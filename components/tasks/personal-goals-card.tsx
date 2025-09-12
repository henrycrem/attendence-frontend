"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, Calendar, Loader2, TrendingUp, Award, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getSalesDashboardAnalytics } from "@/actions/tashdashboard";
import { useAuth } from "@/contexts/AuthContext";

interface Goal {
  id: string;
  title: string;
  target: number | null;
  current: number;
  period: string;
  status: "on-track" | "behind" | "exceeded" | "no-target";
}

export function PersonalGoalsCard() {
  const { user } = useAuth();

  const {
    data: dashboardData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["personalGoals", user?.id],
    queryFn: () => getSalesDashboardAnalytics(user?.id, "month"),
    enabled: !!user?.id,
    refetchInterval: 5 * 60 * 1000,
  });

  const getGoalsFromData = (data: any): Goal[] => {
    if (!data?.success || !data.data) return [];

    const userPerformance = data.data.userPerformance || {};

    const getGoalStatus = (current: number, target: number | null): Goal["status"] => {
      if (target === null || target <= 0) return "no-target";
      if (current >= target) return "exceeded";
      if (current >= target * 0.8) return "on-track";
      return "behind";
    };

    return [
      // ✅ Weekly Sales Goal
      {
        id: "weekly-sales",
        title: "Weekly Sales",
        target: userPerformance.targets?.weekly ?? null,
        current: userPerformance.current?.weekly?.sales ?? 0,
        period: "This Week",
        status: getGoalStatus(
          userPerformance.current?.weekly?.sales ?? 0,
          userPerformance.targets?.weekly ?? null
        ),
      },
      // ✅ Monthly Sales Goal
      {
        id: "monthly-sales",
        title: "Monthly Sales",
        target: userPerformance.targets?.monthly ?? null,
        current: userPerformance.current?.monthly?.sales ?? 0,
        period: "This Month",
        status: getGoalStatus(
          userPerformance.current?.monthly?.sales ?? 0,
          userPerformance.targets?.monthly ?? null
        ),
      },
      // ✅ Weekly Revenue Goal
      {
        id: "weekly-revenue",
        title: "Weekly Revenue",
        target: userPerformance.targets?.weekly ? userPerformance.targets.weekly * 50 : null, // Example: $50 per sale
        current: userPerformance.current?.weekly?.revenue ?? 0,
        period: "This Week",
        status: getGoalStatus(
          userPerformance.current?.weekly?.revenue ?? 0,
          userPerformance.targets?.weekly ? userPerformance.targets.weekly * 50 : null
        ),
      },
      // ✅ Monthly Revenue Goal
      {
        id: "monthly-revenue",
        title: "Monthly Revenue",
        target: userPerformance.targets?.monthly ? userPerformance.targets.monthly * 100 : null, // Example: $100 per sale
        current: userPerformance.current?.monthly?.revenue ?? 0,
        period: "This Month",
        status: getGoalStatus(
          userPerformance.current?.monthly?.revenue ?? 0,
          userPerformance.targets?.monthly ? userPerformance.targets.monthly * 100 : null
        ),
      },
    ];
  };

  const goals = getGoalsFromData(dashboardData);

  const getStatusColor = (status: Goal["status"]) => {
    switch (status) {
      case "exceeded":
        return "bg-green-500";
      case "on-track":
        return "bg-red-600";
      case "behind":
        return "bg-gray-400";
      default:
        return "bg-gray-300";
    }
  };

  const getStatusBadge = (status: Goal["status"], target: number | null) => {
    if (target === null) {
      return (
        <Badge className="bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-100">
          <AlertTriangle className="w-3 h-3 mr-1" />
          No Target
        </Badge>
      );
    }

    switch (status) {
      case "exceeded":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-300 hover:bg-green-100">
            <Award className="w-3 h-3 mr-1" />
            Exceeded
          </Badge>
        );
      case "on-track":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300 hover:bg-red-100">
            <TrendingUp className="w-3 h-3 mr-1" />
            On Track
          </Badge>
        );
      case "behind":
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-100">
            Behind
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-100">
            Unknown
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <Card className="border-red-200 shadow-sm bg-white">
        <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-red-800 text-lg">Personal Goals</CardTitle>
              <CardDescription className="text-red-600 text-sm">Loading your progress...</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-center h-24">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-red-600" />
              <span className="text-gray-500 text-xs">Loading goals...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !dashboardData?.success) {
    return (
      <Card className="border-red-200 shadow-sm bg-white">
        <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-red-800 text-lg">Personal Goals</CardTitle>
              <CardDescription className="text-red-600 text-sm">Unable to load data</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center py-4">
            <p className="text-gray-600 text-sm">Unable to load your goals at this time.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-red-200 shadow-sm bg-white">
      <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <Target className="w-4 h-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-red-800 text-lg">Personal Goals</CardTitle>
            <CardDescription className="text-red-600 text-sm">
              Track your weekly & monthly progress
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {goals.map((goal) => {
            const percentage = goal.target
              ? Math.min((goal.current / goal.target) * 100, 100)
              : 0;

            return (
              <div
                key={goal.id}
                className="space-y-2 p-3 bg-red-50/50 rounded-lg border border-red-100"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-800 text-sm">{goal.title}</h4>
                  {getStatusBadge(goal.status, goal.target)}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">
                      {goal.current.toLocaleString()} of {goal.target?.toLocaleString() || "No Target"}
                    </span>
                    {goal.target && (
                      <span className="font-semibold text-red-600">{percentage.toFixed(0)}%</span>
                    )}
                  </div>

                  {goal.target && (
                    <div className="relative h-2 bg-red-100 rounded-full overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 ${getStatusColor(goal.status)} transition-all duration-300`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  )}

                  {!goal.target && (
                    <div className="text-xs text-gray-500 italic">
                      Set a target with your manager
                    </div>
                  )}
                </div>

                {goal.status === "behind" && goal.current > 0 && (
                  <p className="text-xs text-gray-600 mt-1">Keep pushing!</p>
                )}

                {goal.status === "exceeded" && (
                  <p className="text-xs text-green-700 mt-1 font-medium">🎯 Exceeded target!</p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}