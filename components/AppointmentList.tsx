'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAppointments, updateAppointment, cancelAppointment } from '../actions/appointmentActions';
import { toast } from 'react-hot-toast';
import { Calendar, User, Stethoscope, X, Clock, Plus, Filter, Search, AlertCircle, CheckCircle2, XCircle, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';

interface Appointment {
  id: string;
  doctor: { id: string; fullName: string };
  patient: { id: string; fullName: string };
  triage?: { id: string; triageCategory: string } | null;
  startTime: string;
  endTime: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string | null;
}

const AppointmentList: React.FC = () => {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('startTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const data = await getAppointments({});
        setAppointments(data);
      } catch (error: any) {
        toast.error(error.message || 'Failed to load appointments');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await cancelAppointment(id);
      setAppointments((prev) =>
        prev.map((appt) => (appt.id === id ? { ...appt, status: 'CANCELLED' } : appt)),
      );
      toast.success('Appointment cancelled successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel appointment');
    }
  };

  const handleStatusChange = async (id: string, status: Appointment['status']) => {
    try {
      await updateAppointment({ id, status });
      setAppointments((prev) =>
        prev.map((appt) => (appt.id === id ? { ...appt, status } : appt)),
      );
      toast.success('Appointment status updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update appointment');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'COMPLETED':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'NO_SHOW':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'NO_SHOW':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'critical':
      case 'urgent':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const filteredAppointments = appointments.filter(appt => {
    const matchesSearch = 
      appt.doctor.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appt.patient.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || appt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort appointments
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'startTime':
        aValue = new Date(a.startTime).getTime();
        bValue = new Date(b.startTime).getTime();
        break;
      case 'doctor':
        aValue = a.doctor.fullName.toLowerCase();
        bValue = b.doctor.fullName.toLowerCase();
        break;
      case 'patient':
        aValue = a.patient.fullName.toLowerCase();
        bValue = b.patient.fullName.toLowerCase();
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      default:
        aValue = new Date(a.startTime).getTime();
        bValue = new Date(b.startTime).getTime();
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAppointments = sortedAppointments.slice(startIndex, endIndex);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
              <p className="text-gray-600 mt-1">Manage and track all patient appointments</p>
            </div>
            
            <button
              onClick={() => router.push('/dashboard/appointment/new')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              Schedule New Appointment
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col gap-4">
            {/* First Row: Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by doctor or patient name..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[160px]"
                >
                  <option value="ALL">All Status</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="NO_SHOW">No Show</option>
                </select>
              </div>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[120px]"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
            
            {/* Second Row: Sort Options */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700 self-center mr-2">Sort by:</span>
              {[
                { field: 'startTime', label: 'Date & Time' },
                { field: 'doctor', label: 'Doctor' },
                { field: 'patient', label: 'Patient' },
                { field: 'status', label: 'Status' }
              ].map(({ field, label }) => (
                <button
                  key={field}
                  onClick={() => handleSort(field)}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sortBy === field 
                      ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {label}
                  {getSortIcon(field)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].map(status => {
            const count = filteredAppointments.filter(appt => appt.status === status).length;
            return (
              <div key={status} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">{status.replace('_', ' ')}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${getStatusColor(status)}`}>
                    {getStatusIcon(status)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Results Summary */}
        {(searchTerm || statusFilter !== 'ALL') && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-blue-800 text-sm">
              Showing {paginatedAppointments.length} of {filteredAppointments.length} appointments
              {searchTerm && ` matching "${searchTerm}"`}
              {statusFilter !== 'ALL' && ` with status "${statusFilter}"`}
            </p>
          </div>
        )}

        {/* Appointments List */}
        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No appointments found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'ALL' 
                ? 'Try adjusting your search or filter criteria' 
                : 'Get started by scheduling your first appointment'}
            </p>
            {!searchTerm && statusFilter === 'ALL' && (
              <button
                onClick={() => router.push('/dashboard/appointment/new')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Schedule Appointment
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Left Section - Main Info */}
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                          {/* Basic Info */}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-6">
                              <div className="flex items-center gap-2">
                                <Stethoscope className="w-4 h-4 text-blue-600" />
                                <span className="font-semibold text-gray-900">{appt.doctor.fullName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-green-600" />
                                <span className="font-medium text-gray-700">{appt.patient.fullName}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-6">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-purple-600" />
                                <span className="text-sm text-gray-700">
                                  {format(new Date(appt.startTime), 'MMM dd, yyyy')}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-indigo-600" />
                                <span className="text-sm text-gray-700">
                                  {format(new Date(appt.startTime), 'h:mm aa')} - {format(new Date(appt.endTime), 'h:mm aa')}
                                </span>
                              </div>
                            </div>

                            {/* Notes - Condensed */}
                            {appt.notes && (
                              <div className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 max-w-md">
                                <span className="font-medium">Notes:</span> {appt.notes.length > 80 ? `${appt.notes.substring(0, 80)}...` : appt.notes}
                              </div>
                            )}
                          </div>

                          {/* Status and Priority Badges */}
                          <div className="flex flex-row sm:flex-col gap-2 sm:items-end">
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium ${getStatusColor(appt.status)}`}>
                              {getStatusIcon(appt.status)}
                              {appt.status.replace('_', ' ')}
                            </div>
                            {appt.triage && (
                              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium ${getPriorityColor(appt.triage.triageCategory)}`}>
                                <AlertCircle className="w-3 h-3" />
                                {appt.triage.triageCategory}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Section - Actions */}
                      <div className="flex flex-row gap-2 lg:min-w-[180px] lg:justify-end">
                        <select
                          value={appt.status}
                          onChange={(e) =>
                            handleStatusChange(appt.id, e.target.value as Appointment['status'])
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-xs font-medium"
                          disabled={appt.status === 'CANCELLED'}
                        >
                          <option value="SCHEDULED">Scheduled</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="NO_SHOW">No Show</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                        
                        {appt.status !== 'CANCELLED' && (
                          <button
                            onClick={() => handleCancel(appt.id)}
                            className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 border border-red-200 transition-colors text-xs font-medium"
                          >
                            <X className="w-3 h-3" />
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mt-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredAppointments.length)} of {filteredAppointments.length} appointments
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AppointmentList;