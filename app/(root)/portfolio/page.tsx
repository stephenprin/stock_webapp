"use client";

import { useEffect, useState } from "react";
import { getPortfolioHoldings, getAssetAllocation } from "@/lib/actions/portfolio.actions";
import { PortfolioSummary, AssetAllocation } from "@/lib/services/portfolio-analytics.service";
import { PortfolioHolding } from "@/database/models/portfolio-holding.model";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, TrendingUp, TrendingDown, DollarSign, PieChart, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import PortfolioHoldingsTable from "@/components/portfolio/PortfolioHoldingsTable";
import AddPositionDialog from "@/components/portfolio/AddPositionDialog";
import AssetAllocationChart from "@/components/portfolio/AssetAllocationChart";
import PortfolioPerformanceChart from "@/components/portfolio/PortfolioPerformanceChart";

export default function PortfolioPage() {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [allocation, setAllocation] = useState<AssetAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      const result = await getPortfolioHoldings();
      
      if (result.success && result.holdings && result.summary) {
        setHoldings(result.holdings);
        setSummary(result.summary);

        // Load allocation
        const allocationResult = await getAssetAllocation();
        if (allocationResult.success && allocationResult.allocation) {
          setAllocation(allocationResult.allocation);
        }
      } else {
        toast.error(result.error || "Failed to load portfolio");
      }
    } catch (error) {
      console.error("Error loading portfolio:", error);
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

  const handlePositionAdded = () => {
    setAddDialogOpen(false);
    loadPortfolio();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Portfolio</h1>
          <p className="text-gray-400">Track your investments and performance</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setAddDialogOpen(true)}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900"
          >
            <Plus className="h-4 w-4" />
            Add Position
          </Button>
        </div>
      </div>


      {summary && (
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

      {/* Holdings Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Holdings</CardTitle>
          <CardDescription className="text-gray-400">
            Your current positions and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {holdings.length > 0 ? (
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
    </div>
  );
}

