"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { TrendingUp, TrendingDown, Target, AlertTriangle, BarChart3, Award, Zap, Shield } from "lucide-react";
import { useSubscription } from "@/lib/hooks/useSubscription";
import UpgradeDialog from "@/components/billing/UpgradeDialog";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface EnhancedPortfolioAnalyticsProps {
  holdings: PortfolioHolding[];
  summary: any;
}

export default function EnhancedPortfolioAnalytics({
  holdings,
  summary,
}: EnhancedPortfolioAnalyticsProps) {
  const { isPro, isEnterprise, plan, loading: subscriptionLoading } = useSubscription();
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  
  const hasProAccess = isPro || isEnterprise;

  if (subscriptionLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {[1, 2].map((i) => (
          <Card key={i} className="bg-gray-800 border-gray-700">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!hasProAccess) {
    return (
      <Card className="bg-gray-800 border-yellow-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-yellow-500" />
                Enhanced Portfolio Analytics
              </CardTitle>
              <CardDescription className="text-gray-400 mt-2">
                Unlock advanced portfolio insights with Pro
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-yellow-500/50 text-yellow-500">
              Pro Feature
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="h-16 w-16 text-yellow-500/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Advanced Analytics Available
            </h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Get detailed sector analysis, risk metrics, top performers, and advanced portfolio insights with Pro or Enterprise.
            </p>
            <button
              onClick={() => setUpgradeDialogOpen(true)}
              className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-medium rounded-lg transition-colors"
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

  // Calculate enhanced metrics
  const sectorBreakdown = calculateSectorBreakdown(holdings);
  const topPerformers = getTopPerformers(holdings, 5);
  const worstPerformers = getWorstPerformers(holdings, 5);
  const riskMetrics = calculateRiskMetrics(holdings, summary);
  const diversificationScore = calculateDiversificationScore(holdings);

  const COLORS = ["#FDD458", "#0FEDBE", "#FF6B6B", "#4ECDC4", "#95E1D3", "#F38181", "#AA96DA"];

  const SectorTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-gray-700 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold">{data.payload.sector}</p>
          <p className="text-yellow-500 font-medium mt-1">
            ${data.payload.value.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-gray-300 text-sm mt-1">
            {data.payload.percentage.toFixed(2)}% of portfolio
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Risk & Diversification Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Diversification Score
            </CardTitle>
            <Shield className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {diversificationScore.score}/100
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    diversificationScore.score >= 70
                      ? "bg-green-500"
                      : diversificationScore.score >= 50
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${diversificationScore.score}%` }}
                />
              </div>
              <Badge
                variant={
                  diversificationScore.score >= 70
                    ? "default"
                    : diversificationScore.score >= 50
                    ? "secondary"
                    : "destructive"
                }
                className="text-xs"
              >
                {diversificationScore.label}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {diversificationScore.recommendation}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Portfolio Concentration
            </CardTitle>
            <Target className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {riskMetrics.concentration.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Top 3 holdings represent{" "}
              {riskMetrics.topThreeConcentration.toFixed(1)}% of portfolio
            </p>
            {riskMetrics.concentration > 50 && (
              <div className="flex items-center gap-1 mt-2 text-xs text-yellow-500">
                <AlertTriangle className="h-3 w-3" />
                High concentration risk
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Average Return
            </CardTitle>
            <Zap className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                riskMetrics.avgReturn >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {riskMetrics.avgReturn >= 0 ? "+" : ""}
              {riskMetrics.avgReturn.toFixed(2)}%
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Weighted average return across all positions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sector Breakdown Chart */}
      {sectorBreakdown.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Sector Allocation</CardTitle>
            <CardDescription className="text-gray-400">
              Portfolio distribution by sector
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectorBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="sector"
                      stroke="#9CA3AF"
                      style={{ fontSize: "12px" }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      stroke="#9CA3AF"
                      style={{ fontSize: "12px" }}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<SectorTooltip />} />
                    <Bar dataKey="value" fill="#FDD458" radius={[4, 4, 0, 0]}>
                      {sectorBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-300 mb-4">
                  Sector Breakdown
                </h4>
                {sectorBreakdown.map((sector, index) => (
                  <div
                    key={sector.sector}
                    className="flex items-center justify-between p-2 bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <span className="text-sm text-white">{sector.sector}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">
                        ${sector.value.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-xs text-gray-400">
                        {sector.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top & Worst Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-green-500" />
              Top Performers
            </CardTitle>
            <CardDescription className="text-gray-400">
              Your best performing positions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topPerformers.length > 0 ? (
              <div className="space-y-3">
                {topPerformers.map((holding, index) => (
                  <div
                    key={holding.symbol}
                    className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20 text-green-500 text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{holding.symbol}</p>
                        <p className="text-xs text-gray-400">{holding.companyName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-green-500">
                        <TrendingUp className="h-4 w-4" />
                        <p className="font-semibold">
                          +{holding.gainLossPercent?.toFixed(2)}%
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        ${holding.gainLoss?.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-4">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Worst Performers */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Worst Performers
            </CardTitle>
            <CardDescription className="text-gray-400">
              Positions needing attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            {worstPerformers.length > 0 ? (
              <div className="space-y-3">
                {worstPerformers.map((holding, index) => (
                  <div
                    key={holding.symbol}
                    className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/20 text-red-500 text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{holding.symbol}</p>
                        <p className="text-xs text-gray-400">{holding.companyName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-red-500">
                        <TrendingDown className="h-4 w-4" />
                        <p className="font-semibold">
                          {holding.gainLossPercent?.toFixed(2)}%
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        ${holding.gainLoss?.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-4">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper functions
function calculateSectorBreakdown(holdings: PortfolioHolding[]) {
  const sectorMap: Record<string, { value: number; count: number }> = {};

  holdings.forEach((holding) => {
    // Use stored sector from database, fallback to "Other" if not available
    const sector = holding.sector || "Other";
    if (!sectorMap[sector]) {
      sectorMap[sector] = { value: 0, count: 0 };
    }
    sectorMap[sector].value += holding.marketValue || 0;
    sectorMap[sector].count += 1;
  });

  const totalValue = holdings.reduce(
    (sum, h) => sum + (h.marketValue || 0),
    0
  );

  return Object.entries(sectorMap)
    .map(([sector, data]) => ({
      sector,
      value: data.value,
      percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
      count: data.count,
    }))
    .sort((a, b) => b.value - a.value);
}

// Removed getSectorFromSymbol - now using stored sector from database

function getTopPerformers(
  holdings: PortfolioHolding[],
  limit: number = 5
): PortfolioHolding[] {
  return [...holdings]
    .filter((h) => (h.gainLossPercent || 0) > 0)
    .sort((a, b) => (b.gainLossPercent || 0) - (a.gainLossPercent || 0))
    .slice(0, limit);
}

function getWorstPerformers(
  holdings: PortfolioHolding[],
  limit: number = 5
): PortfolioHolding[] {
  return [...holdings]
    .filter((h) => (h.gainLossPercent || 0) < 0)
    .sort((a, b) => (a.gainLossPercent || 0) - (b.gainLossPercent || 0))
    .slice(0, limit);
}

function calculateRiskMetrics(
  holdings: PortfolioHolding[],
  summary: any
): {
  concentration: number;
  topThreeConcentration: number;
  avgReturn: number;
} {
  if (holdings.length === 0 || !summary) {
    return { concentration: 0, topThreeConcentration: 0, avgReturn: 0 };
  }

  const sortedByValue = [...holdings].sort(
    (a, b) => (b.marketValue || 0) - (a.marketValue || 0)
  );

  const topHolding = sortedByValue[0];
  const topThreeValue = sortedByValue
    .slice(0, 3)
    .reduce((sum, h) => sum + (h.marketValue || 0), 0);

  const concentration =
    summary.totalMarketValue > 0
      ? ((topHolding?.marketValue || 0) / summary.totalMarketValue) * 100
      : 0;

  const topThreeConcentration =
    summary.totalMarketValue > 0
      ? (topThreeValue / summary.totalMarketValue) * 100
      : 0;

  const weightedReturn = holdings.reduce((sum, h) => {
    const weight = summary.totalMarketValue > 0
      ? (h.marketValue || 0) / summary.totalMarketValue
      : 0;
    return sum + (weight * (h.gainLossPercent || 0));
  }, 0);

  return {
    concentration,
    topThreeConcentration,
    avgReturn: weightedReturn,
  };
}

function calculateDiversificationScore(
  holdings: PortfolioHolding[]
): {
  score: number;
  label: string;
  recommendation: string;
} {
  if (holdings.length === 0) {
    return {
      score: 0,
      label: "No Holdings",
      recommendation: "Add positions to diversify your portfolio",
    };
  }

  const sectorCount = new Set(holdings.map((h) => h.sector || "Other")).size;
  const holdingsCount = holdings.length;
  const sectorScore = Math.min((sectorCount / 10) * 40, 40); // Max 40 points
  const holdingsScore = Math.min((holdingsCount / 20) * 30, 30); // Max 30 points
  const concentrationPenalty = holdings.length > 0 ? 30 : 0; // Base 30 points

  let score = Math.round(sectorScore + holdingsScore + concentrationPenalty);

  // Adjust based on concentration (penalize if too concentrated)
  if (holdings.length > 0) {
    const sortedByValue = [...holdings].sort(
      (a, b) => (b.marketValue || 0) - (a.marketValue || 0)
    );
    const topThreeValue = sortedByValue
      .slice(0, 3)
      .reduce((sum, h) => sum + (h.marketValue || 0), 0);
    const totalValue = holdings.reduce(
      (sum, h) => sum + (h.marketValue || 0),
      0
    );
    const concentration = totalValue > 0 ? (topThreeValue / totalValue) * 100 : 0;

    if (concentration > 70) {
      score -= 20;
    } else if (concentration > 50) {
      score -= 10;
    }
  }

  score = Math.max(0, Math.min(100, score));

  let label = "Excellent";
  let recommendation = "Your portfolio is well diversified";

  if (score < 50) {
    label = "Low";
    recommendation = "Consider adding more positions across different sectors";
  } else if (score < 70) {
    label = "Moderate";
    recommendation = "Good diversification, but could be improved";
  } else if (score < 85) {
    label = "Good";
    recommendation = "Well diversified portfolio";
  }

  return { score, label, recommendation };
}

