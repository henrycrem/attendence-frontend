"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, ArrowUpDown, Phone, Mail, Loader2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { getTeamAnalytics } from "@/actions/tashdashboard" 


interface TeamMember {
  id: string
  name: string
  email: string
  phone: string
  clients: number
  revenue: number
  conversionRate: number
  tasksCompleted: number
  totalTasks: number
  neighborhood: string
  status: "active" | "inactive"
  lastActivity: string
}

export function TeamPerformanceTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<keyof TeamMember>("revenue")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const {
    data: teamData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["team-performance"],
    queryFn: () => getTeamAnalytics("month"),
    refetchInterval: 5 * 60 * 1000,
  })

  const teamMembers: TeamMember[] =
    teamData?.data?.teamMembers?.map((member: any) => ({
      id: member.id,
      name: member.name,
      email: member.email || `${member.name.toLowerCase().replace(" ", ".")}@telecel.lr`,
      phone: member.phone || "+231-777-000-000",
      clients: member.totalClients || 0,
      revenue: member.totalRevenue || 0,
      conversionRate: member.conversionRate || 0,
      tasksCompleted: member.completedTasks || 0,
      totalTasks: member.totalTasks || 0,
      neighborhood: member.neighborhood || "Not assigned",
      status: member.isActive ? "active" : "inactive",
      lastActivity: member.lastActivity || "Unknown",
    })) || []

  const filteredMembers = teamMembers
    .filter(
      (member) =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.neighborhood.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
      }

      return 0
    })

  const handleSort = (field: keyof TeamMember) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const getStatusBadge = (status: TeamMember["status"]) => {
    return status === "active" ? (
      <Badge className="bg-green-500 text-white">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Performance Details</CardTitle>
          <CardDescription>Comprehensive view of all sales team members and their metrics</CardDescription>
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Team Performance Details</CardTitle>
            <CardDescription>Comprehensive view of all sales team members and their metrics</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("clients")}
                    className="flex items-center gap-1 p-0 h-auto font-medium"
                  >
                    Clients
                    <ArrowUpDown className="w-4 h-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("revenue")}
                    className="flex items-center gap-1 p-0 h-auto font-medium"
                  >
                    Revenue
                    <ArrowUpDown className="w-4 h-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("conversionRate")}
                    className="flex items-center gap-1 p-0 h-auto font-medium"
                  >
                    Conversion
                    <ArrowUpDown className="w-4 h-4" />
                  </Button>
                </TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("neighborhood")}
                    className="flex items-center gap-1 p-0 h-auto font-medium"
                  >
                    Area
                    <ArrowUpDown className="w-4 h-4" />
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {error ? "Unable to load team data" : "No team members found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{member.clients}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(member.revenue)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{member.conversionRate.toFixed(1)}%</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="font-medium">{member.tasksCompleted}</span>
                        <span className="text-muted-foreground">/{member.totalTasks}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {member.totalTasks > 0 ? ((member.tasksCompleted / member.totalTasks) * 100).toFixed(0) : 0}%
                        complete
                      </div>
                    </TableCell>
                    <TableCell>{member.neighborhood}</TableCell>
                    <TableCell>{getStatusBadge(member.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 bg-transparent">
                          <Phone className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 bg-transparent">
                          <Mail className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
