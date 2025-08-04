'use server';

import { cookies } from 'next/headers';
import axios from 'axios';

interface MinimalPatientData {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: string;
  genderId?: string;
  address?: string;
  primaryPhone: string;
  clinicId?: string | null; // Added
}

interface TriageFormData {
  patientId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  genderId?: string;
  temperature: number;
  bloodPressure: string;
  pulse: number;
  bloodOxygenLevel: number;
  respirationRate: number;
}

interface Patient {
  id: string;
  fullName: string;
  patientName: string;
  patientNumber: string;
  triageId: string | null;
  triageCategory: 'URGENT' | 'NORMAL' | null;
}

interface GetPatientsParams {
  search?: string;
  limit?: number;
  offset?: number;
}

interface Gender {
  id: string;
  gender: string;
}

interface TriageRecord {
  id: string;
  createdAt: string;
  temperature: number;
  temperatureStatus: 'LOW' | 'NORMAL' | 'HIGH';
  bloodPressure: string;
  bloodPressureStatus: 'LOW' | 'NORMAL' | 'HIGH';
  pulse: number;
  pulseStatus: 'LOW' | 'NORMAL' | 'HIGH';
  bloodOxygenLevel: number;
  bloodOxygenStatus: 'LOW' | 'NORMAL' | 'HIGH';
  respirationRate: number;
  respirationStatus: 'LOW' | 'NORMAL' | 'HIGH';
  triageCategory: 'URGENT' | 'NORMAL';
  overallStatus: 'STABLE' | 'NEEDS_ATTENTION' | 'CRITICAL';
  statusNote?: string;
  patient: {
    id: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    fullName?: string;
  };
  gender?: {
    id: string;
    gender: string;
  };
}


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

// Helper function to get all cookies and format them for axios
async function getCookieHeader() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  return allCookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
}

export async function getGenders(): Promise<Gender[]> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  console.log('getGenders: Access token:', accessToken ? 'Present' : 'Missing');

  if (!accessToken) {
    console.error('getGenders: No access token found');
    throw new Error('Unauthorized: No access token found. Please log in.');
  }

  try {
    const cookieHeader = await getCookieHeader();
    console.log('getGenders: Cookie header:', cookieHeader);
    console.log('getGenders: Sending request to:', `${process.env.NEXT_PUBLIC_SERVER_URL}/api/genders`);
    
    const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/genders`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Cookie': cookieHeader,
      },
      withCredentials: true,
    });
    
    console.log('getGenders: Response received:', response.data);
    return response.data.genders;
  } catch (error: any) {
    console.error('getGenders: Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
    });
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }
    
    throw new Error(error.response?.data?.error || error.response?.data?.message || 'Failed to fetch genders');
  }
}

export async function searchPatients(query: string) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  console.log('searchPatients: Access token:', accessToken ? 'Present' : 'Missing');

  if (!accessToken) {
    console.error('searchPatients: No access token found');
    throw new Error('Unauthorized: No access token found. Please log in.');
  }

  if (!query) {
    return { patients: [], count: 0 };
  }

  try {
    const cookieHeader = await getCookieHeader();
    console.log('searchPatients: Cookie header:', cookieHeader);
    console.log('searchPatients: Sending request to:', `${process.env.NEXT_PUBLIC_SERVER_URL}/api/patients/search`);
    console.log('searchPatients: Query:', query);
    
    const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/patients/search`, {
      params: { query },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Cookie': cookieHeader,
      },
      withCredentials: true,
    });
    
    console.log('searchPatients: Response received:', response.data);
    return response.data.data;
  } catch (error: any) {
    console.error('searchPatients: Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
    });
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }
    
    throw new Error(error.response?.data?.error || error.response?.data?.message || 'Failed to search patients');
  }
}

export async function createMinimalPatient(data: MinimalPatientData) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  console.log('createMinimalPatient: Access token:', accessToken ? 'Present' : 'Missing');

  if (!accessToken) {
    console.error('createMinimalPatient: No access token found');
    throw new Error('Unauthorized: No access token found. Please log in.');
  }

  const normalizedData = {
    ...data,
    primaryPhone: data.primaryPhone ? data.primaryPhone.replace(/\s+/g, '').trim() : null,
  };

  try {
    const cookieHeader = await getCookieHeader();
    console.log('createMinimalPatient: Cookie header:', cookieHeader);
    console.log('createMinimalPatient: Sending request to:', `${process.env.NEXT_PUBLIC_SERVER_URL}/api/patients/minimal`);
    console.log('createMinimalPatient: Request data:', normalizedData);
    
    const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/patients/minimal`, normalizedData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Cookie': cookieHeader,
      },
      withCredentials: true,
    });
    
    console.log('createMinimalPatient: Response received:', response.data);
    return response.data.data;
  } catch (error: any) {
    console.error('createMinimalPatient: Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
    });
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }
    
    throw new Error(error.response?.data?.message || 'Failed to create patient');
  }
}

export async function createTriage(data: TriageFormData) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  console.log('createTriage: Access token:', accessToken ? 'Present' : 'Missing');

  if (!accessToken) {
    console.error('createTriage: No access token found');
    throw new Error('Unauthorized: No access token found. Please log in.');
  }

  try {
    const cookieHeader = await getCookieHeader();
    console.log('createTriage: Cookie header:', cookieHeader);
    console.log('createTriage: Sending request to:', `${process.env.NEXT_PUBLIC_SERVER_URL}/api/triage`);
    console.log('createTriage: Request data:', data);
    
    const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/triage`, data, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Cookie': cookieHeader,
      },
      withCredentials: true,
    });
    
    console.log('createTriage: Response received:', response.data);
    return response.data.data;
  } catch (error: any) {
    console.error('createTriage: Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
    });
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }
    
    throw new Error(error.response?.data?.error || error.response?.data?.message || 'Failed to create triage');
  }
}

export async function getTriageByPatientId(patientId: string): Promise<TriageRecord[]> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  console.log('getTriageByPatientId: Access token:', accessToken ? 'Present' : 'Missing');

  if (!accessToken) {
    console.error('getTriageByPatientId: No access token found');
    throw new Error('Unauthorized: No access token found. Please log in.');
  }

  if (!patientId) {
    console.error('getTriageByPatientId: No patientId provided');
    throw new Error('Patient ID is required');
  }

  try {
    const cookieHeader = await getCookieHeader();
    console.log('getTriageByPatientId: Cookie header:', cookieHeader);
    console.log('getTriageByPatientId: Sending request to:', `${process.env.NEXT_PUBLIC_SERVER_URL}/api/triage/patient/${patientId}`);
    
    const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/triage/patient/${patientId}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Cookie': cookieHeader,
      },
      withCredentials: true,
    });
    
    console.log('getTriageByPatientId: Response received:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('getTriageByPatientId: Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
    });
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }
    
    throw new Error(error.response?.data?.error || error.response?.data?.message || 'Failed to fetch triage records');
  }
}

export async function updateTriageDoctorNote(triageId: string, overallStatus: 'STABLE' | 'NEEDS_ATTENTION' | 'CRITICAL', statusNote: string) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  console.log('updateTriageDoctorNote: Access token:', accessToken ? 'Present' : 'Missing');

  if (!accessToken) {
    console.error('updateTriageDoctorNote: No access token found');
    throw new Error('Unauthorized: No access token found. Please log in.');
  }

  if (!triageId) {
    console.error('updateTriageDoctorNote: No triageId provided');
    throw new Error('Triage ID is required');
  }

  try {
    const cookieHeader = await getCookieHeader();
    console.log('updateTriageDoctorNote: Cookie header:', cookieHeader);
    console.log('updateTriageDoctorNote: Sending request to:', `${process.env.NEXT_PUBLIC_SERVER_URL}/api/triage/${triageId}/doctor-note`);
    console.log('updateTriageDoctorNote: Request data:', { overallStatus, statusNote });
    
    const response = await axios.patch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/triage/${triageId}/doctor-note`,
      { overallStatus, statusNote },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'Cookie': cookieHeader,
        },
        withCredentials: true,
      }
    );
    
    console.log('updateTriageDoctorNote: Response received:', response.data);
    return response.data.triage;
  } catch (error: any) {
    console.error('updateTriageDoctorNote: Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
    });
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }
    if (error.response?.status === 403) {
      throw new Error('Only doctors can override triage status.');
    }
    
    throw new Error(error.response?.data?.error || error.response?.data?.message || 'Failed to update triage doctor note');
  }
}

export async function getAllTriages(): Promise<TriageRecord[]> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  console.log('getAllTriages: Access token:', accessToken ? 'Present' : 'Missing');

  if (!accessToken) {
    console.error('getAllTriages: No access token found');
    throw new Error('Unauthorized: No access token found. Please log in.');
  }

  try {
    const cookieHeader = await getCookieHeader();
    console.log('getAllTriages: Cookie header:', cookieHeader);
    console.log('getAllTriages: Sending request to:', `${process.env.NEXT_PUBLIC_SERVER_URL}/api/allTriage`);
    
    const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/allTriage`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Cookie': cookieHeader,
      },
      withCredentials: true,
    });
    
    console.log('getAllTriages: Response received:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('getAllTriages: Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
    });
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }
    
    throw new Error(error.response?.data?.error || error.response?.data?.message || 'Failed to fetch all triage records');
  }
}



export async function getPatients(params: GetPatientsParams = {}): Promise<GetPatientsResponse> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    throw new AuthenticationError('Unauthorized: No access token found. Please log in.', 401);
  }

  try {
    const { search, limit = 10, offset = 0 } = params;
    const queryParams = new URLSearchParams();
    if (search) queryParams.append('search', search);
    queryParams.append('limit', limit.toString());
    queryParams.append('offset', offset.toString());

    const url = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/patients?${queryParams.toString()}`;
    console.log('getPatients: Sending request to:', url);

    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      withCredentials: true,
    });

    console.log('getPatients: Full response:', JSON.stringify(response.data, null, 2));

    const patientsData = response.data?.data ?? [];
    const count = response.data?.count ?? patientsData.length;
    const totalCount = response.data?.totalCount ?? patientsData.length;

    const formattedPatients: PatientSummary[] = patientsData.map((patient: any) => ({
      id: patient.id,
      fullName: patient.fullName || '',
      patientNumber: patient.patientNumber || '',
      gender: patient.gender ? { id: patient.gender.id, gender: patient.gender.gender } : undefined,
      billingType: patient.billingType ? { id: patient.billingType.id, billingType: patient.billingType.billingType } : undefined,
      county: patient.county ? { id: patient.county.id, countyName: patient.county.countyName } : undefined,
      triage: patient.triageRecords?.[0] ? { id: patient.triageRecords[0].id, triageCategory: patient.triageRecords[0].triageCategory } : null,
    }));

    return {
      data: formattedPatients,
      count,
      totalCount,
    };
  } catch (error: any) {
    console.error('getPatients: Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    if (error.response?.status === 401) {
      throw new AuthenticationError('Authentication failed. Please log in again.', 401);
    }

    const message = error.response?.data?.message || 'Failed to fetch patients';
    throw new Error(message);
  }
}

// Custom error class for consistency with backend
class AuthenticationError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AuthenticationError';
  }
}