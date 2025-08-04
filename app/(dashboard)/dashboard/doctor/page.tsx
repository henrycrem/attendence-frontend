'use client';
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { User, Stethoscope, Search, Plus, Download, RefreshCw, Eye, ChevronUp, ChevronDown } from 'lucide-react';
import { getAllDoctors, searchDoctors } from 'apps/user-ui/src/actions/doctorActions';
import { toast, Toaster } from 'react-hot-toast';
import Link from 'next/link';

interface Doctor {
  id: string;
  title: string | null;
  firstName: string | null;
  lastName: string;
  middleName: string | null;
  emailWork: string | null;
  emailPersonal: string | null;
  mobilePrimary: string | null;
  mobileSecondary: string | null;
  entityId: string | null;
  ourDoctor: boolean | null;
  fullName: string | null;
  createdAt: string;
  updatedAt: string;
  entity?: {
    id: string;
    entityName: string;
  };
  specializations: string[];
}

const DoctorList: React.FC = () => {
  const router = useRouter();
  const [sortField, setSortField] = useState<keyof Doctor | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const [searchTerm, setSearchTerm] = useState('');
  const pageSize = 10;

  // Fetch doctors
  const { data: doctors = [], isLoading, isError, error, refetch } = useQuery<Doctor[], Error>({
    queryKey: ['allDoctors', searchTerm],
    queryFn: async () => {
      try {
        if (searchTerm.trim()) {
          return await searchDoctors(searchTerm);
        }
        return await getAllDoctors();
      } catch (err: any) {
        toast.error(err.message || 'Failed to fetch doctor records');
        throw err;
      }
    },
    retry: false,
  });

  // Filtered and sorted list
  const filteredTriages = useMemo(() => {
      return doctors.filter(doctor => {
        const patientName = doctor.fullName || `${doctor.firstName} ${doctor.lastName}`;
        const matchesSearch = 
          patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doctor.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doctor.emailWork?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
      });
    }, [doctors, searchTerm, ]);


     const sortedDoctors = useMemo(() => {
        if (!sortField) return filteredTriages;
    
        return [...filteredTriages].sort((a, b) => {
          let aValue: any;
          let bValue: any;
    
          if (sortField === 'fullName') {
            aValue = a.fullName || `${a.firstName} ${a.lastName}`;
            bValue = b.fullName || `${b.firstName} ${b.lastName}`;
          } else if (sortField === 'emailWork') {
            aValue = a.emailWork || a.emailPersonal;
            bValue = b.emailWork || b.emailPersonal;
          } else if (sortField === 'mobilePrimary') {
            aValue = a.mobilePrimary || a.mobileSecondary;
            bValue = b.mobilePrimary || b.mobileSecondary;
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



  const totalPages = Math.ceil(sortedDoctors.length / pageSize);
  const paginatedDoctors = sortedDoctors.slice((page - 1) * pageSize, page * pageSize);




  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getInitials = (doctor: Doctor) => {
    const firstInitial = doctor.firstName?.charAt(0)?.toUpperCase() || '';
    const lastInitial = doctor.lastName?.charAt(0)?.toUpperCase() || '';
    return firstInitial + lastInitial;
  };

  const handleAddDoctor = () => {
    router.push('/dashboard/doctor/new');
    toast.success('Redirecting to create new doctor...');
  };

  const handleRefresh = () => {
    refetch();
    toast.success('Refreshing doctor records...');
  };

  const handleView = (doctorId: string) => {
    toast.success(`Viewing doctor record ${doctorId}...`);
    router.push(`/dashboard/doctor/${doctorId}`);
  };

  const handleExport = () => {
    toast.success('Exporting doctor records...');
    const csv = [
      ['ID', 'Name', 'Work Email', 'Primary Phone', 'Specializations', 'Entity', 'Created At'],
      ...sortedDoctors.map(doctor => [
        doctor.id,
        doctor.fullName ?? 'N/A',
        doctor.emailWork ?? doctor.emailPersonal ?? 'N/A',
        doctor.mobilePrimary ?? doctor.mobileSecondary ?? 'N/A',
        doctor.specializations.join(', ') || 'None',
        doctor.entity?.entityName ?? 'N/A',
        formatDate(doctor.createdAt),
      ]),
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'doctor_records.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSort = (field: keyof Doctor) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header Section */}
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-8 transform hover:scale-105 transition-all duration-300">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 rounded-full shadow-2xl mb-6 animate-bounce">
            <Stethoscope className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            Doctor Management
          </h1>
          <p className="text-gray-600 text-lg mt-2">Manage healthcare professionals</p>
        </div>

        {/* Controls Section */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-6 mb-8 transform hover:scale-[1.02] transition-all duration-300">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search doctors, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/90 backdrop-blur border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-lg"
              />
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
                className="inline-flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold rounded-2xl hover:from-gray-600 hover:to-gray-700 disabled:opacity-70 transition-all duration-300 shadow-lg transform hover:scale-105"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <Link href="/dashboard/doctor/new" className="no-underline">
                <button
                  onClick={handleAddDoctor}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white font-semibold rounded-2xl hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700 transition-all duration-300 shadow-lg transform hover:scale-105 animate-pulse"
                >
                  <Plus className="w-5 h-5" />
                  Add New Doctor
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {isLoading ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center gap-3 text-gray-600">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-lg">Loading doctor records...</span>
              </div>
            </div>
          ) : isError ? (
            <div className="text-center py-20">
              <p className="text-xl text-red-600">Error: {error?.message || 'Failed to load doctor records'}</p>
              <button
                onClick={handleRefresh}
                className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : sortedDoctors.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-gray-600">
                {searchTerm ? 'No doctor records found matching your search' : 'No doctor records found'}
              </p>
              <p className="text-gray-500 mt-2">
                {searchTerm ? 'Try adjusting your search terms' : 'Start by adding a new doctor'}
              </p>
            </div>
          ) : (
            <>
              {/* Table */}
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <tr>
                    <th
                      className="px-6 py-4 text-left cursor-pointer hover:bg-gray-200/50 transition-all duration-300"
                      onClick={() => handleSort('fullName')}
                    >
                      <div className="flex items-center gap-2 font-bold text-gray-700">
                        <User className="w-4 h-4" />
                        Doctor Name
                        {sortField === 'fullName' && (
                          <div className="animate-bounce">
                            {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4 text-blue-500" /> : <ChevronDown className="w-4 h-4 text-blue-500" />}
                          </div>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-left cursor-pointer hover:bg-gray-200/50 transition-all duration-300"
                      onClick={() => handleSort('emailWork')}
                    >
                      <div className="flex items-center gap-2 font-bold text-gray-700">
                        Email
                        {sortField === 'emailWork' && (
                          <div className="animate-bounce">
                            {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4 text-blue-500" /> : <ChevronDown className="w-4 h-4 text-blue-500" />}
                          </div>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-left cursor-pointer hover:bg-gray-200/50 transition-all duration-300"
                      onClick={() => handleSort('mobilePrimary')}
                    >
                      <div className="flex items-center gap-2 font-bold text-gray-700">
                        Phone
                        {sortField === 'mobilePrimary' && (
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
                  {paginatedDoctors.map((doctor, index) => (
                    <tr
                      key={doctor.id}
                      className="border-b border-gray-100/50 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/30 transition-all duration-300"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                            {getInitials(doctor)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-800">{doctor.fullName ?? 'N/A'}</div>
                            <div className="text-sm text-gray-600">{doctor.entity?.entityName ?? 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{doctor.emailWork ?? doctor.emailPersonal ?? 'N/A'}</td>
                      <td className="px-6 py-4">{doctor.mobilePrimary ?? doctor.mobileSecondary ?? 'N/A'}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleView(doctor.id)}
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

              {/* Pagination */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600 font-medium">
                    Showing <span className="font-bold text-blue-600">{(page - 1) * pageSize + 1}</span> to{' '}
                    <span className="font-bold text-blue-600">{Math.min(page * pageSize, sortedDoctors.length)}</span> of{' '}
                    <span className="font-bold text-blue-600">{sortedDoctors.length}</span> records
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-full hover:from-blue-600 hover:to-blue-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 shadow-lg transform hover:scale-105"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </button>
                    <button
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-full hover:from-blue-600 hover:to-blue-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 shadow-lg transform hover:scale-105"
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
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

export default DoctorList;