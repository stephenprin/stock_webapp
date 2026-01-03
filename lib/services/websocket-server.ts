import { WebSocketServer, WebSocket } from "ws";

interface ClientConnection {
  ws: WebSocket;
  userId: string;
  subscribedSymbols: Set<string>;
  isPro: boolean;
}

interface MarketUpdate {
  symbol: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  previousClose: number;
  high: number;
  low: number;
  open: number;
  timestamp: number;
}

export class MarketDataWebSocketServer {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ClientConnection> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private subscribedSymbols: Set<string> = new Set();
  private lastQuotes: Map<string, MarketUpdate> = new Map();
  private readonly UPDATE_INTERVAL_MS = 60000;
  private rateLimitedUntil: number = 0;

  start(port: number = 8080) {
    try {
      this.wss = new WebSocketServer({ port });

      this.wss.on("error", (error: any) => {
        if (error.code === "EADDRINUSE") {
          process.exit(1);
        }
      });

      this.wss.on("listening", () => {
        // WebSocket server ready
      });

    this.wss.on("connection", async (ws: WebSocket, req) => {
      const urlString = req.url || "";
      const url = new URL(urlString.startsWith("http") ? urlString : `http://${req.headers.host || "localhost"}${urlString}`);
      const token = url.searchParams.get("token");
      const userId = url.searchParams.get("userId");

      if (!token || !userId) {
        ws.close(1008, "Missing authentication");
        return;
      }

      const connectionId = this.generateConnectionId();
      
      try {
        const isPro = await this.verifyProUser(userId);
        
        if (!isPro) {
          ws.close(1008, "Pro subscription required");
          return;
        }
        
        const client: ClientConnection = {
          ws,
          userId,
          subscribedSymbols: new Set(),
          isPro: true,
        };

        this.clients.set(connectionId, client);

        ws.on("message", async (data: Buffer) => {
          try {
            const message = JSON.parse(data.toString());
            await this.handleMessage(connectionId, message);
          } catch (error) {
            this.sendError(connectionId, "Invalid message format");
          }
        });

        ws.on("close", () => {
          this.clients.delete(connectionId);
          this.updateSubscribedSymbols();
        });

        ws.on("error", () => {
          this.clients.delete(connectionId);
          this.updateSubscribedSymbols();
        });

        this.send(connectionId, {
          type: "connected",
          message: "Connected to real-time market data",
        });

        this.updateSubscribedSymbols();
        this.startPollingIfNeeded();
      } catch (error) {
        ws.close(1011, "Internal server error");
      }
    });

    } catch (error: any) {
      if (error.code === "EADDRINUSE") {
        process.exit(1);
      } else {
        throw error;
      }
    }
  }

  private async verifyProUser(userId: string): Promise<boolean> {
    try {
      const { checkUserSubscriptionPlan } = await import("@/lib/services/subscription-check");
      const plan = await checkUserSubscriptionPlan(userId);
      return plan === "pro" || plan === "enterprise";
    } catch (error) {
      return false;
    }
  }

  private generateConnectionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async handleMessage(connectionId: string, message: any) {
    const client = this.clients.get(connectionId);
    if (!client) {
      return;
    }

    switch (message.type) {
      case "subscribe":
        if (Array.isArray(message.symbols)) {
          message.symbols.forEach((symbol: string) => {
            client.subscribedSymbols.add(symbol.toUpperCase());
          });
          this.updateSubscribedSymbols();
          this.send(connectionId, {
            type: "subscribed",
            symbols: Array.from(client.subscribedSymbols),
          });
          this.startPollingIfNeeded();
          
          // For initial subscription, fetch quotes without checking lastQuotes (force send)
          const initialQuotes = await this.fetchQuotesForSymbolsForced(
            Array.from(client.subscribedSymbols)
          );
          if (initialQuotes.length > 0) {
            this.send(connectionId, {
              type: "quote",
              data: initialQuotes,
            });
          }
        }
        break;

      case "unsubscribe":
        if (Array.isArray(message.symbols)) {
          message.symbols.forEach((symbol: string) => {
            client.subscribedSymbols.delete(symbol.toUpperCase());
          });
          this.updateSubscribedSymbols();
          this.send(connectionId, {
            type: "unsubscribed",
            symbols: Array.from(client.subscribedSymbols),
          });
        }
        break;

      case "ping":
        this.send(connectionId, { type: "pong" });
        break;

      default:
        this.sendError(connectionId, `Unknown message type: ${message.type}`);
    }
  }

  private updateSubscribedSymbols() {
    const allSymbols = new Set<string>();
    this.clients.forEach((client) => {
      client.subscribedSymbols.forEach((symbol) => {
        allSymbols.add(symbol);
      });
    });
    this.subscribedSymbols = allSymbols;
  }

  private async startPollingIfNeeded() {
    if (this.updateInterval || this.subscribedSymbols.size === 0) {
      return;
    }

    this.updateInterval = setInterval(async () => {
      if (this.subscribedSymbols.size === 0) {
        if (this.updateInterval) {
          clearInterval(this.updateInterval);
          this.updateInterval = null;
        }
        return;
      }

      const quotes = await this.fetchQuotesForSymbols(
        Array.from(this.subscribedSymbols)
      );

      if (quotes.length > 0) {
        this.broadcast({
          type: "quote",
          data: quotes,
        });
      }
    }, this.UPDATE_INTERVAL_MS);
  }

  private async fetchQuotesForSymbols(
    symbols: string[]
  ): Promise<MarketUpdate[]> {
    const apiKey = process.env.FINNHUB_API_KEY || process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!apiKey) {
      return [];
    }
    
    const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
    
    const quotes = await Promise.allSettled(
      symbols.map(async (symbol) => {
        try {
          const cleanSymbol = symbol.trim().toUpperCase();
          const url = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(cleanSymbol)}&token=${apiKey}`;
          
          const response = await fetch(url);
          
          if (!response.ok) {
            const text = await response.text().catch(() => '');
            
            if (response.status === 429) {
              this.rateLimitedUntil = Date.now() + 60000;
              throw new Error(`Rate limited: ${text}`);
            }
            
            throw new Error(`Finnhub API error ${response.status}: ${text}`);
          }
          
          const data = await response.json() as {
            c?: number;
            d?: number;
            dp?: number;
            h?: number;
            l?: number;
            o?: number;
            pc?: number;
          };
          
          if (!data || typeof data.c !== 'number' || data.c <= 0) {
            return null;
          }
          
          return {
            symbol: cleanSymbol,
            currentPrice: data.c,
            change: data.d || 0,
            changePercent: data.dp || 0,
            previousClose: data.pc || data.c,
            high: data.h || data.c,
            low: data.l || data.c,
            open: data.o || data.c,
            timestamp: Date.now(),
          } as MarketUpdate;
        } catch (error) {
          return null;
        }
      })
    );

    const updates: MarketUpdate[] = [];

    quotes.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value) {
        const update = result.value;
        const lastUpdate = this.lastQuotes.get(update.symbol);

        if (
          !lastUpdate ||
          lastUpdate.currentPrice !== update.currentPrice ||
          lastUpdate.change !== update.change ||
          lastUpdate.changePercent !== update.changePercent
        ) {
          this.lastQuotes.set(update.symbol, update);
          updates.push(update);
        }
      }
    });

    return updates;
  }

  private async fetchQuotesForSymbolsForced(
    symbols: string[]
  ): Promise<MarketUpdate[]> {
    
    const apiKey = process.env.FINNHUB_API_KEY || process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!apiKey) {
      return [];
    }
    
    const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
    
    const quotes = await Promise.allSettled(
      symbols.map(async (symbol) => {
        try {
          const cleanSymbol = symbol.trim().toUpperCase();
          const url = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(cleanSymbol)}&token=${apiKey}`;
          
          const response = await fetch(url);
          
          if (!response.ok) {
            const text = await response.text().catch(() => '');
            
            if (response.status === 429) {
              this.rateLimitedUntil = Date.now() + 60000;
              throw new Error(`Rate limited: ${text}`);
            }
            
            throw new Error(`Finnhub API error ${response.status}: ${text}`);
          }
          
          const data = await response.json() as {
            c?: number;
            d?: number;
            dp?: number;
            h?: number;
            l?: number;
            o?: number;
            pc?: number;
          };
          
          if (!data || typeof data.c !== 'number' || data.c <= 0) {
            return null;
          }
          
          const update: MarketUpdate = {
            symbol: cleanSymbol,
            currentPrice: data.c,
            change: data.d || 0,
            changePercent: data.dp || 0,
            previousClose: data.pc || data.c,
            high: data.h || data.c,
            low: data.l || data.c,
            open: data.o || data.c,
            timestamp: Date.now(),
          };
          this.lastQuotes.set(cleanSymbol, update);
          
          return update;
        } catch (error) {
          return null;
        }
      })
    );

    const updates: MarketUpdate[] = [];

    quotes.forEach((result) => {
      if (result.status === "fulfilled" && result.value) {
        updates.push(result.value);
      }
    });

    return updates;
  }

  private send(connectionId: string, message: any) {
    const client = this.clients.get(connectionId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      client.ws.send(JSON.stringify(message));
    } catch (error) {
      this.clients.delete(connectionId);
    }
  }

  private sendError(connectionId: string, error: string) {
    this.send(connectionId, {
      type: "error",
      error,
    });
  }

  private broadcast(message: any) {
    this.clients.forEach((client, connectionId) => {
      if (
        message.type === "quote" &&
        Array.isArray(message.data) &&
        client.subscribedSymbols.size > 0
      ) {
        const relevantQuotes = message.data.filter((quote: MarketUpdate) =>
          client.subscribedSymbols.has(quote.symbol)
        );

        if (relevantQuotes.length > 0) {
          this.send(connectionId, {
            type: "quote",
            data: relevantQuotes,
          });
        }
      } else {
        this.send(connectionId, message);
      }
    });
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.clients.forEach((client) => {
      client.ws.close();
    });
    this.clients.clear();

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
  }
}

let serverInstance: MarketDataWebSocketServer | null = null;

export function getWebSocketServer(): MarketDataWebSocketServer {
  if (!serverInstance) {
    serverInstance = new MarketDataWebSocketServer();
  }
  return serverInstance;
}
