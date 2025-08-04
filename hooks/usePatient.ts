
'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// Fetch all patients
export const useGetAllPatients = () => {
  return useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/patient`, {
        withCredentials: true,
      });
      return response.data;
    },
    onError: (error: any) => {
      if (error.response?.status === 401) {
        window.location.href = '/login'; // Redirect to login on 401
      }
    },
  });
};

// Fetch patient by ID
export const useGetPatientById = (patientId: string) => {
  return useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/patient/${patientId}`,
        { withCredentials: true }
      );
      return response.data;
    },
    enabled: !!patientId, // Only run if patientId is provided
    onError: (error: any) => {
      if (error.response?.status === 401) {
        window.location.href = '/';
      }
    },
  });
};