"use client"

import * as React from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Row,
} from "@tanstack/react-table"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"

import { DataTablePagination } from "./DataTablePagination"
import SearchBar from "./SearchBar" 
import { DataTableViewOptions } from "./DataTableViewOptions"
import { Button } from "@/components/ui/button"
import { ListFilter, Trash } from "lucide-react"
import DateFilters from "./DateFilters"
import DateRangeFilter from "./DateRangeFilter"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  tableTitle?: string
  onDelete?: (rows: Row<TData>[]) => void
  disabled?: boolean
}

export default function DataTable<TData, TValue>({
  columns,
  data,
  tableTitle = "",
  onDelete,
  disabled,
}: DataTableProps<TData, TValue>) {
   console.log("DataTable received data:", data)
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [searchResults, setSearchResults] = useState(data)
  const [filteredData, setFilteredData] = useState(data)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [isSearch, setIsSearch] = useState(true)

  const table = useReactTable({
    data: isSearch ? searchResults : filteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 w-full">
          <SearchBar data={data} onSearch={setSearchResults} setIsSearch={setIsSearch} />
        </div>
        <div className="flex items-center gap-3">
          <DateRangeFilter data={data} onFilter={setFilteredData} setIsSearch={setIsSearch} />
          <DateFilters data={data} onFilter={setFilteredData} setIsSearch={setIsSearch} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2 bg-white border-gray-200 hover:bg-gray-50">
                <ListFilter className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Filter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked>Active</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>Inactive</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DataTableViewOptions table={table} />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-gray-200 hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className="h-12 px-6 text-left align-middle font-semibold text-gray-700 text-sm"
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-6 py-4 text-sm text-gray-900">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-lg">No Data found</div>
                    <div className="text-sm text-gray-400">Try adjusting your search or filters</div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between pt-2">
        <DataTablePagination table={table} />
        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <Button
            disabled={disabled}
            size="sm"
            variant="destructive"
            className="h-9 gap-2"
            onClick={async () => {
              if (onDelete) {
                onDelete(table.getFilteredSelectedRowModel().rows)
                table.resetRowSelection()
              }
            }}
          >
            <Trash className="h-4 w-4" />
            Delete {table.getFilteredSelectedRowModel().rows.length}
          </Button>
        )}
      </div>
    </div>
  )
}
