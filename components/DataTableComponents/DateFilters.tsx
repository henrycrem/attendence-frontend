"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Calendar } from "lucide-react"

interface DateFiltersProps<T> {
  data: T[]
  onFilter: (filtered: T[]) => void
  setIsSearch: (isSearch: boolean) => void
}

export default function DateFilters<T>({ data, onFilter, setIsSearch }: DateFiltersProps<T>) {
  const handleFilter = (days: number | null) => {
    if (days === null) {
      onFilter(data)
      setIsSearch(true)
      return
    }

    const now = new Date()
    const filterDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    const filtered = data.filter((item: any) => {
      // This is a generic filter - you might need to customize based on your data structure
      const itemDate = new Date(item.createdAt || item.date || item.updatedAt)
      return itemDate >= filterDate
    })

    onFilter(filtered)
    setIsSearch(false)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1 bg-transparent">
          <Calendar className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Date</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleFilter(null)}>All Time</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleFilter(1)}>Last 24 Hours</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleFilter(7)}>Last 7 Days</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleFilter(30)}>Last 30 Days</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleFilter(90)}>Last 3 Months</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
