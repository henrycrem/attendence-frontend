"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createAppointment, getDoctorAvailability } from "../actions/appointmentActions"
import { getAllDoctors } from "../actions/doctorActions"
import { getAppointmentPatients } from "../actions/appointmentActions"
import { toast, Toaster } from "react-hot-toast"
import {
  Calendar,
  User,
  Stethoscope,
  Clock,
  FileText,
  Search,
  ChevronDown,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { format, parseISO, startOfDay, endOfDay } from "date-fns"
import axios from "axios"

interface Doctor {
  id: string
  fullName: string
}

interface Patient {
  id: string
  fullName: string
  triageId?: string | null
  triageCategory?: "URGENT" | "MODERATE" | "LOW" | null
}

interface TimeSlot {
  startTime: string
  endTime: string
}

interface FormData {
  doctorId?: string
  patientId?: string
  triageId?: string
  startTime?: string
  duration: number
  notes?: string
}

const SearchableDropdown: React.FC<{
  options: { id: string; name: string; category?: string }[]
  value: string
  onChange: (value: string) => void
  placeholder: string
  icon: React.ReactNode
  disabled?: boolean
}> = ({ options, value, onChange, placeholder, icon, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredOptions = options.filter((option) => option.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const selectedOption = options.find((option) => option.id === value)

  const handleSelect = (optionId: string) => {
    onChange(optionId)
    setIsOpen(false)
    setSearchTerm("")
  }

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange("")
  }

  return (
    <div className="relative">
      <div
        className={`w-full pl-12 pr-12 py-4 bg-white rounded-2xl border-2 border-gray-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md ${
          disabled ? "opacity-50 cursor-not-allowed bg-gray-50" : "hover:border-blue-300"
        }`}
        style={{
          boxShadow: "0 4px 6px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">{icon}</div>
        <div className="flex items-center justify-between">
          <span className={selectedOption ? "text-gray-900 font-medium" : "text-gray-500"}>
            {selectedOption ? selectedOption.name : placeholder}
          </span>
          <div className="flex items-center space-x-2">
            {selectedOption && (
              <button onClick={clearSelection} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          </div>
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-2xl shadow-2xl max-h-64 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-50 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 font-medium">{option.name}</span>
                    {option.category && (
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          option.category === "URGENT"
                            ? "bg-red-100 text-red-700"
                            : option.category === "MODERATE"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                        }`}
                      >
                        {option.category}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-gray-500 text-center">
                <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No results found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const NewAppointmentForm: React.FC = () => {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    doctorId: "",
    patientId: "",
    duration: 60,
    notes: "",
  })
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [isLoadingPatients, setIsLoadingPatients] = useState(true)
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true)

  // Helper function to get access token from client-side cookies
  const getAccessToken = () => {
    if (typeof document !== "undefined") {
      const cookies = document.cookie.split(";")
      const tokenCookie = cookies.find((cookie) => cookie.trim().startsWith("access_token="))
      return tokenCookie ? tokenCookie.split("=")[1] : null
    }
    return null
  }

  // Fetch triage record for selected patient
  const fetchTriageForPatient = async (patientId: string, date: string) => {
    try {
      const accessToken = getAccessToken()
      if (!accessToken) {
        console.warn("No access token found")
        return null
      }

      const startOfDayDate = startOfDay(parseISO(date))
      const endOfDayDate = endOfDay(parseISO(date))

      const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/triage`, {
        params: {
          patientId,
          createdAt_gte: startOfDayDate.toISOString(),
          createdAt_lte: endOfDayDate.toISOString(),
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        withCredentials: true,
      })

      console.log("Triage response for patient:", patientId, response.data)

      if (response.data.data && response.data.data.length > 0) {
        const latestTriage = response.data.data[0]
        console.log("Found triage ID:", latestTriage.id)
        return latestTriage.id
      }
      return null
    } catch (error: any) {
      console.error("fetchTriageForPatient error:", error)
      return null
    }
  }

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setIsLoadingDoctors(true)
        const data = await getAllDoctors()
        if (Array.isArray(data)) {
          setDoctors(data)
        } else {
          console.error("Doctors data is not an array:", data)
          setDoctors([])
          toast.error("Invalid doctors data received")
        }
      } catch (error: any) {
        console.error("fetchDoctors error:", error)
        setDoctors([])
        toast.error("Failed to load doctors")
      } finally {
        setIsLoadingDoctors(false)
      }
    }

    const fetchPatients = async () => {
      try {
        setIsLoadingPatients(true)
        const response = await getAppointmentPatients({ date: selectedDate })
        console.log("Raw patients response:", response)

        if (Array.isArray(response.data)) {
          const formattedPatients: Patient[] = response.data.map((patient: any) => {
            console.log("Processing patient:", patient.fullName, "Triage:", patient.triage)
            return {
              id: patient.id,
              fullName: patient.fullName || "Unknown",
              triageId: patient.triage?.id || null,
              triageCategory: patient.triage?.triageCategory || null,
            }
          })
          console.log("Formatted patients:", formattedPatients)
          setPatients(formattedPatients)
        } else {
          console.error("Patients response.data is not an array:", response.data)
          setPatients([])
          toast.error("Invalid patients data received")
        }
      } catch (error: any) {
        console.error("fetchPatients error:", error)
        setPatients([])
        toast.error(error.message || "Failed to load patients")
      } finally {
        setIsLoadingPatients(false)
      }
    }

    fetchDoctors()
    fetchPatients()
  }, [selectedDate])

  useEffect(() => {
    if (formData?.doctorId?.trim() && selectedDate?.trim()) {
      const fetchAvailability = async () => {
        setIsLoadingSlots(true)
        try {
          const slots = await getDoctorAvailability(formData.doctorId, selectedDate)
          setTimeSlots(slots)
        } catch (error: any) {
          console.error("fetchAvailability error:", error)
          setTimeSlots([])
          toast.error(error.message || "Failed to load availability")
        } finally {
          setIsLoadingSlots(false)
        }
      }
      fetchAvailability()
    } else {
      setTimeSlots([])
    }
  }, [formData.doctorId, selectedDate])

  const handleDoctorChange = (doctorId: string) => {
    setFormData((prev) => ({
      ...prev,
      doctorId: doctorId || undefined,
    }))
  }

  const handlePatientChange = (patientId: string) => {
    const patient = patients.find((p) => p.id === patientId)
    console.log("Selected patient:", patient)

    setFormData((prev) => ({
      ...prev,
      patientId: patientId || undefined,
      triageId: patient?.triageId || undefined,
    }))

    // If no triageId from patient data, fetch it separately
    if (patientId && !patient?.triageId) {
      console.log("No triageId in patient data, fetching separately...")
      fetchTriageForPatient(patientId, selectedDate).then((triageId) => {
        if (triageId) {
          console.log("Setting triageId from separate fetch:", triageId)
          setFormData((prev) => ({
            ...prev,
            triageId,
          }))
        }
      })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: name === "duration" ? Number.parseInt(value, 10) : value || undefined,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log("Form submission data:", formData)

    if (!formData.doctorId) {
      toast.error("Please select a doctor")
      return
    }
    if (!formData.patientId) {
      toast.error("Please select a patient")
      return
    }
    if (!formData.startTime) {
      toast.error("Please select a time slot")
      return
    }
    if (!selectedDate) {
      toast.error("Please select a date")
      return
    }
    if (!formData.duration) {
      toast.error("Please select a duration")
      return
    }

    setIsSubmitting(true)

    try {
      const timeParts = formData.startTime.split(":")
      const parsedStartTime = parseISO(`${selectedDate}T${timeParts[0]}:${timeParts[1]}:00.000Z`)
      const formattedStartTime = format(parsedStartTime, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")

      // Only include triageId if it's not undefined
      const appointmentData: any = {
        doctorId: formData.doctorId!,
        patientId: formData.patientId!,
        startTime: formattedStartTime,
        duration: formData.duration,
        notes: formData.notes || "",
      }

      // Only add triageId if it exists
      if (formData.triageId) {
        appointmentData.triageId = formData.triageId
      }

      console.log("Sending appointment data:", appointmentData)

      const result = await createAppointment(appointmentData)
      console.log("Appointment created successfully:", result)

      toast.success("Appointment created successfully!")
      router.push("/dashboard/appointments")
    } catch (error: any) {
      console.error("createAppointment error:", error)
      toast.error(error.message || "Failed to create appointment")
    } finally {
      setIsSubmitting(false)
    }
  }

  const doctorOptions = doctors.map((doctor) => ({
    id: doctor.id,
    name: doctor.fullName,
  }))

  const patientOptions = patients.map((patient) => ({
    id: patient.id,
    name: patient.fullName,
    category: patient.triageCategory || undefined,
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
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

      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-r from-blue-200/30 to-purple-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-gradient-to-r from-indigo-200/30 to-blue-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-purple-100/20 to-pink-100/20 rounded-full blur-2xl"></div>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mx-auto mb-6 shadow-2xl transform hover:scale-105 transition-all duration-300">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Schedule New Appointment
          </h1>
          <p className="text-gray-600 text-base max-w-2xl mx-auto">
            Book an appointment for your patient with available doctors. All fields marked with * are required.
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden transform hover:shadow-3xl transition-all duration-300">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute -top-2 -right-2 w-20 h-20 bg-white/10 rounded-full blur-lg"></div>
            <div className="relative">
              <h2 className="text-white text-lg font-semibold flex items-center">
                <Stethoscope className="w-5 h-5 mr-3" />
                Appointment Details
              </h2>
            </div>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Doctor and Patient Selection */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                    <Stethoscope className="w-4 h-4 mr-2 text-blue-600" />
                    Select Doctor <span className="text-red-500 ml-1">*</span>
                  </label>
                  <SearchableDropdown
                    options={doctorOptions}
                    value={formData.doctorId || ""}
                    onChange={handleDoctorChange}
                    placeholder="Search and select a doctor"
                    icon={<Stethoscope className="w-5 h-5" />}
                    disabled={isLoadingDoctors}
                  />
                  {isLoadingDoctors && (
                    <div className="flex items-center text-amber-600 text-sm bg-amber-50 p-3 rounded-xl">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600 mr-2"></div>
                      Loading doctors...
                    </div>
                  )}
                  {!isLoadingDoctors && doctorOptions.length === 0 && (
                    <div className="flex items-center text-red-600 text-sm bg-red-50 p-3 rounded-xl">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      No doctors available
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                    <User className="w-4 h-4 mr-2 text-blue-600" />
                    Select Patient <span className="text-red-500 ml-1">*</span>
                  </label>
                  <SearchableDropdown
                    options={patientOptions}
                    value={formData.patientId || ""}
                    onChange={handlePatientChange}
                    placeholder="Search and select a patient"
                    icon={<User className="w-5 h-5" />}
                    disabled={isLoadingPatients}
                  />
                  {isLoadingPatients && (
                    <div className="flex items-center text-amber-600 text-sm bg-amber-50 p-3 rounded-xl">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600 mr-2"></div>
                      Loading patients...
                    </div>
                  )}
                  {!isLoadingPatients && patientOptions.length === 0 && (
                    <div className="flex items-center text-red-600 text-sm bg-red-50 p-3 rounded-xl">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      No patients available for selected date
                    </div>
                  )}
                </div>
              </div>

              {/* Date and Time Selection */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                    <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                    Appointment Date <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      required
                      min={format(new Date(), "yyyy-MM-dd")}
                      className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border-2 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md"
                      style={{
                        boxShadow: "0 4px 6px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.1)",
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                    <Clock className="w-4 h-4 mr-2 text-blue-600" />
                    Available Time Slots <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <select
                      name="startTime"
                      value={formData.startTime || ""}
                      onChange={handleChange}
                      required
                      disabled={!timeSlots.length || isLoadingSlots}
                      className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border-2 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                      style={{
                        boxShadow: "0 4px 6px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.1)",
                      }}
                    >
                      <option value="" disabled>
                        {isLoadingSlots
                          ? "Loading available slots..."
                          : timeSlots.length > 0
                            ? "Select a time slot"
                            : "No slots available"}
                      </option>
                      {timeSlots.map((slot, index) => (
                        <option key={index} value={format(parseISO(slot.startTime), "HH:mm:ss")}>
                          {format(parseISO(slot.startTime), "h:mm a")} - {format(parseISO(slot.endTime), "h:mm a")}
                        </option>
                      ))}
                    </select>
                  </div>
                  {timeSlots.length === 0 && !isLoadingSlots && formData.doctorId && selectedDate && (
                    <div className="flex items-center text-red-600 text-sm bg-red-50 p-3 rounded-xl">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      No available slots. Try selecting a different date or doctor.
                    </div>
                  )}
                  {isLoadingSlots && (
                    <div className="flex items-center text-amber-600 text-sm bg-amber-50 p-3 rounded-xl">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600 mr-2"></div>
                      Loading available time slots...
                    </div>
                  )}
                </div>
              </div>

              {/* Duration and Notes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                    <Clock className="w-4 h-4 mr-2 text-blue-600" />
                    Duration <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <select
                      name="duration"
                      value={formData.duration}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border-2 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md"
                      style={{
                        boxShadow: "0 4px 6px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.1)",
                      }}
                    >
                      <option value="" disabled>
                        Select duration
                      </option>
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={90}>1.5 hours</option>
                      <option value={120}>2 hours</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                    <FileText className="w-4 h-4 mr-2 text-blue-600" />
                    Additional Notes
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
                    <textarea
                      name="notes"
                      value={formData.notes || ""}
                      onChange={handleChange}
                      rows={4}
                      className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border-2 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 resize-none shadow-sm hover:shadow-md"
                      style={{
                        boxShadow: "0 4px 6px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.1)",
                      }}
                      placeholder="Enter any additional notes or special requirements for this appointment..."
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-end pt-8 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/appointments")}
                  className="px-8 py-4 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 transition-all duration-300 font-semibold border-2 border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md transform hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center justify-center min-w-[180px] transform hover:scale-105 disabled:hover:scale-100"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-3" />
                      Schedule Appointment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center px-6 py-3 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
            <AlertCircle className="w-4 h-4 text-blue-600 mr-2" />
            <p className="text-gray-600 text-sm font-medium">
              All appointments are subject to doctor availability and confirmation
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewAppointmentForm
