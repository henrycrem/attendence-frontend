// app/admin/dashboard/components/SalesPerformanceChart.tsx

"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface SalesPerformanceChartProps {
  salesData: {
    date: string;
    clients_created: number;
    tasks_created: number;
    tasks_completed: number;
  }[];
}

export default function SalesPerformanceChart({
  salesData,
}: SalesPerformanceChartProps) {
  console.log("📊 SalesPerformanceChart received salesData:", salesData);
  const formattedData = salesData.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          Sales Activity Trends
        </CardTitle>
        <CardDescription>Clients, tasks, and completions over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
              <XAxis dataKey="date" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.375rem",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="clients_created"
                stroke="#3b82f6" // Blue — neutral/positive
                strokeWidth={2}
                name="Clients Created"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="tasks_created"
                stroke="#ef4444" // 🔴 RED — dominates to show "unfinished work"
                strokeWidth={3} // Slightly thicker for emphasis
                name="Tasks Created"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="tasks_completed"
                stroke="#10b981" // Green — positive/completed
                strokeWidth={2}
                name="Tasks Completed"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}