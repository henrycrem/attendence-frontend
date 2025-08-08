"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, User, Loader2 } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { searchEmployeesAction } from "@/actions/employee-search"

interface Employee {
  id: string
  name: string
  email: string
  position?: string
  role?: {
    displayName: string
    roleName: string
  }
  department?: {
    name: string
  }
  lastOnlineStatus?: string
}

interface EmployeeSearchProps {
  className?: string
}

export default function EmployeeSearch({ className = "" }: EmployeeSearchProps) {
  const [query, setQuery] = useState("")
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (query.trim().length < 2) {
      setEmployees([])
      setIsOpen(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)
      console.log('EmployeeSearch: Searching for:', query)
      
      try {
        const result = await searchEmployeesAction(query)
        console.log('EmployeeSearch: Search result:', result)
        
        if (result.success && result.data) {
          setEmployees(result.data.employees || [])
          setIsOpen(true)
          console.log('EmployeeSearch: Found employees:', result.data.employees?.length || 0)
        } else {
          console.error('EmployeeSearch: Search failed:', result.error)
          setEmployees([])
          setIsOpen(false)
        }
      } catch (error) {
        console.error('EmployeeSearch: Search error:', error)
        setEmployees([])
        setIsOpen(false)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < employees.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
          break
        case 'Enter':
          e.preventDefault()
          if (selectedIndex >= 0 && employees[selectedIndex]) {
            handleEmployeeSelect(employees[selectedIndex])
          }
          break
        case 'Escape':
          setIsOpen(false)
          setSelectedIndex(-1)
          inputRef.current?.blur()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, employees])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleEmployeeSelect = (employee: Employee) => {
    console.log('EmployeeSearch: Selected employee:', employee)
    setQuery("")
    setIsOpen(false)
    setSelectedIndex(-1)
    router.push(`/dashboard/employees/${employee.id}`)
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500'
      case 'offline':
        return 'bg-gray-400'
      default:
        return 'bg-gray-400'
    }
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search employees..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (employees.length > 0) {
              setIsOpen(true)
            }
          }}
          className="pl-10 pr-10 w-full h-9 sm:h-10 text-sm bg-white/50 backdrop-blur-sm border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin" />
        )}
      </div>

      {/* Search Results Dropdown - High z-index to appear above dashboard content */}
      {isOpen && (
        <div className="absolute cursor-pointer top-full left-0 right-0 mt-1 bg-white/95 backdrop-blur-md border border-gray-200 rounded-lg shadow-xl z-[9999] max-h-80 overflow-y-auto">
          {employees.length > 0 ? (
            <div className="py-2">
              {employees.map((employee, index) => (
                <button
                  key={employee.id}
                  onClick={() => handleEmployeeSelect(employee)}
                  className={`w-full cursor-pointer px-4 py-3 text-left hover:bg-gray-50/80 transition-colors duration-150 ${
                    index === selectedIndex ? 'bg-blue-50/80 cursor-pointer border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3 cursor-pointer">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-500" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {employee.name}
                        </p>
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(employee.lastOnlineStatus)} flex-shrink-0`} />
                      </div>
                      <p className="text-xs text-gray-500 truncate">{employee.email}</p>
                      <div className="flex items-center space-x-2 mt-1 flex-wrap">
                        {employee.role && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {employee.role.displayName}
                          </span>
                        )}
                        {employee.department && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {employee.department.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : query.trim().length >= 2 && !isLoading ? (
            <div className="px-4 py-6 text-center text-gray-500">
              <User className="mx-auto h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm">No employees found</p>
              <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}