"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getStockQuote, getCompanyProfile } from "@/lib/actions/finnhub.actions";
import { getNews } from "@/lib/actions/finnhub.actions";
import { getPortfolioHoldings } from "@/lib/actions/portfolio.actions";
import TradingViewWidget from "@/components/TradingViewWidget";
import { CANDLE_CHART_WIDGET_CONFIG, SYMBOL_INFO_WIDGET_CONFIG } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, TrendingDown, ExternalLink, Plus, Building2, Globe, BarChart3, Bell, Sparkles } from "lucide-react";
import { toast } from "sonner";
import AddPositionDialog from "@/components/portfolio/AddPositionDialog";
import CreateAlertDialog from "@/components/alerts/CreateAlertDialog";
import UpgradeDialog from "@/components/billing/UpgradeDialog";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { getSubscriptionLimits } from "@/lib/utils/subscription";
import { formatCurrency, formatPercent } from "@/lib/utils/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const symbol = searchParams.get("symbol")?.toUpperCase() || "";

  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [news, setNews] = useState<MarketNewsArticle[]>([]);
  const [inPortfolio, setInPortfolio] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [createAlertDialogOpen, setCreateAlertDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<string>();
  
  const { plan, isFree } = useSubscription();
  const [stockLimit, setStockLimit] = useState<number | null>(null);

  useEffect(() => {
    if (!symbol) {
      router.push("/dashboard");
      return;
    }

    loadStockData();
  }, [symbol]);

  useEffect(() => {
    const fetchLimits = async () => {
      const limits = await getSubscriptionLimits(plan);
      setStockLimit(limits.maxStocks);
      setAlertLimit(limits.maxAlerts);
    };
    if (plan) {
      fetchLimits();
    }
  }, [plan]);

  const loadStockData = async () => {
    if (!symbol) return;

    setLoading(true);
    try {
      const [quoteData, profileData, newsData, portfolioData] = await Promise.all([
        getStockQuote(symbol),
        getCompanyProfile(symbol),
        getNews([symbol]),
        getPortfolioHoldings(),
      ]);

      if (!quoteData) {
        toast.error(`Could not find data for symbol: ${symbol}. Please check if the symbol is correct.`);
        setLoading(false);
        router.push("/dashboard");
        return;
      }

      if (!quoteData.currentPrice || quoteData.currentPrice === 0) {
        toast.error(`Could not find valid price data for symbol: ${symbol}. The symbol may be invalid or not available.`);
        setLoading(false);
        router.push("/dashboard");
        return;
      }

      // Set quote data (required)
      setQuote(quoteData);
      
      // Set profile data (optional - might be null for some symbols)
      if (profileData && Object.keys(profileData).length > 0) {
        setProfile(profileData);
      } else {
        setProfile(null);
      }
      
      // Set news data
      setNews(newsData || []);

      if (portfolioData.success && portfolioData.holdings) {
        const isInPortfolio = portfolioData.holdings.some(
          (h: any) => h.symbol.toUpperCase() === symbol.toUpperCase()
        );
        setInPortfolio(isInPortfolio);
      }
    } catch (error) {
      toast.error("Failed to load stock data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <Skeleton className="w-16 h-16 rounded-lg" />
                <div>
                  <Skeleton className="h-10 w-24 mb-2" />
                  <Skeleton className="h-6 w-48" />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          {/* Price Card Skeleton */}
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i}>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-32" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-700">
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <Skeleton className="h-4 w-16 mb-2" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Symbol Info Widget Skeleton */}
          <div className="mb-6">
            <Skeleton className="h-[170px] w-full rounded-lg" />
          </div>
        </div>

        {/* Chart and Info Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Chart Skeleton */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[500px] w-full" />
              </CardContent>
            </Card>
          </div>

          {/* Company Info Skeleton */}
          <div className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i}>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <Skeleton className="h-6 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* News Section Skeleton */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                  <Skeleton className="h-3 w-24 mb-2" />
                  <Skeleton className="h-5 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quote || !symbol) {
    // Show error state instead of null
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-white mb-4">Invalid Symbol</h2>
          <p className="text-gray-400 mb-6">
            Could not load data for {symbol}. The symbol may be invalid or not available.
          </p>
          <Button
            onClick={() => router.push("/dashboard")}
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isPositive = quote.change >= 0;
  
  // Construct TradingView symbol - TradingView requires EXCHANGE:SYMBOL format
  const getTradingViewSymbol = (sym: string, profileData: any): string => {
    if (profileData?.exchange) {
      const exchange = profileData.exchange.toUpperCase().trim();
      
      // Map common exchange formats to TradingView format
      // Handle "NASDAQ NMS - GLOBAL MARKET" format
      if (exchange.includes("NASDAQ") || exchange === "NMS" || exchange === "NCM" || exchange === "NGM") {
        return `NASDAQ:${sym}`;
      }
      if (exchange.includes("NYSE") || exchange === "NYQ") {
        return `NYSE:${sym}`;
      }
      if (exchange.includes("AMEX") || exchange === "ASE") {
        return `AMEX:${sym}`;
      }
      // For other exchanges, try to use the exchange code directly
      // Some common mappings
      const exchangeMap: Record<string, string> = {
        "OTC": "OTC",
        "LSE": "LSE",
        "TSX": "TSX",
        "TSE": "TSE",
      };
      
      for (const [key, value] of Object.entries(exchangeMap)) {
        if (exchange.includes(key)) {
          return `${value}:${sym}`;
        }
      }
      
      // Fallback: try using exchange name directly (might work for some)
      return `${exchange}:${sym}`;
    }
    
    // Default fallback: try NASDAQ first (most common for tech stocks like NVDA)
    // If that doesn't work, TradingView will show an error
    return `NASDAQ:${sym}`;
  };
  
  const tradingViewSymbol = getTradingViewSymbol(symbol, profile);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header with Symbol Info */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              {profile?.logo && (
                <img
                  src={profile.logo}
                  alt={profile.name || symbol}
                  className="w-16 h-16 rounded-lg object-contain"
                />
              )}
              <div>
                <h1 className="text-4xl font-bold text-white mb-1">
                  {symbol}
                </h1>
                <p className="text-xl text-gray-400">
                  {profile?.name || "Loading..."}
                </p>
              </div>
            </div>
            {profile && (
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-400">
                {profile.exchange && (
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>{profile.exchange}</span>
                  </div>
                )}
                {profile.sector && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>{profile.sector}</span>
                  </div>
                )}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-yellow-500 transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                    <span>Website</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            {!inPortfolio && (
              <Button
                onClick={() => setAddDialogOpen(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-gray-900"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to Portfolio
              </Button>
            )}
            {inPortfolio && (
              <Button
                onClick={() => router.push("/portfolio")}
                variant="outline"
                className="border-green-500 text-green-500 hover:bg-green-500/10"
              >
                View in Portfolio
              </Button>
            )}
            <Button
              onClick={() => setCreateAlertDialogOpen(true)}
              variant="outline"
              className="border-green-500 text-green-500 hover:bg-green-500/10"
            >
              <Bell className="h-4 w-4 mr-2" />
              Create Alert
            </Button>
          </div>
        </div>

        {/* Price Card */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-400 mb-1">Current Price</p>
                <p className="text-3xl font-bold text-white">
                  {formatCurrency(quote.currentPrice)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Change</p>
                <div className={`flex items-center gap-2 ${isPositive ? "text-green-500" : "text-red-500"}`}>
                  {isPositive ? (
                    <TrendingUp className="h-5 w-5" />
                  ) : (
                    <TrendingDown className="h-5 w-5" />
                  )}
                  <p className="text-2xl font-bold">
                    {formatCurrency(Math.abs(quote.change))}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Change %</p>
                <p className={`text-2xl font-bold ${isPositive ? "text-green-500" : "text-red-500"}`}>
                  {formatPercent(quote.changePercent)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Previous Close</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(quote.previousClose)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-700">
              <div>
                <p className="text-sm text-gray-400 mb-1">Open</p>
                <p className="text-lg font-medium text-white">
                  {formatCurrency(quote.open)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">High</p>
                <p className="text-lg font-medium text-green-500">
                  {formatCurrency(quote.high)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Low</p>
                <p className="text-lg font-medium text-red-500">
                  {formatCurrency(quote.low)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Symbol Info Widget */}
        <div className="mb-6">
          <TradingViewWidget
            scriptUrl="https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js"
            config={SYMBOL_INFO_WIDGET_CONFIG(tradingViewSymbol)}
            height={170}
          />
        </div>
      </div>

      {/* Chart and Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Chart */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Price Chart</CardTitle>
              <CardDescription className="text-gray-400">
                Interactive chart for {symbol}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TradingViewWidget
                scriptUrl="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
                config={CANDLE_CHART_WIDGET_CONFIG(tradingViewSymbol)}
                height={500}
              />
            </CardContent>
          </Card>
        </div>

        {/* Company Info */}
        <div className="space-y-6">
          {profile && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.marketCapitalization && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Market Cap</p>
                    <p className="text-lg font-semibold text-white">
                      {(() => {
                        const marketCap = profile.marketCapitalization;
                        // Finnhub returns market cap in the base currency unit (dollars)
                        // Format appropriately based on size
                        if (marketCap >= 1e12) {
                          return `$${(marketCap / 1e12).toFixed(2)}T`;
                        } else if (marketCap >= 1e9) {
                          return `$${(marketCap / 1e9).toFixed(2)}B`;
                        } else if (marketCap >= 1e6) {
                          return `$${(marketCap / 1e6).toFixed(2)}M`;
                        } else {
                          return `$${marketCap.toLocaleString()}`;
                        }
                      })()}
                    </p>
                  </div>
                )}
                {profile.industry && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Industry</p>
                    <p className="text-lg font-semibold text-white">
                      {profile.industry}
                    </p>
                  </div>
                )}
                {profile.sector && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Sector</p>
                    <p className="text-lg font-semibold text-white">
                      {profile.sector}
                    </p>
                  </div>
                )}
                {profile.country && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Country</p>
                    <p className="text-lg font-semibold text-white">
                      {profile.country}
                    </p>
                  </div>
                )}
                {profile.currency && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Currency</p>
                    <p className="text-lg font-semibold text-white">
                      {profile.currency}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {profile?.description && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {profile.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* News Section */}
      {news.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Latest News</CardTitle>
            <CardDescription className="text-gray-400">
              Recent news about {symbol}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {news.slice(0, 6).map((article) => (
                <a
                  key={article.id}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors border border-gray-600 hover:border-yellow-500/50"
                >
                  <p className="text-xs text-gray-500 mb-2">
                    {new Date(article.datetime * 1000).toLocaleDateString()}
                  </p>
                  <h3 className="text-white font-semibold mb-2 line-clamp-2">
                    {article.headline}
                  </h3>
                  {article.summary && (
                    <p className="text-sm text-gray-400 line-clamp-3 mb-2">
                      {article.summary}
                    </p>
                  )}
                  <p className="text-xs text-yellow-500 flex items-center gap-1">
                    Read more <ExternalLink className="h-3 w-3" />
                  </p>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AddPositionDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onPositionAdded={() => {
          setAddDialogOpen(false);
          loadStockData();
        }}
        defaultSymbol={symbol}
        defaultCompanyName={profile?.name || ""}
      />

      <CreateAlertDialog
        open={createAlertDialogOpen}
        onOpenChange={setCreateAlertDialogOpen}
        onAlertCreated={() => {
          setCreateAlertDialogOpen(false);
          toast.success("Price alert created successfully");
        }}
        defaultSymbol={symbol}
        defaultCompany={profile?.name || ""}
      />
      
      <UpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        targetPlan="pro"
        reason={upgradeReason}
      />
    </div>
  );
}

