"use client";

import { useWebSocket } from "@/lib/hooks/useWebSocket";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubscription } from "@/lib/hooks/useSubscription";
import UpgradeDialog from "@/components/billing/UpgradeDialog";
import { useState } from "react";

interface RealTimePriceProps {
  symbols: string[];
  maxDisplay?: number;
  title?: string;
  description?: string;
}

export function RealTimePrice({ 
  symbols, 
  maxDisplay = 5,
  title = "Real-Time Prices",
  description = "Live price updates for your tracked stocks"
}: RealTimePriceProps) {
  const { isPro, isEnterprise, plan, loading: subscriptionLoading, customer } = useSubscription();
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  
  const hasProAccess = isPro || isEnterprise;
  
  const { 
    isConnected, 
    isPro: wsIsPro,
    error, 
    updates,
    getUpdate 
  } = useWebSocket({
    symbols: hasProAccess ? symbols.slice(0, maxDisplay) : [],
    enabled: hasProAccess && symbols.length > 0,
  });

  const displaySymbols = symbols.slice(0, maxDisplay);
  const hasMore = symbols.length > maxDisplay;

  if (subscriptionLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">{title}</CardTitle>
          <CardDescription className="text-gray-400">
            Loading subscription status...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 md:gap-4 overflow-x-auto pb-2 -mx-6 px-6 md:mx-0 md:px-0">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 md:h-20 w-[140px] md:w-[180px] flex-shrink-0 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasProAccess) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">{title}</CardTitle>
          <CardDescription className="text-gray-400">
            Real-time price updates (Pro feature)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-sm text-gray-400 mb-4">
              Upgrade to Pro to access real-time market data updates.
            </p>
            <button
              onClick={() => setUpgradeDialogOpen(true)}
              className="text-sm text-yellow-500 hover:text-yellow-400 font-medium"
            >
              Upgrade to Pro
            </button>
          </div>
          <UpgradeDialog
            open={upgradeDialogOpen}
            onOpenChange={setUpgradeDialogOpen}
            targetPlan="pro"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">{title}</CardTitle>
            <CardDescription className="text-gray-400">
              {description}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge variant="default" className="gap-1 bg-green-500/20 text-green-400 border-green-500/30">
                <Wifi className="h-3 w-3" />
                Live
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <WifiOff className="h-3 w-3" />
                Connecting
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {displaySymbols.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-400">
              Add stocks to your watchlist or portfolio to see real-time price updates.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
            <div className="flex items-center gap-3 md:gap-4 pb-2 min-w-max">
              {displaySymbols.map((symbol) => {
                const update = getUpdate(symbol);
                
                if (!update) {
                  return (
                    <div
                      key={symbol}
                      className="flex-shrink-0 px-3 py-2.5 md:px-4 md:py-3 bg-gray-700/50 rounded-lg border border-gray-600 min-w-[140px] md:min-w-[180px]"
                    >
                      <p className="font-medium text-white text-sm md:text-base mb-1.5 md:mb-2">{symbol}</p>
                      <Skeleton className="h-4 w-16 md:w-20" />
                    </div>
                  );
                }

                const isPositive = update.change >= 0;
                const changeColor = isPositive ? "text-green-500" : "text-red-500";
                const ChangeIcon = isPositive ? ArrowUp : ArrowDown;

                return (
                  <div
                    key={symbol}
                    className="flex-shrink-0 px-3 py-2.5 md:px-4 md:py-3 bg-gray-700/50 rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors min-w-[140px] md:min-w-[180px]"
                  >
                    <div className="flex items-center justify-between mb-1.5 md:mb-2">
                      <p className="font-semibold text-white text-xs md:text-sm">{symbol}</p>
                      <ChangeIcon className={cn("h-2.5 w-2.5 md:h-3 md:w-3", changeColor)} />
                    </div>
                    <p className="text-base md:text-lg font-bold text-white mb-0.5 md:mb-1">
                      ${update.currentPrice.toFixed(2)}
                    </p>
                    <p className={cn("text-xs md:text-sm font-medium", changeColor)}>
                      {update.change >= 0 ? "+" : ""}
                      {update.change.toFixed(2)} ({update.changePercent >= 0 ? "+" : ""}
                      {update.changePercent.toFixed(2)}%)
                    </p>
                  </div>
                );
              })}
            </div>
            
            {hasMore && (
              <p className="text-xs text-gray-500 text-center pt-2 md:pt-3">
                Showing {maxDisplay} of {symbols.length} stocks
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}