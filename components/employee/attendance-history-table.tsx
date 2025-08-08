"use client"
import { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, RefreshCw, AlertCircle, WifiOff } from 'lucide-react'
import { toast } from 'sonner'
import { getEmployeeAttendanceHistory } from '@/actions/dashboard'
import { errorHandlers } from '@/errorHandler'

interface AttendanceRecord {
  id: string
  date: string
  clockIn: string
  clockOut: string
  hoursWorked: string
  status: string
  location: string
  method: string
}

interface PaginationData {
  currentPage: number
  totalPages: number
  totalRecords: number
  hasNext: boolean
  hasPrev: boolean
}

interface AttendanceHistoryClientProps {
  initialData: {
    records: AttendanceRecord[]
    pagination: PaginationData
  } | null
  initialError: string | null
}

export default function AttendanceHistoryClient({
  initialData,
  initialError,
}: AttendanceHistoryClientProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>(initialData?.records || [])
  const [pagination, setPagination] = useState<PaginationData | null>(initialData?.pagination || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError)
  const [currentPage, setCurrentPage] = useState(initialData?.pagination?.currentPage || 1)
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // ✅ Monitor online status
    const handleOnline = () => {
      setIsOnline(true);
      if (error && error.includes('connection')) {
        fetchFromServerAction(currentPage, selectedMonth, selectedYear); // Retry when back online
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchFromServerAction = async (page: number, month?: string, year?: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await getEmployeeAttendanceHistory({ page, month, year })
      setRecords(result.data.records)
      setPagination(result.data.pagination)
      setCurrentPage(page)
      setRetryCount(0) // Reset retry count on success
      
      // Show success toast only after retry
      if (retryCount > 0) {
        toast.success('Attendance history loaded successfully!');
      }
    } catch (err: any) {
      console.error('Failed to fetch attendance history:', err);
      
      // ✅ Use error handler for user-friendly messages
      const friendlyError = errorHandlers.auth(err, false);
      setError(friendlyError);
      
      // Show appropriate toast based on error type
      if (err.message.includes('session') || err.message.includes('log in')) {
        toast.error('Your session has expired. Please log in again.');
      } else if (err.message.includes('connection') || err.message.includes('network')) {
        toast.error('Connection issue. Please check your internet.');
      } else if (err.message.includes('Access denied')) {
        toast.error('Access denied. Employee privileges required.');
      } else {
        toast.error('Failed to load attendance history. Please try again.');
      }
    } finally {
      setLoading(false)
    }
  }

  // On filter change
  useEffect(() => {
    fetchFromServerAction(1, selectedMonth, selectedYear)
  }, [selectedMonth, selectedYear])

  // ✅ Enhanced retry with exponential backoff
  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    
    // Add delay for retries to prevent spam
    if (retryCount > 0) {
      const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000); // Max 5 seconds
      toast.info(`Retrying in ${delay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    fetchFromServerAction(currentPage, selectedMonth, selectedYear);
  };

  const handlePageChange = (page: number) => {
    fetchFromServerAction(page, selectedMonth, selectedYear)
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      Completed: 'bg-green-100 text-green-800',
      Incomplete: 'bg-yellow-100 text-yellow-800',
      'Not Started': 'bg-gray-100 text-gray-800',
    }
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
  }

  const getMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'gps': return '📍'
      case 'ip': return '🌐'
      case 'manual': return '📝'
      case 'qr': return '📱'
      default: return '❓'
    }
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ]

  // ✅ Enhanced loading state
  if (loading && records.length === 0) {
    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
          </div>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200">
      {/* Connection Status Indicator */}
      {!isOnline && (
        <div className="p-4 bg-orange-50 border-b border-orange-200 flex items-center space-x-2">
          <WifiOff className="w-4 h-4 text-orange-600" />
          <span className="text-sm text-orange-700">You're currently offline</span>
        </div>
      )}
      
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Calendar className="text-blue-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Attendance History</h3>
              <p className="text-sm text-gray-600">
                {pagination ? `${pagination.totalRecords} records found` : 'Loading...'}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              disabled={loading}
            >
              <option value="">All Months</option>
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              disabled={loading}
            >
              <option value="">All Years</option>
              {years.map((year) => (
                <option key={year} value={year.toString()}>
                  {year}
                </option>
              ))}
            </select>
            <button
              onClick={handleRetry}
              disabled={loading || !isOnline}
              className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-6 bg-red-50 border-b border-red-200">
          <div className="flex items-center justify-between">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={handleRetry}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Retrying...' : 'Retry'}</span>
            </button>
          </div>
          
          {retryCount > 0 && (
            <p className="text-sm text-red-500 mt-2">
              Retry attempt: {retryCount}
            </p>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm font-medium text-gray-600 bg-gray-50">
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Clock In</th>
              <th className="px-6 py-4">Clock Out</th>
              <th className="px-6 py-4">Hours Worked</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Method</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">{record.date}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-800">{record.clockIn}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-800">{record.clockOut}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{record.hoursWorked}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(record.status)}`}>
                    {record.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="text-gray-400" size={14} />
                    <span className="text-sm text-gray-600 truncate max-w-32" title={record.location}>
                      {record.location}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{getMethodIcon(record.method)}</span>
                    <span className="text-sm text-gray-600 capitalize">{record.method}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {records.length === 0 && !loading && !error && (
        <div className="p-12 text-center">
          <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records found</h3>
          <p className="text-gray-500">
            {selectedMonth || selectedYear 
              ? 'Try adjusting your filters or check a different time period.'
              : 'Your attendance records will appear here once you start clocking in.'
            }
          </p>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalRecords > 0 && (
        <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium">{((currentPage - 1) * 10) + 1}</span> to{' '}
            <span className="font-medium">{Math.min(currentPage * 10, pagination.totalRecords)}</span> of{' '}
            <span className="font-medium">{pagination.totalRecords}</span> records
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
              disabled={!pagination.hasPrev || loading}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pageNum = Math.max(1, currentPage - 2) + i
              if (pageNum > pagination.totalPages) return null
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-2 border rounded-lg text-sm font-medium ${
                    pageNum === currentPage
                      ? 'border-gray-300 bg-gray-100 text-gray-800'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              onClick={() => handlePageChange(Math.min(currentPage + 1, pagination.totalPages))}
              disabled={!pagination.hasNext || loading}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
