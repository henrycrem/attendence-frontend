'use server';

import { cookies } from 'next/headers';
import axios from 'axios';

interface Doctor {
  id: string;
  title: string | null;
  firstName: string | null;
  lastName: string;
  middleName: string | null;
  emailWork: string | null;
  emailPersonal: string | null;
  mobilePrimary: string | null;
  mobileSecondary: string | null;
  entityId: string | null;
  ourDoctor: boolean | null;
  fullName: string | null;
  createdAt: string;
  updatedAt: string;
  entity?: {
    id: string;
    entityName: string;
  };
  specializations: string[];
}

interface DoctorFormData {
  title?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  emailWork: string;
  emailPersonal?: string;
  mobilePrimary: string;
  mobileSecondary?: string;
  entityId?: string;
  ourDoctor?: boolean;
  consultationIds?: string[];
}

export async function getAllDoctors(): Promise<Doctor[]> {
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
  console.log('getDoctors: Sending request to:', `${process.env.NEXT_PUBLIC_SERVER_URL}/api/doctors`);

  const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/doctors`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'Cookie': cookieHeader,
    },
    withCredentials: true,
  });

  console.log("doctor data", response.data);

  return response.data.data.map((doctor: any) => ({ // ←← fix here
    ...doctor,
    createdAt: doctor.createdAt?.toString() || '',
    updatedAt: doctor.updatedAt?.toString() || '',
  }));
} catch (error: any) {
  console.error('Get all doctors error:', error.response?.data || error.message);
  throw new Error(error.response?.data?.message || 'Failed to fetch doctors');
}
}

export async function searchDoctors(query: string): Promise<Doctor[]> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    throw new Error('Unauthorized: No access token found. Please log in.');
  }

  if (!query.trim()) {
    return [];
  }

  try {
    const cookieHeader = await getCookieHeader();
    const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/doctors/search`, {
      params: { query },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Cookie': cookieHeader,
      },
      withCredentials: true,
    });

    console.log('Search response:', response.data); // 💡 Debugging line

    // Safely extract doctors list
    const doctorsArray = response.data?.data ?? response.data;

    if (!Array.isArray(doctorsArray)) {
      throw new Error('Unexpected API response format: expected an array');
    }

    return doctorsArray.map((doctor: any) => ({
      ...doctor,
      createdAt: doctor.createdAt?.toString() ?? '',
      updatedAt: doctor.updatedAt?.toString() ?? '',
    }));
  } catch (error: any) {
    console.error('Search doctors error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to search doctors');
  }
}

async function getCookieHeader() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  return allCookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
}

export async function createDoctor(data: DoctorFormData): Promise<Doctor> {
   const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    console.log('getGenders: Access token:', accessToken ? 'Present' : 'Missing');
  
    if (!accessToken) {
      console.error('getGenders: No access token found');
      throw new Error('Unauthorized: No access token found. Please log in.');
    }

    const cookieHeader = await getCookieHeader();


  try {
    const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/doctors`, data, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
         'Cookie': cookieHeader,
      },
      withCredentials: true,
    });

    return {
      ...response.data.data,
    //   createdAt: response.data.data.createdAt.toString(),
    //   updatedAt: response.data.data.updatedAt.toString(),
    };
  } catch (error: any) {
    console.error('Create doctor error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to create doctor');
  }
}

export async function getDoctorById(id: string): Promise<Doctor> {
   const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  try {
    const cookieHeader = await getCookieHeader();
    const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/doctors/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Cookie': cookieHeader,
      },
      withCredentials: true,
    });

    return {
      ...response.data.data,
      createdAt: response.data.data.createdAt.toString(),
      updatedAt: response.data.data.updatedAt.toString(),
    };
  } catch (error: any) {
    console.error('Get doctor by ID error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch doctor');
  }
}