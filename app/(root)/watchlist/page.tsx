"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getWatchlistItems } from "@/lib/actions/watchlist.actions";
import { getUserAlerts, type PriceAlertPlain } from "@/lib/actions/alerts.actions";
import { getNews } from "@/lib/actions/finnhub.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, RefreshCw, Sparkles, Bell, TrendingUp, TrendingDown, Plus } from "lucide-react";
import { toast } from "sonner";
import SubscriptionBadge from "@/components/billing/SubscriptionBadge";
import UpgradeDialog from "@/components/billing/UpgradeDialog";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { getSubscriptionLimits } from "@/lib/utils/subscription";
import { Skeleton } from "@/components/ui/skeleton";
import WatchlistTable from "@/components/watchlist/WatchlistTable";
import WatchlistNews from "@/components/watchlist/WatchlistNews";
import WatchlistAlerts from "@/components/watchlist/WatchlistAlerts";
import CreateAlertDialog from "@/components/alerts/CreateAlertDialog";
import StockSearchCommand from "@/components/StockSearchCommand";
import { formatCurrency } from "@/lib/utils/utils";

export default function WatchlistPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [watchlistItems, setWatchlistItems] = useState<StockWithData[]>([]);
  const [alerts, setAlerts] = useState<PriceAlertPlain[]>([]);
  const [news, setNews] = useState<MarketNewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createAlertDialogOpen, setCreateAlertDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);

  const { plan, isFree, isPro, isEnterprise } = useSubscription();
  const [watchlistLimit, setWatchlistLimit] = useState<number | null>(null);

  useEffect(() => {
    const upgraded = searchParams.get("upgraded");
    if (upgraded === "true") {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
      
      toast.success("Upgrade successful! Your subscription is now active.", {
        duration: 5000,
      });
      
      const reloadTimer = setTimeout(() => {
        window.location.reload();
      }, 2500);
      
      return () => clearTimeout(reloadTimer);
    }
  }, [searchParams]);

  const loadWatchlist = async () => {
    try {
      setLoading(true);
      const [watchlistResult, alertsResult] = await Promise.all([
        getWatchlistItems(),
        getUserAlerts(),
      ]);

      if (watchlistResult.success && watchlistResult.items) {
        setWatchlistItems(watchlistResult.items);

        // Fetch news for watchlist symbols
        if (watchlistResult.items.length > 0) {
          const symbols = watchlistResult.items.map((item) => item.symbol);
          try {
            const newsData = await getNews(symbols);
            setNews(newsData || []);
          } catch (error) {
            setNews([]);
          }
        } else {
          setNews([]);
        }
      } else {
        toast.error(watchlistResult.error || "Failed to load watchlist");
        setWatchlistItems([]);
        setNews([]);
      }

      if (alertsResult.success && alertsResult.alerts) {
        setAlerts(alertsResult.alerts);
      } else {
        setAlerts([]);
      }
    } catch (error) {
      toast.error("Failed to load watchlist");
      setWatchlistItems([]);
      setNews([]);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWatchlist();
    setRefreshing(false);
    toast.success("Watchlist refreshed");
  };

  useEffect(() => {
    loadWatchlist();
  }, []);

  useEffect(() => {
    const fetchLimit = async () => {
      const limits = await getSubscriptionLimits(plan);
      setWatchlistLimit(limits.maxWatchlistStocks);
    };
    if (plan) {
      fetchLimit();
    }
  }, [plan]);

  const handleWatchlistUpdated = () => {
    loadWatchlist();
  };

  const handleAlertCreated = () => {
    setCreateAlertDialogOpen(false);
    loadWatchlist();
  };

  // Calculate stats
  const totalStocks = watchlistItems.length;
  const watchlistSymbols = watchlistItems.map((item) => item.symbol);
  const watchlistAlerts = alerts.filter((alert) =>
    watchlistSymbols.includes(alert.symbol.toUpperCase())
  );
  const activeAlertsCount = watchlistAlerts.filter((alert) => alert.isActive).length;
  
  // Calculate total watchlist value (sum of current prices)
  const totalValue = watchlistItems.reduce((sum, item) => {
    return sum + (item.currentPrice || 0);
  }, 0);

  // Calculate total change (sum of change percentages)
  const totalChangePercent = watchlistItems.length > 0
    ? watchlistItems.reduce((sum, item) => sum + (item.changePercent || 0), 0) / watchlistItems.length
    : 0;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Skeleton className="h-9 w-48" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-5 w-64 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content Skeleton */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white">My Watchlist</h1>
            <SubscriptionBadge />
          </div>
          <p className="text-gray-400">Track your favorite stocks and stay informed</p>
          {isFree && watchlistLimit !== null && (
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
              <Sparkles className="h-4 w-4" />
              <span>
                {totalStocks} of {watchlistLimit} stocks added
              </span>
              {totalStocks >= watchlistLimit && (
                <span className="text-yellow-500 font-medium">
                  • Limit reached - upgrade for unlimited
                </span>
              )}
            </div>
          )}
          {!isFree && (
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>
                {totalStocks} stocks in your watchlist • Unlimited
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {isFree && (
            <Button
              variant="outline"
              onClick={() => setUpgradeDialogOpen(true)}
              className="flex items-center gap-2 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10"
            >
              <Sparkles className="h-4 w-4" />
              Upgrade
            </Button>
          )}
          {(isPro || isEnterprise || (isFree && (watchlistLimit === null || totalStocks < watchlistLimit))) && (
            <Button
              onClick={() => setSearchDialogOpen(true)}
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-medium"
              disabled={isFree && watchlistLimit !== null && totalStocks >= watchlistLimit}
            >
              <Plus className="h-4 w-4" />
              Add Stocks
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Total Stocks
            </CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalStocks}</div>
            <p className="text-xs text-gray-500 mt-1">
              {isFree && watchlistLimit !== null
                ? `${watchlistLimit} limit`
                : "Unlimited"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Active Alerts
            </CardTitle>
            <Bell className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {activeAlertsCount}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {watchlistAlerts.length} total alerts
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Average Change
            </CardTitle>
            {totalChangePercent >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-400" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-400" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                totalChangePercent >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {totalChangePercent >= 0 ? "+" : ""}
              {totalChangePercent.toFixed(2)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Today's performance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      {watchlistItems.length === 0 ? (
        <div className="watchlist-empty-container">
          <div className="watchlist-empty">
            <Star className="watchlist-star" />
            <h2 className="empty-title">Your watchlist is empty</h2>
            <p className="empty-description">
              Start tracking stocks by adding them to your watchlist. Use the search icon in the header or click below to browse stocks.
            </p>
            <Button
              onClick={() => setSearchDialogOpen(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900"
            >
              <Plus className="h-4 w-4 mr-2" />
              Browse Stocks
            </Button>
          </div>
        </div>
      ) : (
        <div className="watchlist-container">
          {/* Main Table Section */}
          <div className="watchlist">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Watchlist</CardTitle>
                <CardDescription className="text-gray-400">
                  Your tracked stocks with real-time prices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WatchlistTable
                  watchlist={watchlistItems}
                  onWatchlistUpdated={handleWatchlistUpdated}
                />
              </CardContent>
            </Card>

            {/* News Section */}
            {news.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Latest News</CardTitle>
                  <CardDescription className="text-gray-400">
                    News related to your watchlist stocks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <WatchlistNews news={news} />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="watchlist-alerts">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Alerts</CardTitle>
                    <CardDescription className="text-gray-400">
                      Price alerts for watchlist stocks
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCreateAlertDialogOpen(true)}
                    className="h-8 px-2 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    New
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <WatchlistAlerts
                  alerts={alerts}
                  watchlistSymbols={watchlistSymbols}
                  onAlertUpdated={handleWatchlistUpdated}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <CreateAlertDialog
        open={createAlertDialogOpen}
        onOpenChange={setCreateAlertDialogOpen}
        onAlertCreated={handleAlertCreated}
      />

      <UpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        targetPlan="pro"
      />

      <StockSearchCommand
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        mode="watchlist"
        onWatchlistAdded={handleWatchlistUpdated}
      />
    </div>
  );
}


