"use client"

import { Search } from "lucide-react"
import type React from "react"
import { useState } from "react"

export default function SearchBar({
  data,
  onSearch,
  setIsSearch,
}: {
  data: any[]
  onSearch: any
  setIsSearch: any
}) {
  const [searchTerm, setSearchTerm] = useState("")

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)

    const filteredData = data.filter((item: any) => {
      const searchValue = e.target.value.toLowerCase()

      // Search in patient name (handle nested structure)
      if (item.name && Array.isArray(item.name) && item.name[0]) {
        const patientName = item.name[0]
        const fullName = `${patientName.given?.join(" ") || ""} ${patientName.family || ""}`.trim().toLowerCase()
        if (fullName.includes(searchValue)) return true
      }

      // Search in other fields
      return Object.values(item).some((value: any) => {
        if (value && typeof value === "string") {
          return value.toLowerCase().includes(searchValue)
        }
        if (value && typeof value === "object") {
          return JSON.stringify(value).toLowerCase().includes(searchValue)
        }
        return false
      })
    })

    setIsSearch(true)
    onSearch(filteredData)
  }

  return (
    <div className="flex justify-between items-center gap-8 w-full">
      <div className="mt-2 relative w-full max-w-sm">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="text-slate-400 w-4 h-4" />
        </div>
        <input
          id="search"
          name="search"
          type="text"
          autoComplete="search"
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search patients by name..."
          className="block w-full rounded-lg border border-gray-200 py-2.5 text-gray-900 shadow-sm placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:text-sm pl-10 bg-white transition-colors"
        />
      </div>
    </div>
  )
}
