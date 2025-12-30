"use client";

import { AssetAllocation } from "@/lib/services/portfolio-analytics.service";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface AssetAllocationChartProps {
  data: AssetAllocation[];
}


const COLORS = [
  "#FDD458", 
  "#0FEDBE", 
  "#FF6B6B", 
  "#4ECDC4", 
  "#95E1D3", 
  "#F38181", 
  "#AA96DA", 
  "#FCBAD3", 
  "#AED9E0", 
  "#D4A5A5", 
];

const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function AssetAllocationChart({ data }: AssetAllocationChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No allocation data available
      </div>
    );
  }

  const chartData = data.map((item, index) => ({
    name: item.symbol,
    fullName: item.companyName,
    value: item.percentage,
    color: COLORS[index % COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-gray-700 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold">{data.payload.fullName}</p>
          <p className="text-gray-300 text-sm">{data.name}</p>
          <p className="text-yellow-500 font-medium mt-1">
            ${data.payload.value.toFixed(2)} ({data.value.toFixed(2)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value, entry: any) => (
              <span className="text-gray-300 text-sm">
                {entry.payload.fullName || value}
              </span>
            )}
            iconType="circle"
            wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

