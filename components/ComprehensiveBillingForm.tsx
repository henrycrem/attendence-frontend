"use client"

import { useState } from "react"
import { submitInsuranceClaim } from "../actions/bils"
import { getAllInsurances } from "../actions/insuranceActions"
import toast from "react-hot-toast"
import { useQuery } from "@tanstack/react-query"
import { useDebounce } from "use-debounce"
import {
  CreditCard,
  FileText,
  User,
  Shield,
  DollarSign,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Plus,
  Trash2,
  Send,
  Search,
  Building2,
  Loader2,
  Percent,
  Briefcase,
  Wallet,
  CheckCircle,
  X,
  Edit3,
  Receipt,
  Calculator,
  ArrowLeft,
  ArrowRight,
} from "lucide-react"

// Mock data for bill types, account holders (entities), and discounts
const MOCK_BILL_TYPES = [
  {
    id: "bt1",
    billingType: "Cash",
    description: "Direct cash payment",
    icon: DollarSign,
    color: "emerald",
    gradient: "from-emerald-400 to-emerald-600",
  },
  {
    id: "bt2",
    billingType: "Insurance",
    description: "Insurance coverage billing",
    icon: Shield,
    color: "blue",
    gradient: "from-blue-400 to-blue-600",
  },
  {
    id: "bt3",
    billingType: "AccountHolder",
    description: "Corporate account billing",
    icon: Briefcase,
    color: "purple",
    gradient: "from-purple-400 to-purple-600",
  },
]

const MOCK_ACCOUNT_HOLDERS = [
  { id: "ent1", entityName: "Acme Healthcare", abbr: "AH", partner: true },
  { id: "ent2", entityName: "Global Medical Group", abbr: "GMG", partner: false },
  { id: "ent3", entityName: "Liberia Wellness Corp", abbr: "LWC", partner: true },
]

const MOCK_DISCOUNTS = [
  { id: "disc1", title: "Senior Citizen Discount", discount: 15, type: "percentage", active: true },
  { id: "disc2", title: "Corporate Discount", discount: 10, type: "percentage", active: true },
  { id: "disc3", title: "Holiday Promo", discount: 25, type: "fixed", active: true },
  { id: "disc4", title: "Student Discount", discount: 20, type: "percentage", active: true },
]

const BILLING_CATEGORIES = [
  "Consultation",
  "Laboratory",
  "Imaging",
  "Medication",
  "Procedure",
  "Surgery",
  "Emergency",
  "Admission",
  "Other",
]

interface Patient {
  id: string
  fullName: string
  patientNumber: string
  firstName: string
  lastName: string
  middleName?: string
  primaryPhone?: string
  primaryEmail?: string
  dateOfBirth?: string
  address?: string
  genderId?: string
}

interface Insurance {
  id: string
  name: string
  email: string
  phoneNumber?: string
  address?: string
  contactPerson?: string
  contactPhone?: string
  contactEmail?: string
  companyLogo?: string
  status: string
  description?: string
}

interface BillItem {
  id: string
  description: string
  amount: number
  category: string
  quantity: number
  unitPrice: number
}

interface AccountHolder {
  id: string
  entityName: string
  abbr?: string
  partner: boolean
}

interface Discount {
  id: string
  title: string
  discount: number
  type: string
  active: boolean
}

interface BillType {
  id: string
  billingType: string
  description: string
  icon: any
  color: string
  gradient: string
}

interface ModernBillingFormProps {
  patient: Patient
  visitId: string
  currentUserId: string
  onSuccess: () => void
  onError: (error: string) => void
}

export default function ModernBillingForm({
  patient,
  visitId,
  currentUserId,
  onSuccess,
  onError,
}: ModernBillingFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedBillType, setSelectedBillType] = useState<BillType | null>(null)
  const [selectedInsurance, setSelectedInsurance] = useState<Insurance | null>(null)
  const [insuranceSearchQuery, setInsuranceSearchQuery] = useState("")
  const [debouncedInsuranceSearch] = useDebounce(insuranceSearchQuery, 300)
  const [policyNumber, setPolicyNumber] = useState("")
  const [selectedAccountHolder, setSelectedAccountHolder] = useState<AccountHolder | null>(null)
  const [accountHolderSearchQuery, setAccountHolderSearchQuery] = useState("")
  const [debouncedAccountHolderSearch] = useDebounce(accountHolderSearchQuery, 300)
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null)
  const [discountSearchQuery, setDiscountSearchQuery] = useState("")
  const [debouncedDiscountSearch] = useDebounce(discountSearchQuery, 300)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [billItems, setBillItems] = useState<BillItem[]>([
    {
      id: "1",
      description: "",
      amount: 0,
      category: "Consultation",
      quantity: 1,
      unitPrice: 0,
    },
  ])

  const [visitDetails, setVisitDetails] = useState({
    visitCode: `VIS-${Date.now()}`,
    entryDate: new Date().toISOString().split("T")[0],
    facility: "",
    doctorId: "",
    billingCategory: "OPD",
    billTypeId: "",
    coPay: 0,
    discount: 0,
    discountId: "",
    entityId: "",
    insurance: "",
    notes: "",
  })

  // Fetch all insurance companies
  const { data: allInsurances, isLoading: isLoadingInsurances } = useQuery({
    queryKey: ["insurances"],
    queryFn: getAllInsurances,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    enabled: selectedBillType?.billingType === "Insurance",
  })

  // Filter insurances based on search query
  const filteredInsurances =
    allInsurances?.filter(
      (insurance) =>
        insurance.name.toLowerCase().includes(debouncedInsuranceSearch.toLowerCase()) ||
        insurance.email.toLowerCase().includes(debouncedInsuranceSearch.toLowerCase()),
    ) || []

  // Filter account holders based on search query
  const filteredAccountHolders = MOCK_ACCOUNT_HOLDERS.filter(
    (accountHolder) =>
      accountHolder.entityName.toLowerCase().includes(debouncedAccountHolderSearch.toLowerCase()) ||
      (accountHolder.abbr || "").toLowerCase().includes(debouncedAccountHolderSearch.toLowerCase()),
  )

  // Filter discounts based on search query
  const filteredDiscounts = MOCK_DISCOUNTS.filter(
    (discount) => discount.title.toLowerCase().includes(debouncedDiscountSearch.toLowerCase()) && discount.active,
  )

  const addBillItem = () => {
    const newItem: BillItem = {
      id: Date.now().toString(),
      description: "",
      amount: 0,
      category: "Consultation",
      quantity: 1,
      unitPrice: 0,
    }
    setBillItems([...billItems, newItem])
  }

  const removeBillItem = (id: string) => {
    if (billItems.length > 1) {
      setBillItems(billItems.filter((item) => item.id !== id))
    }
  }

  const updateBillItem = (id: string, field: keyof BillItem, value: string | number) => {
    setBillItems(
      billItems.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }
          if (field === "quantity" || field === "unitPrice") {
            updatedItem.amount = updatedItem.quantity * updatedItem.unitPrice
          }
          return updatedItem
        }
        return item
      }),
    )
  }

  const handleBillTypeSelect = (billType: BillType) => {
    setSelectedBillType(billType)
    setSelectedInsurance(null)
    setSelectedAccountHolder(null)
    setSelectedDiscount(null)
    setPolicyNumber("")
    setVisitDetails({
      ...visitDetails,
      billTypeId: billType.billingType.toLowerCase(),
      entityId: "",
      insurance: "",
      discountId: "",
      discount: 0,
      coPay: 0,
    })
  }

  const handleAccountHolderSelect = (accountHolder: AccountHolder) => {
    setSelectedAccountHolder(accountHolder)
    setAccountHolderSearchQuery("")
    setVisitDetails({ ...visitDetails, entityId: accountHolder.id })
  }

  const handleDiscountSelect = (discount: Discount) => {
    setSelectedDiscount(discount)
    setDiscountSearchQuery("")
    setVisitDetails({
      ...visitDetails,
      discountId: discount.id,
      discount: discount.type === "percentage" ? discount.discount : 0,
    })
  }

  const handleInsuranceSelect = (insurance: Insurance) => {
    setSelectedInsurance(insurance)
    setInsuranceSearchQuery("")
    setVisitDetails({ ...visitDetails, insurance: insurance.name })
  }

  // Calculation functions
  const totalAmount = billItems.reduce((sum, item) => sum + item.amount, 0)
  const discountAmount =
    selectedDiscount?.type === "percentage"
      ? (totalAmount * selectedDiscount.discount) / 100
      : selectedDiscount?.discount || 0
  const finalAmount = totalAmount - discountAmount + visitDetails.coPay

  // Step navigation
  const steps = [
    { id: 1, name: "Bill Type", icon: Wallet },
    { id: 2, name: "Details", icon: FileText },
    { id: 3, name: "Items", icon: Receipt },
    { id: 4, name: "Review", icon: CheckCircle },
  ]

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return selectedBillType !== null
      case 2:
        if (selectedBillType?.billingType === "Insurance") {
          return selectedInsurance && policyNumber.trim()
        }
        if (selectedBillType?.billingType === "AccountHolder") {
          return selectedAccountHolder !== null
        }
        return true
      case 3:
        return billItems.every((item) => item.description && item.amount > 0)
      default:
        return true
    }
  }

  const nextStep = () => {
    if (currentStep < 4 && canProceedToNextStep()) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!selectedBillType) {
      toast.error("Please select a bill type")
      return
    }

    if (selectedBillType.billingType === "Insurance") {
      if (!selectedInsurance) {
        toast.error("Please select an insurance company")
        return
      }
      if (!policyNumber.trim()) {
        toast.error("Please enter the patient's policy number")
        return
      }
    }

    if (selectedBillType.billingType === "AccountHolder" && !selectedAccountHolder) {
      toast.error("Please select an account holder")
      return
    }

    if (billItems.some((item) => !item.description || item.amount <= 0)) {
      toast.error("Please fill in all bill items with valid amounts")
      return
    }

    setIsSubmitting(true)

    try {
      const claimData = {
        patientId: patient.id,
        insuranceId: selectedInsurance?.id || "",
        policyNumber: policyNumber.trim(),
        visitId,
        visitCode: visitDetails.visitCode,
        billItems: billItems.map((item) => ({
          description: item.description,
          amount: item.amount,
          category: item.category,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        totalAmount: finalAmount,
        consultationFee: totalAmount,
        discountedAmount: finalAmount - visitDetails.coPay,
        billingCategory: visitDetails.billingCategory,
        userId: currentUserId,
        visitDetails: {
          ...visitDetails,
          totalAmount: finalAmount,
          discountAmount,
          entityId: selectedAccountHolder?.id || "",
          discountId: selectedDiscount?.id || "",
          billTypeId: selectedBillType.billingType.toLowerCase(),
        },
      }

      const result = await submitInsuranceClaim(claimData)

      if (result.success) {
        toast.success("Claim submitted successfully!")
        onSuccess()
      } else {
        toast.error(result.error || "Failed to submit claim")
        onError(result.error || "Failed to submit claim")
      }
    } catch (error: any) {
      console.error("Error submitting claim:", error)
      toast.error(error.message || "Failed to submit claim")
      onError(error.message || "Failed to submit claim")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 3D Header Card */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transform hover:scale-[1.01] transition-all duration-300">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
              <div className="relative flex items-center justify-between text-white">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold mb-2">Patient Billing System</h1>
                    <p className="text-blue-100 text-sm">Advanced billing management for {patient.fullName}</p>
                  </div>
                </div>
                <div className="text-right bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-blue-100 text-sm">Patient ID</p>
                  <p className="font-bold text-xl">{patient.patientNumber}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3D Progress Steps */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const StepIcon = step.icon
                const isActive = currentStep === step.id
                const isCompleted = currentStep > step.id

                return (
                  <div key={step.id} className="flex items-center">
                    <div className="flex items-center">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 transform ${
                          isCompleted
                            ? "bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg scale-110"
                            : isActive
                              ? "bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg scale-110"
                              : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                        }`}
                        style={{
                          boxShadow:
                            isActive || isCompleted
                              ? "0 10px 25px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)"
                              : "0 4px 6px rgba(0,0,0,0.1)",
                        }}
                      >
                        {isCompleted ? <CheckCircle className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                      </div>
                      <div className="ml-4">
                        <p className={`text-sm font-semibold ${isActive ? "text-blue-600" : "text-gray-600"}`}>
                          {step.name}
                        </p>
                        <p className="text-xs text-gray-500">Step {step.id}</p>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="mx-8 flex-1 h-1 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            currentStep > step.id ? "bg-gradient-to-r from-green-400 to-green-600 w-full" : "w-0"
                          }`}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="xl:col-span-3 space-y-8">
            {/* 3D Patient Information Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden transform hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute -top-2 -right-2 w-20 h-20 bg-white/10 rounded-full blur-lg"></div>
                <div className="relative flex items-center gap-6 text-white">
                  <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1">{patient.fullName}</h3>
                    <p className="text-indigo-100 text-sm">{patient.patientNumber}</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {patient.primaryPhone && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Phone className="w-3 h-3 text-blue-600" />
                      </div>
                      <span className="text-gray-700 font-medium">{patient.primaryPhone}</span>
                    </div>
                  )}
                  {patient.primaryEmail && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Mail className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-gray-700 font-medium">{patient.primaryEmail}</span>
                    </div>
                  )}
                  {patient.dateOfBirth && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Calendar className="w-3 h-3 text-purple-600" />
                      </div>
                      <span className="text-gray-700 font-medium">
                        {new Date(patient.dateOfBirth).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {patient.address && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl md:col-span-2 lg:col-span-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <MapPin className="w-3 h-3 text-orange-600" />
                      </div>
                      <span className="text-gray-700 font-medium">{patient.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Step Content */}
            {currentStep === 1 && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                <h3 className="text-lg font-bold text-gray-900 mb-8 flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Wallet className="w-4 h-4 text-blue-600" />
                  </div>
                  Select Billing Type
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {MOCK_BILL_TYPES.map((billType) => {
                    const Icon = billType.icon
                    const isSelected = selectedBillType?.id === billType.id

                    return (
                      <div
                        key={billType.id}
                        className={`relative p-8 border-2 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                          isSelected
                            ? "border-transparent shadow-2xl scale-105"
                            : "border-gray-200 hover:border-gray-300 shadow-lg hover:shadow-xl"
                        }`}
                        style={{
                          background: isSelected
                            ? `linear-gradient(135deg, ${billType.gradient.replace("from-", "").replace("to-", "").replace("-400", "").replace("-600", "")})`
                            : "white",
                          boxShadow: isSelected
                            ? "0 20px 40px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)"
                            : "0 10px 25px rgba(0,0,0,0.1)",
                        }}
                        onClick={() => handleBillTypeSelect(billType)}
                      >
                        <div className="text-center">
                          <div
                            className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
                              isSelected ? "bg-white/20 backdrop-blur-sm" : "bg-gray-100"
                            }`}
                          >
                            <Icon className={`w-5 h-5 ${isSelected ? "text-white" : "text-gray-600"}`} />
                          </div>
                          <h4 className={`text-base font-bold mb-2 ${isSelected ? "text-white" : "text-gray-900"}`}>
                            {billType.billingType}
                          </h4>
                          <p className={`text-sm ${isSelected ? "text-white/80" : "text-gray-600"}`}>
                            {billType.description}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="absolute top-4 right-4">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                              <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {currentStep === 2 && selectedBillType && (
              <div className="space-y-8">
                {/* Insurance Selection */}
                {selectedBillType.billingType === "Insurance" && (
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Shield className="w-4 h-4 text-blue-600" />
                      </div>
                      Insurance Details
                    </h3>

                    {!selectedInsurance ? (
                      <div className="space-y-6">
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                            <Search className="w-5 h-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            placeholder="Search insurance companies..."
                            value={insuranceSearchQuery}
                            onChange={(e) => setInsuranceSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            style={{
                              boxShadow: "0 4px 6px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.1)",
                            }}
                          />
                          {isLoadingInsurances && (
                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                            </div>
                          )}
                        </div>

                        {insuranceSearchQuery && (
                          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl bg-gray-50 shadow-inner">
                            {isLoadingInsurances ? (
                              <div className="p-8 text-center">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                                <p className="text-gray-500">Loading insurance companies...</p>
                              </div>
                            ) : filteredInsurances.length > 0 ? (
                              filteredInsurances.map((insurance) => (
                                <div
                                  key={insurance.id}
                                  className="p-4 hover:bg-blue-50 cursor-pointer border-b border-gray-200 last:border-b-0 transition-all duration-200 transform hover:scale-[1.02]"
                                  onClick={() => handleInsuranceSelect(insurance)}
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-100 rounded-xl">
                                      <Building2 className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-gray-900 text-sm">{insurance.name}</h4>
                                      <p className="text-gray-600">{insurance.email}</p>
                                      {insurance.contactPerson && (
                                        <p className="text-sm text-gray-500">Contact: {insurance.contactPerson}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-8 text-center text-gray-500">
                                No insurance companies found matching "{insuranceSearchQuery}"
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 shadow-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-blue-100 rounded-xl">
                                <Building2 className="w-8 h-8 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="text-base font-bold text-blue-900">{selectedInsurance.name}</h4>
                                <p className="text-blue-700">{selectedInsurance.email}</p>
                                {selectedInsurance.contactPerson && (
                                  <p className="text-blue-600 text-sm">Contact: {selectedInsurance.contactPerson}</p>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => setSelectedInsurance(null)}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Policy Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={policyNumber}
                            onChange={(e) => setPolicyNumber(e.target.value)}
                            placeholder="Enter patient's policy number"
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            style={{
                              boxShadow: "0 4px 6px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.1)",
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Account Holder Selection */}
                {selectedBillType.billingType === "AccountHolder" && (
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Briefcase className="w-4 h-4 text-purple-600" />
                      </div>
                      Account Holder
                    </h3>

                    {!selectedAccountHolder ? (
                      <div className="space-y-6">
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                            <Search className="w-5 h-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            placeholder="Search account holders..."
                            value={accountHolderSearchQuery}
                            onChange={(e) => setAccountHolderSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                            style={{
                              boxShadow: "0 4px 6px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.1)",
                            }}
                          />
                        </div>

                        {accountHolderSearchQuery && (
                          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl bg-gray-50 shadow-inner">
                            {filteredAccountHolders.length > 0 ? (
                              filteredAccountHolders.map((accountHolder) => (
                                <div
                                  key={accountHolder.id}
                                  className="p-4 hover:bg-purple-50 cursor-pointer border-b border-gray-200 last:border-b-0 transition-all duration-200 transform hover:scale-[1.02]"
                                  onClick={() => handleAccountHolderSelect(accountHolder)}
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="p-3 bg-purple-100 rounded-xl">
                                      <Briefcase className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-gray-900 text-sm">
                                        {accountHolder.entityName}
                                      </h4>
                                      <p className="text-gray-600">{accountHolder.abbr || "No abbreviation"}</p>
                                      <p className="text-sm text-gray-500">
                                        {accountHolder.partner ? "Partner Account" : "Non-Partner Account"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-8 text-center text-gray-500">
                                No account holders found matching "{accountHolderSearchQuery}"
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200 shadow-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-xl">
                              <Briefcase className="w-8 h-8 text-purple-600" />
                            </div>
                            <div>
                              <h4 className="text-base font-bold text-purple-900">
                                {selectedAccountHolder.entityName}
                              </h4>
                              <p className="text-purple-700">{selectedAccountHolder.abbr || "No abbreviation"}</p>
                              <p className="text-purple-600 text-sm">
                                {selectedAccountHolder.partner ? "Partner Account" : "Non-Partner Account"}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedAccountHolder(null)}
                            className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Visit Details */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <FileText className="w-4 h-4 text-gray-600" />
                    </div>
                    Visit Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Visit Code</label>
                      <input
                        type="text"
                        value={visitDetails.visitCode}
                        onChange={(e) => setVisitDetails({ ...visitDetails, visitCode: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        style={{
                          boxShadow: "0 4px 6px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.1)",
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Visit Date</label>
                      <input
                        type="date"
                        value={visitDetails.entryDate}
                        onChange={(e) => setVisitDetails({ ...visitDetails, entryDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        style={{
                          boxShadow: "0 4px 6px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.1)",
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Facility</label>
                      <input
                        type="text"
                        value={visitDetails.facility}
                        onChange={(e) => setVisitDetails({ ...visitDetails, facility: e.target.value })}
                        placeholder="Medical center name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        style={{
                          boxShadow: "0 4px 6px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.1)",
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                      <select
                        value={visitDetails.billingCategory}
                        onChange={(e) => setVisitDetails({ ...visitDetails, billingCategory: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        style={{
                          boxShadow: "0 4px 6px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.1)",
                        }}
                      >
                        <option value="OPD">Outpatient (OPD)</option>
                        <option value="IPD">Inpatient</option>
                        <option value="Emergency">Emergency</option>
                        <option value="Surgery">Surgery</option>
                      </select>
                    </div>
                    {selectedBillType.billingType === "Insurance" && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Co-Payment ($)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={visitDetails.coPay}
                          onChange={(e) => setVisitDetails({ ...visitDetails, coPay: Number(e.target.value) })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          style={{
                            boxShadow: "0 4px 6px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.1)",
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="mt-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                    <textarea
                      value={visitDetails.notes}
                      onChange={(e) => setVisitDetails({ ...visitDetails, notes: e.target.value })}
                      placeholder="Additional visit notes..."
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      style={{
                        boxShadow: "0 4px 6px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.1)",
                      }}
                    />
                  </div>
                </div>

                {/* Discount Selection */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Percent className="w-4 h-4 text-green-600" />
                    </div>
                    Apply Discount (Optional)
                  </h3>

                  {!selectedDiscount ? (
                    <div className="space-y-6">
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                          <Search className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          placeholder="Search available discounts..."
                          value={discountSearchQuery}
                          onChange={(e) => setDiscountSearchQuery(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                          style={{
                            boxShadow: "0 4px 6px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.1)",
                          }}
                        />
                      </div>

                      {discountSearchQuery && (
                        <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl bg-gray-50 shadow-inner">
                          {filteredDiscounts.length > 0 ? (
                            filteredDiscounts.map((discount) => (
                              <div
                                key={discount.id}
                                className="p-4 hover:bg-green-50 cursor-pointer border-b border-gray-200 last:border-b-0 transition-all duration-200 transform hover:scale-[1.02]"
                                onClick={() => handleDiscountSelect(discount)}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="p-3 bg-green-100 rounded-xl">
                                    <Percent className="w-6 h-6 text-green-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-900 text-lg">{discount.title}</h4>
                                    <p className="text-gray-600">
                                      {discount.discount}
                                      {discount.type === "percentage" ? "%" : "$"} off
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-8 text-center text-gray-500">
                              No active discounts found matching "{discountSearchQuery}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 shadow-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-green-100 rounded-xl">
                            <Percent className="w-8 h-8 text-green-600" />
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-green-900">{selectedDiscount.title}</h4>
                            <p className="text-green-700">
                              {selectedDiscount.discount}
                              {selectedDiscount.type === "percentage" ? "%" : "$"} discount
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedDiscount(null)}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Receipt className="w-4 h-4 text-gray-600" />
                    </div>
                    Bill Items
                  </h3>
                  <button
                    onClick={addBillItem}
                    className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    <Plus className="w-5 h-5" />
                    Add Item
                  </button>
                </div>

                <div className="space-y-6">
                  {billItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-6 border border-gray-200 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 shadow-lg"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-base font-bold text-gray-800">Item #{index + 1}</h4>
                        {billItems.length > 1 && (
                          <button
                            onClick={() => removeBillItem(item.id)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateBillItem(item.id, "description", e.target.value)}
                            placeholder="Service description"
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            style={{
                              boxShadow: "0 4px 6px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.1)",
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                          <select
                            value={item.category}
                            onChange={(e) => updateBillItem(item.id, "category", e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            style={{
                              boxShadow: "0 4px 6px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.1)",
                            }}
                          >
                            {BILLING_CATEGORIES.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateBillItem(item.id, "quantity", Number(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            style={{
                              boxShadow: "0 4px 6px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.1)",
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Unit Price ($)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateBillItem(item.id, "unitPrice", Number(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            style={{
                              boxShadow: "0 4px 6px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.1)",
                            }}
                          />
                        </div>
                        <div className="md:col-span-2 lg:col-span-4">
                          <div className="flex justify-between items-center pt-4 border-t border-gray-300">
                            <span className="text-lg text-gray-600">Item Total:</span>
                            <span className="text-lg font-bold text-gray-900">${item.amount.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-8">
                {/* Review Summary */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-8 flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    Review & Submit
                  </h3>

                  {/* Bill Type Summary */}
                  <div className="mb-8">
                    <h4 className="text-base font-semibold text-gray-800 mb-4">Billing Information</h4>
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 shadow-inner">
                      <div className="flex items-center gap-4 mb-4">
                        {selectedBillType && (
                          <>
                            <div className="p-3 bg-blue-100 rounded-xl">
                              <selectedBillType.icon className="w-6 h-6 text-blue-600" />
                            </div>
                            <span className="text-xl font-semibold">{selectedBillType.billingType}</span>
                          </>
                        )}
                      </div>
                      {selectedInsurance && (
                        <div className="text-gray-600 space-y-1">
                          <p>
                            <span className="font-semibold">Insurance:</span> {selectedInsurance.name}
                          </p>
                          <p>
                            <span className="font-semibold">Policy:</span> {policyNumber}
                          </p>
                        </div>
                      )}
                      {selectedAccountHolder && (
                        <div className="text-gray-600">
                          <p>
                            <span className="font-semibold">Account Holder:</span> {selectedAccountHolder.entityName}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Visit Details Summary */}
                  <div className="mb-8">
                    <h4 className="text-base font-semibold text-gray-800 mb-4">Visit Details</h4>
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 shadow-inner">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <span className="text-gray-600 font-medium">Visit Code:</span>
                          <p className="text-lg font-semibold">{visitDetails.visitCode}</p>
                        </div>
                        <div>
                          <span className="text-gray-600 font-medium">Date:</span>
                          <p className="text-lg font-semibold">{visitDetails.entryDate}</p>
                        </div>
                        <div>
                          <span className="text-gray-600 font-medium">Category:</span>
                          <p className="text-lg font-semibold">{visitDetails.billingCategory}</p>
                        </div>
                        <div>
                          <span className="text-gray-600 font-medium">Facility:</span>
                          <p className="text-lg font-semibold">{visitDetails.facility || "Not specified"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bill Items Summary */}
                  <div className="mb-8">
                    <h4 className="text-base font-semibold text-gray-800 mb-4">Bill Items</h4>
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 shadow-inner">
                      <div className="space-y-4">
                        {billItems.map((item, index) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0"
                          >
                            <div>
                              <p className="text-lg font-semibold text-gray-900">{item.description}</p>
                              <p className="text-gray-600">
                                {item.category} • Qty: {item.quantity} × ${item.unitPrice.toFixed(2)}
                              </p>
                            </div>
                            <span className="text-lg font-bold text-gray-900">${item.amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <ArrowLeft className="w-5 h-5" />
                Previous
              </button>

              {currentStep < 4 ? (
                <button
                  onClick={nextStep}
                  disabled={!canProceedToNextStep()}
                  className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Next
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  {isSubmitting ? "Submitting..." : "Submit Claim"}
                </button>
              )}
            </div>
          </div>

          {/* 3D Sidebar - Bill Summary */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-8 sticky top-8 transform hover:scale-[1.02] transition-all duration-300">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calculator className="w-4 h-4 text-blue-600" />
                </div>
                Bill Summary
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between text-lg text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold">${totalAmount.toFixed(2)}</span>
                </div>

                {selectedDiscount && (
                  <div className="flex justify-between text-lg text-green-600">
                    <span>{selectedDiscount.title}:</span>
                    <span className="font-semibold">-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                {visitDetails.coPay > 0 && (
                  <div className="flex justify-between text-lg text-orange-600">
                    <span>Co-Payment:</span>
                    <span className="font-semibold">+${visitDetails.coPay.toFixed(2)}</span>
                  </div>
                )}

                <div className="border-t-2 border-gray-200 pt-4">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total:</span>
                    <span>${finalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {selectedBillType && (
                <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-inner">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <selectedBillType.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="font-semibold text-blue-900">{selectedBillType.billingType} Billing</span>
                  </div>
                  <p className="text-sm text-blue-700">{selectedBillType.description}</p>
                </div>
              )}

              {currentStep === 4 && (
                <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-inner">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="font-semibold text-green-900">Ready to Submit</span>
                  </div>
                  <p className="text-sm text-green-700">
                    All required information has been provided. Review and submit your claim.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
