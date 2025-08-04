"use client"

import React, { useState, useCallback } from "react"
import { Search, Users } from "lucide-react"
import { useDebounce } from "use-debounce"
import { toast, Toaster } from "react-hot-toast"
import { getPatients } from "apps/user-ui/src/actions/triageActions" 
import ModernFrontDeskBilling from "apps/user-ui/src/components/billTypeForm"

interface Patient {
  id: string
  fullName: string
  patientNumber: string
}

const FrontDeskPage = () => {
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300)
  const [isLoading, setIsLoading] = useState(false)

  const fetchPatients = useCallback(async () => {
    if (!debouncedSearchTerm.trim()) {
      setPatients([])
      return
    }

    setIsLoading(true)
    try {
      const response = await getPatients({ search: debouncedSearchTerm, limit: 10, offset: 0 })
      setPatients(response.data || [])
    } catch (error: any) {
      console.error("fetchPatients error:", error)
      toast.error(error.message || "Failed to load patients")
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearchTerm])

  React.useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient)
  }

  const clearSelection = () => {
    setSelectedPatient(null)
    setSearchTerm("")
    setPatients([])
  }

  const handleBillingSuccess = () => {
    toast.success("Billing details saved successfully!")
    // Optionally clear selection or navigate
    setTimeout(() => {
      clearSelection()
    }, 2000)
  }

  if (selectedPatient) {
    return (
      <ModernFrontDeskBilling patient={selectedPatient} onSuccess={handleBillingSuccess} onCancel={clearSelection} />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#fff",
            color: "#333",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            borderRadius: "12px",
          },
        }}
      />

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mx-auto mb-6 shadow-2xl transform hover:scale-105 transition-all duration-300">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Front Desk - Patient Billing
          </h1>
          <p className="text-gray-600 text-base max-w-2xl mx-auto">
            Search for a patient to configure their billing preferences for today's visit
          </p>
        </div>

        {/* Search Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute -top-2 -right-2 w-20 h-20 bg-white/10 rounded-full blur-lg"></div>
            <div className="relative">
              <h2 className="text-white text-xl font-semibold flex items-center">
                <Search className="w-6 h-6 mr-3" />
                Find Patient
              </h2>
            </div>
          </div>

          <div className="p-8">
            <div className="relative mb-6">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Search className="w-6 h-6 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by patient name or ID..."
                className="w-full pl-14 pr-12 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg transition-all duration-300 shadow-sm hover:shadow-md"
                style={{
                  boxShadow: "0 4px 6px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.1)",
                }}
              />
              {isLoading && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>

            {debouncedSearchTerm && (
              <div className="bg-gray-50 rounded-2xl border border-gray-200 shadow-inner max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium">Searching patients...</p>
                  </div>
                ) : patients.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {patients.map((patient) => (
                      <div
                        key={patient.id}
                        onClick={() => handleSelectPatient(patient)}
                        className="p-6 hover:bg-blue-50 cursor-pointer transition-all duration-200 transform hover:scale-[1.02] first:rounded-t-2xl last:rounded-b-2xl"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                            {patient.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{patient.fullName}</h3>
                            <p className="text-gray-600">ID: {patient.patientNumber}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No patients found matching "{debouncedSearchTerm}"</p>
                    <p className="text-gray-400 text-sm mt-2">Try searching with a different name or patient ID</p>
                  </div>
                )}
              </div>
            )}

            {!debouncedSearchTerm && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Start typing to search</h3>
                <p className="text-gray-500">Enter a patient's name or ID to begin</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FrontDeskPage
