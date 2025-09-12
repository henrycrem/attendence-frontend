"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { getSalesDashboardAnalyticsChart } from "@/actions/tashdashboard";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

// Define period type
type Period = "day" | "week" | "month" | "year";

export function DailyActivityTracker() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>("month");

  const {
    data: analyticsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["salesAnalytics", user?.id, period],
    queryFn: () =>
      getSalesDashboardAnalyticsChart({
        userId: user?.id as string,
        period,
      }),
    enabled: !!user?.id,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Transform dailyActivity data for chart
  const chartData = analyticsData?.data?.charts?.dailyActivity
    ?.map((item: any) => ({
      date: item.date, // Keep original date string (YYYY-MM-DD) for XAxis positioning
      label: new Date(item.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }), // Formatted for display
      "Completed Tasks": Number(item.tasks_completed) || 0,
      "Pending Tasks": Number(item.tasks_created - item.tasks_completed) || 0,
    }))
    .reverse() || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                📊 Task Completion Analytics
              </CardTitle>
              <CardDescription>Loading your task analytics...</CardDescription>
            </div>
            <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !analyticsData?.success) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                📊 Task Completion Analytics
              </CardTitle>
              <CardDescription>Failed to load analytics</CardDescription>
            </div>
            <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive text-center py-8">
            Unable to load your task analytics at this time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              📊 Task Completion Analytics
            </CardTitle>
            <CardDescription>
              Track your completed vs pending tasks over time
            </CardDescription>
          </div>
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                type="category"
                tickFormatter={(value) => {
                  return new Date(value).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
                interval={0}
                tick={{ fill: "#666", fontSize: 12 }}
                tickLine={{ stroke: "#666" }}
                axisLine={{ stroke: "#666" }}
              />
              <YAxis
                tick={{ fill: "#666", fontSize: 12 }}
                tickLine={{ stroke: "#666" }}
                axisLine={{ stroke: "#666" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #ff6b6b",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                }}
                labelStyle={{ fontWeight: "bold", color: "#333" }}
                labelFormatter={(label) =>
                  `Date: ${new Date(label).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}`
                }
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Completed Tasks"
                stroke="#ff6b6b"
                strokeWidth={3}
                dot={{ fill: "#ff6b6b", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 8, fill: "#ff6b6b", stroke: "#fff", strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="Pending Tasks"
                stroke="#ffcccc"
                strokeWidth={2}
                dot={{ fill: "#ffcccc", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 8, fill: "#ffcccc", stroke: "#fff", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-red-50 py-2 px-4 rounded-lg border border-red-100">
            <p className="text-sm text-red-600 font-medium">Total Tasks</p>
            <p className="text-xl font-bold text-red-700">
              {analyticsData.data.summary.totalTasks}
            </p>
          </div>
          <div className="bg-red-50 py-2 px-4 rounded-lg border border-red-100">
            <p className="text-sm text-red-600 font-medium">Completed</p>
            <p className="text-xl font-bold text-red-700">
              {analyticsData.data.summary.completedTasks}
            </p>
          </div>
          <div className="bg-red-50 py-2 px-4 rounded-lg border border-red-100">
            <p className="text-sm text-red-600 font-medium">Completion Rate</p>
            <p className="text-md font-bold text-red-700">
              {analyticsData.data.summary.taskCompletionRate}%
            </p>
          </div>
          <div className="bg-red-50 py-2 px-4 rounded-lg border border-red-100">
            <p className="text-sm text-red-600 font-medium">Conversions</p>
            <p className="text-xl font-bold text-red-700">
              {Math.round(
                (analyticsData.data.summary.conversionRate *
                  analyticsData.data.summary.totalTasks) /
                  100
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}