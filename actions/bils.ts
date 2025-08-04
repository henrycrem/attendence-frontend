"use server"

import { cookies } from "next/headers"
import axios from "axios"


// Helper function to get auth token from cookies
async function getAuthToken() {
  const cookieStore = await cookies()
  return cookieStore.get("access_token")?.value

}

async function getCookieHeader() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  return allCookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
}

export async function submitInsuranceClaim(claimData: {
  patientId: string
  visitId: string
  insuranceId: string
  billItems: any[]
  userId: string
}) {
    const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  console.log('createTriage: Access token:', accessToken ? 'Present' : 'Missing');

  if (!accessToken) {
    console.error('createTriage: No access token found');
    throw new Error('Unauthorized: No access token found. Please log in.');
  }

  try {
    const cookieHeader = await getCookieHeader()
    console.log("submitInsuranceClaim: Cookie header:", cookieHeader)

    // Use the correct endpoint path without /api prefix
    const submitUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/submit-claim`
    console.log("submitInsuranceClaim: Sending request to:", submitUrl)

    const response = await axios.post(submitUrl, claimData, {
       headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Cookie': cookieHeader,
      },
      withCredentials: true,
    });

    console.log("submitInsuranceClaim: Response received:", response.data)
    return {
      success: true,
      data: response.data,
    }
  } catch (error: any) {
    console.error("submitInsuranceClaim: Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
    })

    if (error.response?.status === 401) {
      throw new Error("Authentication failed. Please log in again.")
    }

    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || "Failed to submit insurance claim",
    }
  }
}


export async function processInsuranceResponse(responseData: {
  claimId: string
  patientId: string
  insuranceId: string
  status: "APPROVED" | "REJECTED" | "PARTIAL"
  approvedAmount: number
  rejectedAmount: number
  reason?: string
  insuranceUserId: string
}) {
  const accessToken = await getAuthToken()
  console.log("processInsuranceResponse: Access token:", accessToken ? "Present" : "Missing")

  if (!accessToken) {
    console.error("processInsuranceResponse: No access token found")
    throw new Error("Unauthorized: No access token found. Please log in.")
  }

  try {
    const cookieHeader = await getCookieHeader()
    console.log("processInsuranceResponse: Cookie header:", cookieHeader)
    console.log(
      "processInsuranceResponse: Sending request to:",
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/insurance-billing/respond-claim`,
    )

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/insurance-billing/respond-claim`,
      responseData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          Cookie: cookieHeader,
        },
        withCredentials: true,
      },
    )

    console.log("processInsuranceResponse: Response received:", response.data)
    return {
      success: true,
      data: response.data,
    }
  } catch (error: any) {
    console.error("processInsuranceResponse: Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
    })

    if (error.response?.status === 401) {
      throw new Error("Authentication failed. Please log in again.")
    }

    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || "Failed to process insurance response",
    }
  }
}


export async function searchPatients(query: string) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("access_token")?.value
  console.log("searchPatients: Access token:", accessToken ? "Present" : "Missing")

  if (!accessToken) {
    console.error("searchPatients: No access token found")
    throw new Error("Unauthorized: No access token found. Please log in.")
  }

  try {
    const cookieHeader = await getCookieHeader()
    console.log("searchPatients: Cookie header:", cookieHeader)

    // Use the correct endpoint path without /api prefix
    const searchUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/patients/search?query=${encodeURIComponent(query)}`
    console.log("searchPatients: Sending request to:", searchUrl)

    const response = await axios.get(searchUrl, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        Cookie: cookieHeader,
      },
      withCredentials: true,
    })

    console.log("searchPatients: Response received:", response.data)

    // Extract patients from the nested structure
    const patients = response.data.data?.patients || []

    return {
      success: true,
      data: patients,
    }
  } catch (error: any) {
    console.error("searchPatients: Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
    })

    if (error.response?.status === 401) {
      throw new Error("Authentication failed. Please log in again.")
    }

    return {
      success: false,
      error: error.response?.data?.message || error.response?.data?.details || "Failed to search patients",
      data: [],
    }
  }
}
