"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface MarketUpdate {
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

export interface WebSocketMessage {
  type: "connected" | "quote" | "error" | "subscribed" | "unsubscribed" | "pong";
  message?: string;
  error?: string;
  symbols?: string[];
  data?: MarketUpdate[];
}

export interface UseWebSocketOptions {
  symbols?: string[];
  enabled?: boolean;
  onUpdate?: (updates: MarketUpdate[]) => void;
  onError?: (error: string) => void;
}

export function useWebSocket({
  symbols = [],
  enabled = true,
  onUpdate,
  onError,
}: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updates, setUpdates] = useState<Map<string, MarketUpdate>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const isMountedRef = useRef(true);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  const safeSetState = useCallback((setter: (value: any) => void, value: any) => {
    if (isMountedRef.current) {
      setter(value);
    }
  }, []);

  const getAuthToken = useCallback(async (): Promise<{ userId: string | null; isPro: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/ws/token");
      if (response.status === 403) {
        const data = await response.json();
        return { userId: null, isPro: false, error: data.error || "Pro subscription required" };
      }
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        return { userId: null, isPro: false, error: data.error || "Authentication failed" };
      }
      const data = await response.json();
      return { userId: data.userId || null, isPro: true };
    } catch (error) {
      console.error("Error getting auth token:", error);
      return { userId: null, isPro: false, error: "Failed to connect to authentication service" };
    }
  }, []);

  const connect = useCallback(async () => {
    if (!enabled || !isMountedRef.current) return;

    const authResult = await getAuthToken();
    
    if (!isMountedRef.current) return;
    
    if (!authResult.userId) {
      safeSetState(setIsPro, authResult.isPro);
      safeSetState(setError, authResult.error || "Authentication required");
      return;
    }
    
    if (!authResult.isPro) {
      safeSetState(setIsPro, false);
      safeSetState(setError, "Pro subscription required for real-time market data");
      return;
    }
    
    safeSetState(setIsPro, true);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";
      const url = `${wsUrl}?token=${authResult.userId}&userId=${authResult.userId}`;
      const ws = new WebSocket(url);

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        safeSetState(setIsConnected, true);
        safeSetState(setError, null);
        reconnectAttempts.current = 0;
        
        if (symbols.length > 0) {
          subscribe(symbols);
        }
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onerror = (event) => {
        if (!isMountedRef.current) return;
        console.error("WebSocket error:", event);
        safeSetState(setError, "WebSocket connection error");
      };

      ws.onclose = (event) => {
        if (!isMountedRef.current) return;
        safeSetState(setIsConnected, false);
        
        if (event.code === 1008) {
          safeSetState(setError, "Pro subscription required for real-time market data");
          safeSetState(setIsPro, false);
          return;
        }

        if (reconnectAttempts.current < maxReconnectAttempts && enabled && isMountedRef.current) {
          reconnectAttempts.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              connect();
            }
          }, reconnectDelay * reconnectAttempts.current);
        } else if (isMountedRef.current) {
          safeSetState(setError, "Failed to connect to real-time market data");
        }
      };

      wsRef.current = ws;
    } catch (error) {
      if (!isMountedRef.current) return;
      console.error("Error connecting WebSocket:", error);
      safeSetState(setError, "Failed to establish WebSocket connection");
    }
  }, [enabled, symbols, getAuthToken]);

  const handleMessage = useCallback(
    (message: WebSocketMessage) => {
      if (!isMountedRef.current) return;
      
      switch (message.type) {
        case "connected":
          safeSetState(setIsPro, true);
          break;

        case "quote":
          if (message.data && Array.isArray(message.data)) {
            setUpdates((prevUpdates) => {
              if (!isMountedRef.current) return prevUpdates;
              const newUpdates = new Map(prevUpdates);
              message.data!.forEach((update) => {
                newUpdates.set(update.symbol, update);
              });
              return newUpdates;
            });
            
            if (onUpdate) {
              onUpdate(message.data);
            }
          }
          break;

        case "error":
          const errorMsg = message.error || "Unknown error";
          safeSetState(setError, errorMsg);
          if (onError) {
            onError(errorMsg);
          }
          break;

        case "subscribed":
        case "unsubscribed":
          break;

        case "pong":
          break;
      }
    },
    [onUpdate, onError, safeSetState]
  );

  const subscribe = useCallback(
    (symbolsToSubscribe: string[]) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "subscribe",
            symbols: symbolsToSubscribe.map((s) => s.toUpperCase()),
          })
        );
      }
    },
    []
  );

  const unsubscribe = useCallback((symbolsToUnsubscribe: string[]) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "unsubscribe",
          symbols: symbolsToUnsubscribe.map((s) => s.toUpperCase()),
        })
      );
    }
  }, []);

  const sendPing = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "ping" }));
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (enabled) {
      connect();
    }

    return () => {
      isMountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [enabled, connect]);

  useEffect(() => {
    if (isConnected && symbols.length > 0) {
      subscribe(symbols);
    }
  }, [isConnected, symbols, subscribe]);

  useEffect(() => {
    if (isConnected) {
      const pingInterval = setInterval(sendPing, 30000);
      return () => clearInterval(pingInterval);
    }
  }, [isConnected, sendPing]);

  return {
    isConnected,
    isPro,
    error,
    updates: Array.from(updates.values()),
    getUpdate: (symbol: string) => updates.get(symbol.toUpperCase()),
    subscribe,
    unsubscribe,
  };
}

