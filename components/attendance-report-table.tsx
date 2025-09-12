"use client";

import type React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { formatDate, formatTime, getDayRange, getWeekRange, getMonthRange } from "@/lib/date-utils";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";

// ✅ Define the unified session type
export type UnifiedAttendanceSession = {
  userId: string;
  name: string;
  date: string;
  signInTime: Date | null;
  signOutTime: Date | null;
  signInMethod: "fingerprint" | "remote_app" | null;
  signInSource: "dahua" | "system" | null;
  signOutMethod: "fingerprint" | "remote_app" | null;
  signOutSource: "dahua" | "system" | null;
  email?: string;
  position?: string;
  department?: string | null;
  workplace?: string | null;
};

interface AttendanceReportTableProps {
  initialData: UnifiedAttendanceSession[];
  initialTotalRecords: number;
  initialCurrentPage: number;
  initialPageSize: number;
  initialSearchQuery: string;
  initialStatusFilter: string;
  initialDateFilterType: string;
  initialSelectedDate?: Date;
  initialCustomDateRange: { from?: Date; to?: Date };
  onExport: (filters: {
    startDate?: Date;
    endDate?: Date;
    search?: string;
    status?: string;
  }) => Promise<any>;
  isLoading: boolean;
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [data, setData] = useState<UnifiedAttendanceSession[]>(initialData);
  const [totalRecords, setTotalRecords] = useState(initialTotalRecords);
  const [currentPage, setCurrentPage] = useState(initialCurrentPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [dateFilterType, setDateFilterType] = useState(initialDateFilterType);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialSelectedDate);
  const [customDateRange, setCustomDateRange] = useState<{ from?: Date; to?: Date }>(initialCustomDateRange);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setData(initialData);
    setTotalRecords(initialTotalRecords);
    setCurrentPage(initialCurrentPage);
    setPageSize(initialPageSize);
    setSearchQuery(initialSearchQuery);
    setStatusFilter(initialStatusFilter);
    setDateFilterType(initialDateFilterType);
    setSelectedDate(initialSelectedDate);
    setCustomDateRange(initialCustomDateRange);
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
  ]);

  const updateUrlParams = useCallback(
    (newParams: Record<string, string | number | undefined | null>) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
          current.delete(key);
        } else {
          current.set(key, String(value));
        }
      });
      router.push(`${pathname}?${current.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = e.target.value;
    setSearchQuery(newSearch);
    updateUrlParams({ search: newSearch, page: 1 });
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    updateUrlParams({ status: value, page: 1 });
  };

  const handleDateFilterTypeChange = (value: string) => {
    setDateFilterType(value);
    updateUrlParams({
      dateFilterType: value,
      selectedDate: undefined,
      customDateFrom: undefined,
      customDateTo: undefined,
      page: 1,
    });
  };

  const handleSelectedDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    updateUrlParams({ selectedDate: date?.toISOString(), page: 1 });
  };

  const handleCustomDateRangeChange = (range: { from?: Date; to?: Date }) => {
    setCustomDateRange(range);
    updateUrlParams({
      customDateFrom: range.from?.toISOString(),
      customDateTo: range.to?.toISOString(),
      page: 1,
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrlParams({ page });
  };

  const handlePageSizeChange = (size: string) => {
    const newSize = parseInt(size, 10);
    setPageSize(newSize);
    updateUrlParams({ limit: newSize, page: 1 });
  };

  const handleExportClick = async () => {
    setIsExporting(true);
    let exportStartDate: Date | undefined;
    let exportEndDate: Date | undefined;

    if (dateFilterType === "day" && selectedDate) {
      const range = getDayRange(selectedDate);
      exportStartDate = range.startDate;
      exportEndDate = range.endDate;
    } else if (dateFilterType === "week" && selectedDate) {
      const range = getWeekRange(selectedDate);
      exportStartDate = range.startDate;
      exportEndDate = range.endDate;
    } else if (dateFilterType === "month" && selectedDate) {
      const range = getMonthRange(selectedDate);
      exportStartDate = range.startDate;
      exportEndDate = range.endDate;
    } else if (dateFilterType === "custom") {
      exportStartDate = customDateRange.from;
      exportEndDate = customDateRange.to;
    }

    try {
      await onExport({
        startDate: exportStartDate,
        endDate: exportEndDate,
        search: searchQuery,
        status: statusFilter,
      });
    } catch (error) {
      toast.error("Failed to export data.");
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  // ✅ Updated columns
  const columns: ColumnDef<UnifiedAttendanceSession>[] = useMemo(
    () => [
      {
        header: "Employee Name",
        cell: (info) => info.row.original.name || "N/A",
      },
      {
        header: "Email",
        cell: (info) => info.row.original.email || "N/A",
      },
      {
        header: "Position",
        cell: (info) => info.row.original.position || info.row.original.department || "Employee",
      },
      {
        header: "Date",
        cell: (info) => info.row.original.date,
      },
      {
        header: "Sign In",
        cell: (info) => {
          const time = info.row.original.signInTime;
          const method = info.row.original.signInMethod;
          const source = info.row.original.signInSource;
          return (
            <div>
              <div>{time ? formatTime(time) : "—"}</div>
              <div className="text-xs text-gray-500">
                {method && source ? `${method} (${source})` : "N/A"}
              </div>
            </div>
          );
        },
      },
      {
        header: "Sign Out",
        cell: (info) => {
          const time = info.row.original.signOutTime;
          const method = info.row.original.signOutMethod;
          const source = info.row.original.signOutSource;
          return (
            <div>
              <div>{time ? formatTime(time) : "—"}</div>
              <div className="text-xs text-gray-500">
                {method && source ? `${method} (${source})` : "N/A"}
              </div>
            </div>
          );
        },
      },
      {
        header: "Workplace",
        cell: (info) => info.row.original.workplace || "N/A",
      },
    ],
    []
  );

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
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    pageCount: Math.ceil(totalRecords / pageSize),
  });

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
                  !selectedDate && "text-muted-foreground"
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
                    !customDateRange.from && "text-muted-foreground"
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
                  onSelect={(date) =>
                    handleCustomDateRangeChange({ ...customDateRange, from: date || undefined })
                  }
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
                    !customDateRange.to && "text-muted-foreground"
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
                  onSelect={(date) =>
                    handleCustomDateRangeChange({ ...customDateRange, to: date || undefined })
                  }
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
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" /> Loading attendance records...
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
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
              {"<"}
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0 bg-transparent"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!table.getCanNextPage()}
            >
              {">"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}