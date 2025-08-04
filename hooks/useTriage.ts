
'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// Fetch all triage records
export const useGetAllTriages = () => {
  return useQuery({
    queryKey: ['triages'],
    queryFn: async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/triage`, {
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

// Fetch a triage record by ID
export const useGetTriageById = (triageId: string) => {
  return useQuery({
    queryKey: ['triage', triageId],
    queryFn: async () => {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/triage/${triageId}`,
        { withCredentials: true }
      );
      return response.data;
    },
    enabled: !!triageId, // Only run if triageId is provided
    onError: (error: any) => {
      if (error.response?.status === 401) {
        window.location.href = '/login';
      }
    },
  });
};

// Fetch triage records by patient ID
export const useGetTriageByPatientId = (patientId: string) => {
  return useQuery({
    queryKey: ['triage', 'patient', patientId],
    queryFn: async () => {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/triage/patient/${patientId}`,
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