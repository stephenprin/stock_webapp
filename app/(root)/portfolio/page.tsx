"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getPortfolioHoldings, getAssetAllocation } from "@/lib/actions/portfolio.actions";
import { PortfolioSummary, AssetAllocation } from "@/lib/services/portfolio-analytics.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, TrendingUp, TrendingDown, DollarSign, PieChart, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import PortfolioHoldingsTable from "@/components/portfolio/PortfolioHoldingsTable";
import AddPositionDialog from "@/components/portfolio/AddPositionDialog";
import AssetAllocationChart from "@/components/portfolio/AssetAllocationChart";
import PortfolioPerformanceChart from "@/components/portfolio/PortfolioPerformanceChart";
import EnhancedPortfolioAnalytics from "@/components/portfolio/EnhancedPortfolioAnalytics";
import SubscriptionBadge from "@/components/billing/SubscriptionBadge";
import UpgradeDialog from "@/components/billing/UpgradeDialog";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { getSubscriptionLimits } from "@/lib/utils/subscription";
import { Skeleton } from "@/components/ui/skeleton";

export default function PortfolioPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [allocation, setAllocation] = useState<AssetAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  
  const { plan, isFree, isPro } = useSubscription();
  const [stockLimit, setStockLimit] = useState<number | null>(null);

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

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      const result = await getPortfolioHoldings();
      
      if (result.success && result.holdings && result.summary) {
        setHoldings(result.holdings);
        setSummary(result.summary);

        const allocationResult = await getAssetAllocation();
        if (allocationResult.success && allocationResult.allocation) {
          setAllocation(allocationResult.allocation);
        }
      } else {
        toast.error(result.error || "Failed to load portfolio");
      }
    } catch (error) {
      toast.error("Failed to load portfolio");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPortfolio();
    setRefreshing(false);
    toast.success("Portfolio refreshed");
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  useEffect(() => {
    const fetchLimit = async () => {
      const limits = await getSubscriptionLimits(plan);
      setStockLimit(limits.maxStocks);
    };
    if (plan) {
      fetchLimit();
    }
  }, [plan]);

  const handlePositionAdded = () => {
    setAddDialogOpen(false);
    loadPortfolio();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header - Static content, always visible */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white">My Portfolio</h1>
            <SubscriptionBadge />
          </div>
          <p className="text-gray-400">Track your investments and performance</p>
          {loading ? (
            <Skeleton className="h-4 w-40 mt-2" />
          ) : (
            isFree && stockLimit !== null && (
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                <Sparkles className="h-4 w-4" />
                <span>
                  Using {holdings.length}/{stockLimit} stocks
                </span>
                {holdings.length >= stockLimit && (
                  <span className="text-yellow-500 font-medium">
                    • Limit reached
                  </span>
                )}
              </div>
            )
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
          {isPro && (
            <Button
              variant="outline"
              onClick={() => setUpgradeDialogOpen(true)}
              className="flex items-center gap-2 border-purple-500/50 text-purple-500 hover:bg-purple-500/10"
            >
              <Sparkles className="h-4 w-4" />
              Switch to Enterprise
            </Button>
          )}
          <Button
            onClick={() => setAddDialogOpen(true)}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900"
            disabled={loading || (isFree && stockLimit !== null && holdings.length >= stockLimit)}
          >
            <Plus className="h-4 w-4" />
            Add Position
          </Button>
        </div>
      </div>

      {/* Summary Cards - Dynamic, show skeleton when loading */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Total Value
              </CardTitle>
              <DollarSign className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                ${summary.totalMarketValue.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Total Cost: ${summary.totalCost.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Total Gain/Loss
              </CardTitle>
              {summary.totalGainLoss >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  summary.totalGainLoss >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {summary.totalGainLoss >= 0 ? "+" : ""}
                ${summary.totalGainLoss.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p
                className={`text-xs mt-1 ${
                  summary.totalGainLossPercent >= 0
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {summary.totalGainLossPercent >= 0 ? "+" : ""}
                {summary.totalGainLossPercent.toFixed(2)}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Holdings
              </CardTitle>
              <PieChart className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {summary.holdingsCount}
              </div>
              <p className="text-xs text-gray-500 mt-1">Positions</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Return
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  summary.totalGainLossPercent >= 0
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {summary.totalGainLossPercent >= 0 ? "+" : ""}
                {summary.totalGainLossPercent.toFixed(2)}%
              </div>
              <p className="text-xs text-gray-500 mt-1">Overall return</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts - Dynamic, show skeleton when loading */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Asset Allocation</CardTitle>
              <CardDescription className="text-gray-400">
                Portfolio distribution by position
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Performance</CardTitle>
              <CardDescription className="text-gray-400">
                Portfolio value over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {allocation.length > 0 && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Asset Allocation</CardTitle>
              <CardDescription className="text-gray-400">
                Portfolio distribution by position
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AssetAllocationChart data={allocation} />
            </CardContent>
          </Card>
        )}

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Performance</CardTitle>
            <CardDescription className="text-gray-400">
              Portfolio value over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PortfolioPerformanceChart holdings={holdings} />
          </CardContent>
        </Card>
      </div>
      )}

      {/* Enhanced Analytics - Pro Only */}
      {summary && holdings.length > 0 && (
        <EnhancedPortfolioAnalytics holdings={holdings} summary={summary} />
      )}

      {/* Holdings Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Holdings</CardTitle>
          <CardDescription className="text-gray-400">
            Your current positions and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4 items-center">
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 w-24" />
                </div>
              ))}
            </div>
          ) : holdings.length > 0 ? (
            <PortfolioHoldingsTable
              holdings={holdings}
              onPositionUpdated={loadPortfolio}
            />
          ) : (
            <div className="text-center py-12">
              <PieChart className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                No positions yet
              </h3>
              <p className="text-gray-500 mb-6">
                Start building your portfolio by adding your first position
              </p>
              <Button
                onClick={() => setAddDialogOpen(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-gray-900"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Position
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AddPositionDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onPositionAdded={handlePositionAdded}
      />
      
      <UpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        targetPlan={plan === "pro" ? "enterprise" : "pro"}
        reason={isFree && stockLimit !== null && holdings.length >= stockLimit 
          ? `You've reached the limit of ${stockLimit} stocks for your free plan. Upgrade to Pro for unlimited stock tracking.`
          : undefined
        }
      />
    </div>
  );
}

