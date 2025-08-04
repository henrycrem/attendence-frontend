'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Thermometer, Heart, Activity, Droplets, Wind, AlertTriangle, CheckCircle, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search, Plus, Filter, Download, RefreshCw, Eye, User } from 'lucide-react';
import { getAllTriages } from 'apps/user-ui/src/actions/triageActions'; 
import { toast, Toaster } from 'react-hot-toast';

interface TriageRecord {
  id: string;
  createdAt: string;
  temperature: number;
  temperatureStatus: 'LOW' | 'NORMAL' | 'HIGH';
  bloodPressure: string;
  bloodPressureStatus: 'LOW' | 'NORMAL' | 'HIGH';
  pulse: number;
  pulseStatus: 'LOW' | 'NORMAL' | 'HIGH';
  bloodOxygenLevel: number;
  bloodOxygenStatus: 'LOW' | 'NORMAL' | 'HIGH';
  respirationRate: number;
  respirationStatus: 'LOW' | 'NORMAL' | 'HIGH';
  triageCategory: 'URGENT' | 'NORMAL';
  overallStatus: 'STABLE' | 'NEEDS_ATTENTION' | 'CRITICAL';
  statusNote?: string;
  patient: {
    id: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    fullName?: string;
  };
  gender?: {
    id: string;
    gender: string;
  };
}

const TriageList: React.FC = () => {
  const [sortField, setSortField] = useState<keyof TriageRecord | 'patient.fullName' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const pageSize = 10;

  // Fetch triage records
  const { data: triages = [], isLoading, isError, error, refetch } = useQuery<TriageRecord[], Error>({
    queryKey: ['allTriages'],
    queryFn: async () => {
      try {
        const response = await getAllTriages();
        return response;
      } catch (err: any) {
        toast.error(err.message || 'Failed to fetch triage records');
        throw err;
      }
    },
    retry: false,
  });

  // Handle sorting
  const handleSort = (field: keyof TriageRecord | 'patient.fullName') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filter and search triages
  const filteredTriages = useMemo(() => {
    return triages.filter(triage => {
      const patientName = triage.patient.fullName || `${triage.patient.firstName} ${triage.patient.lastName}`;
      const matchesSearch = 
        patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        triage.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (triage.statusNote && triage.statusNote.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || triage.overallStatus === statusFilter;
      const matchesCategory = categoryFilter === 'all' || triage.triageCategory === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [triages, searchTerm, statusFilter, categoryFilter]);

  // Sort triages
  const sortedTriages = useMemo(() => {
    if (!sortField) return filteredTriages;

    return [...filteredTriages].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortField === 'patient.fullName') {
        aValue = a.patient.fullName || `${a.patient.firstName} ${a.patient.lastName}`;
        bValue = b.patient.fullName || `${b.patient.firstName} ${b.patient.lastName}`;
      } else {
        aValue = a[sortField];
        bValue = b[sortField];
      }

      if (typeof aValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [filteredTriages, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedTriages.length / pageSize);
  const paginatedTriages = sortedTriages.slice((page - 1) * pageSize, page * pageSize);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status styles
  const getStatusStyles = (status: 'LOW' | 'NORMAL' | 'HIGH' | 'STABLE' | 'NEEDS_ATTENTION' | 'CRITICAL') => {
    switch (status) {
      case 'LOW':
        return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 border border-blue-300 shadow-sm';
      case 'HIGH':
        return 'bg-gradient-to-r from-red-100 to-red-200 text-red-700 border border-red-300 shadow-sm';
      case 'NORMAL':
        return 'bg-gradient-to-r from-green-100 to-green-200 text-green-700 border border-green-300 shadow-sm';
      case 'STABLE':
        return 'bg-gradient-to-r from-green-100 to-green-200 text-green-700 border border-green-300 shadow-sm';
      case 'NEEDS_ATTENTION':
        return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-700 border border-yellow-300 shadow-sm';
      case 'CRITICAL':
        return 'bg-gradient-to-r from-red-100 to-red-200 text-red-700 border border-red-300 shadow-sm animate-pulse';
      default:
        return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-300 shadow-sm';
    }
  };

  // Get triage category styles
  const getTriageCategoryStyles = (category: 'URGENT' | 'NORMAL') => {
    return category === 'URGENT'
      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white border border-red-700 shadow-lg animate-pulse'
      : 'bg-gradient-to-r from-green-500 to-green-600 text-white border border-green-700 shadow-lg';
  };

  const handleAddTriage = () => {
    toast.success('Redirecting to add new triage...');
    // Implement navigation to triage form, e.g., router.push('/triage/new');
  };

  const handleRefresh = () => {
    refetch();
    toast.success('Refreshing triage records...');
  };

  const handleView = (triageId: string) => {
    toast.success(`Viewing triage record ${triageId}...`);
    // Implement navigation to triage details, e.g., router.push(`/triage/${triageId}`);
  };

  const handleExport = () => {
    toast.success('Exporting triage records...');
    // Implement CSV export logic
    const csv = [
      ['ID', 'Patient', 'Category', 'Status', 'Temperature', 'Blood Pressure', 'Pulse', 'Oxygen Level', 'Respiration Rate', 'Date', 'Note'],
      ...sortedTriages.map(triage => [
        triage.id,
        triage.patient.fullName || `${triage.patient.firstName} ${triage.patient.lastName}`,
        triage.triageCategory,
        triage.overallStatus,
        triage.temperature,
        triage.bloodPressure,
        triage.pulse,
        triage.bloodOxygenLevel,
        triage.respirationRate,
        formatDate(triage.createdAt),
        triage.statusNote || '',
      ]),
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'triage_records.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8 transform hover:scale-105 transition-all duration-300">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 rounded-full shadow-2xl mb-6 animate-bounce">
            <Clock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            Triage Management Section
          </h1>
          <p className="text-gray-600 text-lg mt-2">Advanced patient monitoring and assessment dashboard</p>
        </div>

        {/* Controls Section */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-6 mb-8 transform hover:scale-105 transition-all duration-300">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search patients, ID, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/90 backdrop-blur border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-lg"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-white/90 backdrop-blur border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-lg"
              >
                <option value="all">All Status</option>
                <option value="STABLE">Stable</option>
                <option value="NEEDS_ATTENTION">Needs Attention</option>
                <option value="CRITICAL">Critical</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-3 bg-white/90 backdrop-blur border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-lg"
              >
                <option value="all">All Categories</option>
                <option value="URGENT">Urgent</option>
                <option value="NORMAL">Normal</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-2xl hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg transform hover:scale-105"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold rounded-2xl hover:from-gray-600 hover:to-gray-700 disabled:opacity-50 transition-all duration-300 shadow-lg transform hover:scale-105"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={handleAddTriage}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white font-semibold rounded-2xl hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700 transition-all duration-300 shadow-lg transform hover:scale-105 animate-pulse"
              >
                <Plus className="w-5 h-5" />
                Add New Triage
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Records', value: triages.length, icon: User, color: 'from-blue-500 to-blue-600' },
            { label: 'Critical Cases', value: triages.filter(t => t.overallStatus === 'CRITICAL').length, icon: AlertTriangle, color: 'from-red-500 to-red-600' },
            { label: 'Urgent Cases', value: triages.filter(t => t.triageCategory === 'URGENT').length, icon: Clock, color: 'from-orange-500 to-orange-600' },
            { label: 'Stable Cases', value: triages.filter(t => t.overallStatus === 'STABLE').length, icon: CheckCircle, color: 'from-green-500 to-green-600' }
          ].map((stat, index) => (
            <div key={index} className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Table */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden transform hover:scale-[1.01] transition-all duration-300">
          {isLoading ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center gap-3 text-gray-600">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-lg">Loading triage records...</span>
              </div>
            </div>
          ) : isError ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-12 h-12 text-red-600" />
              </div>
              <p className="text-xl text-red-600">Error: {error?.message || 'Failed to load triage records'}</p>
            </div>
          ) : sortedTriages.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-xl text-gray-600">No triage records found</p>
              <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <tr>
                      <th
                        className="px-6 py-4 text-left cursor-pointer hover:bg-gray-200/50 transition-all duration-300"
                        onClick={() => handleSort('patient.fullName')}
                      >
                        <div className="flex items-center gap-2 font-bold text-gray-700">
                          <User className="w-4 h-4" />
                          Patient
                          {sortField === 'patient.fullName' && (
                            <div className="animate-bounce">
                              {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4 text-blue-500" /> : <ChevronDown className="w-4 h-4 text-blue-500" />}
                            </div>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-6 py-4 text-left cursor-pointer hover:bg-gray-200/50 transition-all duration-300"
                        onClick={() => handleSort('triageCategory')}
                      >
                        <div className="flex items-center gap-2 font-bold text-gray-700">
                          <AlertTriangle className="w-4 h-4" />
                          Category
                          {sortField === 'triageCategory' && (
                            <div className="animate-bounce">
                              {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4 text-blue-500" /> : <ChevronDown className="w-4 h-4 text-blue-500" />}
                            </div>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-6 py-4 text-left cursor-pointer hover:bg-gray-200/50 transition-all duration-300"
                        onClick={() => handleSort('overallStatus')}
                      >
                        <div className="flex items-center gap-2 font-bold text-gray-700">
                          <Activity className="w-4 h-4" />
                          Status
                          {sortField === 'overallStatus' && (
                            <div className="animate-bounce">
                              {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4 text-blue-500" /> : <ChevronDown className="w-4 h-4 text-blue-500" />}
                            </div>
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left font-bold text-gray-700">
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4" />
                          Vital Signs
                        </div>
                      </th>
                      <th
                        className="px-6 py-4 text-left cursor-pointer hover:bg-gray-200/50 transition-all duration-300"
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className="flex items-center gap-2 font-bold text-gray-700">
                          <Clock className="w-4 h-4" />
                          Date
                          {sortField === 'createdAt' && (
                            <div className="animate-bounce">
                              {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4 text-blue-500" /> : <ChevronDown className="w-4 h-4 text-blue-500" />}
                            </div>
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left font-bold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTriages.map((triage, index) => (
                      <tr 
                        key={triage.id} 
                        className="border-b border-gray-100/50 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/30 transition-all duration-300 transform hover:scale-[1.01]"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                              {(triage.patient.firstName.charAt(0) + triage.patient.lastName.charAt(0)).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-gray-800">
                                {triage.patient.fullName || `${triage.patient.firstName} ${triage.patient.lastName}`}
                              </div>
                              {triage.gender && (
                                <div className="text-sm text-gray-500">{triage.gender.gender}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${getTriageCategoryStyles(triage.triageCategory)}`}>
                            {triage.triageCategory === 'URGENT' && <AlertTriangle className="w-4 h-4" />}
                            {triage.triageCategory}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${getStatusStyles(triage.overallStatus)}`}>
                            <CheckCircle className="w-4 h-4" />
                            {triage.overallStatus.replace('_', ' ')}
                          </span>
                          {triage.statusNote && (
                            <div className="text-sm text-gray-600 italic mt-2 bg-gray-50 rounded-lg p-2">{triage.statusNote}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                            <div className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-semibold ${getStatusStyles(triage.temperatureStatus)}`}>
                              <Thermometer className="w-3 h-3" />
                              {triage.temperature}°C
                            </div>
                            <div className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-semibold ${getStatusStyles(triage.bloodPressureStatus)}`}>
                              <Heart className="w-3 h-3" />
                              {triage.bloodPressure}
                            </div>
                            <div className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-semibold ${getStatusStyles(triage.pulseStatus)}`}>
                              <Activity className="w-3 h-3" />
                              {triage.pulse} BPM
                            </div>
                            <div className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-semibold ${getStatusStyles(triage.bloodOxygenStatus)}`}>
                              <Droplets className="w-3 h-3" />
                              {triage.bloodOxygenLevel}%
                            </div>
                            <div className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-semibold ${getStatusStyles(triage.respirationStatus)}`}>
                              <Wind className="w-3 h-3" />
                              {triage.respirationRate}/min
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">{formatDate(triage.createdAt)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => handleView(triage.id)}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg transform hover:scale-105"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Enhanced Pagination */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600 font-medium">
                    Showing <span className="font-bold text-blue-600">{(page - 1) * pageSize + 1}</span> to{' '}
                    <span className="font-bold text-blue-600">{Math.min(page * pageSize, sortedTriages.length)}</span> of{' '}
                    <span className="font-bold text-blue-600">{sortedTriages.length}</span> records
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-full hover:from-blue-600 hover:to-blue-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 shadow-lg transform hover:scale-105"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    
                    <div className="flex items-center gap-2">
                      {(() => {
                        const maxButtons = 5;
                        const half = Math.floor(maxButtons / 2);
                        let startPage = Math.max(1, page - half);
                        let endPage = Math.min(totalPages, startPage + maxButtons - 1);

                        if (endPage - startPage + 1 < maxButtons) {
                          startPage = Math.max(1, endPage - maxButtons + 1);
                        }

                        const pages = [];
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <button
                              key={i}
                              onClick={() => setPage(i)}
                              className={`w-10 h-10 rounded-full font-bold flex items-center justify-center transition-all duration-200 ${
                                page === i
                                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-110'
                                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                              }`}
                            >
                              {i}
                            </button>
                          );
                        }
                        return pages;
                      })()}
                    </div>
                    
                    <button
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-full hover:from-blue-600 hover:to-blue-600 disabled:from-gray-400 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 shadow-lg transform hover:scale-105"
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TriageList;