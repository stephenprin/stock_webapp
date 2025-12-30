"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface PortfolioPerformanceChartProps {
  holdings: PortfolioHolding[];
}

// Simple performance chart showing current positions
// In a full implementation, you'd track historical portfolio values over time
export default function PortfolioPerformanceChart({
  holdings,
}: PortfolioPerformanceChartProps) {
  if (holdings.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No performance data available
      </div>
    );
  }

  // Calculate totals for visualization
  const totalCost = holdings.reduce((sum, h) => sum + h.totalCost, 0);
  const totalMarketValue = holdings.reduce(
    (sum, h) => sum + (h.marketValue || 0),
    0
  );
  const totalGainLoss = totalMarketValue - totalCost;

  // For demo purposes, create a simple comparison chart
  // In production, you'd want historical data points
  const data = [
    {
      name: "Cost Basis",
      value: totalCost,
      gain: totalGainLoss >= 0 ? totalGainLoss : 0,
      loss: totalGainLoss < 0 ? Math.abs(totalGainLoss) : 0,
    },
    {
      name: "Market Value",
      value: totalMarketValue,
      gain: totalGainLoss >= 0 ? totalGainLoss : 0,
      loss: totalGainLoss < 0 ? Math.abs(totalGainLoss) : 0,
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-700 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold mb-2">{payload[0].payload.name}</p>
          <p className="text-gray-300 text-sm">
            Value: $
            {payload[0].value.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          {totalGainLoss !== 0 && (
            <p
              className={`text-sm mt-1 ${
                totalGainLoss >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {totalGainLoss >= 0 ? "Gain" : "Loss"}: $
              {Math.abs(totalGainLoss).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="name"
            stroke="#9CA3AF"
            style={{ fontSize: "12px" }}
          />
          <YAxis
            stroke="#9CA3AF"
            style={{ fontSize: "12px" }}
            tickFormatter={(value) =>
              `$${(value / 1000).toFixed(0)}k`
            }
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
            formatter={(value) => (
              <span className="text-gray-300">{value}</span>
            )}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#FDD458"
            strokeWidth={2}
            name="Portfolio Value"
            dot={{ fill: "#FDD458", r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-500 text-center mt-2">
        Historical performance tracking coming soon
      </p>
    </div>
  );
}

