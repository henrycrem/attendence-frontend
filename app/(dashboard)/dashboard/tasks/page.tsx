"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  Users,
  Target,
  DollarSign,
  Phone,
  MapPin,
  CheckCircle,
  Filter,
  Calendar,
  Loader2,
  TrendingUp,
} from "lucide-react";
import {
  format,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  isWithinInterval,
} from "date-fns";
import { ProspectiveClientsTable } from "@/components/tasks/prospective-clients-table";
import { PersonalGoalsCard } from "@/components/tasks/personal-goals-card";
import { DailyActivityTracker } from "@/components/tasks/daily-activity-tracker";
import { useAuth } from "@/contexts/AuthContext";
import { getSalesDashboardAnalytics } from "@/actions/tashdashboard";
import { getDailyRevenueTrendsAction } from "@/actions/tashdashboard"; 
import { useQuery } from "@tanstack/react-query";

export default function SalesDashboard() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [serviceFilter, setServiceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [neighborhoodFilter, setNeighborhoodFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // ✅ Main dashboard data
  const {
   data: dashboardData, // ✅ RENAME: "data" → "dashboardData"
  isLoading: dashboardLoading,
  error: dashboardError,
  refetch: refetchDashboard,
} = useQuery({
  queryKey: ["salesDashboard", user?.id, selectedPeriod],
  queryFn: async () => {
    if (!user?.id) throw new Error("User ID is required");
    return getSalesDashboardAnalytics(user.id, selectedPeriod);
  },
  enabled: !!user?.id,
  refetchInterval: 5 * 60 * 1000,
});

  // ✅ Dedicated revenue trends data
  const {
   data: revenueTrends, // ✅ RENAME: "data" → "revenueTrends"
  isLoading: revenueLoading,
  error: revenueError,
  refetch: refetchRevenue,
} = useQuery({
  queryKey: ["dailyRevenue", user?.id, selectedPeriod],
  queryFn: async () => {
    if (!user?.id) throw new Error("User ID is required");
    return getDailyRevenueTrendsAction({
      userId: user.id,
      period: selectedPeriod as "day" | "week" | "month" | "year",
    });
  },
  enabled: !!user?.id,
});

 const filteredData = useMemo(() => {
  if (!dashboardData?.success || !dashboardData.data) {
    return null;
  }

  // Create a deep copy to avoid mutating original data
  const data = JSON.parse(JSON.stringify(dashboardData.data));

  // 1. Filter dailyActivity by date range
  if (dateRange.from && dateRange.to && data.charts.dailyActivity) {
    data.charts.dailyActivity = data.charts.dailyActivity.filter((item: any) => {
      const itemDate = new Date(item.date);
      return isWithinInterval(itemDate, { start: dateRange.from, end: dateRange.to });
    });
  }

  // 2. Filter clientsByStatus by status filter
  if (statusFilter !== "all" && data.charts.clientsByStatus) {
    data.charts.clientsByStatus = data.charts.clientsByStatus.filter((item: any) => 
      item.name === statusFilter
    );
  }

  // 3. Filter serviceInterest by service filter
  if (serviceFilter !== "all" && data.charts.serviceInterest) {
    data.charts.serviceInterest = data.charts.serviceInterest.filter((item: any) => 
      item.name === serviceFilter
    );
  }

  // 4. Filter topNeighborhoods by neighborhood filter
  if (neighborhoodFilter !== "all" && data.charts.topNeighborhoods) {
    data.charts.topNeighborhoods = data.charts.topNeighborhoods.filter((item: any) => 
      item.name === neighborhoodFilter
    );
  }

  return data;
}, [dashboardData, dateRange, serviceFilter, statusFilter, neighborhoodFilter]);

  const getPeriodDateRange = (period: string) => {
    const now = new Date();
    switch (period) {
      case "day":
        return { from: subDays(now, 1), to: now };
      case "week":
        return { from: subWeeks(now, 1), to: now };
      case "year":
        return { from: subYears(now, 1), to: now };
      default:
        return { from: subMonths(now, 1), to: now };
    }
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    const newRange = getPeriodDateRange(period);
    setDateRange(newRange);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (dashboardLoading || revenueLoading) {
    return (
      <div className="flex items-center justify-center h-64 p-6 bg-gradient-to-br from-red-50 to-white">
        <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-lg shadow-sm border border-red-100">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
          <span className="text-gray-600 font-medium">Loading your sales analytics...</span>
        </div>
      </div>
    );
  }

  if (dashboardError || !dashboardData?.success) {
    return (
      <div className="flex items-center justify-center h-64 p-6 bg-gradient-to-br from-red-50 to-white">
        <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-red-200">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-red-700 font-semibold mb-4">Failed to load your dashboard</p>
          <Button
            onClick={() => refetchDashboard()}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const data = filteredData || dashboardData.data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
      <div className="space-y-8 p-6 max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Sales Performance Dashboard
                  </h1>
                </div>
                <p className="text-gray-600 text-lg">
                  Monitor your field sales activities and client engagement metrics
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 border-red-200 text-red-700 hover:bg-red-50"
                >
                  <Filter className="w-4 h-4" />
                  Advanced Filters
                </Button>
                <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                  <SelectTrigger className="w-36 border-red-200 focus:ring-red-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
                
              </div>
            </div>

            {showFilters && (
              <div className="mt-6 pt-6 border-t border-red-100">
                <Card className="border-red-200 shadow-sm">
                  <CardHeader className="bg-red-50">
                    <CardTitle className="flex items-center gap-2 text-red-800">
                      <Filter className="w-4 h-4" />
                      Advanced Filtering Options
                    </CardTitle>
                    <CardDescription className="text-red-600">
                      Customize your dashboard view with detailed filtering controls
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="date-range" className="text-gray-700 font-medium">
                          Date Range
                        </Label>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-red-500" />
                          <Input
                            type="date"
                            value={format(dateRange.from, "yyyy-MM-dd")}
                            onChange={(e) =>
                              setDateRange({ ...dateRange, from: new Date(e.target.value) })
                            }
                            className="border-red-200 focus:ring-red-500"
                          />
                          <span className="text-gray-500 font-medium">to</span>
                          <Input
                            type="date"
                            value={format(dateRange.to, "yyyy-MM-dd")}
                            onChange={(e) =>
                              setDateRange({ ...dateRange, to: new Date(e.target.value) })
                            }
                            className="border-red-200 focus:ring-red-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="service-filter" className="text-gray-700 font-medium">
                          Service Type
                        </Label>
                        <Select value={serviceFilter} onValueChange={setServiceFilter}>
  <SelectTrigger className="border-red-200 focus:ring-red-500">
    <SelectValue placeholder="All Services" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All Services</SelectItem>
    <SelectItem value="FIBER_INTERNET">Fiber Internet</SelectItem>
    <SelectItem value="WIRELESS_4G">Wireless 4G</SelectItem>
    <SelectItem value="WIFI_HOTSPOT">WiFi Hotspot</SelectItem>
    <SelectItem value="BUSINESS_INTERNET">Business Internet</SelectItem>
    <SelectItem value="RESIDENTIAL_INTERNET">Residential Internet</SelectItem>
  </SelectContent>
</Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="status-filter" className="text-gray-700 font-medium">
                          Client Status
                        </Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
  <SelectTrigger className="border-red-200 focus:ring-red-500">
    <SelectValue placeholder="All Statuses" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All Statuses</SelectItem>
    <SelectItem value="new">New</SelectItem>
    <SelectItem value="contacted">Contacted</SelectItem>
    <SelectItem value="follow_up">Follow Up</SelectItem>
    <SelectItem value="converted">Converted</SelectItem>
    <SelectItem value="lost">Lost</SelectItem>
  </SelectContent>
</Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="neighborhood-filter" className="text-gray-700 font-medium">
                          Neighborhood
                        </Label>
                        <Select value={neighborhoodFilter} onValueChange={setNeighborhoodFilter}>
                          <SelectTrigger className="border-red-200 focus:ring-red-500">
                            <SelectValue placeholder="All Areas" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Areas</SelectItem>
                            <SelectItem value="Sinkor">Sinkor</SelectItem>
                            <SelectItem value="Congo Town">Congo Town</SelectItem>
                            <SelectItem value="Paynesville">Paynesville</SelectItem>
                            <SelectItem value="New Kru Town">New Kru Town</SelectItem>
                            <SelectItem value="Monrovia Central">Monrovia Central</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-6 pt-4 border-t border-red-100">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setServiceFilter("all");
                          setStatusFilter("all");
                          setNeighborhoodFilter("all");
                          setDateRange({ from: subDays(new Date(), 30), to: new Date() });
                        }}
                        className="border-red-200 text-red-700 hover:bg-red-50"
                      >
                        Reset All Filters
                      </Button>
                      <Badge className="bg-red-100 text-red-700 border-red-300">
                            Showing {data?.charts?.dailyActivity?.length || 0} days of data
                          </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Personal Dashboard Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <PersonalGoalsCard />
          <DailyActivityTracker />
        </div>

        {/* Enhanced KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-red-600 to-red-700 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold opacity-90">
                Total Clients Acquired
              </CardTitle>
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{data?.summary?.totalClients || 0}</div>
              <p className="text-xs opacity-80 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +12% from last {selectedPeriod}
              </p>
            </CardContent>
          </Card>

          <Card className="border-red-200 shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">Conversion Rate</CardTitle>
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                <Target className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600 mb-1">
                {formatPercentage(data?.summary?.conversionRate || 0)}
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                +2.1% from last {selectedPeriod}
              </p>
            </CardContent>
          </Card>

          <Card className="border-red-200 shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">Revenue Generated</CardTitle>
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600 mb-1">
                {formatCurrency(data?.summary?.totalRevenue || 0)}
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                +8.2% from last {selectedPeriod}
              </p>
            </CardContent>
          </Card>

          <Card className="border-red-200 shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">Task Completion</CardTitle>
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600 mb-1">
                {formatPercentage(data?.summary?.taskCompletionRate || 0)}
              </div>
              <p className="text-xs text-gray-500">
                {data?.summary?.completedTasks || 0} of {data?.summary?.totalTasks || 0} tasks completed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Charts Section */}
        <Card className="border-red-200 shadow-sm bg-white">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="px-6 pt-6">
              <TabsList className="grid w-full grid-cols-5 bg-red-50 p-1">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-white data-[state=active]:text-red-700 data-[state=active]:shadow-sm"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="performance"
                  className="data-[state=active]:bg-white data-[state=active]:text-red-700 data-[state=active]:shadow-sm"
                >
                  Performance
                </TabsTrigger>
                <TabsTrigger
                  value="clients"
                  className="data-[state=active]:bg-white data-[state=active]:text-red-700 data-[state=active]:shadow-sm"
                >
                  Clients
                </TabsTrigger>
                <TabsTrigger
                  value="revenue"
                  className="data-[state=active]:bg-white data-[state=active]:text-red-700 data-[state=active]:shadow-sm"
                >
                  Revenue
                </TabsTrigger>
                <TabsTrigger
                  value="data"
                  className="data-[state=active]:bg-white data-[state=active]:text-red-700 data-[state=active]:shadow-sm"
                >
                  Client Data
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="px-6 pb-6">
              <TabsContent value="overview" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* ✅ UPDATED: Daily Revenue Trends Chart */}
                <Card className="border-red-100 shadow-sm">
  <CardHeader className="bg-red-50">
    <CardTitle className="text-red-800">Daily Revenue Trends</CardTitle>
    <CardDescription className="text-red-600 flex items-center gap-2">
      Actual revenue generated from completed tasks over time
      {revenueTrends?.data?.dailyActivity && (
        <Badge className="bg-red-100 text-red-700 border-red-300">
          {revenueTrends.data.dailyActivity.length} days
        </Badge>
      )}
    </CardDescription>
  </CardHeader>
  <CardContent className="pt-6">
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={revenueTrends?.data?.dailyActivity?.map((item: any) => ({
          ...item,
          date: new Date(item.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          "Revenue Generated": Number(item.revenue_generated) || 0,
        })) || []}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#fee2e2" />
        <XAxis
          dataKey="date"
          stroke="#991b1b"
          tick={{ fontSize: 12, fill: "#666" }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis
          stroke="#991b1b"
          tick={{ fontSize: 12, fill: "#666" }}
          tickFormatter={(value) => `$${value.toLocaleString()}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
          formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue Generated"]}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Legend
          wrapperStyle={{ paddingTop: "20px" }}
          formatter={(value) => (
            <span className="text-sm font-medium text-gray-700">{value}</span>
          )}
        />
        <Line
          type="monotone"
          dataKey="Revenue Generated"
          stroke="#dc2626"
          strokeWidth={3}
          dot={{ fill: "#dc2626", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
          name="Revenue Generated"
        />
      </LineChart>
    </ResponsiveContainer>
  </CardContent>
</Card>

                  <Card className="border-red-100 shadow-sm">
                    <CardHeader className="bg-red-50">
                      <CardTitle className="text-red-800">Client Status Distribution</CardTitle>
                      <CardDescription className="text-red-600">
                        Current status breakdown of your prospects
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
  {(!data?.charts?.clientsByStatus || data.charts.clientsByStatus.length === 0) ? (
    <div className="flex flex-col items-center justify-center h-48 text-gray-500 p-4 bg-red-50 rounded-lg">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
        <Users className="w-6 h-6 text-red-500" />
      </div>
      <p className="text-center font-medium">
        No client status data available
      </p>
      <p className="text-center text-sm mt-1">
        Try adjusting your filters or add new clients.
      </p>
    </div>
  ) : (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data?.charts?.clientsByStatus || []}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) =>
            `${name} ${(percent * 100).toFixed(0)}%`
          }
          outerRadius={90}
          fill="#dc2626"
          dataKey="value"
          stroke="#ffffff"
          strokeWidth={2}
        >
          {(data?.charts?.clientsByStatus || []).map((entry: any, index: number) => {
            const colors = ["#dc2626", "#ef4444", "#f87171", "#fca5a5", "#fecaca"];
            return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
          })}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #fecaca",
            borderRadius: "8px",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )}
</CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-red-100 shadow-sm">
                    <CardHeader className="bg-red-50">
                      <CardTitle className="text-red-800">Service Interest</CardTitle>
                      <CardDescription className="text-red-600">
                        Most requested services by clients
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data?.charts?.serviceInterest || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#fee2e2" />
                          <XAxis dataKey="name" stroke="#991b1b" />
                          <YAxis stroke="#991b1b" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #fecaca",
                              borderRadius: "8px",
                            }}
                          />
                          <Bar dataKey="value" fill="#dc2626" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="border-red-100 shadow-sm">
                    <CardHeader className="bg-red-50">
                      <CardTitle className="text-red-800">Top Neighborhoods</CardTitle>
                      <CardDescription className="text-red-600">
                        Areas with highest client engagement
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {(data?.charts?.topNeighborhoods || []).map((neighborhood: any, index: number) => (
                          <div
                            key={neighborhood.name}
                            className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"
                          >
                            <div className="flex items-center gap-3">
                              <Badge className="w-8 h-8 rounded-full flex items-center justify-center bg-red-600 text-white border-0">
                                {index + 1}
                              </Badge>
                              <div>
                                <p className="font-semibold text-gray-800">{neighborhood.name}</p>
                                <p className="text-sm text-gray-600">{neighborhood.value} clients</p>
                              </div>
                            </div>
                            <MapPin className="w-5 h-5 text-red-500" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="performance" className="space-y-6 mt-6">
  <Card className="border-red-100 shadow-sm">
    <CardHeader className="bg-red-50">
      <CardTitle className="text-red-800">Cumulative Revenue Growth</CardTitle>
      <CardDescription className="text-red-600">
        Track your total revenue accumulation over time
      </CardDescription>
    </CardHeader>
    <CardContent className="pt-6">
      <ResponsiveContainer width="100%" height={400}>
  <AreaChart
    data={revenueTrends?.data?.dailyActivity
      ?.map((item: any) => ({
        date: new Date(item.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        dailyRevenue: Number(item.revenue_generated) || 0,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .reduce((acc: any[], curr: any, idx: number, arr: any[]) => {
        const cumulative = (acc[idx - 1]?.cumulativeRevenue || 0) + curr.dailyRevenue;
        acc.push({
          ...curr,
          cumulativeRevenue: cumulative,
        });
        return acc;
      }, []) || []}
    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
  >
    <CartesianGrid strokeDasharray="3 3" stroke="#fee2e2" />
    <XAxis
      dataKey="date"
      stroke="#991b1b"
      tick={{ fontSize: 12, fill: "#666" }}
      angle={-45}
      textAnchor="end"
      height={60}
    />
    <YAxis
      stroke="#991b1b"
      tick={{ fontSize: 12, fill: "#666" }}
      tickFormatter={(value) => `$${value.toLocaleString()}`}
    />

    {/* ✅ TARGET REFERENCE LINE */}
    {dashboardData?.data?.userPerformance?.salesTarget && (
      <ReferenceLine
        y={dashboardData.data.userPerformance.salesTarget}
        stroke="#3b82f6"
        strokeDasharray="5 5"
        strokeWidth={2}
        label={{
          value: `Target: $${dashboardData.data.userPerformance.salesTarget.toLocaleString()}`,
          position: "insideTopLeft",
          fill: "#3b82f6",
          fontSize: 12,
          fontWeight: "bold",
        }}
      />
    )}

    <defs>
      <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
        <stop offset="95%" stopColor="#dc2626" stopOpacity={0.05} />
      </linearGradient>
    </defs>
    <Area
      type="monotone"
      dataKey="cumulativeRevenue"
      stroke="#b91c1c"
      fill="url(#colorCumulative)"
      strokeWidth={3}
      dot={{ fill: "#b91c1c", strokeWidth: 2, r: 4 }}
      activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
      name="Cumulative Revenue"
    />
    <Line
      type="monotone"
      dataKey="dailyRevenue"
      stroke="#ef4444"
      strokeWidth={2}
      dot={{ fill: "#ef4444", strokeWidth: 2, r: 3 }}
      activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
      name="Daily Revenue"
    />
  </AreaChart>
</ResponsiveContainer>
    </CardContent>
  </Card>
</TabsContent>

              <TabsContent value="clients" className="space-y-6 mt-6">
                <Card className="border-red-100 shadow-sm">
                  <CardHeader className="bg-red-50">
                    <CardTitle className="text-red-800">Task Types Distribution</CardTitle>
                    <CardDescription className="text-red-600">
                      Breakdown of your field activities
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={data?.charts?.tasksByType || []} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#fee2e2" />
                        <XAxis type="number" stroke="#991b1b" />
                        <YAxis dataKey="name" type="category" width={120} stroke="#991b1b" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #fecaca",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="value" fill="#dc2626" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="revenue" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border-red-200 shadow-sm bg-gradient-to-br from-red-50 to-white">
                    <CardHeader>
                      <CardTitle className="text-sm text-red-800">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-600">
                        {formatCurrency(data?.summary?.totalRevenue || 0)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-red-200 shadow-sm bg-gradient-to-br from-red-50 to-white">
                    <CardHeader>
                      <CardTitle className="text-sm text-red-800">Potential Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-600">
                        {formatCurrency(data?.summary?.potentialRevenue || 0)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-red-200 shadow-sm bg-gradient-to-br from-red-50 to-white">
                    <CardHeader>
                      <CardTitle className="text-sm text-red-800">Expected Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-600">
                        {formatCurrency(data?.summary?.expectedRevenue || 0)}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="data" className="space-y-6 mt-6">
                <ProspectiveClientsTable />
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}