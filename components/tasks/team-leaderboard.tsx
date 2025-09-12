"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Trophy, Medal, Award, TrendingUp, Loader2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { getTeamAnalytics } from "@/actions/tashdashboard" 

interface LeaderboardMember {
  id: string
  name: string
  clients: number
  revenue: number
  conversionRate: number
  rank: number
  change: "up" | "down" | "same"
}

export function TeamLeaderboard() {
  const {
    data: teamData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["team-analytics"],
    queryFn: () => getTeamAnalytics("month"),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold">{rank}</span>
    }
  }

  const getChangeIndicator = (change: LeaderboardMember["change"]) => {
    switch (change) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case "down":
        return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
      default:
        return <div className="w-4 h-4" />
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Top Performers This Month
          </CardTitle>
          <CardDescription>Leading sales representatives based on overall performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading team performance...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !teamData?.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Top Performers This Month
          </CardTitle>
          <CardDescription>Leading sales representatives based on overall performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Unable to load team performance data</div>
        </CardContent>
      </Card>
    )
  }

  const leaderboardData: LeaderboardMember[] =
    teamData.data?.topPerformers?.map((member: any, index: number) => ({
      id: member.id,
      name: member.name,
      clients: member.totalClients || 0,
      revenue: member.totalRevenue || 0,
      conversionRate: member.conversionRate || 0,
      rank: index + 1,
      change: member.trend || "same",
    })) || []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Top Performers This Month
        </CardTitle>
        <CardDescription>Leading sales representatives based on overall performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {leaderboardData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No performance data available</div>
          ) : (
            leaderboardData.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getRankIcon(member.rank)}
                    {getChangeIndicator(member.change)}
                  </div>
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.clients} clients acquired</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(member.revenue)}</p>
                    <p className="text-sm text-muted-foreground">Revenue generated</p>
                  </div>
                  <Badge className="bg-primary text-primary-foreground">
                    {member.conversionRate.toFixed(1)}% conversion
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
