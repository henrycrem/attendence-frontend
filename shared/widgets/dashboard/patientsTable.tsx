"use client"

import { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, Clock } from 'lucide-react';

export default function AttendanceTable() {
  const [isVisible, setIsVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    setTimeout(() => {
      setIsVisible(true);
    }, 100);
  }, []);

  const attendanceRecords = [
    {
      name: 'John Doe',
      id: 'EMP001',
      department: 'Engineering',
      clockIn: '08:00 AM',
      clockOut: '05:30 PM',
      status: 'On Time',
      hoursWorked: '9h 30m',
      avatar: '/api/placeholder/40/40'
    },
    {
      name: 'Jane Smith',
      id: 'EMP002',
      department: 'Marketing',
      clockIn: '09:15 AM',
      clockOut: '06:00 PM',
      status: 'Late',
      hoursWorked: '8h 45m',
      avatar: '/api/placeholder/40/40'
    },
    {
      name: 'Michael Brown',
      id: 'EMP003',
      department: 'Finance',
      clockIn: '08:30 AM',
      clockOut: '05:15 PM',
      status: 'On Time',
      hoursWorked: '8h 45m',
      avatar: '/api/placeholder/40/40'
    },
    {
      name: 'Sarah Johnson',
      id: 'EMP004',
      department: 'HR',
      clockIn: '07:45 AM',
      clockOut: '04:45 PM',
      status: 'Early',
      hoursWorked: '9h 00m',
      avatar: '/api/placeholder/40/40'
    },
    {
      name: 'David Wilson',
      id: 'EMP005',
      department: 'Engineering',
      clockIn: '-',
      clockOut: '-',
      status: 'Not Clocked In',
      hoursWorked: '-',
      avatar: '/api/placeholder/40/40'
    }
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      'On Time': 'bg-green-100 text-green-800',
      'Late': 'bg-red-100 text-red-800',
      'Early': 'bg-blue-100 text-blue-800',
      'Not Clocked In': 'bg-gray-100 text-gray-800'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' || record.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

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
              <p className="text-sm text-gray-600">{filteredRecords.length} records found</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search employee..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 px-4 py-2 pl-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
            
            {/* Filter */}
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="All">All Status</option>
              <option value="On Time">On Time</option>
              <option value="Late">Late</option>
              <option value="Early">Early</option>
              <option value="Not Clocked In">Not Clocked In</option>
            </select>
            
            {/* Export */}
            <button className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center space-x-2">
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

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
            {filteredRecords.map((record, index) => (
              <tr
                key={index}
                className="hover:bg-gray-50 transition-colors duration-150"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-lg bg-gray-200 overflow-hidden">
                      <img src={record.avatar} alt={record.name} className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{record.name}</div>
                      <div className="text-sm text-gray-500">{record.id}</div>
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
      <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-sm text-gray-600">
          Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredRecords.length}</span> of <span className="font-medium">{attendanceRecords.length}</span> records
        </div>
        
        <div className="flex space-x-2">
          <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
            Previous
          </button>
          <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-gray-100 text-gray-800">
            1
          </button>
          <button className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors duration-200">
            2
          </button>
          <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors duration-200">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}