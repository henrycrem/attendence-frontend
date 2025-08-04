"use client"

import { useState, useEffect } from 'react';
import { Trash2, Eye, ChevronDown, Search, Filter, Plus, Download } from 'lucide-react';

export default function EmployeeAttendanceTable() {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Today');

  useEffect(() => {
    setTimeout(() => {
      setIsVisible(true);
    }, 100);
  }, []);

  const employees = [
    {
      name: 'John Doe',
      age: '30 y',
      gender: 'Male',
      id: 'EMP001',
      date: '6 Dec 2024',
      checkInTime: '08:00 AM',
      status: 'Present',
      department: 'Engineering',
      avatar: 'https://via.placeholder.com/40'
    },
    {
      name: 'Jane Smith',
      age: '28 y',
      gender: 'Female',
      id: 'EMP002',
      date: '6 Dec 2024',
      checkInTime: '09:15 AM',
      status: 'Late',
      department: 'Marketing',
      avatar: 'https://via.placeholder.com/40'
    },
    {
      name: 'Michael Brown',
      age: '45 y',
      gender: 'Male',
      id: 'EMP003',
      date: '6 Dec 2024',
      checkInTime: '-',
      status: 'Absent',
      department: 'Finance',
      avatar: 'https://via.placeholder.com/40'
    },
    {
      name: 'Sarah Johnson',
      age: '35 y',
      gender: 'Female',
      id: 'EMP004',
      date: '6 Dec 2024',
      checkInTime: '-',
      status: 'Leave',
      department: 'HR',
      avatar: 'https://via.placeholder.com/40'
    }
  ];

  const filters = ['Today', 'Last Week', 'Last Month', 'Last Year'];

  return (
    <div className={`bg-slate-800/80 backdrop-blur-xl rounded-xl shadow-sm mt-6 transition-all duration-700 transform ${
      isVisible ? 'opacity-100 translate-y-0 rotate-0' : 'opacity-0 translate-y-8 rotate-1'
    } border border-slate-700/40 hover:shadow-red-500/20`}
    style={{ transformStyle: 'preserve-3d' }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-red-400/20 rounded-full animate-ping"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-red-500/20 rounded-full animate-pulse"></div>
      </div>
      <div className="p-4 md:p-6 border-b border-red-500/20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-semibold text-white">Employee Attendance Records</h3>
          
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
            <div className="relative flex-grow sm:flex-grow-0">
              <input 
                type="text" 
                placeholder="Search employee..." 
                className="w-full sm:w-64 px-4 py-2 pl-10 text-sm border border-slate-600 bg-slate-800 text-red-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all shadow-sm hover:shadow-md"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-red-400" />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <button 
                  className="px-4 py-2 text-sm font-medium bg-slate-700 border border-red-400 rounded-xl text-red-100 shadow-sm hover:shadow-md flex items-center gap-2 transition-all hover:bg-red-500/20"
                  onClick={() => setFilterOpen(!filterOpen)}
                >
                  <Filter className="h-4 w-4 text-red-400" />
                  <span>Filter</span>
                  <ChevronDown className={`h-4 w-4 text-red-400 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {filterOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 shadow-lg rounded-md border border-red-400/40 py-1 z-10 transform transition-all duration-200" style={{ transformOrigin: 'top right' }}>
                    {filters.map((filter, index) => (
                      <button 
                        key={index}
                        className={`block w-full text-left px-4 py-2 text-sm transition-colors ${activeFilter === filter ? 'text-red-400 bg-red-100/20' : 'text-red-100'}`}
                        onClick={() => {
                          setActiveFilter(filter);
                          setFilterOpen(false);
                        }}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <button className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-xl shadow-sm hover:shadow-md flex items-center gap-2 transition-all hover:bg-red-600 transform hover:translate-y-0">
                <Plus className="h-4 w-4" />
                <span>Add Employee</span>
              </button>
              
              <button className="px-4 py-2 text-sm font-medium bg-slate-700 border border-red-400 rounded-xl text-red-100 shadow-sm hover:shadow-md flex items-center gap-2 transition-all hover:bg-red-500/20">
                <Download className="h-4 w-4 text-red-400" />
                <span className="hidden md:inline">Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-red-400 bg-slate-100/10">
              <th className="px-2 md:px-4 py-3 font-medium">Employee</th>
              <th className="px-2 md:px-4 py-3 font-medium">ID</th>
              <th className="px-2 md:px-4 py-3 font-medium">Date</th>
              <th className="px-2 md:px-4 py-3 font-medium">Check-in</th>
              <th className="px-2 md:px-4 py-3 font-medium">Status</th>
              <th className="px-2 md:px-4 py-3 font-medium">Department</th>
              <th className="px-2 md:px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee, index) => (
              <tr
                key={index}
                className={`hover:bg-red-500/10 transition-all duration-300 ${
                  index < employees.length - 1 ? 'border-b border-red-500/20' : ''
                } ${hoveredRow === index ? 'bg-red-100/20 shadow-sm transform scale-[1.01] z-10' : ''}`}
                onMouseEnter={() => setHoveredRow(index)}
                onMouseLeave={() => setHoveredRow(null)}
                style={{ transformOrigin: 'center', transformStyle: 'preserve-3d' }}
              >
                <td className="px-2 md:px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden shadow-sm transform transition-transform hover:scale-110">
                      <img src={employee.avatar} alt={employee.name} className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <div className="font-medium text-white">{employee.name}</div>
                      <div className="text-xs text-red-400">{employee.age}, {employee.gender}</div>
                    </div>
                  </div>
                </td>
                <td className="px-2 md:px-4 py-2 text-white text-xs">{employee.id}</td>
                <td className="px-2 md:px-4 py-2 text-white text-xs">{employee.date}</td>
                <td className="px-2 md:px-4 py-2 text-white text-xs">{employee.checkInTime}</td>
                <td className="px-2 md:px-4 py-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    employee.status === 'Absent' ? 'bg-red-100 text-red-600' :
                    employee.status === 'Late' ? 'bg-blue-600 text-white' :
                    employee.status === 'Leave' ? 'bg-green-100 text-green-600' : 'bg-green-600 text-white'
                  } shadow-sm: transform transition-transform hover:scale-110`}>
                    {employee.status}
                  </span>
                </td>
                <td className="px-2 md:px-4 py-2 text-white text-xs">{employee.department}</td>
                <td className="px-2 md:px-2 py-2">
                  <div className="flex gap-2 justify-end">
                    <button className="p-2 hover:bg-blue-600/20 rounded-full transition-all hover:shadow-sm transform hover:scale-110">
                      <Eye className="h-4 w-4 text-blue-400" />
                    </button>
                    <button className="p-2 hover:bg-red-600/20 rounded-full transition-all hover:shadow-sm transform hover:scale-110">
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 md:p-6 border-t border-red-500/20 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-sm text-red-400">
          Showing <span className="font-medium">1</span> to <span className="font-medium">4</span> of <span className="font-medium">100</span> employees
        </div>
        
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-red-400 rounded-xl text-sm font-medium text-red-100 transition-all transform hover:bg-red-600/20 hover:shadow disabled:opacity-50 disabled:cursor-not-allowed">
            Previous
          </button>
          <button className="px-3 py-2 border border-red-500 rounded-xl text-sm font-medium bg-red-100/20 text-red-400 border-red-500/50  transition-all transform hover:bg-red-600/20 hover:shadow">
            1
          </button>
          <button className="px-3 py-2 border border-red-400 rounded-xl text-sm font-medium text-red-100 transition-all transform hover:bg-red-600/20 hover:shadow">
            2
          </button>
          <button className="px-3 py-2 border border-red-400 rounded-xl text-sm font-medium text-red-100 transition-all transform hover:bg-red-600/20 hover:shadow">
            3
          </button>
          <button className="px-4 py-2 border border-red-400 rounded-xl text-sm font-medium text-red-100 transition-all transform hover:bg-red-600/20 hover:shadow">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}