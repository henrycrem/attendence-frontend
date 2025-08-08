"use client"
import { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { getTodayAttendanceRecords, exportAttendanceData, getUserRole } from '@/actions/dashboard';

interface AttendanceRecord {
  id: string;
  name: string;
  email: string;
  department: string;
  clockIn: string;
  clockOut: string;
  status: string;
  hoursWorked: string;
  signInLocation?: any;
  signOutLocation?: any;
  workplace?: string;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function AttendanceTable() {
  const [isVisible, setIsVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsVisible(true);
    }, 100);
  }, []);

  // ✅ Check user role first
  useEffect(() => {
    checkUserAccess();
  }, []);

  useEffect(() => {
    if (hasAccess) {
      fetchAttendanceRecords();
    }
  }, [currentPage, searchTerm, filterStatus, hasAccess]);

  // ✅ Check if user has access to this component
  const checkUserAccess = async () => {
    try {
      const roleResponse = await getUserRole();
      if (roleResponse.success) {
        const { role, isAdmin } = roleResponse.data;
        setUserRole(role);
        setHasAccess(isAdmin);
        
        if (!isAdmin) {
          setError("Access denied. Admin privileges required to view attendance records.");
        }
      }
    } catch (err: any) {
      console.error('Failed to check user role:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Use server action instead of direct API call
  const fetchAttendanceRecords = async () => {
    if (!hasAccess) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await getTodayAttendanceRecords({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: filterStatus
      });

      if (response.success) {
        setRecords(response.data.records || []);
        setPagination(response.data.pagination || null);
      } else {
        throw new Error('Failed to fetch attendance records');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch attendance records:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      'On Time': 'bg-green-100 text-green-800',
      'Late': 'bg-red-100 text-red-800',
      'Early': 'bg-blue-100 text-blue-800',
      'Not Clocked In': 'bg-gray-100 text-gray-800'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  // ✅ Use server action for export
  const handleExport = async () => {
    if (!hasAccess) return;

    try {
      setExporting(true);
      
      const response = await exportAttendanceData({
        format: 'csv',
        search: searchTerm,
        status: filterStatus
      });

      if (response.success && response.blob) {
        // Create download link
        const url = window.URL.createObjectURL(response.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.filename || `attendance-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Export failed');
      }
    } catch (err: any) {
      console.error('Export failed:', err);
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  // ✅ Show access denied message for non-admin users
  if (!loading && !hasAccess) {
    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Access Denied</h3>
          <p className="text-gray-600 mb-4">
            You need administrator privileges to view attendance records.
          </p>
          <p className="text-sm text-gray-500">
            Current role: <span className="font-medium">{userRole || 'Unknown'}</span>
          </p>
        </div>
      </div>
    );
  }

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
    );
  }

  return (
    <div className={`bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 transition-all duration-700 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
    }`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Clock className="text-gray-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Today's Attendance Records</h3>
              <p className="text-sm text-gray-600">
                {pagination ? `${pagination.totalRecords} records found` : 'Loading...'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative">
              <input 
                type="text"
                placeholder="Search employee..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-64 px-4 py-2 pl-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
            
            {/* Filter */}
            <select 
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="All">All Status</option>
              <option value="On Time">On Time</option>
              <option value="Late">Late</option>
              <option value="Early">Early</option>
              <option value="Not Clocked In">Not Clocked In</option>
            </select>
            
            {/* Refresh */}
            <button 
              onClick={fetchAttendanceRecords}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`${loading ? 'animate-spin' : ''}`} size={16} />
              <span>Refresh</span>
            </button>
            
            {/* Export */}
            <button 
              onClick={handleExport}
              disabled={exporting}
              className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
            >
              <Download className={`${exporting ? 'animate-spin' : ''}`} size={16} />
              <span>{exporting ? 'Exporting...' : 'Export'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-6 bg-red-50 border-b border-red-200">
          <p className="text-red-600">Error: {error}</p>
          <button 
            onClick={fetchAttendanceRecords}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm font-medium text-gray-600 bg-gray-50">
              <th className="px-6 py-4">Employee</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4">Clock In</th>
              <th className="px-6 py-4">Clock Out</th>
              <th className="px-6 py-4">Hours Worked</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.map((record, index) => (
              <tr
                key={record.id}
                className="hover:bg-gray-50 transition-colors duration-150"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {record.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{record.name}</div>
                      <div className="text-sm text-gray-500">{record.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{record.department}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-800">{record.clockIn}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-800">{record.clockOut}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{record.hoursWorked}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(record.status)}`}>
                    {record.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                    <Eye className="h-4 w-4 text-gray-500" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {pagination && (
        <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium">{((currentPage - 1) * 10) + 1}</span> to{' '}
            <span className="font-medium">{Math.min(currentPage * 10, pagination.totalRecords)}</span> of{' '}
            <span className="font-medium">{pagination.totalRecords}</span> records
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={!pagination.hasPrev || loading}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pageNum = Math.max(1, currentPage - 2) + i;
              if (pageNum > pagination.totalPages) return null;
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 border rounded-lg text-sm font-medium transition-colors duration-200 ${
                    pageNum === currentPage
                      ? 'border-gray-300 bg-gray-100 text-gray-800'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
              disabled={!pagination.hasNext || loading}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
