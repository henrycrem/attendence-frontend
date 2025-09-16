"use client";

import {
  PieChart as RePieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PieChartIcon } from "lucide-react";

interface StatusDistributionChartProps {
  attendanceStats: {
    presentToday: number;
    lateArrivals: number;
    notClockedIn: number;
  };
}

// 🔴 Red-dominant palette
const COLORS = ["#b91c1c", "#ef4444", "#f87171"]; 
// Dark Red, Standard Red, Soft Red

export default function StatusDistributionChart({
  attendanceStats,
}: StatusDistributionChartProps) {
  const data = [
    { name: "Present", value: attendanceStats.presentToday },
    { name: "Late", value: attendanceStats.lateArrivals },
    { name: "Not Clocked In", value: attendanceStats.notClockedIn },
  ].filter((item) => item.value > 0);

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="w-5 h-5 text-red-600" />
          Status Distribution
        </CardTitle>
        <CardDescription>Today’s attendance breakdown by status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RePieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#ef4444"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </RePieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
