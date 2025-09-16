"use client";


import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Users, TrendingUp, Medal } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TeamMember {
  id: string;
  name: string;
  position: string;
  periodStats: {
    conversions: number;
    revenue: number;
  };
  // ❗ No department or attendanceRate in teamPerformance
}

interface TeamLeaderboardProps {
  teamData: TeamMember[];
}

export default function TeamLeaderboard({ teamData }: TeamLeaderboardProps) {
  // ✅ Sort by revenue (or conversions if revenue is 0)
  const topPerformers = [...teamData]
    .sort((a, b) => (b.periodStats.revenue || 0) - (a.periodStats.revenue || 0))
    .slice(0, 5)
    .map((member, index) => ({
      ...member,
      rank: index + 1,
    }));

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Medal className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-700" />;
      default:
        return <span className="text-sm font-medium text-gray-500">{rank}</span>;
    }
  };

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Team Leaderboard
        </CardTitle>
        <CardDescription>Top 5 performers by revenue generated</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left text-sm text-gray-600">
                <th className="pb-3 font-medium">Rank</th>
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Position</th>
                <th className="pb-3 font-medium">Revenue</th>
                <th className="pb-3 font-medium">Conversions</th>
              </tr>
            </thead>
            <tbody>
              {topPerformers.map((member) => (
                <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      {getRankIcon(member.rank)}
                    </div>
                  </td>
                  <td className="py-4 font-medium text-gray-800">{member.name}</td>
                  <td className="py-4">
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                      {member.position || "N/A"}
                    </Badge>
                  </td>
                  <td className="py-4 font-semibold text-green-700">
                    {formatCurrency(member.periodStats.revenue)}
                  </td>
                  <td className="py-4 text-purple-600 font-medium">
                    {member.periodStats.conversions}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {topPerformers.length === 0 && (
          <div className="text-center py-8 text-gray-500 italic">
            No team performance data available.
          </div>
        )}
      </CardContent>
    </Card>
  );
}