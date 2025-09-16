

"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { TrendingUp, Crown, Medal } from "lucide-react";

interface SalesMember {
  id: string;
  name: string;
  position: string;
  periodStats: {
    revenue: number;
    conversions: number;
  };
  // Add role info to ensure we're filtering correctly
  role?: {
    roleName: string;
  };
}

interface SalesPerformanceByMemberChartProps {
  teamPerformance: SalesMember[];
  period: string;
}

export default function SalesPerformanceByMemberChart({
  teamPerformance,
  period,
}: SalesPerformanceByMemberChartProps) {
  // ✅ FILTER: Only include users with roleName 'sales'
  const salesMembers = teamPerformance.filter(member => 
    member.role?.roleName === 'sales' || 
    // Fallback: if role info not available, include if they have revenue data
    (member.periodStats?.revenue > 0 || member.periodStats?.conversions > 0)
  );

  // ✅ SORT: By revenue (highest first)
  const sortedMembers = [...salesMembers]
    .sort((a, b) => (b.periodStats?.revenue || 0) - (a.periodStats?.revenue || 0))
    .slice(0, 10); // Show top 10

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  // ✅ Get top performer for special highlighting
  const topPerformer = sortedMembers[0];

  // ✅ Handle case where no sales members found
  if (sortedMembers.length === 0) {
    return (
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Top Revenue Generators
          </CardTitle>
          <CardDescription>
            {period === "daily" ? "Today's" : 
             period === "weekly" ? "This week's" : 
             period === "yearly" ? "This year's" : "This month's"} 
            top performers by revenue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full flex items-center justify-center">
            <div className="text-center p-8">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-16 h-16">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Sales Team Members Found</h3>
              <p className="text-gray-600">No users with 'sales' role have generated revenue in this period.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          Top Revenue Generators
        </CardTitle>
        <CardDescription>
          {period === "daily" ? "Today's" : 
           period === "weekly" ? "This week's" : 
           period === "yearly" ? "This year's" : "This month's"} 
          top performers by revenue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedMembers}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" horizontal={false} />
              <XAxis 
                type="number" 
                stroke="#666" 
                fontSize={12}
                tickFormatter={(value) => {
                  // Format large numbers as K/M
                  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
                  return `$${value}`;
                }}
              />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#666"
                fontSize={12}
                width={120}
                tick={({ payload, x, y, fill }) => {
                  const member = sortedMembers.find(m => m.name === payload.value);
                  const isTopPerformer = member?.id === topPerformer?.id;
                  
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text
                        x={0}
                        y={0}
                        dy={4}
                        textAnchor="end"
                        fill={isTopPerformer ? "#f59e0b" : "#666"}
                        fontSize={12}
                        fontWeight={isTopPerformer ? "bold" : "normal"}
                      >
                        {payload.value}
                        {isTopPerformer && (
                          <tspan dx={5} fill="#f59e0b">🏆</tspan>
                        )}
                      </text>
                    </g>
                  );
                }}
              />
              <Tooltip
                formatter={(value: any) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.375rem",
                }}
                labelFormatter={(label) => {
                  const member = sortedMembers.find(m => m.name === label);
                  return `${member?.name} (${member?.position || "Sales Rep"})`;
                }}
              />
              <Bar
                dataKey="periodStats.revenue"
                radius={[0, 4, 4, 0]}
                name="Revenue Generated"
              >
                {sortedMembers.map((member, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={member.id === topPerformer?.id ? "#f59e0b" : "#3b82f6"}
                    stroke={member.id === topPerformer?.id ? "#d97706" : "#2563eb"}
                    strokeWidth={member.id === topPerformer?.id ? 2 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Leaderboard summary */}
        {topPerformer && (
          <div className=" p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Crown className="w-8 h-8 text-yellow-600" />
              <div>
                <div className="font-bold text-yellow-800">
                  Top Performer: {topPerformer.name}
                </div>
                <div className="text-sm text-yellow-700">
                  Generated {formatCurrency(topPerformer.periodStats.revenue)} with {topPerformer.periodStats.conversions} conversions
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance insights */}
        <div className="mt-4 text-xs text-gray-500 space-y-1">
          <div>🏆 Gold: Top sales performer</div>
          <div>🔵 Blue: Other sales team members</div>
       
          <div>Higher bars = More revenue generated</div>
        </div>
      </CardContent>
    </Card>
  );
}