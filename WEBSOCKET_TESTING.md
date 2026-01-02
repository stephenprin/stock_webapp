# Testing the WebSocket Service

## Quick Start Testing

### 1. Start the Required Services

**Option A: Start all services together**
```bash
npm run dev:all
```

**Option B: Start services separately**
```bash
# Terminal 1: Next.js dev server
npm run dev

# Terminal 2: WebSocket server
npm run ws:dev

# Terminal 3: Inngest dev (optional)
npm run inngest:dev
```

### 2. Verify WebSocket Server is Running

You should see:
```
WebSocket server started on port 8080
```

If you see errors, check:
- Port 8080 is not already in use
- Environment variables are set correctly
- Database connection is working (for subscription verification)

### 3. Access the Test Page

Navigate to: **http://localhost:3000/test-ws**

This test page includes:
- Connection status indicator
- Subscription status (Pro/Free)
- Symbol management (add/remove)
- Real-time market data display
- Debug information panel

### 4. Verify Pro Subscription

The WebSocket connection requires a Pro or Enterprise subscription:
- If you're a free user, you'll see an error message
- To test as a Pro user, ensure your account has an active subscription

## Manual Testing Steps

### Step 1: Check Browser Console

Open browser DevTools (F12) and check the console:
- Should see connection attempts
- Look for "Connected to real-time market data" message
- Check for any error messages

### Step 2: Test Connection

1. Go to `/test-ws` page
2. Check the "Connection Status" card:
   - Status should show "Connected" (green badge)
   - Subscription should show "Pro User"
3. If disconnected, check error message

### Step 3: Subscribe to Symbols

1. Add symbols in the "Manage Symbols" section
2. Type a symbol (e.g., "AAPL") and click "Add"
3. Symbol should appear in the subscribed list
4. Real-time data should start appearing

### Step 4: Verify Updates

1. Watch the "Real-Time Market Data" section
2. Updates should appear every 5 seconds (when prices change)
3. Check the "Debug Information" panel for raw JSON data
4. Verify price changes are reflected in real-time

### Step 5: Test Reconnection

1. Stop the WebSocket server (Ctrl+C)
2. Observe: Connection status should change to "Disconnected"
3. Restart the WebSocket server
4. Connection should automatically reconnect
5. Updates should resume

## Testing with cURL

Test the WebSocket token endpoint:

```bash
# Get authentication token (replace with your session)
curl http://localhost:3000/api/ws/token

# Expected response (Pro user):
{
  "userId": "...",
  "token": "...",
  "wsUrl": "ws://localhost:8080"
}

# Expected response (Free user):
{
  "error": "Pro subscription required"
}
```

## Testing WebSocket Connection Directly

You can use `wscat` to test the WebSocket connection:

```bash
# Install wscat
npm install -g wscat

# Connect (replace USER_ID with actual user ID)
wscat -c "ws://localhost:8080?token=USER_ID&userId=USER_ID"

# Once connected, send subscribe message:
{"type":"subscribe","symbols":["AAPL","MSFT"]}

# You should receive:
{"type":"connected","message":"Connected to real-time market data"}
{"type":"subscribed","symbols":["AAPL","MSFT"]}
{"type":"quote","data":[...]}
```

## Common Issues and Solutions

### Issue: "WebSocket connection error"
**Solution:**
- Verify WebSocket server is running (`npm run ws:dev`)
- Check `NEXT_PUBLIC_WS_URL` environment variable
- Ensure port 8080 is accessible

### Issue: "Pro subscription required"
**Solution:**
- Verify your account has Pro/Enterprise subscription
- Check subscription status in settings
- Ensure Autumn billing is configured correctly

### Issue: No updates received
**Solution:**
- Check that symbols are subscribed
- Verify Finnhub API key is configured
- Check WebSocket server logs for errors
- Ensure symbols are valid (e.g., "AAPL", not "appl")

### Issue: Connection keeps disconnecting
**Solution:**
- Check network stability
- Verify WebSocket server isn't crashing
- Check server logs for errors
- Ensure authentication is working

## Testing in Different Browsers

Test in multiple browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari

Each browser handles WebSockets slightly differently.

## Performance Testing

1. **Multiple Symbols:**
   - Subscribe to 10+ symbols
   - Verify all symbols receive updates
   - Check server performance

2. **Multiple Clients:**
   - Open multiple browser tabs
   - Verify each receives updates independently
   - Check server handles multiple connections

3. **Connection Limits:**
   - Test with many simultaneous connections
   - Verify graceful handling of connection limits

## Integration Testing

Test the WebSocket in actual pages:
- Portfolio page: Subscribe to portfolio symbols
- Watchlist page: Subscribe to watchlist symbols
- Search page: Subscribe to viewed stock

Example integration:

```tsx
// In your portfolio page
import { useWebSocket } from "@/lib/hooks/useWebSocket";

const { updates, getUpdate } = useWebSocket({
  symbols: portfolioSymbols,
  enabled: isPro,
});
```

## Monitoring

Watch for:
- Connection count in server logs
- Update frequency (should be ~5 seconds)
- Error rates in console
- Memory usage (long-running connections)

## Production Testing

Before deploying:
1. Test with production-like data volumes
2. Verify SSL/HTTPS with `wss://` protocol
3. Test load with multiple concurrent users
4. Verify error handling and reconnection logic
5. Test subscription verification works correctly

