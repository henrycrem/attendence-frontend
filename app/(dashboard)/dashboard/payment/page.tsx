'use client';

import { useEffect, useState } from 'react';
import ComprehensiveBillingForm from 'apps/user-ui/src/components/ComprehensiveBillingForm';
import { searchPatients } from 'apps/user-ui/src/actions/triageActions'; 
import toast from 'react-hot-toast';
import { useAuth } from 'apps/user-ui/src/contexts/AuthContext'; 
import { useSelector } from 'react-redux';
import type { RootState } from 'apps/user-ui/src/store'; 
import { Search, User, Phone, Mail, Calendar, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';

interface Patient {
  id: string;
  fullName: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  primaryPhone?: string;
  primaryEmail?: string;
  dateOfBirth?: string;
  address?: string;
  genderId?: string;
}

export default function BillingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  const { user, loading, error: authError, isAuthenticated } = useAuth();
  const isConnected = useSelector((state: RootState) => state.notifications.isConnected);

  // Live patient search using React Query
  const {
    data: searchResults,
    isLoading: isSearching,
    error: searchError,
  } = useQuery({
    queryKey: ['patients', debouncedSearchQuery],
    queryFn: async () => {
      if (!debouncedSearchQuery.trim()) return { patients: [], count: 0 };

      try {
        const result = await searchPatients(debouncedSearchQuery);
        return result;
      } catch (error: any) {
        toast.error(error.message || 'Failed to search patients');
        throw error;
      }
    },
    enabled: !!debouncedSearchQuery.trim() && isAuthenticated,
    staleTime: 30000, // 30 seconds
    retry: 1,
  });

  useEffect(() => {
    console.log('BillingPage: Auth status:', isAuthenticated);
    console.log('BillingPage: WebSocket connection status:', isConnected ? 'Connected' : 'Disconnected');
  }, [isAuthenticated, isConnected]);

  const handleSuccess = () => {
    toast.success('Insurance claim sent successfully!');
    setSelectedPatient(null);
    setSearchQuery('');
  };

  const handleError = (error: string) => {
    toast.error(error);
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <svg className="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-4V8m-3 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="mt-4 text-xl font-semibold text-gray-800">Authentication Required</h2>
            <p className="mt-2 text-gray-600">
              {authError || 'You need to be logged in to access this page. Please log in and try again.'}
            </p>
            <a
              href="/login"
              className="mt-6 inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Insurance Billing</h1>
          <p className="text-gray-600 mt-2">Manage patient bills and insurance claims</p>
        </div>

        {/* Patient Search Section */}
        <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Search className="w-5 h-5" />
              Patient Search
            </h2>
            <p className="text-sm text-gray-600 mt-1">Search for a patient to create an insurance claim</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, patient number, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-blue-500" />
              )}
            </div>

            {/* Search Results */}
            {debouncedSearchQuery && (
              <div className="space-y-3">
                {isSearching ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Searching patients...</p>
                  </div>
                ) : searchResults?.patients && searchResults.patients.length > 0 ? (
                  <>
                    <h3 className="font-medium text-gray-800 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Search Results ({searchResults.patients.length})
                    </h3>
                    <div className="grid gap-3 max-h-64 overflow-y-auto">
                      {searchResults.patients.map((patient: Patient) => (
                        <div
                          key={patient.id}
                          className="p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md hover:bg-gray-50 border-gray-200"
                          onClick={() => handlePatientSelect(patient)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                                {patient.fullName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{patient.fullName}</h4>
                                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                  <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {patient.patientNumber || 'No patient number'}
                                  </span>
                                  {patient.primaryPhone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="w-3 h-3" />
                                      {patient.primaryPhone}
                                    </span>
                                  )}
                                  {patient.primaryEmail && (
                                    <span className="flex items-center gap-1">
                                      <Mail className="w-3 h-3" />
                                      {patient.primaryEmail}
                                    </span>
                                  )}
                                </div>
                                {patient.dateOfBirth && (
                                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                    <Calendar className="w-3 h-3" />
                                    Born: {new Date(patient.dateOfBirth).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-blue-500">Click to select</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">No patients found matching "{debouncedSearchQuery}"</p>
                  </div>
                )}
              </div>
            )}

            {/* Selected Patient Display */}
            {selectedPatient && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-green-800 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Selected Patient
                    </h3>
                    <p className="text-green-700 mt-1">{selectedPatient.fullName}</p>
                    <p className="text-green-600 text-sm">ID: {selectedPatient.patientNumber}</p>
                  </div>
                  <button
                    onClick={() => setSelectedPatient(null)}
                    className="text-green-600 hover:text-green-800 text-sm underline"
                  >
                    Change Patient
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Billing Form */}
        {selectedPatient && (
          <ComprehensiveBillingForm
            patient={selectedPatient}
            visitId={`visit_${Date.now()}`}
            currentUserId={user?.id || 'unknown'}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        )}
      </div>
    </div>
  );
}