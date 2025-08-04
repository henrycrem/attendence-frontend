'use server';

import { cookies } from 'next/headers';

import axios from 'axios';



interface GetPatientsParams {
  search?: string;
  limit?: number;
  offset?: number;
}

interface PatientSummary {
  id: string;
  fullName: string;
  patientNumber: string;
  gender?: { id: string; gender: string };
  billingType?: { id: string; billingType: string };
  county?: { id: string; countyName: string };
  triage?: { id: string; triageCategory: string } | null;
}

interface GetPatientsResponse {
  data: PatientSummary[];
  count: number;
  totalCount: number;
}


class AuthenticationError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AuthenticationError';
  }
}


interface PatientData {
  id: string;
  patientNumber: string;
  firstName?: string;
  middleName?: string;
  lastName: string;
  fullName?: string;
  dateOfBirth?: Date;
  age?: number;
  gender?: { id: string; gender: string };
  primaryPhone?: string;
  primaryEmail?: string;
  secondaryPhone?: string;
  secondaryEmail?: string;
  emergencyPhone?: string;
  emergencyEmail?: string;
  address?: string;
  county?: { id: string; countyName: string };
  billingType?: { id: string; billingType: string };
  triageRecords: Array<{
    id: string;
    temperature: number;
    temperatureStatus: string;
    bloodPressure: string;
    bloodPressureStatus: string;
    pulse: number;
    pulseStatus: string;
    bloodOxygenLevel: number;
    bloodOxygenStatus: string;
    respirationRate: number;
    respirationStatus: string;
    triageCategory: string;
    overallStatus: string;
    statusNote?: string;
    createdAt: Date;
  }>;
  visitsClinic: Array<{
    id: string;
    visitCode: string;
    entryDate: Date;
    consultationFee: number;
    billingCategory?: string;
    doctor?: { fullName: string };
  }>;
  appointments: Array<{
    id: string;
    startTime: Date;
    endTime?: Date;
    status: string;
    notes?: string;
    doctor: { fullName: string };
  }>;
  images: Array<{
    id: string;
    url: string;
  }>;
}

export async function getPatientById(patientId: string): Promise<PatientData> {
  console.log('getPatientById: Received patientId:', patientId);

  if (!patientId) {
    throw new Error('Patient ID is required');
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  console.log('getPatientById: Access token present:', !!accessToken);

  if (!accessToken) {
    throw new AuthenticationError('Unauthorized: No access token found. Please log in.', 401);
  }

  try {
    const url = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/patient/${patientId}`;
    console.log('getPatientById: Sending request to:', url);

    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      withCredentials: true,
    });

    console.log('getPatientById: Response:', JSON.stringify(response.data, null, 2));

    return response.data.patient;
  } catch (error: any) {
    console.error('getPatientById: Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    if (error.response?.status === 401) {
      throw new AuthenticationError('Authentication failed. Please log in again.', 401);
    }

    if (error.response?.status === 404) {
      throw new Error('Patient not found');
    }

    const message = error.response?.data?.message || 'Failed to fetch patient';
    throw new Error(message);
  }
}