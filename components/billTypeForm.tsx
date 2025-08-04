"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useDebounce } from "use-debounce"
import { toast, Toaster } from "react-hot-toast"
import { useWebSocket } from "../hooks/useWebSocket"
import { useSelector } from "react-redux"
import type { RootState } from "../store"
import {
  Search,
  DollarSign,
  Shield,
  Briefcase,
  Loader2,
  Send,
  CheckCircle,
  User,
  FileText,
  CreditCard,
  Building2,
  Edit3,
  AlertCircle,
  Clock,
  RefreshCw,
  History,
  Bell,
} from "lucide-react"
import {
  getBillingTypes,
  getAllInsurances,
  getAccountHoldersByPatient,
  getPatientTodayVisit,
  getPatientPreviousBilling,
  submitBillingDetails,
} from "../actions/billType"

interface BillingType {
  id: string
  billingType: string
}

interface Insurance {
  id: string
  name: string
  email: string
  phoneNumber?: string
  contactPerson?: string
}

interface AccountHolder {
  id: string
  accountHolderName: string
  isFallback?: boolean
}

interface Patient {
  id: string
  fullName: string
  patientNumber: string
}

interface PatientVisit {
  id: string
  visitCode: string
  entryDate: string
  patientId: string
  billTypeId?: string
  billType?: BillingType
  insuranceId?: string
  insurance?: Insurance
  accountHolderId?: string
  accountHolder?: AccountHolder
}

interface PreviousBillingInfo {
  billType?: BillingType
  insurance?: Insurance
  accountHolder?: AccountHolder
  lastUsedDate?: string
}

interface ModernFrontDeskBillingProps {
  patient: Patient
  onSuccess?: () => void
  onCancel?: () => void
  // Add these props for WebSocket integration
  isAuthenticated?: boolean
  token?: string | null
}

const ModernFrontDeskBilling: React.FC<ModernFrontDeskBillingProps> = ({
  patient,
  onSuccess,
  onCancel,
  isAuthenticated = true,
  token = null,
}) => {
  const [selectedBillType, setSelectedBillType] = useState<BillingType | null>(null)
  const [selectedInsurance, setSelectedInsurance] = useState<Insurance | null>(null)
  const [insuranceSearchQuery, setInsuranceSearchQuery] = useState("")
  const [debouncedInsuranceSearch] = useDebounce(insuranceSearchQuery, 300)
  const [selectedAccountHolder, setSelectedAccountHolder] = useState<AccountHolder | null>(null)
  const [accountHolderSearchQuery, setAccountHolderSearchQuery] = useState("")
  const [debouncedAccountHolderSearch] = useDebounce(accountHolderSearchQuery, 300)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [patientVisit, setPatientVisit] = useState<PatientVisit | null>(null)
  const [previousBilling, setPreviousBilling] = useState<PreviousBillingInfo | null>(null)
  const [showPreviousBilling, setShowPreviousBilling] = useState(false)
  const [showInsuranceDropdown, setShowInsuranceDropdown] = useState(false)
  const [showAccountHolderDropdown, setShowAccountHolderDropdown] = useState(false)

  // WebSocket integration for receiving notifications
  const socket = useWebSocket(isAuthenticated, token)
  const { isConnected } = useSelector((state: RootState) => state.notifications)

  // Normalize billing type string - preserve exact format for comparison but normalize for logic
  const normalizeBillingType = (billingType: string | undefined) => {
    if (!billingType) return ""
    return billingType.trim().toLowerCase()
  }

  // Check if billing type is account holder - handle exact database format
  const isAccountHolderBillingType = (billingType: string | undefined) => {
    const normalized = normalizeBillingType(billingType)
    return normalized === "account holder"
  }

  // Check if billing type is insurance - handle exact database format
  const isInsuranceBillingType = (billingType: string | undefined) => {
    const normalized = normalizeBillingType(billingType)
    return normalized === "insurance"
  }

  // Check if billing type is cash - handle exact database format
  const isCashBillingType = (billingType: string | undefined) => {
    const normalized = normalizeBillingType(billingType)
    return normalized === "cash"
  }

  const {
    data: visitData,
    isLoading: isLoadingVisit,
    error: visitError,
  } = useQuery({
    queryKey: ["patientVisit", patient.id],
    queryFn: () => getPatientTodayVisit(patient.id),
    staleTime: 2 * 60 * 1000,
    retry: 3,
  })

  const { data: previousBillingData } = useQuery({
    queryKey: ["previousBilling", patient.id],
    queryFn: () => getPatientPreviousBilling(patient.id),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  useEffect(() => {
    if (visitData) {
      console.log("Visit data loaded:", visitData)
      setPatientVisit(visitData)
    }
  }, [visitData])

  useEffect(() => {
    if (previousBillingData) {
      console.log("Previous billing data loaded:", previousBillingData)
      setPreviousBilling(previousBillingData)
      setShowPreviousBilling(true)
    }
  }, [previousBillingData])

  const {
    data: billingTypes,
    isLoading: isLoadingBillingTypes,
    error: billingTypesError,
  } = useQuery({
    queryKey: ["billingTypes"],
    queryFn: async () => {
      const response = await getBillingTypes()
      console.log("Billing types fetched:", response)
      return response.data.map((bt: BillingType) => ({
        ...bt,
        billingType: bt.billingType.trim(),
      }))
    },
    staleTime: 5 * 60 * 1000,
  })

  const {
    data: allInsurances,
    isLoading: isLoadingInsurances,
    error: insurancesError,
  } = useQuery({
    queryKey: ["insurances", patient.id],
    queryFn: async () => {
      const response = await getAllInsurances()
      console.log("Insurances fetched:", response)
      return response.data
    },
    staleTime: 5 * 60 * 1000,
    enabled: isInsuranceBillingType(selectedBillType?.billingType),
  })

  const {
    data: accountHolders,
    isLoading: isLoadingAccountHolders,
    error: accountHoldersError,
  } = useQuery({
    queryKey: ["accountHolders", patient.id],
    queryFn: async () => {
      console.log("Fetching account holders for patient:", patient.id)
      const response = await getAccountHoldersByPatient(patient.id)
      console.log("Account holders fetched:", response)
      return response.data
    },
    staleTime: 5 * 60 * 1000,
    enabled: isAccountHolderBillingType(selectedBillType?.billingType),
  })

  // Debug logging
  useEffect(() => {
    console.log("=== DEBUG INFO ===")
    console.log("Selected bill type:", selectedBillType)
    console.log("Selected bill type normalized:", normalizeBillingType(selectedBillType?.billingType))
    console.log("Is account holder type:", isAccountHolderBillingType(selectedBillType?.billingType))
    console.log("Is insurance type:", isInsuranceBillingType(selectedBillType?.billingType))
    console.log("Show insurance dropdown:", showInsuranceDropdown)
    console.log("Show account holder dropdown:", showAccountHolderDropdown)
    console.log("Account holders data:", accountHolders)
    console.log("Account holders loading:", isLoadingAccountHolders)
    console.log("Account holders error:", accountHoldersError)
    console.log("==================")
  }, [
    selectedBillType,
    showInsuranceDropdown,
    showAccountHolderDropdown,
    accountHolders,
    isLoadingAccountHolders,
    accountHoldersError,
  ])

  const filteredInsurances =
    allInsurances?.filter(
      (insurance) =>
        !debouncedInsuranceSearch ||
        insurance.name.toLowerCase().includes(debouncedInsuranceSearch.toLowerCase()) ||
        insurance.email.toLowerCase().includes(debouncedInsuranceSearch.toLowerCase()),
    ) || []

  const filteredAccountHolders =
    accountHolders?.filter(
      (accountHolder) =>
        !debouncedAccountHolderSearch ||
        accountHolder.accountHolderName.toLowerCase().includes(debouncedAccountHolderSearch.toLowerCase()),
    ) || []

  const getBillTypeStyles = (billingType: string) => {
    const normalized = normalizeBillingType(billingType)
    switch (normalized) {
      case "cash":
      case "individual":
        return {
          icon: DollarSign,
          color: "emerald",
          gradient: "from-emerald-400 to-emerald-600",
          bgGradient: "from-emerald-50 to-emerald-100",
          description: "Patient pays directly",
        }
      case "insurance":
        return {
          icon: Shield,
          color: "blue",
          gradient: "from-blue-400 to-blue-600",
          bgGradient: "from-blue-50 to-blue-100",
          description: "Insurance company coverage",
        }
      case "accountholder":
      case "account holder":
        return {
          icon: Briefcase,
          color: "purple",
          gradient: "from-purple-400 to-purple-600",
          bgGradient: "from-purple-50 to-purple-100",
          description: "Corporate account billing",
        }
      default:
        console.warn("Unknown billing type:", billingType, "normalized:", normalized)
        return {
          icon: DollarSign,
          color: "gray",
          gradient: "from-gray-400 to-gray-600",
          bgGradient: "from-gray-50 to-gray-100",
          description: "Standard billing",
        }
    }
  }

  const handleBillTypeSelect = (billType: BillingType) => {
    console.log("handleBillTypeSelect called with:", billType)

    // Keep the original billing type format from database
    setSelectedBillType(billType)

    // Reset selections
    setSelectedInsurance(null)
    setSelectedAccountHolder(null)
    setInsuranceSearchQuery("")
    setAccountHolderSearchQuery("")

    // Determine which dropdown to show using normalized comparison
    const isInsurance = isInsuranceBillingType(billType.billingType)
    const isAccountHolder = isAccountHolderBillingType(billType.billingType)

    console.log("Setting dropdown states:", { isInsurance, isAccountHolder })

    setShowInsuranceDropdown(isInsurance)
    setShowAccountHolderDropdown(isAccountHolder)
  }

  // ✅ SIMPLIFIED: No more separate notification logic!
  const handleInsuranceSelect = (insurance: Insurance) => {
    setSelectedInsurance(insurance)
    setShowInsuranceDropdown(false)

    // 🎉 The enhanced controller will handle notifications automatically when form is submitted!
    console.log("Insurance selected:", insurance.name, "- notification will be sent automatically on submit")
  }

  const handleAccountHolderSelect = (accountHolder: AccountHolder) => {
    setSelectedAccountHolder(accountHolder)
    setShowAccountHolderDropdown(false)
  }

  const handleUsePreviousBilling = () => {
    if (!previousBilling?.billType) return

    const normalizedBillType = {
      ...previousBilling.billType,
      billingType: previousBilling.billType.billingType.trim(),
    }
    setSelectedBillType(normalizedBillType)

    if (isInsuranceBillingType(previousBilling.billType.billingType) && previousBilling.insurance) {
      setSelectedInsurance(previousBilling.insurance)
      setShowInsuranceDropdown(false)
    }

    if (isAccountHolderBillingType(previousBilling.billType.billingType) && previousBilling.accountHolder) {
      setSelectedAccountHolder(previousBilling.accountHolder)
      setShowAccountHolderDropdown(false)
    }

    setShowPreviousBilling(false)
    toast.success("Previous billing preferences applied!")
  }

  // ✅ SIMPLIFIED: Just submit - controller handles everything!
  const handleSubmit = async () => {
    if (!selectedBillType) {
      toast.error("Please select a billing type")
      return
    }

    if (!patientVisit) {
      toast.error("No visit found for today. Please ensure the patient has checked in.")
      return
    }

    if (isInsuranceBillingType(selectedBillType.billingType) && !selectedInsurance) {
      toast.error("Please select an insurance company")
      return
    }

    if (isAccountHolderBillingType(selectedBillType.billingType) && !selectedAccountHolder) {
      toast.error("Please select an account holder")
      return
    }

    setIsSubmitting(true)

    try {
      const submitData = {
        visitCode: patientVisit.visitCode,
        patientId: patient.id,
        billTypeId: selectedBillType.id,
        insuranceId: isInsuranceBillingType(selectedBillType.billingType) ? selectedInsurance?.id : undefined,
        accountHolderId: isAccountHolderBillingType(selectedBillType.billingType)
          ? selectedAccountHolder?.id
          : undefined,
      }

      console.log("Submitting billing data:", submitData)

      // 🎯 ENHANCED: Controller now handles notifications automatically!
      const response = await submitBillingDetails(submitData)

      // 🎉 Show success message with notification status
      if (selectedInsurance && isInsuranceBillingType(selectedBillType.billingType)) {
        toast.success(`Billing saved! ${selectedInsurance.name} has been notified automatically.`, {
          icon: <Bell className="w-4 h-4" />,
          duration: 5000,
        })
      } else {
        toast.success("Billing details saved successfully!")
      }

      onSuccess?.()
    } catch (error: any) {
      console.error("Billing submission error:", {
        message: error.message,
        data: error.response?.data,
      })
      toast.error(error.response?.data?.message || "Failed to save billing details")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingVisit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-gray-700 font-medium">Loading patient visit information...</span>
        </div>
      </div>
    )
  }

  if (visitError || !patientVisit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Visit Issue</h3>
          <p className="text-gray-600 mb-6">
            {visitError
              ? `Error loading visit: ${visitError.message}`
              : `No visit record found for ${patient.fullName}. Please ensure the patient has checked in.`}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors font-medium flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
            <button
              onClick={() => onCancel?.()}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
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
        {/* Header with WebSocket Status */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl mx-auto mb-4 shadow-lg">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Patient Billing Setup
          </h1>
          <p className="text-gray-600 text-sm max-w-xl mx-auto">
            Configure how the patient will pay for their medical services today
          </p>

          {/* WebSocket Connection Status */}
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
            <span className={`text-xs ${isConnected ? "text-green-600" : "text-red-600"}`}>
              {isConnected ? "Real-time notifications active" : "Notifications offline"}
            </span>
          </div>
        </div>

        {/* Patient & Visit Info Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-4">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">{patient.fullName}</h3>
                  <p className="text-indigo-100 text-sm">{patient.patientNumber}</p>
                </div>
              </div>
              <div className="text-right bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-3 h-3" />
                  <span className="text-xs">Visit Code</span>
                </div>
                <p className="font-semibold text-sm">{patientVisit.visitCode}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Messages */}
        {billingTypesError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">Error loading billing types: {billingTypesError.message}</p>
          </div>
        )}
        {insurancesError && isInsuranceBillingType(selectedBillType?.billingType) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">Error loading insurances: {insurancesError.message}</p>
          </div>
        )}
        {accountHoldersError && isAccountHolderBillingType(selectedBillType?.billingType) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">Error loading account holders: {accountHoldersError.message}</p>
          </div>
        )}

        {/* Previous Billing Preferences */}
        {showPreviousBilling && previousBilling?.billType && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative">
                <h2 className="text-white text-xl font-semibold flex items-center">
                  <History className="w-6 h-6 mr-3" />
                  Previous Billing Preference Found
                </h2>
              </div>
            </div>

            <div className="p-8">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200 shadow-lg mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-100 rounded-xl">
                      <Clock className="w-8 h-8 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-amber-900 mb-1">
                        Last used: {previousBilling.billType.billingType}
                      </h4>
                      {previousBilling.insurance && (
                        <p className="text-amber-700">Insurance: {previousBilling.insurance.name}</p>
                      )}
                      {previousBilling.accountHolder && (
                        <p className="text-amber-700">Account: {previousBilling.accountHolder.accountHolderName}</p>
                      )}
                      {previousBilling.lastUsedDate && (
                        <p className="text-amber-600 text-sm">
                          Last used: {new Date(previousBilling.lastUsedDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleUsePreviousBilling}
                      className="px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors font-medium flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Use Same
                    </button>
                    <button
                      onClick={() => setShowPreviousBilling(false)}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                    >
                      Choose Different
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Billing Type Selection */}
        {!showPreviousBilling && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative">
                <h2 className="text-white text-xl font-semibold flex items-center">
                  <DollarSign className="w-6 h-6 mr-3" />
                  How will the patient pay today?
                </h2>
              </div>
            </div>

            <div className="p-8">
              {isLoadingBillingTypes ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {billingTypes?.map((billType) => {
                    const { icon: Icon, gradient, bgGradient, description } = getBillTypeStyles(billType.billingType)
                    const isSelected = selectedBillType?.id === billType.id

                    return (
                      <div
                        key={billType.id}
                        className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${
                          isSelected
                            ? "border-transparent shadow-lg scale-102"
                            : "border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md"
                        }`}
                        style={{
                          background: isSelected ? `linear-gradient(135deg, #3b82f6, #8b5cf6)` : `white`,
                        }}
                        onClick={() => handleBillTypeSelect(billType)}
                      >
                        <div className="text-center">
                          <div
                            className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3 ${
                              isSelected ? "bg-white/20 backdrop-blur-sm" : "bg-gray-100"
                            }`}
                          >
                            <Icon className={`w-5 h-5 ${isSelected ? "text-white" : "text-gray-600"}`} />
                          </div>
                          <h4 className={`text-sm font-semibold mb-1 ${isSelected ? "text-white" : "text-gray-900"}`}>
                            {billType.billingType}
                          </h4>
                          <p className={`text-xs ${isSelected ? "text-white/80" : "text-gray-600"}`}>{description}</p>
                        </div>
                        {isSelected && (
                          <div className="absolute top-3 right-3">
                            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Insurance Selection Section - Add notification indicator */}
              {isInsuranceBillingType(selectedBillType?.billingType) && (
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
                  <h3 className="text-base font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Select Insurance Company
                    {selectedInsurance && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
                        <Bell className="w-3 h-3" />
                        Will be notified automatically
                      </span>
                    )}
                  </h3>

                  {!selectedInsurance ? (
                    <div className="space-y-4">
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                          <Search className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          placeholder="Search insurance companies..."
                          value={insuranceSearchQuery}
                          onChange={(e) => {
                            setInsuranceSearchQuery(e.target.value)
                            setShowInsuranceDropdown(true)
                          }}
                          onFocus={() => setShowInsuranceDropdown(true)}
                          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                        {isLoadingInsurances && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                          </div>
                        )}
                      </div>

                      {showInsuranceDropdown && (
                        <div className="relative">
                          <div className="absolute top-0 left-0 right-0 w-full z-50 max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-lg">
                            {isLoadingInsurances ? (
                              <div className="p-6 text-center">
                                <Loader2 className="w-6 h-4 animate-spin text-blue-500 mx-auto mb-2" />
                                <p className="text-gray-400 text-sm">Loading...</p>
                              </div>
                            ) : filteredInsurances.length > 0 ? (
                              filteredInsurances.map((insurance) => (
                                <div
                                  key={insurance.id}
                                  className="p-4 hover:bg-gray-50 cursor-pointer border-b border-b-gray-100 last:border-none"
                                  onClick={() => handleInsuranceSelect(insurance)}
                                >
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 rounded-full bg-blue-100">
                                        <Building2 className="w-4 h-4 text-blue-600" />
                                      </div>
                                      <div>
                                        <h4 className="font-medium text-gray-900 text-sm">{insurance.name}</h4>
                                        <p className="text-gray-500 text-xs">{insurance.email}</p>
                                        {insurance.contactPerson && (
                                          <p className="text-gray-400 text-xs">Contact: {insurance.contactPerson}</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-5 text-center">
                                <p className="text-gray-400 text-sm">No insurance companies found.</p>
                              </div>
                            )}
                          </div>
                          <div className="fixed inset-0 z-40" onClick={() => setShowInsuranceDropdown(false)}></div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Building2 className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-blue-900">{selectedInsurance.name}</h4>
                            <p className="text-blue-600 text-xs">{selectedInsurance.email}</p>
                            {selectedInsurance.contactPerson && (
                              <p className="text-blue-500 text-xs">Contact: {selectedInsurance.contactPerson}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedInsurance(null)
                            setInsuranceSearchQuery("")
                            setShowInsuranceDropdown(true)
                          }}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Account Holder Selection */}
              {isAccountHolderBillingType(selectedBillType?.billingType) && (
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
                  <h3 className="text-base font-semibold text-purple-900 mb-4 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Select Account Holder
                    <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full ml-2">
                      {isLoadingAccountHolders ? "Loading..." : `${filteredAccountHolders.length} found`}
                    </span>
                  </h3>

                  {!selectedAccountHolder ? (
                    <div className="space-y-4">
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                          <Search className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          placeholder="Search account holders..."
                          value={accountHolderSearchQuery}
                          onChange={(e) => {
                            setAccountHolderSearchQuery(e.target.value)
                            setShowAccountHolderDropdown(true)
                          }}
                          onFocus={() => setShowAccountHolderDropdown(true)}
                          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                        />
                        {isLoadingAccountHolders && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                          </div>
                        )}
                      </div>

                      {showAccountHolderDropdown && (
                        <div className="relative">
                          <div className="absolute top-0 left-0 right-0 w-full z-50 max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-lg">
                            {isLoadingAccountHolders ? (
                              <div className="p-6 text-center">
                                <Loader2 className="w-6 h-6 animate-spin text-purple-600 mx-auto mb-2" />
                                <p className="text-gray-500 text-sm">Loading account holders...</p>
                              </div>
                            ) : filteredAccountHolders.length > 0 ? (
                              filteredAccountHolders.map((accountHolder) => (
                                <div
                                  key={accountHolder.id}
                                  className="p-3 hover:bg-purple-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                                  onClick={() => handleAccountHolderSelect(accountHolder)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                      <Briefcase className="w-3 h-3 text-purple-600" />
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-gray-900 text-sm">
                                        {accountHolder.accountHolderName}
                                      </h4>
                                      {accountHolder.isFallback && (
                                        <p className="text-gray-500 text-xs">Fallback name used</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-6 text-center text-gray-500 text-sm">
                                {accountHolders && accountHolders.length === 0 ? (
                                  <>
                                    <p className="mb-2">No account holders found for this patient.</p>
                                    <button
                                      onClick={() => {
                                        toast.info(
                                          "Please contact your administrator to link an account holder to this patient.",
                                        )
                                      }}
                                      className="text-purple-600 hover:underline text-xs"
                                    >
                                      Need help? Contact admin
                                    </button>
                                  </>
                                ) : (
                                  "No matching account holders found."
                                )}
                              </div>
                            )}
                          </div>
                          <div className="fixed inset-0 z-40" onClick={() => setShowAccountHolderDropdown(false)}></div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Briefcase className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-purple-900">
                              {selectedAccountHolder.accountHolderName}
                            </h4>
                            {selectedAccountHolder.isFallback && (
                              <p className="text-purple-600 text-xs">Fallback name used</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedAccountHolder(null)
                            setAccountHolderSearchQuery("")
                            setShowAccountHolderDropdown(true)
                          }}
                          className="p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-full transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-end pt-6 border-t border-gray-100">
                <button
                  onClick={() => onCancel?.()}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium border border-gray-200 hover:border-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={
                    !selectedBillType ||
                    isSubmitting ||
                    (isInsuranceBillingType(selectedBillType.billingType) && !selectedInsurance) ||
                    (isAccountHolderBillingType(selectedBillType.billingType) && !selectedAccountHolder)
                  }
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[160px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Save Billing Details
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ModernFrontDeskBilling
