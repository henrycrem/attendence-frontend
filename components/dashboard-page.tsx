"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Users,
  Clock,
  DollarSign,
  Target,
  TrendingUp,
  Download,
  RefreshCw,
  WifiOff,
  BarChart3,
  LineChartIcon,
  AlertTriangle,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { getSuperAdminDashboardData } from "@/actions/dashboard"

// Import chart components
import AttendanceTrendsChart from "@/components/AttendanceTrendsChart"
import SalesPerformanceChart from "@/components/SalesPerformanceChart"
import StatusDistributionChart from "@/components/StatusDistributionChart"
import TeamLeaderboard from "@/components/TeamLeaderboard"
// In your dashboard page
import SalesPerformanceByMemberChart from "@/components/SalesPerformanceByMemberChart"
import { getSalesTableData } from "@/actions/dashboard"
import AttendanceTable from "@/components/admin/attendance-table"
import SalesTable from "@/components/SalesTable"
import { generateAttendanceReport, generateSalesReport, generateTeamReport } from "@/actions/reports"
import Link from "next/link"

export interface SalesRecord {
  id: string
  title: string
  clientName: string
  actualRevenue: number
  potentialRevenue: number
  startTime: string
  completedAt: string | null
  isCompleted: boolean
  conversionAchieved: boolean
  taskType: string
  salesRep: string
}

export default function SuperAdminDashboard() {
  const [viewReportData, setViewReportData] = useState<any>(null)
  const [viewReportType, setViewReportType] = useState<string>("")
  const [isViewReportOpen, setIsViewReportOpen] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  const [salesTableData, setSalesTableData] = useState<SalesRecord[]>([])
  const [salesTableLoading, setSalesTableLoading] = useState(true)
  const [salesTableError, setSalesTableError] = useState<Error | null>(null)

  // In your SuperAdminDashboard.tsx
  useEffect(() => {
    const loadSalesTableData = async () => {
      setSalesTableLoading(true)
      setSalesTableError(null)

      try {
        const result = await getSalesTableData(selectedPeriod)
        console.log("📊 Frontend received sales data:", result) // ✅ Add this debug log

        if (result.success) {
          setSalesTableData(result.data || []) // ✅ Ensure it's an array
          console.log("✅ Sales table data set:", result.data) // ✅ Add this debug log
        } else {
          setSalesTableError(new Error(result.message || "Failed to load sales data"))
        }
      } catch (error) {
        console.error("❌ Error loading sales table data:", error) // ✅ Add this debug log
        setSalesTableError(error instanceof Error ? error : new Error("Failed to load sales data"))
      } finally {
        setSalesTableLoading(false)
      }
    }

    loadSalesTableData()
  }, [selectedPeriod])

  // ✅ Fetch combined dashboard data — NO AUTH CHECK
  const {
    data: dashboardData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["superAdminDashboard", selectedPeriod, selectedDepartment],
    queryFn: async () => {
      const result = await getSuperAdminDashboardData({
        period: selectedPeriod,
        departmentId: selectedDepartment,
      })

      if (!result.success) {
        throw new Error(result.error || "Failed to load dashboard data")
      }

      return result
    },
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  })

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period)
    // Update date range based on period
    const now = new Date()
    switch (period) {
      case "day":
        setDateRange({
          from: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          to: now,
        })
        break
      case "week":
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        setDateRange({
          from: new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()),
          to: now,
        })
        break
      case "year":
        setDateRange({
          from: new Date(now.getFullYear(), 0, 1),
          to: now,
        })
        break
      default:
        setDateRange({
          from: new Date(now.getFullYear(), now.getMonth(), 1),
          to: now,
        })
    }
  }

  const handleRetry = () => {
    refetch()
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  // ✅ Enhanced loading state with red spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4">
            <RefreshCw className="w-16 h-16 text-red-600 animate-spin" />
          </div>
          <h3 className="text-xl font-semibold text-black mb-2">Loading Super Admin Dashboard</h3>
          <p className="text-gray-600">Please wait while we gather all your data...</p>
        </div>
      </div>
    )
  }

  // ✅ Generic error state — NO PERMISSION MESSAGES
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="bg-white rounded-lg shadow-lg border-2 border-red-200 p-8 max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-red-50 rounded-full border-2 border-red-200">
            <WifiOff className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-black mb-2">Unable to Load Dashboard</h3>
          <p className="text-gray-700 mb-6">{error.message || "Something went wrong. Please try again."}</p>
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center justify-center font-medium"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Loading
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="w-full px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors font-medium"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ✅ Safely extract data
  const data = dashboardData?.data

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-8 max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-gray-50 rounded-full border-2 border-gray-200">
            <WifiOff className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold text-black mb-2">No Data Available</h3>
          <p className="text-gray-700 mb-6">Dashboard data could not be loaded.</p>
          <button
            onClick={handleRetry}
            className="w-full px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center justify-center font-medium"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-md border-2 border-red-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center shadow-md">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-black">Super Admin Dashboard</h1>
                    <p className="text-gray-700">Monitor organization-wide attendance and sales performance</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                  <SelectTrigger className="w-36 border-2 border-red-300 focus:ring-red-500 focus:border-red-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-red-200">
                    <SelectItem value="day">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards - Red/White/Black Theme */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Attendance Cards */}
          <Link href="/dashboard/employees" className="cursor-pointer">
          <Card className="bg-red-600 text-white border-2 border-red-700 shadow-lg cursor-pointer">

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold opacity-90">Total Employees</CardTitle>
              <Users className="h-5 w-5" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{data.attendanceStats.totalEmployees}</div>
              <p className="text-sm opacity-90">{data.attendanceStats.presentToday} present today</p>
            </CardContent>
          </Card>
          </Link>
            <Link href="/dashboard/attendance-report" className="cursor-pointer">
          <Card className="bg-white text-black border-2 border-red-300 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-black">Attendance Rate</CardTitle>
              <Clock className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1 text-red-600">
                {formatPercentage(Number.parseFloat(data.attendanceStats.attendanceRate))}
              </div>
              <p className="text-sm text-gray-700">{data.attendanceStats.lateArrivals} late arrivals</p>
            </CardContent>
          </Card>
          </Link>

          {/* Sales Cards */}
          <Link href="/dashboard/sales-report" className="cursor-pointer">
          <Card className="bg-black text-white border-2 border-gray-800 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold opacity-90">Total Revenue</CardTitle>
              <DollarSign className="h-5 w-5" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{formatCurrency(data.salesStats.totalRevenue)}</div>
              <p className="text-sm opacity-80">{data.salesStats.totalConversions} conversions</p>
            </CardContent>
          </Card>
          </Link>
          
            <Link href="/dashboard/sales-settings" className="cursor-pointer">  
          <Card className="bg-white text-black border-2 border-black shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-black">Sales Target ({selectedPeriod})</CardTitle>
              <Target className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1 text-red-600">
                {formatPercentage(data.salesStats.achievementRate)}
              </div>
              <p className="text-sm text-gray-700">{data.salesStats.remainingToTarget.toFixed(1)} to target</p>
            </CardContent>
          </Card>
          </Link>
        </div>

        {/* Tabs */}
        <Card className="border-2 border-red-200 shadow-md bg-white">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="px-6 pt-6">
              <TabsList className="grid w-full grid-cols-5 bg-red-50 p-1 border-2 border-red-200">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-md font-medium"
                >
                  <LineChartIcon className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="attendance"
                  className="data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-md font-medium"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Attendance
                </TabsTrigger>
                <TabsTrigger
                  value="sales"
                  className="data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-md font-medium"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Sales
                </TabsTrigger>
                <TabsTrigger
                  value="team"
                  className="data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-md font-medium"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Team
                </TabsTrigger>
                <TabsTrigger
                  value="reports"
                  className="data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-md font-medium"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Reports
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="px-6 pb-6">
              <TabsContent value="overview" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <AttendanceTrendsChart attendanceData={data.attendanceTrends} />
                  <SalesPerformanceChart salesData={data.salesTrends} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <StatusDistributionChart attendanceStats={data.attendanceStats} />
                  <SalesPerformanceByMemberChart teamPerformance={data.teamPerformance} period={selectedPeriod} />
                </div>
              </TabsContent>

              <TabsContent value="attendance" className="space-y-6 mt-6">
                <Card className="border-2 border-red-200">
                  <CardHeader className="bg-red-50 border-b border-red-200">
                    <CardTitle className="text-black">Attendance Details</CardTitle>
                    <CardDescription className="text-gray-700">
                      Detailed view of employee attendance patterns and statistics
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="bg-white">
                    {/* <div className="text-center py-12">
                      <Clock className="w-16 h-16 text-red-600 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-black mb-2">Attendance Table Coming Soon</h3>
                      <p className="text-gray-700">Your detailed attendance table will be displayed here.</p>
                    </div> */}
                    <AttendanceTable />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sales" className="space-y-6 mt-6">
                {salesTableLoading ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4">
                        <RefreshCw className="w-16 h-16 text-blue-600 animate-spin" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Loading Sales Data</h3>
                      <p className="text-gray-600">Please wait while we gather all your sales records...</p>
                    </CardContent>
                  </Card>
                ) : salesTableError ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 text-red-500">
                        <AlertTriangle className="w-16 h-16" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Sales Data</h3>
                      <p className="text-gray-600 mb-4">{salesTableError.message}</p>
                      <Button
                        onClick={() => {
                          setSalesTableLoading(true)
                          getSalesTableData(selectedPeriod)
                            .then((result) => {
                              if (result.success) {
                                setSalesTableData(result.data || [])
                                setSalesTableError(null)
                              } else {
                                setSalesTableError(new Error(result.message || "Failed to load sales data"))
                              }
                            })
                            .catch((err) => {
                              setSalesTableError(err instanceof Error ? err : new Error("Failed to load sales data"))
                            })
                            .finally(() => {
                              setSalesTableLoading(false)
                            })
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry Loading
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <SalesTable
                    salesData={salesTableData || []} // ✅ Safe default
                    currentPage={currentPage}
                    totalPages={Math.ceil((salesTableData?.length || 0) / 5)} // ✅ Safe length access
                    onPageChange={setCurrentPage}
                    period={selectedPeriod}
                  />
                )}
              </TabsContent>

              <TabsContent value="team" className="space-y-6 mt-6">
                <TeamLeaderboard teamData={data.teamPerformance} />
              </TabsContent>

              <TabsContent value="reports" className="space-y-6 mt-6">
                <Card className="border-2 border-red-200">
                  <CardHeader className="bg-red-50 border-b border-red-200">
                    <CardTitle className="text-black">Reports & Analytics</CardTitle>
                    <CardDescription className="text-gray-700">
                      Generate and export comprehensive reports for attendance and sales
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 bg-white">
                    <div className="space-y-6">
                      {/* Date Range Filter */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-4">Report Date Range</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <Input
                              type="date"
                              value={dateRange.from.toISOString().split("T")[0]}
                              onChange={(e) =>
                                setDateRange({
                                  ...dateRange,
                                  from: new Date(e.target.value),
                                })
                              }
                              className="border-2 border-gray-300 focus:ring-red-500 focus:border-red-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <Input
                              type="date"
                              value={dateRange.to.toISOString().split("T")[0]}
                              onChange={(e) =>
                                setDateRange({
                                  ...dateRange,
                                  to: new Date(e.target.value),
                                })
                              }
                              className="border-2 border-gray-300 focus:ring-red-500 focus:border-red-500"
                            />
                          </div>
                          <div className="md:col-span-2 flex items-end">
                            <Button
                              onClick={() => {
                                const now = new Date()
                                setDateRange({
                                  from: new Date(now.getFullYear(), now.getMonth(), 1),
                                  to: now,
                                })
                              }}
                              variant="outline"
                              className="border-2 border-black text-black hover:bg-black hover:text-white"
                            >
                              Reset to Current Month
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Report Generation Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-2 border-red-200 shadow-sm">
                          <CardContent className="p-6 text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4 border-2 border-red-200">
                              <TrendingUp className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="font-semibold text-black mb-2">Attendance Report</h3>
                            <p className="text-sm text-gray-700 mb-4">Generate attendance summary reports</p>
                            <div className="space-y-2">
                              <Button
                                onClick={async () => {
                                  try {
                                    const result = await generateAttendanceReport({
                                      startDate: dateRange.from.toISOString(),
                                      endDate: dateRange.to.toISOString(),
                                      format: "csv",
                                    })

                                    if (result.success && result.blob) {
                                      const url = window.URL.createObjectURL(result.blob)
                                      const a = document.createElement("a")
                                      a.href = url
                                      a.download = result.filename
                                      document.body.appendChild(a)
                                      a.click()
                                      window.URL.revokeObjectURL(url)
                                      document.body.removeChild(a)
                                      toast.success("Attendance report downloaded successfully!")
                                    }
                                  } catch (error) {
                                    toast.error("Failed to generate attendance report")
                                    console.error("Error generating attendance report:", error)
                                  }
                                }}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Export CSV
                              </Button>
                              <Button
                                onClick={async () => {
                                  try {
                                    const result = await generateAttendanceReport({
                                      startDate: dateRange.from.toISOString(),
                                      endDate: dateRange.to.toISOString(),
                                      format: "json",
                                    })

                                    if (result.success) {
                                      const dataStr = JSON.stringify(result.data, null, 2)
                                      const dataUri = "application/json;charset=utf-8," + encodeURIComponent(dataStr)
                                      const exportFileDefaultName = `attendance-report-${new Date().toISOString().split("T")[0]}.json`

                                      const linkElement = document.createElement("a")
                                      linkElement.setAttribute("href", dataUri)
                                      linkElement.setAttribute("download", exportFileDefaultName)
                                      document.body.appendChild(linkElement)
                                      linkElement.click()
                                      document.body.removeChild(linkElement)
                                      toast.success("Attendance report downloaded as JSON!")
                                    }
                                  } catch (error) {
                                    toast.error("Failed to generate attendance report")
                                    console.error("Error generating attendance report:", error)
                                  }
                                }}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                              >
                                Export JSON
                              </Button>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-2 border-red-200 shadow-sm">
                          <CardContent className="p-6 text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4 border-2 border-red-200">
                              <DollarSign className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="font-semibold text-black mb-2">Sales Report</h3>
                            <p className="text-sm text-gray-700 mb-4">Generate sales performance reports</p>
                            <div className="space-y-2">
                              <Button
                                onClick={async () => {
                                  try {
                                    const result = await generateSalesReport({
                                      startDate: dateRange.from.toISOString(),
                                      endDate: dateRange.to.toISOString(),
                                      format: "csv",
                                    })

                                    if (result.success && result.blob) {
                                      const url = window.URL.createObjectURL(result.blob)
                                      const a = document.createElement("a")
                                      a.href = url
                                      a.download = result.filename
                                      document.body.appendChild(a)
                                      a.click()
                                      window.URL.revokeObjectURL(url)
                                      document.body.removeChild(a)
                                      toast.success("Sales report downloaded successfully!")
                                    }
                                  } catch (error) {
                                    toast.error("Failed to generate sales report")
                                    console.error("Error generating sales report:", error)
                                  }
                                }}
                                className="w-full bg-black hover:bg-gray-800 text-white font-medium"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Export CSV
                              </Button>
                              <Button
                                onClick={async () => {
                                  try {
                                    const result = await generateSalesReport({
                                      startDate: dateRange.from.toISOString(),
                                      endDate: dateRange.to.toISOString(),
                                      format: "json",
                                    })

                                    if (result.success) {
                                      const dataStr = JSON.stringify(result.data, null, 2)
                                      const dataUri = "application/json;charset=utf-8," + encodeURIComponent(dataStr)
                                      const exportFileDefaultName = `sales-report-${new Date().toISOString().split("T")[0]}.json`

                                      const linkElement = document.createElement("a")
                                      linkElement.setAttribute("href", dataUri)
                                      linkElement.setAttribute("download", exportFileDefaultName)
                                      document.body.appendChild(linkElement)
                                      linkElement.click()
                                      document.body.removeChild(linkElement)
                                      toast.success("Sales report downloaded as JSON!")
                                    }
                                  } catch (error) {
                                    toast.error("Failed to generate sales report")
                                    console.error("Error generating sales report:", error)
                                  }
                                }}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                              >
                                Export JSON
                              </Button>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-2 border-red-200 shadow-sm">
                          <CardContent className="p-6 text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4 border-2 border-red-200">
                              <Users className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="font-semibold text-black mb-2">Team Report</h3>
                            <p className="text-sm text-gray-700 mb-4">Generate team performance reports</p>
                            <div className="space-y-2">
                              <Button
                                onClick={async () => {
                                  try {
                                    const result = await generateTeamReport({
                                      startDate: dateRange.from.toISOString(),
                                      endDate: dateRange.to.toISOString(),
                                      format: "csv",
                                    })

                                    if (result.success && result.blob) {
                                      const url = window.URL.createObjectURL(result.blob)
                                      const a = document.createElement("a")
                                      a.href = url
                                      a.download = result.filename
                                      document.body.appendChild(a)
                                      a.click()
                                      window.URL.revokeObjectURL(url)
                                      document.body.removeChild(a)
                                      toast.success("Team report downloaded successfully!")
                                    }
                                  } catch (error) {
                                    toast.error("Failed to generate team report")
                                    console.error("Error generating team report:", error)
                                  }
                                }}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Export CSV
                              </Button>
                              <Button
                                onClick={async () => {
                                  try {
                                    const result = await generateTeamReport({
                                      startDate: dateRange.from.toISOString(),
                                      endDate: dateRange.to.toISOString(),
                                      format: "json",
                                    })

                                    if (result.success) {
                                      const dataStr = JSON.stringify(result.data, null, 2)
                                      const dataUri = "application/json;charset=utf-8," + encodeURIComponent(dataStr)
                                      const exportFileDefaultName = `team-report-${new Date().toISOString().split("T")[0]}.json`

                                      const linkElement = document.createElement("a")
                                      linkElement.setAttribute("href", dataUri)
                                      linkElement.setAttribute("download", exportFileDefaultName)
                                      document.body.appendChild(linkElement)
                                      linkElement.click()
                                      document.body.removeChild(linkElement)
                                      toast.success("Team report downloaded as JSON!")
                                    }
                                  } catch (error) {
                                    toast.error("Failed to generate team report")
                                    console.error("Error generating team report:", error)
                                  }
                                }}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                              >
                                Export JSON
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Export Options */}
                      <div className="border-t-2 border-red-200 pt-6">
                        <h3 className="text-lg font-semibold text-black mb-4">Export All Reports</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <Button
                            onClick={async () => {
                              try {
                                // Generate all reports in sequence
                                const [attendanceResult, salesResult, teamResult] = await Promise.all([
                                  generateAttendanceReport({
                                    startDate: dateRange.from.toISOString(),
                                    endDate: dateRange.to.toISOString(),
                                    format: "csv",
                                  }),
                                  generateSalesReport({
                                    startDate: dateRange.from.toISOString(),
                                    endDate: dateRange.to.toISOString(),
                                    format: "csv",
                                  }),
                                  generateTeamReport({
                                    startDate: dateRange.from.toISOString(),
                                    endDate: dateRange.to.toISOString(),
                                    format: "csv",
                                  }),
                                ])

                                // Download all files
                                ;[attendanceResult, salesResult, teamResult].forEach((result) => {
                                  if (result.success && result.blob) {
                                    const url = window.URL.createObjectURL(result.blob)
                                    const a = document.createElement("a")
                                    a.href = url
                                    a.download = result.filename
                                    document.body.appendChild(a)
                                    a.click()
                                    window.URL.revokeObjectURL(url)
                                    document.body.removeChild(a)
                                  }
                                })

                                toast.success("All reports downloaded successfully!")
                              } catch (error) {
                                toast.error("Failed to generate all reports")
                                console.error("Error generating all reports:", error)
                              }
                            }}
                            className="bg-gray-600 hover:bg-gray-700 text-white font-medium"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export All CSV
                          </Button>
                          <Button
                            onClick={async () => {
                              try {
                                // Generate all reports as JSON
                                const [attendanceResult, salesResult, teamResult] = await Promise.all([
                                  generateAttendanceReport({
                                    startDate: dateRange.from.toISOString(),
                                    endDate: dateRange.to.toISOString(),
                                    format: "json",
                                  }),
                                  generateSalesReport({
                                    startDate: dateRange.from.toISOString(),
                                    endDate: dateRange.to.toISOString(),
                                    format: "json",
                                  }),
                                  generateTeamReport({
                                    startDate: dateRange.from.toISOString(),
                                    endDate: dateRange.to.toISOString(),
                                    format: "json",
                                  }),
                                ])

                                // Combine all reports into one JSON object
                                const combinedReports = {
                                  attendance: attendanceResult.success ? attendanceResult.data : [],
                                  sales: salesResult.success ? salesResult.data : [],
                                  team: teamResult.success ? teamResult.data : [],
                                  generatedAt: new Date().toISOString(),
                                  dateRange: {
                                    from: dateRange.from.toISOString(),
                                    to: dateRange.to.toISOString(),
                                  },
                                }

                                // Create and download JSON file
                                const dataStr = JSON.stringify(combinedReports, null, 2)
                                const dataUri = "application/json;charset=utf-8," + encodeURIComponent(dataStr)
                                const exportFileDefaultName = `telecel-reports-${new Date().toISOString().split("T")[0]}.json`

                                const linkElement = document.createElement("a")
                                linkElement.setAttribute("href", dataUri)
                                linkElement.setAttribute("download", exportFileDefaultName)
                                linkElement.click()
                                document.body.removeChild(linkElement)

                                toast.success("JSON reports downloaded successfully!")
                              } catch (error) {
                                toast.error("Failed to generate JSON reports")
                                console.error("Error generating JSON reports:", error)
                              }
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white font-medium"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export JSON
                          </Button>

                          <Button
                            onClick={async () => {
                              try {
                                // ✅ Use DYNAMIC dates from UI state (NOT hardcoded 2025)
                                const startDate = dateRange.from.toISOString()
                                const endDate = new Date(dateRange.to.setHours(23, 59, 59, 999)).toISOString()

                                // Generate all reports as JSON for PDF
                                const [attendanceResult, salesResult, teamResult] = await Promise.all([
                                  generateAttendanceReport({
                                    startDate,
                                    endDate,
                                    format: "pdf",
                                  }),
                                  generateSalesReport({
                                    startDate,
                                    endDate,
                                    format: "pdf",
                                  }),
                                  generateTeamReport({
                                    startDate,
                                    endDate,
                                    format: "pdf",
                                  }),
                                ])

                                console.log("📊 PDF Export Results:", {
                                  attendance: {
                                    success: attendanceResult.success,
                                    dataLength: attendanceResult.data?.length || 0,
                                  },
                                  sales: {
                                    success: salesResult.success,
                                    dataLength: salesResult.data?.length || 0,
                                  },
                                  team: {
                                    success: teamResult.success,
                                    dataLength: teamResult.data?.length || 0,
                                  },
                                })

                                // Import PDF generator
                                const { generatePDF } = await import("@/utils/pdfGenerator")

                                // Prepare report data for PDF - only include reports with data
                                const reports = []

                                // Add Attendance Report if it has data
                                if (
                                  attendanceResult.success &&
                                  attendanceResult.data &&
                                  attendanceResult.data.length > 0
                                ) {
                                  reports.push({
                                    title: "Attendance Report",
                                    headers: [
                                      "Employee Name",
                                      "Email",
                                      "Department",
                                      "Date",
                                      "Sign In",
                                      "Sign Out",
                                      "Workplace",
                                      "Status",
                                    ],
                                    rows: attendanceResult.data.map((row: any) => [
                                      row.employeeName || "N/A",
                                      row.employeeEmail || "N/A",
                                      row.department || "Unassigned",
                                      row.date || "N/A",
                                      row.signInTime || "N/A",
                                      row.signOutTime || "N/A",
                                      row.workplace || "N/A",
                                      row.status || "N/A",
                                    ]),
                                    dateRange: {
                                      from: startDate,
                                      to: endDate,
                                    },
                                  })
                                }

                                // Add Sales Report if it has data
                                if (salesResult.success && salesResult.data && salesResult.data.length > 0) {
                                  reports.push({
                                    title: "Sales Report",
                                    headers: [
                                      "Sales Rep",
                                      "Client Name",
                                      "Phone",
                                      "Email",
                                      "Task Title",
                                      "Task Type",
                                      "Start Time",
                                      "Completed At",
                                      "Converted",
                                      "Actual Revenue",
                                      "Potential Revenue",
                                    ],
                                    rows: salesResult.data.map((row: any) => [
                                      row.salesRep || "Unknown",
                                      row.clientName || "Unknown",
                                      row.clientPhone || "N/A",
                                      row.clientEmail || "N/A",
                                      row.taskTitle || "N/A",
                                      row.taskType || "N/A",
                                      row.startTime || "N/A",
                                      row.completedAt || "N/A",
                                      row.conversionAchieved ? "Yes" : "No",
                                      row.actualRevenue || 0,
                                      row.potentialRevenue || 0,
                                    ]),
                                    dateRange: {
                                      from: startDate,
                                      to: endDate,
                                    },
                                  })
                                }

                                // Add Team Report if it has data
                                if (teamResult.success && teamResult.data && teamResult.data.length > 0) {
                                  reports.push({
                                    title: "Team Report",
                                    headers: [
                                      "Name",
                                      "Completed Tasks",
                                      "Conversions",
                                      "Revenue",
                                      "Avg Revenue per Conversion",
                                    ],
                                    rows: teamResult.data.map((row: any) => [
                                      row.name || "Unknown",
                                      row.completedTasks || 0,
                                      row.conversions || 0,
                                      row.revenue || 0,
                                      (row.averageRevenuePerConversion || 0).toFixed(2),
                                    ]),
                                    dateRange: {
                                      from: startDate,
                                      to: endDate,
                                    },
                                  })
                                }

                                // Check if any reports have data
                                if (reports.length === 0) {
                                  reports.push({
                                    title: "No Data Available",
                                    headers: ["Report Type", "Status", "Message"],
                                    rows: [
                                      [
                                        "Attendance Report",
                                        attendanceResult.success ? "No Data" : "Error",
                                        attendanceResult.success
                                          ? "No attendance records found for selected date range"
                                          : attendanceResult.message || "Error loading data",
                                      ],
                                      [
                                        "Sales Report",
                                        salesResult.success ? "No Data" : "Error",
                                        salesResult.success
                                          ? "No sales records found for selected date range"
                                          : salesResult.message || "Error loading data",
                                      ],
                                      [
                                        "Team Report",
                                        teamResult.success ? "No Data" : "Error",
                                        teamResult.success
                                          ? "No team performance data found for selected date range"
                                          : teamResult.message || "Error loading data",
                                      ],
                                    ],
                                    dateRange: {
                                      from: startDate,
                                      to: endDate,
                                    },
                                  })
                                  toast.warning("Some reports have no data. PDF generated with available information.")
                                } else {
                                  toast.success("PDF report generated successfully!")
                                }

                                console.log("🚀 Starting PDF generation...")
                                const pdfDoc = generatePDF(reports)
                                console.log("📄 PDF Doc created:", pdfDoc)
                                console.log("📄 PDF Doc type:", typeof pdfDoc)
                                console.log("📄 Has download method?", typeof pdfDoc.download === "function")
                                const filename = `telecel-reports-${new Date().toISOString().split("T")[0]}.pdf`

                                setTimeout(() => {
                                  console.log("⬇️ Attempting download NOW (in setTimeout)...")
                                  try {
                                    pdfDoc.download(filename)
                                    console.log("✅ Download method called successfully")
                                  } catch (err) {
                                    console.error("❌ Download FAILED:", err)
                                    toast.info("Opening PDF in browser tab...")
                                    pdfDoc.open()
                                  }
                                }, 0)
                              } catch (error) {
                                toast.error("Failed to generate PDF report")
                                console.error("Error generating PDF report:", error)
                              }
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white font-medium"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export PDF
                          </Button>

                          <Button
                            onClick={async () => {
                              try {
                                const result = await generateAttendanceReport({
                                  startDate: dateRange.from.toISOString(),
                                  endDate: dateRange.to.toISOString(),
                                  format: "excel",
                                })

                                if (result.success && result.blob) {
                                  const url = window.URL.createObjectURL(result.blob)
                                  const a = document.createElement("a")
                                  a.href = url
                                  a.download = result.filename
                                  document.body.appendChild(a)
                                  a.click()
                                  window.URL.revokeObjectURL(url)
                                  document.body.removeChild(a)
                                  toast.success("Excel report downloaded!")
                                }
                              } catch (error) {
                                toast.error("Failed to generate Excel report")
                              }
                            }}
                            className="bg-gray-600 hover:bg-gray-700 text-white font-medium"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export Excel
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
