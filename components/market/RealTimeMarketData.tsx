"use client";

import { useWebSocket } from "@/lib/hooks/useWebSocket";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Wifi, WifiOff } from "lucide-react";

interface RealTimeMarketDataProps {
  symbols: string[];
  title?: string;
}

export function RealTimeMarketData({ 
  symbols, 
  title = "Real-Time Market Data" 
}: RealTimeMarketDataProps) {
  const { 
    isConnected, 
    isPro, 
    error, 
    updates, 
    getUpdate 
  } = useWebSocket({
    symbols,
    enabled: symbols.length > 0,
    onUpdate: (updates) => {
      console.log("Received market updates:", updates);
    },
  });

  if (!isPro) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Pro subscription required</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Upgrade to Pro to access real-time market data updates.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              Real-time price updates (Pro only)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge variant="default" className="gap-1">
                <Wifi className="h-3 w-3" />
                Live
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <WifiOff className="h-3 w-3" />
                Disconnected
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {symbols.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No symbols selected. Add stocks to your watchlist or portfolio to see real-time updates.
          </p>
        ) : (
          <div className="space-y-4">
            {symbols.map((symbol) => {
              const update = getUpdate(symbol);
              
              if (!update) {
                return (
                  <div
                    key={symbol}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div>
                      <p className="font-medium">{symbol}</p>
                      <p className="text-sm text-muted-foreground">
                        Loading...
                      </p>
                    </div>
                  </div>
                );
              }

              const isPositive = update.change >= 0;

              return (
                <div
                  key={symbol}
                  className="flex items-center justify-between p-3 border rounded-md hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{symbol}</p>
                      <Badge variant="outline" className="text-xs">
                        {new Date(update.timestamp).toLocaleTimeString()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Price</p>
                        <p className="text-lg font-semibold">
                          ${update.currentPrice.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Change</p>
                        <div className="flex items-center gap-1">
                          {isPositive ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          <p
                            className={`text-sm font-medium ${
                              isPositive ? "text-green-500" : "text-red-500"
                            }`}
                          >
                            {update.change >= 0 ? "+" : ""}
                            {update.change.toFixed(2)} (
                            {update.changePercent >= 0 ? "+" : ""}
                            {update.changePercent.toFixed(2)}%)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

