"use client"

import type React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import type { AttendanceRecord, AttendanceFilter, AttendanceStatusFilter } from "@/types/attendance"
import { formatDate, formatTime, getDayRange, getWeekRange, getMonthRange } from "@/lib/date-utils"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { toast } from "sonner"

interface AttendanceReportTableProps {
  initialData: AttendanceRecord[]
  initialTotalRecords: number
  initialCurrentPage: number
  initialPageSize: number
  initialSearchQuery: string
  initialStatusFilter: AttendanceStatusFilter
  initialDateFilterType: AttendanceFilter
  initialSelectedDate?: Date
  initialCustomDateRange: { from?: Date; to?: Date }
  onExport: (filters: {
    startDate?: Date
    endDate?: Date
    search?: string
    status?: AttendanceStatusFilter
  }) => Promise<any>
  isLoading: boolean
}

export function AttendanceReportTable({
  initialData,
  initialTotalRecords,
  initialCurrentPage,
  initialPageSize,
  initialSearchQuery,
  initialStatusFilter,
  initialDateFilterType,
  initialSelectedDate,
  initialCustomDateRange,
  onExport,
  isLoading,
}: AttendanceReportTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [data, setData] = useState<AttendanceRecord[]>(initialData)
  const [totalRecords, setTotalRecords] = useState(initialTotalRecords)
  const [currentPage, setCurrentPage] = useState(initialCurrentPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery)
  const [statusFilter, setStatusFilter] = useState<AttendanceStatusFilter>(initialStatusFilter)
  const [dateFilterType, setDateFilterType] = useState<AttendanceFilter>(initialDateFilterType)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialSelectedDate)
  const [customDateRange, setCustomDateRange] = useState<{ from?: Date; to?: Date }>(initialCustomDateRange)
  const [sorting, setSorting] = useState<SortingState>([])
  const [isExporting, setIsExporting] = useState(false)

  // Update local state when initial props change (due to server re-render)
  useEffect(() => {
    setData(initialData)
    setTotalRecords(initialTotalRecords)
    setCurrentPage(initialCurrentPage)
    setPageSize(initialPageSize)
    setSearchQuery(initialSearchQuery)
    setStatusFilter(initialStatusFilter)
    setDateFilterType(initialDateFilterType)
    setSelectedDate(initialSelectedDate)
    setCustomDateRange(initialCustomDateRange)
  }, [
    initialData,
    initialTotalRecords,
    initialCurrentPage,
    initialPageSize,
    initialSearchQuery,
    initialStatusFilter,
    initialDateFilterType,
    initialSelectedDate,
    initialCustomDateRange,
  ])

  const updateUrlParams = useCallback(
    (newParams: Record<string, string | number | undefined | null>) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()))
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
          current.delete(key)
        } else {
          current.set(key, String(value))
        }
      })
      const query = current.toString()
      router.push(`${pathname}?${query}`)
    },
    [pathname, router, searchParams],
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = e.target.value
    setSearchQuery(newSearch)
    updateUrlParams({ search: newSearch, page: 1 })
  }

  const handleStatusFilterChange = (value: AttendanceStatusFilter) => {
    setStatusFilter(value)
    updateUrlParams({ status: value, page: 1 })
  }

  const handleDateFilterTypeChange = (value: AttendanceFilter) => {
    setDateFilterType(value)
    // Reset date selections when changing filter type
    updateUrlParams({
      dateFilterType: value,
      selectedDate: undefined,
      customDateFrom: undefined,
      customDateTo: undefined,
      page: 1,
    })
  }

  const handleSelectedDateChange = (date: Date | undefined) => {
    setSelectedDate(date)
    updateUrlParams({ selectedDate: date?.toISOString(), page: 1 })
  }

  const handleCustomDateRangeChange = (range: { from?: Date; to?: Date }) => {
    setCustomDateRange(range)
    updateUrlParams({
      customDateFrom: range.from?.toISOString(),
      customDateTo: range.to?.toISOString(),
      page: 1,
    })
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    updateUrlParams({ page })
  }

  const handlePageSizeChange = (size: string) => {
    const newSize = Number.parseInt(size)
    setPageSize(newSize)
    updateUrlParams({ limit: newSize, page: 1 })
  }

  const handleExportClick = async () => {
    setIsExporting(true)
    let exportStartDate: Date | undefined
    let exportEndDate: Date | undefined

    if (dateFilterType === "day" && selectedDate) {
      const range = getDayRange(selectedDate)
      exportStartDate = range.startDate
      exportEndDate = range.endDate
    } else if (dateFilterType === "week" && selectedDate) {
      const range = getWeekRange(selectedDate)
      exportStartDate = range.startDate
      exportEndDate = range.endDate
    } else if (dateFilterType === "month" && selectedDate) {
      const range = getMonthRange(selectedDate)
      exportStartDate = range.startDate
      exportEndDate = range.endDate
    } else if (dateFilterType === "custom") {
      exportStartDate = customDateRange.from
      exportEndDate = customDateRange.to
    }

    try {
      await onExport({
        startDate: exportStartDate,
        endDate: exportEndDate,
        search: searchQuery,
        status: statusFilter,
      })
    } catch (error) {
      toast.error("Failed to export data.")
      console.error("Export error:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const columns: ColumnDef<AttendanceRecord>[] = useMemo(
    () => [
      {
        accessorKey: "user.name",
        header: "Employee Name",
        cell: ({ row }) => row.original.user?.name || "N/A",
      },
      {
        accessorKey: "user.email",
        header: "Email",
        cell: ({ row }) => row.original.user?.email || "N/A",
      },
      {
        accessorKey: "user.position",
        header: "Position",
        cell: ({ row }) => row.original.user?.position || row.original.user?.department?.name || "Employee",
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => formatDate(row.original.date),
      },
      {
        accessorKey: "signInTime",
        header: "Sign In",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span>{formatTime(row.original.signInTime)}</span>
            <span className="text-xs text-gray-500">
              {row.original.signInLocation?.address || "N/A"} ({row.original.signInLocation?.method || "N/A"})
            </span>
          </div>
        ),
      },
      {
        accessorKey: "signOutTime",
        header: "Sign Out",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span>{formatTime(row.original.signOutTime)}</span>
            <span className="text-xs text-gray-500">
              {row.original.signOutLocation?.address || "N/A"} ({row.original.signOutLocation?.method || "N/A"})
            </span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <span
            className={cn(
              "px-2.5 py-0.5 rounded-full text-xs font-medium",
              row.original.status === "SIGNED_IN" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800",
            )}
          >
            {row.original.status.replace("_", " ")}
          </span>
        ),
      },
      {
        accessorKey: "workplace.name",
        header: "Workplace",
        cell: ({ row }) => row.original.workplace?.name || "N/A",
      },
    ],
    [],
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
      pagination: {
        pageIndex: currentPage - 1,
        pageSize,
      },
      globalFilter: searchQuery,
    },
    manualPagination: true, // Tell TanStack Table that pagination is handled externally
    manualFiltering: true, // Tell TanStack Table that filtering is handled externally
    manualSorting: true, // Tell TanStack Table that sorting is handled externally
    pageCount: Math.ceil(totalRecords / pageSize),
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-center gap-4">
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            <SelectItem value="SIGNED_IN">Signed In</SelectItem>
            <SelectItem value="SIGNED_OUT">Signed Out</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateFilterType} onValueChange={handleDateFilterTypeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Day</SelectItem>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>

        {dateFilterType !== "custom" && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={selectedDate} onSelect={handleSelectedDateChange} initialFocus />
            </PopoverContent>
          </Popover>
        )}

        {dateFilterType === "custom" && (
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[180px] justify-start text-left font-normal",
                    !customDateRange.from && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customDateRange.from ? format(customDateRange.from, "PPP") : <span>From</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={customDateRange.from}
                  onSelect={(date) => handleCustomDateRangeChange({ ...customDateRange, from: date || undefined })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <span>-</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[180px] justify-start text-left font-normal",
                    !customDateRange.to && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customDateRange.to ? format(customDateRange.to, "PPP") : <span>To</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={customDateRange.to}
                  onSelect={(date) => handleCustomDateRangeChange({ ...customDateRange, to: date || undefined })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        <Button onClick={handleExportClick} disabled={isExporting}>
          {isExporting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Exporting...
            </span>
          ) : (
            "Export to Excel"
          )}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" /> Loading attendance records...
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">{totalRecords} total record(s).</div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select value={`${pageSize}`} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {currentPage} of {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0 bg-transparent"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              {"<"}
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0 bg-transparent"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              {">"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
