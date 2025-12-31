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
import { Loader2, TrendingUp, TrendingDown, ExternalLink, Plus, Building2, Globe, BarChart3, Bell } from "lucide-react";
import { toast } from "sonner";
import AddPositionDialog from "@/components/portfolio/AddPositionDialog";
import CreateAlertDialog from "@/components/alerts/CreateAlertDialog";
import { formatCurrency, formatPercent } from "@/lib/utils/utils";

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

  useEffect(() => {
    if (!symbol) {
      router.push("/dashboard");
      return;
    }

    loadStockData();
  }, [symbol]);

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
        toast.error(`Could not find data for symbol: ${symbol}`);
        router.push("/dashboard");
        return;
      }

      setQuote(quoteData);
      setProfile(profileData);
      setNews(newsData || []);

      // Check if stock is in portfolio
      if (portfolioData.success && portfolioData.holdings) {
        const isInPortfolio = portfolioData.holdings.some(
          (h: any) => h.symbol.toUpperCase() === symbol.toUpperCase()
        );
        setInPortfolio(isInPortfolio);
      }
    } catch (error) {
      console.error("Error loading stock data:", error);
      toast.error("Failed to load stock data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading stock data...</p>
        </div>
      </div>
    );
  }

  if (!quote || !symbol) {
    return null;
  }

  const isPositive = quote.change >= 0;
  const tradingViewSymbol = profile?.exchange 
    ? `${profile.exchange}:${symbol}`
    : symbol;

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
                      ${(profile.marketCapitalization / 1e9).toFixed(2)}B
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
    </div>
  );
}

