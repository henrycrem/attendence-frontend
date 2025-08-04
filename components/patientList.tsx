"use client";
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Search, User, Loader2, Filter, Download, MoreVertical, Eye, Edit, Calendar, MapPin, CreditCard, UserCheck, Activity, ArrowUpDown, Grid3X3, List } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { getPatients } from '../actions/triageActions';
import { useDebounce } from 'use-debounce';

interface PatientSummary {
  id: string;
  fullName?: string;
  patientNumber: string;
  gender?: { id: string; gender: string } | null;
  billingType?: { id: string; billingType: string } | null;
  county?: { id: string; countyName: string } | null;
  triage?: { id: string; triageCategory: string } | null;
}

interface PatientsListProps {
  initialData: {
    data: PatientSummary[];
    count: number;
    totalCount: number;
  };
  initialSearch: string;
}

const PatientsList: React.FC<PatientsListProps> = ({ initialData, initialSearch }) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    console.log('PatientsList: initialData received:', JSON.stringify(initialData, null, 2));
  }, [initialData]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['patients', debouncedSearchQuery],
    queryFn: () => getPatients({ search: debouncedSearchQuery, limit: 10, offset: 0 }),
    initialData: initialData,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    console.log('PatientsList: Patient IDs:', data.data.map((patient) => patient.id));
    console.log('PatientsList: useQuery data:', JSON.stringify(data, null, 2));
    if (error) {
      console.error('PatientsList: Query error:', error.message);
      toast.error(error.message || 'Failed to load patients');
    }
  }, [data, error]);

  const handlePatientClick = (patientId: string) => {
    console.log('PatientsList: Navigating to patient ID:', patientId);
    if (!patientId) {
      console.error('PatientsList: Invalid patient ID');
      toast.error('Invalid patient ID');
      return;
    }
    router.push(`/dashboard/patient/${patientId}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    const url = new URL(window.location.href);
    if (e.target.value) {
      url.searchParams.set('search', e.target.value);
    } else {
      url.searchParams.delete('search');
    }
    window.history.pushState({}, '', url.toString());
  };

  const handleSort = (key: string) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig?.key === key && prevConfig?.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getTriageColor = (category: string) => {
    switch (category?.toUpperCase()) {
      case 'URGENT':
        return 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-red-200';
      case 'MODERATE':
        return 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-yellow-200';
      case 'LOW':
        return 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-green-200';
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-gray-200';
    }
  };

  const togglePatientSelection = (patientId: string) => {
    setSelectedPatients(prev => 
      prev.includes(patientId) 
        ? prev.filter(id => id !== patientId)
        : [...prev, patientId]
    );
  };

  const PatientCard = ({ patient }: { patient: PatientSummary }) => (
    <div className="group bg-white rounded-2xl border border-gray-100 hover:border-blue-200 transition-all duration-300 hover:shadow-xl hover:shadow-blue-50 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg shadow-lg">
              {patient.fullName?.charAt(0).toUpperCase() || 'P'}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{patient.fullName || 'Unknown'}</h3>
              <p className="text-sm text-gray-500">ID: {patient.patientNumber}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {patient.triage && (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-lg ${getTriageColor(patient.triage.triageCategory)}`}>
                {patient.triage.triageCategory}
              </span>
            )}
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{patient.gender?.gender || 'N/A'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{patient.billingType?.billingType || 'N/A'}</span>
          </div>
          <div className="flex items-center space-x-2 col-span-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{patient.county?.countyName || 'N/A'}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <button 
            onClick={() => handlePatientClick(patient.id)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium">View Details</span>
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Edit className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Patient Management
                </h1>
                <p className="text-gray-600 mt-1">Manage and monitor patient records efficiently</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="bg-white rounded-xl px-4 py-2 shadow-sm border border-gray-200">
                <span className="text-sm text-gray-600">Total: </span>
                <span className="font-semibold text-gray-900">{data?.totalCount || 0}</span>
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                <Download className="w-4 h-4" />
                <span className="font-medium">Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search patients by name or ID..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-gray-700 font-medium">Filter</span>
            </button>
            
            <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
            <p className="text-gray-600 text-lg">Loading patients...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-red-600 text-lg">Failed to load patients</p>
          </div>
        ) : data.data.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg">No patients found</p>
            <p className="text-gray-500 mt-2">Try adjusting your search criteria</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.data.map((patient) => (
              <PatientCard key={patient.id} patient={patient} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <th className="text-left py-4 px-6">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPatients(data.data.map(p => p.id));
                          } else {
                            setSelectedPatients([]);
                          }
                        }}
                      />
                    </th>
                    <th className="text-left py-4 px-6">
                      <button 
                        onClick={() => handleSort('fullName')}
                        className="flex items-center space-x-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                      >
                        <span>Patient</span>
                        <ArrowUpDown className="w-4 h-4" />
                      </button>
                    </th>
                    <th className="text-left py-4 px-6">
                      <button 
                        onClick={() => handleSort('patientNumber')}
                        className="flex items-center space-x-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                      >
                        <span>Patient ID</span>
                        <ArrowUpDown className="w-4 h-4" />
                      </button>
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Details</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Health Status</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((patient, index) => (
                    <tr
                      key={patient.id}
                      className={`border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                      }`}
                    >
                      <td className="py-4 px-6">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          checked={selectedPatients.includes(patient.id)}
                          onChange={() => togglePatientSelection(patient.id)}
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-semibold shadow-md">
                            {patient.fullName?.charAt(0).toUpperCase() || 'P'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{patient.fullName || 'Unknown Patient'}</p>
                            <p className="text-sm text-gray-500">{patient.gender?.gender || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-mono text-sm bg-gray-100 px-3 py-1 rounded-lg">{patient.patientNumber}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <CreditCard className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{patient.billingType?.billingType || 'N/A'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{patient.county?.countyName || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {patient.triage ? (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-lg ${getTriageColor(patient.triage.triageCategory)}`}>
                            {patient.triage.triageCategory}
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                            Not Assessed
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handlePatientClick(patient.id)}
                            className="flex items-center space-x-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="text-sm font-medium">View</span>
                          </button>
                          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientsList;