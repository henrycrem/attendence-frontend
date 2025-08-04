"use server"

import { cookies } from "next/headers"
import axios from "axios"
import { startOfDay, endOfDay } from "date-fns"

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

interface SubmitBillingParams {
  visitCode: string
  patientId: string
  billTypeId: string
  insuranceId?: string
  accountHolderId?: string
}

class AuthenticationError extends Error {
  statusCode: number
  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.name = "AuthenticationError"
  }
}

const getAuthHeaders = async () => {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("access_token")?.value

  if (!accessToken) {
    throw new AuthenticationError("No access token found.", 401)
  }

  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  }
}

// Keep all your existing functions unchanged
export async function getPatientTodayVisit(patientId: string): Promise<PatientVisit | null> {
  try {
    const headers = await getAuthHeaders()
    console.log("getPatientTodayVisit: id:", patientId)

    const today = new Date()
    const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/patients/${patientId}/visits`, {
      headers,
      withCredentials: true,
      params: {
        startDate: startOfDay(today).toISOString(),
        endDate: endOfDay(today).toISOString(),
      },
    })

    console.log("getPatientTodayVisit: Response:", response.data)

    const visits = response.data.data || []
    if (visits.length === 0) {
      console.log("getPatientTodayVisit: No visits found")
      return null
    }

    const latestVisit = visits[0]
    console.log("getPatientTodayVisit: Latest visit:", latestVisit.visitCode)

    return {
      id: latestVisit.id,
      visitCode: latestVisit.visitCode,
      entryDate: latestVisit.entryDate,
      patientId: latestVisit.patientId,
      billTypeId: latestVisit.billTypeId,
      billType: latestVisit.billType,
      insuranceId: latestVisit.insuranceId,
      insurance: latestVisit.insurance,
      accountHolderId: latestVisit.accountHolderId,
      accountHolder: latestVisit.accountHolder,
    }
  } catch (error: any) {
    console.error("getPatientTodayVisit: Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    })
    throw new Error(error.response?.data?.message || "Failed to fetch patient visit")
  }
}

export async function getPatientPreviousBilling(patientId: string): Promise<PreviousBillingInfo | null> {
  try {
    const headers = await getAuthHeaders()
    console.log("getPatientPreviousBilling: id:", patientId)

    const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/patients/${patientId}/visits`, {
      params: {
        limit: 10,
        includeBilling: true,
      },
      headers,
      withCredentials: true,
    })

    const visits = response.data.data || []
    const today = new Date()
    const visitsWithBilling = visits.filter((visit: any) => {
      const visitDate = new Date(visit.entryDate)
      const isToday = visitDate >= startOfDay(today) && visitDate <= endOfDay(today)
      return visit.billTypeId && !isToday
    })

    if (visitsWithBilling.length === 0) {
      console.log("getPatientPreviousBilling: No previous billing found")
      return null
    }

    const sortedVisits = visitsWithBilling.sort(
      (a: any, b: any) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime(),
    )

    const lastBillingVisit = sortedVisits[0]
    console.log("getPatientPreviousBilling: Found previous billing:", {
      visitCode: lastBillingVisit.visitCode,
      billType: lastBillingVisit.billType?.billingType,
      date: lastBillingVisit.entryDate,
    })

    return {
      billType: lastBillingVisit.billType,
      insurance: lastBillingVisit.insurance,
      accountHolder: lastBillingVisit.accountHolder,
      lastUsedDate: lastBillingVisit.entryDate,
    }
  } catch (error: any) {
    console.error("getPatientPreviousBilling: Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    })
    return null
  }
}

export async function getBillingTypes(): Promise<{ data: BillingType[] }> {
  try {
    const headers = await getAuthHeaders()
    const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/billing-types`, {
      headers,
      withCredentials: true,
    })

    console.log("getBillingTypes: Response:", response.data)

    // DON'T trim the billing types - preserve exact database format
    return { data: response.data.data || [] }
  } catch (error: any) {
    console.error("getBillingTypes: Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    })
    throw new Error(error.response?.data?.message || "Failed to fetch billing types")
  }
}

export async function getAllInsurances(): Promise<{ data: Insurance[] }> {
  try {
    const headers = await getAuthHeaders()
    const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/insurances`, {
      headers,
      withCredentials: true,
    })

    console.log("getAllInsurances: Response:", response.data)
    return { data: response.data.data || [] }
  } catch (error: any) {
    console.error("getAllInsurances: Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    })
    throw new Error(error.response?.data?.message || "Failed to fetch insurances")
  }
}

export async function getAccountHoldersByPatient(patientId: string): Promise<{ data: AccountHolder[] }> {
  try {
    const headers = await getAuthHeaders()
    console.log("getAccountHoldersByPatient: Fetching for patientId:", patientId)

    const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/account-holders/${patientId}`, {
      headers,
      withCredentials: true,
    })

    console.log("getAccountHoldersByPatient: Response:", response.data)

    if (!response.data.data || response.data.data.length === 0) {
      console.warn("getAccountHoldersByPatient: No account holders found for patientId:", patientId)
      // Fallback to get all account holders
      const allResponse = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/account-holders`, {
        headers,
        withCredentials: true,
      })
      console.log("getAccountHoldersByPatient: Fallback response:", allResponse.data)
      return { data: allResponse.data.data || [] }
    }

    return { data: response.data.data }
  } catch (error: any) {
    console.error("getAccountHoldersByPatient: Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    })
    throw new Error(error.response?.data?.message || "Failed to fetch account holders")
  }
}

export async function createAccountHolderPatient(patientId: string, accountHolderId: string): Promise<void> {
  try {
    const headers = await getAuthHeaders()
    console.log("createAccountHolderPatient: Linking patient id:", { patientId, accountHolderId })
    await axios.post(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/account-holder-patients`,
      { patientId, accountHolderId },
      { headers },
    )
    console.log("createAccountHolderPatient: Success")
  } catch (error: any) {
    console.error("createAccountHolderPatient: Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    })
    throw new Error(error.response?.data?.message || "Failed to link account holder to patient")
  }
}

// ✅ SIMPLIFIED: No more separate notification function!
// The enhanced updateVisitBilling controller handles notifications automatically

export async function submitBillingDetails(params: SubmitBillingParams): Promise<void> {
  try {
    const headers = await getAuthHeaders()
    console.log("submitBillingDetails: Params:", params)

    const billingTypesResponse = await getBillingTypes()
    const validBillType = billingTypesResponse.data.find((bt) => bt.id === params.billTypeId)
    if (!validBillType) {
      throw new Error(`Invalid billTypeId: ${params.billTypeId}`)
    }

    console.log("submitBillingDetails: Found billing type:", validBillType)

    // Normalize the billing type for comparison
    const normalizedBillingType = validBillType.billingType.trim().toLowerCase()
    console.log("submitBillingDetails: Normalized billing type:", normalizedBillingType)

    if (params.accountHolderId) {
      // Only check account holder relationship if billing type is account holder
      if (normalizedBillingType === "account holder" || normalizedBillingType === "accountholder") {
        const existingAccountHolders = await getAccountHoldersByPatient(params.patientId)
        const hasRelationship = existingAccountHolders.data.some((ah) => ah.id === params.accountHolderId)
        if (!hasRelationship) {
          console.log("submitBillingDetails: Creating account holder relationship")
          await createAccountHolderPatient(params.patientId, params.accountHolderId)
        }
      }
    }

    console.log("submitBillingDetails: About to make API call to:", `${process.env.NEXT_PUBLIC_SERVER_URL}/api/billing`)
    console.log("submitBillingDetails: Request payload:", params)

    // 🎯 ENHANCED: The controller now handles notifications automatically!
    const response = await axios.put(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/billing`, params, {
      headers,
      withCredentials: true,
    })

    console.log("submitBillingDetails: Success:", response.data)

    // 🎉 NEW: Check if notification was sent
    if (response.data.data.notificationSent) {
      console.log("✅ Insurance notification sent automatically:", response.data.data.insuranceNotified)
    }
  } catch (error: any) {
    console.error("submitBillingDetails: Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
    })
    throw new Error(error.response?.data?.message || `Failed to submit billing details: ${error.message}`)
  }
}
