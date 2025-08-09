import { getAllAttendanceRecordsAction, exportAttendanceRecordsAction } from "@/actions/attendence"
import { AttendanceReportTable } from "@/components/attendance-report-table"
import type { AttendanceFilter, AttendanceStatusFilter } from "@/types/attendance"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDayRange, getWeekRange, getMonthRange } from "@/lib/date-utils"

interface AttendanceReportPageProps {
  searchParams: {
    page?: string
    limit?: string
    search?: string
    status?: AttendanceStatusFilter
    dateFilterType?: AttendanceFilter
    selectedDate?: string // ISO string
    customDateFrom?: string // ISO string
    customDateTo?: string // ISO string
  }
}

export default async function AttendanceReportPage({ searchParams }: AttendanceReportPageProps) {
  // ✅ Correctly access searchParams properties using .get()
  const page = Number.parseInt(searchParams.page || "1")
  const limit = Number.parseInt(searchParams.limit || "10")
  const search = searchParams.search || ""
  const status = searchParams.status || "All"
  const dateFilterType: AttendanceFilter = searchParams.dateFilterType || "day"

  let selectedDate: Date | undefined
  if (searchParams.selectedDate) {
    try {
      selectedDate = new Date(searchParams.selectedDate)
    } catch (e) {
      console.error("Invalid selectedDate param:", searchParams.selectedDate)
      selectedDate = undefined
    }
  } else {
    // Default to today if no specific date is provided for day/week/month filters
    if (dateFilterType === "day" || dateFilterType === "week" || dateFilterType === "month") {
      selectedDate = new Date()
    }
  }

  const customDateRange: { from?: Date; to?: Date } = {}
  if (searchParams.customDateFrom) {
    try {
      customDateRange.from = new Date(searchParams.customDateFrom)
    } catch (e) {
      console.error("Invalid customDateFrom param:", searchParams.customDateFrom)
    }
  }
  if (searchParams.customDateTo) {
    try {
      customDateRange.to = new Date(searchParams.customDateTo)
    } catch (e) {
      console.error("Invalid customDateTo param:", searchParams.customDateTo)
    }
  }

  let startDate: Date | undefined
  let endDate: Date | undefined

  if (dateFilterType === "day" && selectedDate) {
    const range = getDayRange(selectedDate)
    startDate = range.startDate
    endDate = range.endDate
  } else if (dateFilterType === "week" && selectedDate) {
    const range = getWeekRange(selectedDate)
    startDate = range.startDate
    endDate = range.endDate
  } else if (dateFilterType === "month" && selectedDate) {
    const range = getMonthRange(selectedDate)
    startDate = range.startDate
    endDate = range.endDate
  } else if (dateFilterType === "custom") {
    startDate = customDateRange.from
    endDate = customDateRange.to
  }

  const result = await getAllAttendanceRecordsAction({
    page,
    limit,
    search,
    status,
    startDate,
    endDate,
  })

  const attendanceData = result.data || []
  const totalRecords = result.pagination?.total || 0
  const isLoading = false // Data is loaded on the server

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 p-4 md:p-8">
      <Card className="w-full max-w-full mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Attendance Report</CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceReportTable
            initialData={attendanceData}
            initialTotalRecords={totalRecords}
            initialCurrentPage={page}
            initialPageSize={limit}
            initialSearchQuery={search}
            initialStatusFilter={status}
            initialDateFilterType={dateFilterType}
            initialSelectedDate={selectedDate}
            initialCustomDateRange={customDateRange}
            onExport={exportAttendanceRecordsAction}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  )
}
