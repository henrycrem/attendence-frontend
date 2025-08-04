"use client"

import { useState } from "react"
import {
  X,
  CheckCircle,
  XCircle,
  FileText,
  User,
  Calendar,
  DollarSign,
  Shield,
  ArrowRight,
  Info,
  AlertTriangle,
} from "lucide-react"

interface InsuranceResponseDrawerProps {
  isOpen: boolean
  onClose: () => void
  responseData: {
    id: string
    type?: string
    patientName?: string
    patientNumber?: string
    patientId?: string
    visitId?: string
    policyNumber?: string
    response?: "CONFIRMED" | "REJECTED"
    coverageDetails?: any
    rejectionReason?: string
    notes?: string
    timestamp: string
    insuranceCompany?: string
    respondedBy?: any
    actionRequired?: string
    title?: string
    message?: string
    data?: any
  } | null
}

export default function InsuranceResponseDrawer({ isOpen, onClose, responseData }: InsuranceResponseDrawerProps) {
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 300)
  }

  const handleProceedWithBilling = () => {
    // Navigate to billing page or trigger billing process
    console.log("Proceeding with billing for:", responseData?.patientName)
    // You can add navigation logic here
    handleClose()
  }

  const handleViewPatientCoverage = () => {
    // Navigate to patient coverage review
    console.log("Viewing patient coverage for:", responseData?.patientId)
    // Add navigation logic here
    handleClose()
  }

  if (!responseData) return null

  // Determine notification type and styling
  const getNotificationStyle = () => {
    switch (responseData.type) {
      case "INSURANCE_CONFIRMED":
        return {
          bgColor: "bg-green-50 border-green-200",
          iconColor: "text-green-600",
          textColor: "text-green-800",
          icon: CheckCircle,
          title: "Insurance Coverage Confirmed",
        }
      case "INSURANCE_REJECTED":
        return {
          bgColor: "bg-red-50 border-red-200",
          iconColor: "text-red-600",
          textColor: "text-red-800",
          icon: XCircle,
          title: "Insurance Coverage Rejected",
        }
      case "INSURANCE_SELECTED":
        return {
          bgColor: "bg-blue-50 border-blue-200",
          iconColor: "text-blue-600",
          textColor: "text-blue-800",
          icon: Info,
          title: "Insurance Selection Notification",
        }
      case "INSURANCE_CLAIM_RESPONSE":
        return {
          bgColor: "bg-purple-50 border-purple-200",
          iconColor: "text-purple-600",
          textColor: "text-purple-800",
          icon: FileText,
          title: "Insurance Claim Response",
        }
      default:
        return {
          bgColor: "bg-gray-50 border-gray-200",
          iconColor: "text-gray-600",
          textColor: "text-gray-800",
          icon: Info,
          title: "Notification Details",
        }
    }
  }

  const style = getNotificationStyle()
  const IconComponent = style.icon
  const isConfirmed = responseData.response === "CONFIRMED" || responseData.type === "INSURANCE_CONFIRMED"
  const isRejected = responseData.response === "REJECTED" || responseData.type === "INSURANCE_REJECTED"

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          isOpen && !isClosing ? "bg-opacity-50" : "bg-opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 right-0 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen && !isClosing ? "translate-y-0" : "-translate-y-full"
        }`}
        style={{ maxHeight: "80vh" }}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${style.bgColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <IconComponent className={`w-8 h-8 ${style.iconColor}`} />
              <div>
                <h2 className={`text-xl font-bold ${style.textColor}`}>{responseData.title || style.title}</h2>
                <p className="text-sm text-gray-600">
                  {responseData.insuranceCompany && `Response from ${responseData.insuranceCompany} • `}
                  {new Date(responseData.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200">
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 max-h-96 overflow-y-auto">
          {/* Message */}
          {responseData.message && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-800">{responseData.message}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Patient Information */}
            {(responseData.patientName || responseData.patientNumber) && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  Patient Information
                </h3>
                <div className="space-y-3">
                  {responseData.patientName && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Patient Name</label>
                      <p className="text-lg font-semibold text-gray-900">{responseData.patientName}</p>
                    </div>
                  )}
                  {responseData.patientNumber && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Patient Number</label>
                      <p className="text-gray-900 font-mono">{responseData.patientNumber}</p>
                    </div>
                  )}
                  {responseData.policyNumber && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Policy Number</label>
                      <p className="text-gray-900 font-mono">{responseData.policyNumber}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Response Details */}
            <div className={`rounded-lg p-4 ${style.bgColor}`}>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-purple-600" />
                Response Details
              </h3>
              <div className="space-y-3">
                {responseData.response && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Status</label>
                    <div className="flex items-center gap-2">
                      <IconComponent className={`w-5 h-5 ${style.iconColor}`} />
                      <span className={`font-semibold ${style.textColor}`}>{responseData.response}</span>
                    </div>
                  </div>
                )}
                {responseData.insuranceCompany && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Insurance Company</label>
                    <p className="text-gray-900">{responseData.insuranceCompany}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-500">Response Time</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900">{new Date(responseData.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                {responseData.respondedBy && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Responded By</label>
                    <p className="text-gray-900">
                      {responseData.respondedBy.name} ({responseData.respondedBy.role})
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Coverage Details - Show only if confirmed */}
          {isConfirmed && responseData.coverageDetails && (
            <div className="mt-6 bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Coverage Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {responseData.coverageDetails.coverageName && (
                  <div>
                    <label className="block text-sm font-medium text-blue-600">Coverage Plan</label>
                    <p className="text-blue-900">{responseData.coverageDetails.coverageName}</p>
                  </div>
                )}
                {responseData.coverageDetails.copayAmount !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-blue-600">Patient Copay</label>
                    <p className="text-blue-900 font-semibold">${responseData.coverageDetails.copayAmount}</p>
                  </div>
                )}
                {responseData.coverageDetails.coverageLimit && (
                  <div>
                    <label className="block text-sm font-medium text-blue-600">Coverage Limit</label>
                    <p className="text-blue-900 font-semibold">${responseData.coverageDetails.coverageLimit}</p>
                  </div>
                )}
                {responseData.coverageDetails.validFrom && (
                  <div>
                    <label className="block text-sm font-medium text-blue-600">Valid From</label>
                    <p className="text-blue-900">
                      {new Date(responseData.coverageDetails.validFrom).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {responseData.coverageDetails.validTo && (
                  <div>
                    <label className="block text-sm font-medium text-blue-600">Valid To</label>
                    <p className="text-blue-900">
                      {new Date(responseData.coverageDetails.validTo).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rejection Reason - Show only if rejected */}
          {isRejected && responseData.rejectionReason && (
            <div className="mt-6 bg-red-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Rejection Reason
              </h3>
              <p className="text-red-900 bg-white p-3 rounded border border-red-200">{responseData.rejectionReason}</p>
            </div>
          )}

          {/* Action Required */}
          {responseData.actionRequired && (
            <div className="mt-6 bg-yellow-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Action Required
              </h3>
              <p className="text-yellow-900 bg-white p-3 rounded border border-yellow-200">
                {responseData.actionRequired}
              </p>
            </div>
          )}

          {/* Additional Notes */}
          {responseData.notes && (
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Additional Notes
              </h3>
              <p className="text-gray-900 bg-white p-3 rounded border border-gray-200">{responseData.notes}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              Close
            </button>
            <div className="flex gap-3">
              {responseData.type === "INSURANCE_SELECTED" && (
                <button
                  onClick={handleViewPatientCoverage}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
                >
                  View Coverage Details
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              {isConfirmed && (
                <button
                  onClick={handleProceedWithBilling}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
                >
                  Proceed with Billing
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                Mark as Read
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
