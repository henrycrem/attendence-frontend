'use client'
import { useState, useTransition } from 'react'
import { submitInsuranceClaim } from '../actions/bils'

const activityTypes = ['CONSULTATION', 'TRIAGE', 'APPOINTMENT']

export default function BillingForm({ patient, visitId, currentUserId, onSuccess, onError }) {
  const [billItems, setBillItems] = useState([])
  const [selectedInsurance, setSelectedInsurance] = useState('')
  const [activityType, setActivityType] = useState('CONSULTATION')
  const [triageData, setTriageData] = useState({
    firstName: patient.firstName || '',
    lastName: patient.lastName || '',
    temperature: 0,
    bloodPressure: '120/80',
    pulse: 80,
    bloodOxygenLevel: 95,
    respirationRate: 16
  })
  const [appointmentData, setAppointmentData] = useState({
    doctorId: '',
    startTime: '',
    endTime: ''
  })
  const [isPending, startTransition] = useTransition()

  const addBillItem = () => {
    const newItem = {
      id: `item_${Date.now()}`,
      description: '',
      amount: 0,
      category: activityType,
      date: new Date()
    }
    setBillItems([...billItems, newItem])
  }

  const updateBillItem = (id, field, value) => {
    setBillItems(items => items.map(item => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const removeBillItem = (id) => {
    setBillItems(items => items.filter(item => item.id !== id))
  }

  const updateTriageData = (field, value) => {
    setTriageData(prev => ({ ...prev, [field]: value }))
  }

  const updateAppointmentData = (field, value) => {
    setAppointmentData(prev => ({ ...prev, [field]: value }))
  }

  const totalAmount = billItems.reduce((sum, item) => sum + item.amount, 0)

  const selectedInsuranceData = patient.patientInsurances.find(ins => ins.insuranceId === selectedInsurance)
  const remainingBalance = selectedInsuranceData?.coverage
    ? selectedInsuranceData.coverage.totalCoverageLimit - (selectedInsuranceData.amountUtilized || 0)
    : 0

  const handleSubmit = () => {
    if (!selectedInsurance) {
      onError?.('Please select an insurance provider')
      return
    }
    if (billItems.length === 0) {
      onError?.('Please add at least one bill item')
      return
    }
    if (totalAmount > remainingBalance) {
      onError?.(`Total amount ($${totalAmount}) exceeds remaining coverage ($${remainingBalance})`)
      return
    }
    if (activityType === 'TRIAGE' && (!triageData.firstName || !triageData.lastName)) {
      onError?.('First name and last name are required for triage')
      return
    }
    if (activityType === 'APPOINTMENT' && !appointmentData.doctorId) {
      onError?.('Doctor ID is required for appointment')
      return
    }

    startTransition(async () => {
      try {
        const claimData = {
          patientId: patient.id,
          visitId,
          insuranceId: selectedInsurance,
          billItems,
          userId: currentUserId,
          activityType,
          triageData: activityType === 'TRIAGE' ? triageData : undefined,
          appointmentData: activityType === 'APPOINTMENT' ? appointmentData : undefined
        }
        const result = await submitInsuranceClaim(claimData)
        if (result.success) {
          onSuccess?.()
          setBillItems([])
          setSelectedInsurance('')
          setTriageData({
            firstName: patient.firstName || '',
            lastName: patient.lastName || '',
            temperature: 0,
            bloodPressure: '120/80',
            pulse: 80,
            bloodOxygenLevel: 95,
            respirationRate: 16
          })
          setAppointmentData({ doctorId: '', startTime: '', endTime: '' })
        } else {
          onError?.(result.error || 'Failed to send insurance claim')
        }
      } catch (error) {
        console.error('Error submitting claim:', error)
        onError?.(error.message || 'Failed to send insurance claim')
      }
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 max-w-4xl mx-auto">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Insurance Billing</h2>
        <p className="text-sm text-gray-600 mt-1">Collect patient bills and send to insurance for approval</p>
      </div>
      <div className="p-6 space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h3 className="font-semibold mb-2 text-gray-800">Patient Information</h3>
          <p className="text-sm text-gray-700"><strong>Name:</strong> {patient.fullName}</p>
          <p className="text-sm text-gray-700"><strong>Patient Number:</strong> {patient.patientNumber || 'N/A'}</p>
        </div>
        <div className="space-y-2">
          <label htmlFor="insurance" className="block text-sm font-medium text-gray-700">Select Insurance Provider</label>
          <select
            id="insurance"
            value={selectedInsurance}
            onChange={(e) => setSelectedInsurance(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Choose insurance provider</option>
            {patient.patientInsurances.map((insurance) => (
              <option key={insurance.insuranceId} value={insurance.insuranceId}>
                {insurance.insurance.name} - {insurance.policyNumber}
              </option>
            ))}
          </select>
        </div>
        {selectedInsuranceData && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold mb-2 text-blue-800">Coverage Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-700"><strong>Total Coverage:</strong> ${selectedInsuranceData.coverage?.totalCoverageLimit || 0}</p>
                <p className="text-sm text-blue-700"><strong>Amount Used:</strong> ${selectedInsuranceData.amountUtilized}</p>
              </div>
              <div>
                <p className="text-sm text-blue-700">
                  <strong>Remaining Balance:</strong>
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${remainingBalance > 1000 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    ${remainingBalance}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="space-y-2">
          <label htmlFor="activityType" className="block text-sm font-medium text-gray-700">Activity Type</label>
          <select
            id="activityType"
            value={activityType}
            onChange={(e) => setActivityType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {activityTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        {activityType === 'TRIAGE' && (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="font-semibold mb-2 text-gray-800">Triage Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="triage-firstName" className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  id="triage-firstName"
                  value={triageData.firstName}
                  onChange={(e) => updateTriageData('firstName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="triage-lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  id="triage-lastName"
                  value={triageData.lastName}
                  onChange={(e) => updateTriageData('lastName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="triage-temperature" className="block text-sm font-medium text-gray-700">Temperature (°C)</label>
                <input
                  id="triage-temperature"
                  type="number"
                  value={triageData.temperature}
                  onChange={(e) => updateTriageData('temperature', Number.parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="triage-bloodPressure" className="block text-sm font-medium text-gray-700">Blood Pressure</label>
                <input
                  id="triage-bloodPressure"
                  value={triageData.bloodPressure}
                  onChange={(e) => updateTriageData('bloodPressure', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="triage-pulse" className="block text-sm font-medium text-gray-700">Pulse (bpm)</label>
                <input
                  id="triage-pulse"
                  type="number"
                  value={triageData.pulse}
                  onChange={(e) => updateTriageData('pulse', Number.parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="triage-bloodOxygenLevel" className="block text-sm font-medium text-gray-700">Blood Oxygen (%)</label>
                <input
                  id="triage-bloodOxygenLevel"
                  type="number"
                  value={triageData.bloodOxygenLevel}
                  onChange={(e) => updateTriageData('bloodOxygenLevel', Number.parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="triage-respirationRate" className="block text-sm font-medium text-gray-700">Respiration Rate</label>
                <input
                  id="triage-respirationRate"
                  type="number"
                  value={triageData.respirationRate}
                  onChange={(e) => updateTriageData('respirationRate', Number.parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}
        {activityType === 'APPOINTMENT' && (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="font-semibold mb-2 text-gray-800">Appointment Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="appointment-doctorId" className="block text-sm font-medium text-gray-700">Doctor ID</label>
                <input
                  id="appointment-doctorId"
                  value={appointmentData.doctorId}
                  onChange={(e) => updateAppointmentData('doctorId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="appointment-startTime" className="block text-sm font-medium text-gray-700">Start Time</label>
                <input
                  id="appointment-startTime"
                  type="datetime-local"
                  value={appointmentData.startTime}
                  onChange={(e) => updateAppointmentData('startTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="appointment-endTime" className="block text-sm font-medium text-gray-700">End Time</label>
                <input
                  id="appointment-endTime"
                  type="datetime-local"
                  value={appointmentData.endTime}
                  onChange={(e) => updateAppointmentData('endTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Bill Items</h3>
            <button
              onClick={addBillItem}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Item
            </button>
          </div>
          {billItems.map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor={`description-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    id={`description-${item.id}`}
                    value={item.description}
                    onChange={(e) => updateBillItem(item.id, 'description', e.target.value)}
                    placeholder="Enter service description"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
                <div>
                  <label htmlFor={`category-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    id={`category-${item.id}`}
                    value={item.category}
                    onChange={(e) => updateBillItem(item.id, 'category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {activityTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label htmlFor={`amount-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                    <input
                      id={`amount-${item.id}`}
                      type="number"
                      value={item.amount}
                      onChange={(e) => updateBillItem(item.id, 'amount', Number.parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => removeBillItem(item.id)}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {billItems.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-800">Total Amount:</span>
              <span className="text-xl font-bold text-gray-900">${totalAmount.toFixed(2)}</span>
            </div>
            {totalAmount > remainingBalance && (
              <p className="text-red-600 text-sm mt-2">⚠️ Total exceeds remaining coverage balance</p>
            )}
          </div>
        )}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={isPending || billItems.length === 0 || !selectedInsurance}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-32"
          >
            {isPending ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Sending...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send to Insurance
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}