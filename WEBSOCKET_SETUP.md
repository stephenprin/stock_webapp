# WebSocket Service for Real-Time Market Data

This WebSocket service provides real-time market data updates for Pro and Enterprise users.

## Features

- Real-time stock price updates (5-second intervals)
- Pro/Enterprise subscription verification
- Automatic reconnection on connection loss
- Efficient symbol subscription management
- Broadcasts updates only to subscribed clients

## Setup

### 1. Environment Variables

Add to your `.env.local`:

```env
NEXT_PUBLIC_WS_URL=ws://localhost:8080
WS_PORT=8080
```

For production:
```env
NEXT_PUBLIC_WS_URL=wss://your-domain.com
WS_PORT=8080
```

### 2. Install Dependencies

The `ws` package is already installed. If needed:
```bash
npm install ws @types/ws --legacy-peer-deps
```

### 3. Start the WebSocket Server

Run the WebSocket server in development:
```bash
npm run ws:dev
```

Or start everything together:
```bash
npm run dev:all
```

The WebSocket server runs on port 8080 by default (configurable via `WS_PORT`).

## Usage

### Client-Side Hook

```tsx
import { useWebSocket } from "@/lib/hooks/useWebSocket";

function MyComponent() {
  const { 
    isConnected, 
    isPro, 
    error, 
    updates, 
    getUpdate,
    subscribe,
    unsubscribe 
  } = useWebSocket({
    symbols: ["AAPL", "MSFT", "GOOGL"],
    enabled: true,
    onUpdate: (updates) => {
      console.log("New market updates:", updates);
    },
    onError: (error) => {
      console.error("WebSocket error:", error);
    },
  });

  // Get update for a specific symbol
  const appleUpdate = getUpdate("AAPL");

  return (
    <div>
      {isConnected ? "Connected" : "Disconnected"}
      {updates.map(update => (
        <div key={update.symbol}>
          {update.symbol}: ${update.currentPrice}
        </div>
      ))}
    </div>
  );
}
```

### Example Component

```tsx
import { RealTimeMarketData } from "@/components/market/RealTimeMarketData";

function MyPage() {
  const symbols = ["AAPL", "MSFT", "GOOGL"];
  
  return (
    <RealTimeMarketData 
      symbols={symbols}
      title="My Portfolio"
    />
  );
}
```

## API

### WebSocket Hook (`useWebSocket`)

**Options:**
- `symbols`: Array of stock symbols to subscribe to
- `enabled`: Whether to enable the WebSocket connection (default: `true`)
- `onUpdate`: Callback when market updates are received
- `onError`: Callback when an error occurs

**Returns:**
- `isConnected`: Boolean indicating connection status
- `isPro`: Boolean indicating if user has Pro subscription
- `error`: Error message string or null
- `updates`: Array of all received market updates
- `getUpdate(symbol)`: Get the latest update for a specific symbol
- `subscribe(symbols)`: Subscribe to additional symbols
- `unsubscribe(symbols)`: Unsubscribe from symbols

### Market Update Structure

```typescript
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
```

## Pro Subscription Required

Only Pro and Enterprise users can access real-time market data. Free users will see an upgrade prompt.

The WebSocket server verifies subscription status on connection and rejects non-Pro users.

## Production Deployment

For production, you'll need to:

1. Deploy the WebSocket server separately or use a service that supports WebSocket
2. Update `NEXT_PUBLIC_WS_URL` to point to your production WebSocket server
3. Ensure the WebSocket server has access to your database for subscription verification
4. Use `wss://` (secure WebSocket) in production

## Troubleshooting

- **Connection fails**: Check that the WebSocket server is running
- **Pro verification fails**: Ensure the user has an active Pro/Enterprise subscription
- **No updates received**: Verify symbols are correctly subscribed and server is polling Finnhub API
- **High CPU usage**: Consider reducing update frequency or number of symbols per client

