"use server"

import { cookies } from "next/headers"
import axios from "axios"

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
  createdAt: string
  updatedAt: string
}

async function getCookieHeader() {
  const cookieStore = await cookies()
  return cookieStore.toString()
}

export async function getAllInsurances(): Promise<Insurance[]> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("access_token")?.value

  console.log("getAllInsurances: Access token:", accessToken ? "Present" : "Missing")

  if (!accessToken) {
    console.error("getAllInsurances: No access token found")
    throw new Error("Unauthorized: No access token found. Please log in.")
  }

  try {
    const cookieHeader = await getCookieHeader()
    console.log("getAllInsurances: Sending request to:", `${process.env.NEXT_PUBLIC_SERVER_URL}/api/insurances`)

    const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/insurances`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        Cookie: cookieHeader,
      },
      withCredentials: true,
    })

    console.log("getAllInsurances: Response received:", response.data)
    return response.data.data || []
  } catch (error: any) {
    console.error("getAllInsurances: Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    })

    if (error.response?.status === 401) {
      throw new Error("Authentication failed. Please log in again.")
    }

    throw new Error(error.response?.data?.message || "Failed to fetch insurance companies")
  }
}
