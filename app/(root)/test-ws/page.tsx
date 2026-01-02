"use client";

import { useState } from "react";
import { RealTimeMarketData } from "@/components/market/RealTimeMarketData";
import { useWebSocket } from "@/lib/hooks/useWebSocket";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Plus, X } from "lucide-react";

export default function TestWebSocketPage() {
  const [symbols, setSymbols] = useState<string[]>(["AAPL", "MSFT", "GOOGL"]);
  const [newSymbol, setNewSymbol] = useState("");
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loadingDebug, setLoadingDebug] = useState(false);

  const {
    isConnected,
    isPro,
    error,
    updates,
    subscribe,
    unsubscribe,
  } = useWebSocket({
    symbols,
    enabled: true,
    onUpdate: (updates) => {
      console.log("📊 Market updates received:", updates);
    },
    onError: (error) => {
      console.error("❌ WebSocket error:", error);
    },
  });

  const handleAddSymbol = () => {
    const symbol = newSymbol.trim().toUpperCase();
    if (symbol && !symbols.includes(symbol)) {
      const newSymbols = [...symbols, symbol];
      setSymbols(newSymbols);
      subscribe([symbol]);
      setNewSymbol("");
    }
  };

  const handleRemoveSymbol = (symbolToRemove: string) => {
    const newSymbols = symbols.filter((s) => s !== symbolToRemove);
    setSymbols(newSymbols);
    unsubscribe([symbolToRemove]);
  };

  const handleDebugSubscription = async () => {
    setLoadingDebug(true);
    try {
      const response = await fetch("/api/debug/subscription");
      const data = await response.json();
      setDebugInfo(data);
      console.log("🔍 Subscription Debug Info:", data);
    } catch (error) {
      console.error("Error fetching debug info:", error);
      setDebugInfo({ error: "Failed to fetch debug info" });
    } finally {
      setLoadingDebug(false);
    }
  };

  return (
    <div className="container max-w-6xl mx-auto py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">WebSocket Test Page</h1>
        <p className="text-muted-foreground">
          Test real-time market data WebSocket connection (Pro users only)
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
            <CardDescription>WebSocket connection information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant={isConnected ? "default" : "secondary"} className="gap-1">
                {isConnected ? (
                  <>
                    <Wifi className="h-3 w-3" />
                    Connected
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3" />
                    Disconnected
                  </>
                )}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Subscription:</span>
              <Badge variant={isPro ? "default" : "destructive"}>
                {isPro ? "Pro User" : "Free User"}
              </Badge>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive font-medium">Error:</p>
                <p className="text-sm text-destructive mt-1">{error}</p>
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">WebSocket URL:</p>
              <code className="text-xs bg-muted p-2 rounded block break-all">
                {process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080"}
              </code>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Updates Received:</p>
              <p className="text-2xl font-bold">{updates.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manage Symbols</CardTitle>
            <CardDescription>Add or remove symbols to subscribe</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter symbol (e.g., TSLA)"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddSymbol();
                  }
                }}
              />
              <Button onClick={handleAddSymbol} disabled={!newSymbol.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Subscribed Symbols:</p>
              <div className="flex flex-wrap gap-2">
                {symbols.map((symbol) => (
                  <Badge
                    key={symbol}
                    variant="outline"
                    className="gap-2 px-3 py-1"
                  >
                    {symbol}
                    <button
                      onClick={() => handleRemoveSymbol(symbol)}
                      className="hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {symbols.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No symbols subscribed. Add symbols to see real-time updates.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <RealTimeMarketData symbols={symbols} title="Real-Time Market Data" />

      <Card>
        <CardHeader>
          <CardTitle>Subscription Debug</CardTitle>
          <CardDescription>Check your subscription status in the database</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleDebugSubscription} disabled={loadingDebug}>
            {loadingDebug ? "Loading..." : "Debug Subscription Status"}
          </Button>
          
          {debugInfo && (
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-muted rounded-md">
                <p className="font-semibold mb-2">Your User Info:</p>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify({ userId: debugInfo.userId, email: debugInfo.userEmail }, null, 2)}
                </pre>
              </div>
              
              {debugInfo.customer ? (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-md">
                  <p className="font-semibold text-green-400 mb-2">✓ Customer Record Found:</p>
                  <pre className="text-xs overflow-auto max-h-96">
                    {JSON.stringify(debugInfo.customer, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-md">
                  <p className="font-semibold text-red-400 mb-2">✗ No Customer Record Found</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Searched with: {JSON.stringify(debugInfo.queryConditions, null, 2)}
                  </p>
                </div>
              )}
              
              <div className="p-4 bg-muted rounded-md">
                <p className="font-semibold mb-2">Sample Customer Records (first 10):</p>
                <pre className="text-xs overflow-auto max-h-64">
                  {JSON.stringify(debugInfo.allCustomersSample, null, 2)}
                </pre>
              </div>
              
              {debugInfo.error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-md">
                  <p className="font-semibold text-red-400">Error:</p>
                  <pre className="text-xs">{JSON.stringify(debugInfo.error, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
          <CardDescription>Raw WebSocket data for debugging</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">All Updates:</p>
              <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-64">
                {JSON.stringify(updates, null, 2)}
              </pre>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Instructions:</p>
              <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                <li>Make sure the WebSocket server is running: <code className="bg-muted px-1 rounded">npm run ws:dev</code></li>
                <li>Ensure you have a Pro or Enterprise subscription</li>
                <li>Check browser console for connection logs</li>
                <li>Add symbols to subscribe to real-time updates</li>
                <li>Updates should appear every 5 seconds when prices change</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

