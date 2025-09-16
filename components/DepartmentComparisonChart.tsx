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
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

interface Department {
  id: string;
  name: string;
  _count: {
    users: number;
    employees?: number;
  };
}

interface DepartmentComparisonChartProps {
  departments: Department[];
}

export default function DepartmentComparisonChart({
  departments,
}: DepartmentComparisonChartProps) {
  // ✅ Only use guaranteed fields: name and user count
  const data = departments.map((dept) => ({
    name: dept.name,
    "Team Size": dept._count.users,
  }));

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-red-600" />
          Department Comparison
        </CardTitle>
        <CardDescription>Compare departments by team size</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
              <XAxis
                dataKey="name"
                stroke="#991b1b" // dark red axis
                fontSize={12}
                angle={-30}
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="#991b1b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #fecaca", // light red border
                  borderRadius: "0.375rem",
                }}
                labelStyle={{ color: "#b91c1c" }} // dark red labels
              />
              <Legend />
              <Bar
                dataKey="Team Size"
                fill="#ef4444" // 🔴 Telecel red
                name="Team Size"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
