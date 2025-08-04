'use server';

import { cookies } from 'next/headers';
import axios from 'axios';
import { startOfDay, endOfDay } from 'date-fns';

interface DoctorAvailability {
  id: string;
  doctorId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isRecurring: boolean;
  validFrom: string;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  visitId: string | null;
  triageId: string | null;
  startTime: string;
  endTime: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  doctor: { id: string; fullName: string };
  patient: { id: string; fullName: string };
  triage: { id: string; triageCategory: string } | null;
  visit?: any
}

interface Doctor {
  id: string;
  fullName: string;
}

interface Patient {
  id: string;
  fullName: string;
  triageId: string | null;
}

interface AvailabilityFormData {
  doctorId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
    triageId?: string
  slotDuration: number;
  isRecurring: boolean;
  validFrom: string;
  validUntil?: string;
}

interface AppointmentFormData {
  doctorId: string;
  patientId: string;
  triageId?: string;
  startTime: string;
  duration: number;
  notes?: string;
}

interface UpdateAppointmentFormData {
  id: string;
  startTime?: string;
  duration?: number;
  status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
}

class AppointmentError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppointmentError';
  }
}

interface GetPatientsParams {
  search?: string;
  limit?: number;
  offset?: number;
  date?: string; // Optional date filter for triage records
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

async function getCookieHeader() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  return allCookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
}

export async function createDoctorAvailability(data: AvailabilityFormData): Promise<DoctorAvailability> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  console.log('createDoctorAvailability: Access token:', accessToken ? 'Present' : 'Missing');

  if (!accessToken) {
    console.error('createDoctorAvailability: No access token found');
    throw new Error('Unauthorized: No access token found. Please log in.');
  }

  try {
    const cookieHeader = await getCookieHeader();
    console.log('createDoctorAvailability: Cookie header:', cookieHeader);
    console.log('createDoctorAvailability: Sending request to:', `${process.env.NEXT_PUBLIC_SERVER_URL}/api/appointments/availability`);

    const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/appointments/availability`, data, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Cookie': cookieHeader,
      },
      withCredentials: true,
    });

    return {
      ...response.data.data,
      startTime: response.data.data.startTime.toString(),
      endTime: response.data.data.endTime.toString(),
      validFrom: response.data.data.validFrom.toString(),
      validUntil: response.data.data.validUntil?.toString() || null,
      createdAt: response.data.data.createdAt.toString(),
      updatedAt: response.data.data.updatedAt.toString(),
    };
  } catch (error: any) {
    console.error('Create doctor availability error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to create availability');
  }
}

export async function getDoctorAvailability(doctorId: string, date: string): Promise<TimeSlot[]> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    throw new Error('Unauthorized: No access token found. Please log in.');
  }

  if (!doctorId?.trim() || !date?.trim()) {
    throw new AppointmentError('Doctor ID and date are required', 400);
  }

  try {
    const cookieHeader = await getCookieHeader();
    console.log('getDoctorAvailability: Input:', { doctorId, date, accessToken });

    const url = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/appointments/availability/${doctorId}`;
    console.log('getDoctorAvailability: Requesting:', { url, date });

    const response = await axios.get(url, {
      params: { date },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Cookie': cookieHeader,
      },
      withCredentials: true,
    });

    console.log('getDoctorAvailability: Success response:', response.data);
    return response.data; // Note: The backend already returns an array of TimeSlot
  } catch (error: any) {
    console.error('getDoctorAvailability: Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    throw new AppointmentError(
      error.response?.data?.message || 'Failed to fetch availability',
      error.response?.status || 500
    );
  }
}


export async function createAppointment(data: AppointmentFormData): Promise<Appointment> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("access_token")?.value
  console.log("createAppointment: Access token:", accessToken ? "Present" : "Missing")

  if (!accessToken) {
    console.error("createAppointment: No access token found")
    throw new AppointmentError("Unauthorized: No access token found. Please log in.", 401)
  }

  // Validate input
  if (!data.doctorId) {
    throw new AppointmentError("Doctor ID is required", 400)
  }
  if (!data.patientId) {
    throw new AppointmentError("Patient ID is required", 400)
  }
  if (!data.startTime) {
    throw new AppointmentError("Start time is required", 400)
  }
  if (!data.duration || data.duration < 5) {
    throw new AppointmentError("Valid duration is required (minimum 5 minutes)", 400)
  }

  try {
    const cookieHeader = await getCookieHeader()
    console.log("createAppointment: Sending data:", data)

    const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/appointments`, data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        Cookie: cookieHeader,
      },
      withCredentials: true,
    })

    console.log("createAppointment: Success response:", response.data)

    const appointmentData = response.data.data.appointment

    // Safely handle date conversions with proper null checks
    const formatDate = (dateValue: any): string => {
      if (!dateValue) return new Date().toISOString()
      if (typeof dateValue === "string") return dateValue
      if (dateValue instanceof Date) return dateValue.toISOString()
      return new Date(dateValue).toISOString()
    }

    return {
      id: appointmentData.id,
      doctorId: appointmentData.doctorId,
      patientId: appointmentData.patientId,
      visitId: appointmentData.visitId,
      triageId: appointmentData.triageId || null,
      startTime: formatDate(appointmentData.startTime),
      endTime: formatDate(appointmentData.endTime),
      status: appointmentData.status || "SCHEDULED",
      notes: appointmentData.notes || "",
      createdAt: formatDate(appointmentData.createdAt),
      updatedAt: formatDate(appointmentData.updatedAt),
      doctor: appointmentData.doctor,
      patient: appointmentData.patient,
      triage: appointmentData.triage,
      visit: appointmentData.visit,
    }
  } catch (error: any) {
    console.error("createAppointment: Error:", {
      message: error.message,
      status: error.response?.status || 500,
      data: error.response?.data,
      stack: error.stack,
    })

    throw new AppointmentError(
      error.response?.data?.message || error.message || "Failed to create appointment",
      error.response?.status || 500,
    )
  }
}

export async function getAppointments({
  doctorId,
  patientId,
  date,
}: {
  doctorId?: string;
  patientId?: string;
  date?: string;
}): Promise<Appointment[]> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  console.log('getAppointments: Access token:', accessToken ? 'Present' : 'Missing');

  if (!accessToken) {
    console.error('getAppointments: No access token found');
    throw new Error('Unauthorized: No access token found. Please log in.');
  }

  try {
    const cookieHeader = await getCookieHeader();
    console.log('getAppointments: Cookie header:', cookieHeader);
    console.log('getAppointments: Sending request to:', `${process.env.NEXT_PUBLIC_SERVER_URL}/api/appointments`);

    const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/appointments`, {
      params: { doctorId, patientId, date },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Cookie': cookieHeader,
      },
      withCredentials: true,
    });

    return response.data.data.map((appt: any) => ({
      ...appt,
      startTime: appt.startTime.toString(),
      endTime: appt.endTime.toString(),
      createdAt: appt.createdAt.toString(),
      updatedAt: appt.updatedAt.toString(),
    }));
  } catch (error: any) {
    console.error('Get appointments error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch appointments');
  }
}

export async function updateAppointment(data: UpdateAppointmentFormData): Promise<Appointment> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  console.log('updateAppointment: Access token:', accessToken ? 'Present' : 'Missing');

  if (!accessToken) {
    console.error('updateAppointment: No access token found');
    throw new Error('Unauthorized: No access token found. Please log in.');
  }

  try {
    const cookieHeader = await getCookieHeader();
    console.log('updateAppointment: Cookie header:', cookieHeader);
    console.log('updateAppointment: Sending request to:', `${process.env.NEXT_PUBLIC_SERVER_URL}/api/appointments/${data.id}`);

    const response = await axios.put(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/appointments/${data.id}`, data, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Cookie': cookieHeader,
      },
      withCredentials: true,
    });

    return {
      ...response.data.data,
      startTime: response.data.data.startTime.toString(),
      endTime: response.data.data.endTime.toString(),
      createdAt: response.data.data.createdAt.toString(),
      updatedAt: response.data.data.updatedAt.toString(),
    };
  } catch (error: any) {
    console.error('Update appointment error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to update appointment');
  }
}

export async function cancelAppointment(id: string): Promise<Appointment> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  console.log('cancelAppointment: Access token:', accessToken ? 'Present' : 'Missing');

  if (!accessToken) {
    console.error('cancelAppointment: No access token found');
    throw new Error('Unauthorized: No access token found. Please log in.');
  }

  try {
    const cookieHeader = await getCookieHeader();
    console.log('cancelAppointment: Cookie header:', cookieHeader);
    console.log('cancelAppointment: Sending request to:', `${process.env.NEXT_PUBLIC_SERVER_URL}/api/appointments/${id}/cancel`);

    const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/appointments/${id}/cancel`, {}, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Cookie': cookieHeader,
      },
      withCredentials: true,
    });

    return {
      ...response.data.data,
      startTime: response.data.data.startTime.toString(),
      endTime: response.data.data.endTime.toString(),
      createdAt: response.data.data.createdAt.toString(),
      updatedAt: response.data.data.updatedAt.toString(),
    };
  } catch (error: any) {
    console.error('Cancel appointment error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to cancel appointment');
  }
}

export async function getDoctors(): Promise<Doctor[]> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  console.log('getDoctors: Access token:', accessToken ? 'Present' : 'Missing');

  if (!accessToken) {
    console.error('getDoctors: No access token found');
    throw new Error('Unauthorized: No access token found. Please log in.');
  }

  try {
    const cookieHeader = await getCookieHeader();
    console.log('getDoctors: Cookie header:', cookieHeader);
    console.log('getDoctors: Sending request to:', `${process.env.NEXT_PUBLIC_SERVER_URL}/api/doctors`);

    const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/doctors`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Cookie': cookieHeader,
      },
      withCredentials: true,
    });

    return response.data.data.map((doctor: any) => ({
      ...doctor,
      createdAt: doctor.createdAt?.toString() || '',
      updatedAt: doctor.updatedAt?.toString() || '',
    }));
  } catch (error: any) {
    console.error('Get doctors error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch doctors');
  }
}

export async function getPatients(): Promise<Patient[]> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  console.log('getPatients: Access token:', accessToken ? 'Present' : 'Missing');

  if (!accessToken) {
    console.error('getPatients: No access token found');
    throw new Error('Unauthorized: No access token found. Please log in.');
  }

  try {
    const cookieHeader = await getCookieHeader();
    console.log('getPatients: Cookie header:', cookieHeader);
    console.log('getPatients: Sending request to:', `${process.env.NEXT_PUBLIC_SERVER_URL}/api/patients`);

    const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/patients`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Cookie': cookieHeader,
      },
      withCredentials: true,
    });

    return response.data.data.map((patient: any) => ({
      id: patient.id,
      fullName: patient.fullName,
      triageId: patient.triageRecords?.[0]?.id || null,
    }));
  } catch (error: any) {
    console.error('Get patients error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch patients');
  }
}




export async function getDoctorAvailabilities(doctorId: string): Promise<DoctorAvailability[]> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  console.log('getDoctorAvailabilities: Access token:', accessToken ? 'Present' : 'Missing');

  if (!accessToken) {
    console.error('getDoctorAvailabilities: No access token found');
    throw new Error('Unauthorized: No access token found. Please log in.');
  }

  if (!doctorId?.trim()) {
    throw new AppointmentError('Doctor ID is required', 400);
  }

  try {
    const cookieHeader = await getCookieHeader();
    const url = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/appointments/availability`;
    console.log('getDoctorAvailabilities: Sending request to:', url, 'with doctorId:', doctorId);

    const response = await axios.get(url, {
      params: { doctorId },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Cookie': cookieHeader,
      },
      withCredentials: true,
    });

    console.log('getDoctorAvailabilities: Response:', response.data);

    return response.data.data.map((avail: any) => ({
      ...avail,
      startTime: avail.startTime.toString(),
      endTime: avail.endTime.toString(),
      validFrom: avail.validFrom.toString(),
      validUntil: avail.validUntil?.toString() || null,
      createdAt: avail.createdAt.toString(),
      updatedAt: avail.updatedAt.toString(),
    }));
  } catch (error: any) {
    console.error('getDoctorAvailabilities: Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      doctorId,
    });
    throw new AppointmentError(
      error.response?.data?.message || 'Failed to fetch availabilities',
      error.response?.status || 500
    );
  }
}


export async function getAppointmentPatients(params: GetPatientsParams = {}): Promise<GetPatientsResponse> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  

  try {
    const { search, limit = 10, offset = 0, date } = params;
    const queryParams = new URLSearchParams();
    if (search) queryParams.append('search', search);
    queryParams.append('limit', limit.toString());
    queryParams.append('offset', offset.toString());
    if (date) {
      const start = startOfDay(new Date(date)).toISOString();
      const end = endOfDay(new Date(date)).toISOString();
      queryParams.append('triageCreatedAt_gte', start);
      queryParams.append('triageCreatedAt_lte', end);
    } else {
      const today = new Date();
      queryParams.append('triageCreatedAt_gte', startOfDay(today).toISOString());
      queryParams.append('triageCreatedAt_lte', endOfDay(today).toISOString());
    }

    const url = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/patients?${queryParams.toString()}`;
    console.log('getPatients: Sending request to:', url);

    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      withCredentials: true,
    });

    console.log('getPatients: Response:', JSON.stringify(response.data, null, 2));

    const patientsData = response.data?.data ?? [];
    const count = response.data?.count ?? patientsData.length;
    const totalCount = response.data?.totalCount ?? patientsData.length;

    const formattedPatients: PatientSummary[] = patientsData.map((patient: any) => ({
      id: patient.id,
      fullName: patient.fullName || '',
      patientNumber: patient.patientNumber || '',
      gender: patient.gender ? { id: patient.gender.id, gender: patient.gender.gender } : undefined,
      billingType: patient.billingType ? { id: patient.billingType.id, bookingType: patient.billingType.billingType } : undefined,
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

   

    const message = error.response?.data?.message || 'Failed to fetch patients';
    throw new Error(message);
  }
}