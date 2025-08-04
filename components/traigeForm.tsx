"use client";
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Thermometer, Activity, Wind, Droplets, User, Search, Plus, Loader2, Stethoscope, UserCheck, UserPlus, X, Calendar, MapPin, Save, Phone, Users, Clock, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Edit2 } from 'lucide-react';
import { createMinimalPatient, createTriage, searchPatients, getGenders, getTriageByPatientId, updateTriageDoctorNote } from '../actions/triageActions';
import { getCurrentUserAction } from '../actions/auth';
import { useDebounce } from 'use-debounce';
import toast, { Toaster } from 'react-hot-toast';

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
}

interface Patient {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName?: string;
  genderId?: string;
  dateOfBirth?: string;
  primaryPhone?: string;
  primaryEmail?: string;
  address?: string;
  patientNumber?: string;
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
  overallStatus?: 'STABLE' | 'NEEDS_ATTENTION' | 'CRITICAL';
  statusNote?: string;
}

interface PatientCreationFormData {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: string;
  genderId?: string;
  address?: string;
  primaryPhone: string;
  displayAge?: string; // Added for age display
  dateOfBirthWasManuallySet?: boolean; // Track if DOB was manually entered
}

interface DoctorOverrideFormData {
  overallStatus: 'STABLE' | 'NEEDS_ATTENTION' | 'CRITICAL';
  statusNote: string;
}

interface Gender {
  id: string;
  gender: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: {
    id: string;
    displayName: string;
    roleName: string;
    description: string;
    permissions: string[];
  };
  permissions: string[];
  lastLogin: string;
  stats: { patients: number; appointments: number; surgeries: number };
}

const TriageForm: React.FC = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<TriageFormData>({
    patientId: '',
    firstName: '',
    middleName: '',
    lastName: '',
    genderId: '',
    temperature: 36.5,
    bloodPressure: '120/80',
    pulse: 70,
    bloodOxygenLevel: 98,
    respirationRate: 16,
  });

  const [patientFormData, setPatientFormData] = useState<PatientCreationFormData>({
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    genderId: '',
    address: '',
    primaryPhone: '',
    displayAge: '',
    dateOfBirthWasManuallySet: false,
  });

  const [doctorOverrideFormData, setDoctorOverrideFormData] = useState<DoctorOverrideFormData>({
    overallStatus: 'STABLE',
    statusNote: '',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [showCreatePatientDrawer, setShowCreatePatientDrawer] = useState(false);
  const [showDoctorOverrideDrawer, setShowDoctorOverrideDrawer] = useState(false);
  const [selectedTriageId, setSelectedTriageId] = useState<string | null>(null);
  const [overallStatus, setOverallStatus] = useState<'STABLE' | 'NEEDS_ATTENTION' | 'CRITICAL'>('STABLE');
  const [overrideNote, setOverrideNote] = useState<string>('');

  // Fetch current user
  const currentUserQuery = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const user = await getCurrentUserAction();
        return user;
      } catch (error: any) {
        toast.error(error.message || 'Failed to fetch current user');
        throw error;
      }
    },
    retry: false,
  });

  const isDoctor = currentUserQuery.data?.role?.roleName === 'doctor';

  // Fetch genders
  const gendersQuery = useQuery({
    queryKey: ['genders'],
    queryFn: async () => {
      try {
        const genders = await getGenders();
        return genders;
      } catch (error: any) {
        toast.error(error.message || 'Failed to fetch genders');
        throw error;
      }
    },
    retry: false,
  });

  // Search patients
  const searchPatientsQuery = useQuery({
    queryKey: ['patients', debouncedSearchQuery],
    queryFn: async () => {
      if (!debouncedSearchQuery) return { patients: [], count: 0 };
      try {
        return await searchPatients(debouncedSearchQuery);
      } catch (error: any) {
        toast.error(error.message || 'Failed to search patients');
        throw error;
      }
    },
    enabled: !!debouncedSearchQuery,
  });

  // Fetch triage history for selected patient
  const triageHistoryQuery = useQuery({
    queryKey: ['triageHistory', selectedPatient?.id],
    queryFn: async () => {
      if (!selectedPatient?.id) return [];
      try {
        return await getTriageByPatientId(selectedPatient.id);
      } catch (error: any) {
        toast.error(error.message || 'Failed to fetch triage history');
        throw error;
      }
    },
    enabled: !!selectedPatient?.id,
  });

  const createPatientMutation = useMutation({
    mutationFn: createMinimalPatient,
    onSuccess: (newPatient) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      handlePatientSelect(newPatient);
      setPatientFormData({
        firstName: '',
        middleName: '',
        lastName: '',
        dateOfBirth: '',
        genderId: '',
        address: '',
        primaryPhone: '',
        displayAge: '',
        dateOfBirthWasManuallySet: false,
      });
      setShowCreatePatientDrawer(false);
      toast.success('Patient created successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create patient');
    },
  });

  const createTriageMutation = useMutation({
    mutationFn: createTriage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['triageHistory', selectedPatient?.id] });
      toast.success('Triage record created successfully!');
      setTimeout(() => {
        setFormData({
          patientId: '',
          firstName: '',
          middleName: '',
          lastName: '',
          genderId: '',
          temperature: 36.5,
          bloodPressure: '120/80',
          pulse: 70,
          bloodOxygenLevel: 98,
          respirationRate: 16,
        });
        setSelectedPatient(null);
        setOverrideNote('');
        setOverallStatus('STABLE');
      }, 3000);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create triage record');
    },
  });

  const updateDoctorNoteMutation = useMutation({
    mutationFn: ({ triageId, overallStatus, doctorNote }: { triageId: string; overallStatus: 'STABLE' | 'NEEDS_ATTENTION' | 'CRITICAL'; doctorNote: string }) =>
      updateTriageDoctorNote(triageId, overallStatus, doctorNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['triageHistory', selectedPatient?.id] });
      setShowDoctorOverrideDrawer(false);
      setDoctorOverrideFormData({ overallStatus: 'STABLE', statusNote: '' });
      setSelectedTriageId(null);
      toast.success('Doctor override saved successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save doctor override');
    },
  });

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormData((prev) => ({
      ...prev,
      patientId: patient.patientNumber || '',
      firstName: patient.firstName,
      middleName: patient.middleName || '',
      lastName: patient.lastName,
      genderId: patient.genderId || '',
    }));
    setShowPatientSearch(false);
    setSearchQuery('');
  };

  const handleInputChange = (field: keyof TriageFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePatientFormChange = (field: keyof PatientCreationFormData, value: string) => {
    setPatientFormData((prev) => {
      const updatedData = { ...prev, [field]: value };

      // If updating dateOfBirth, calculate and update displayAge
      if (field === 'dateOfBirth' && value) {
        const calculatedAge = calculateAge(new Date(value)).toString();
        return { ...updatedData, displayAge: calculatedAge, dateOfBirthWasManuallySet: true };
      }

      // If updating displayAge, clear dateOfBirth if it was previously calculated from age
      if (field === 'displayAge' && prev.dateOfBirth && !prev.dateOfBirthWasManuallySet) {
        const estimatedDOB = calculateDateOfBirthFromAge(value);
        return { ...updatedData, dateOfBirth: estimatedDOB, dateOfBirthWasManuallySet: false };
      }

      return updatedData;
    });
  };

  const handleDoctorOverrideChange = (field: keyof DoctorOverrideFormData, value: string) => {
    setDoctorOverrideFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateTriageForm = (): boolean => {
    if (!formData.patientId || !formData.firstName || !formData.lastName) {
      toast.error('Please select a patient and fill in all required fields.');
      return false;
    }
    if (formData.temperature < 30 || formData.temperature > 45) {
      toast.error('Temperature must be between 30°C and 45°C.');
      return false;
    }
    if (formData.pulse < 30 || formData.pulse > 200) {
      toast.error('Pulse must be between 30 and 200 BPM.');
      return false;
    }
    if (formData.bloodOxygenLevel < 70 || formData.bloodOxygenLevel > 100) {
      toast.error('Blood oxygen level must be between 70% and 100%.');
      return false;
    }
    if (formData.respirationRate < 5 || formData.respirationRate > 50) {
      toast.error('Respiration rate must be between 5 and 50 breaths per minute.');
      return false;
    }
    if (!formData.bloodPressure.match(/^\d{2,3}\/\d{2,3}$/)) {
      toast.error('Blood pressure must be in format systolic/diastolic (e.g., 120/80).');
      return false;
    }
    return true;
  };

  const validatePatientForm = (): boolean => {
    if (!patientFormData.firstName || !patientFormData.lastName || !patientFormData.primaryPhone) {
      toast.error('First name, last name, and phone number are required.');
      return false;
    }
    const phoneRegex = /^[0-9+\-\s]{7,15}$/;
    if (!phoneRegex.test(patientFormData.primaryPhone)) {
      toast.error('Phone number must be 7-15 digits, allowing +, -, or spaces.');
      return false;
    }
    return true;
  };

  const validateDoctorOverrideForm = (): boolean => {
    if (!doctorOverrideFormData.overallStatus) {
      toast.error('Please select an overall status.');
      return false;
    }
    if (!doctorOverrideFormData.statusNote || doctorOverrideFormData.statusNote.trim().length < 10) {
      toast.error('Doctor note must be at least 10 characters long.');
      return false;
    }
    return true;
  };

  const handleCreatePatient = async () => {
    if (!validatePatientForm()) return;
    createPatientMutation.mutate(patientFormData);
  };

  const handleSubmitTriage = async () => {
    if (!validateTriageForm()) return;
    const triageData = {
      ...formData,
      overallStatus: overallStatus,
      statusNote: overrideNote || undefined,
    };
    createTriageMutation.mutate(triageData);
  };

  const handleDoctorOverrideSubmit = async () => {
    if (!validateDoctorOverrideForm()) return;
    setOverallStatus(doctorOverrideFormData.overallStatus);
    setOverrideNote(doctorOverrideFormData.statusNote);
    setShowDoctorOverrideDrawer(false);
    setDoctorOverrideFormData({ overallStatus: 'STABLE', statusNote: '' });
    toast.success('Status override applied. Please save the triage record.');
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowPatientSearch(!!value);
  };

  const determineVitalSignStatus = (
    vital: number | string,
    type: 'temperature' | 'bloodPressure' | 'pulse' | 'bloodOxygen' | 'respiration'
  ): 'LOW' | 'NORMAL' | 'HIGH' => {
    const age = selectedPatient?.dateOfBirth ? parseInt(calculateAge(new Date(selectedPatient.dateOfBirth))) : 30;
    const isAdult = age >= 18;

    switch (type) {
      case 'temperature':
        const temp = Number(vital);
        if (isAdult) {
          if (temp < 36.1) return 'LOW';
          if (temp > 37.2) return 'HIGH';
          return 'NORMAL';
        } else {
          if (temp < 36.4) return 'LOW';
          if (temp > 37.5) return 'HIGH';
          return 'NORMAL';
        }

      case 'bloodPressure':
        const [systolic, diastolic] = (vital as string).split('/').map(Number);
        if (isAdult) {
          if (systolic < 90 || diastolic < 60) return 'LOW';
          if (systolic > 120 || diastolic > 80) return 'HIGH';
          return 'NORMAL';
        } else {
          if (systolic < 90 || diastolic < 50) return 'LOW';
          if (systolic > 110 || diastolic > 70) return 'HIGH';
          return 'NORMAL';
        }

      case 'pulse':
        const pulse = Number(vital);
        if (isAdult) {
          if (pulse < 60) return 'LOW';
          if (pulse > 100) return 'HIGH';
          return 'NORMAL';
        } else {
          if (pulse < 70) return 'LOW';
          if (pulse > 120) return 'HIGH';
          return 'NORMAL';
        }

      case 'bloodOxygen':
        const oxygen = Number(vital);
        if (oxygen < 95) return 'LOW';
        return 'NORMAL';

      case 'respiration':
        const respiration = Number(vital);
        if (isAdult) {
          if (respiration < 12) return 'LOW';
          if (respiration > 20) return 'HIGH';
          return 'NORMAL';
        } else {
          if (respiration < 20) return 'LOW';
          if (respiration > 30) return 'HIGH';
          return 'NORMAL';
        }

      default:
        return 'NORMAL';
    }
  };

  const determineOverallStatus = (
    temperatureStatus: 'LOW' | 'NORMAL' | 'HIGH',
    bloodPressureStatus: 'LOW' | 'NORMAL' | 'HIGH',
    pulseStatus: 'LOW' | 'NORMAL' | 'HIGH',
    bloodOxygenStatus: 'LOW' | 'NORMAL' | 'HIGH',
    respirationStatus: 'LOW' | 'NORMAL' | 'HIGH'
  ): 'STABLE' | 'NEEDS_ATTENTION' | 'CRITICAL' => {
    const criticalConditions = [
      bloodOxygenStatus === 'LOW',
      temperatureStatus === 'HIGH' && formData.temperature > 39,
      bloodPressureStatus === 'LOW' && Number(formData.bloodPressure.split('/')[0]) < 80,
    ];

    if (criticalConditions.some(Boolean)) {
      return 'CRITICAL';
    }

    const needsAttention = [
      temperatureStatus !== 'NORMAL',
      bloodPressureStatus !== 'NORMAL',
      pulseStatus !== 'NORMAL',
      bloodOxygenStatus !== 'NORMAL',
      respirationStatus !== 'NORMAL',
    ];

    if (needsAttention.some(Boolean)) {
      return 'NEEDS_ATTENTION';
    }

    return 'STABLE';
  };

  const calculateAge = (dateOfBirth: Date): string => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  const calculateDateOfBirthFromAge = (age: string) => {
    if (!age || isNaN(parseInt(age)) || parseInt(age) < 0 || parseInt(age) > 150) return '';
    const today = new Date();
    const birthYear = today.getFullYear() - parseInt(age);
    const estimatedDOB = new Date(birthYear, 0, 1);
    return estimatedDOB.toISOString().split('T')[0];
  };

  // Synchronize dateOfBirth with displayAge
  useEffect(() => {
    if (patientFormData.displayAge && !patientFormData.dateOfBirthWasManuallySet) {
      const estimatedDOB = calculateDateOfBirthFromAge(patientFormData.displayAge);
      setPatientFormData((prev) => ({ ...prev, dateOfBirth: estimatedDOB }));
    }
  }, [patientFormData.displayAge]);

  // Compute overallStatus in real-time (only if not overridden)
  useEffect(() => {
    if (!overrideNote) {
      const temperatureStatus = determineVitalSignStatus(formData.temperature, 'temperature');
      const bloodPressureStatus = determineVitalSignStatus(formData.bloodPressure, 'bloodPressure');
      const pulseStatus = determineVitalSignStatus(formData.pulse, 'pulse');
      const bloodOxygenStatus = determineVitalSignStatus(formData.bloodOxygenLevel, 'bloodOxygen');
      const respirationStatus = determineVitalSignStatus(formData.respirationRate, 'respiration');

      const status = determineOverallStatus(
        temperatureStatus,
        bloodPressureStatus,
        pulseStatus,
        bloodOxygenStatus,
        respirationStatus
      );
      setOverallStatus(status);
    }
  }, [formData, overrideNote]);

  const getVitalStatus = (vital: string, value: number | string) => {
    return {
      status: determineVitalSignStatus(value, vital as any),
      color: determineVitalSignStatus(value, vital as any) === 'LOW' ? 'text-blue-600' : determineVitalSignStatus(value, vital as any) === 'HIGH' ? 'text-red-600' : 'text-green-600',
      bgColor: determineVitalSignStatus(value, vital as any) === 'LOW' ? 'bg-blue-100' : determineVitalSignStatus(value, vital as any) === 'HIGH' ? 'bg-red-100' : 'bg-green-100',
      borderColor: determineVitalSignStatus(value, vital as any) === 'LOW' ? 'border-blue-300' : determineVitalSignStatus(value, vital as any) === 'HIGH' ? 'border-red-300' : 'border-green-300',
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'HIGH':
        return <TrendingUp className="w-4 h-4 text-red-600" />;
      case 'LOW':
        return <TrendingDown className="w-4 h-4 text-blue-600" />;
      case 'NORMAL':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getOverallStatusStyles = (status: 'STABLE' | 'NEEDS_ATTENTION' | 'CRITICAL') => {
    switch (status) {
      case 'CRITICAL':
        return { color: 'text-red-600', bgColor: 'bg-red-100', borderColor: 'border-red-300' };
      case 'NEEDS_ATTENTION':
        return { color: 'text-yellow-600', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-300' };
      case 'STABLE':
        return { color: 'text-green-600', bgColor: 'bg-green-100', borderColor: 'border-green-300' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const TriageHistoryCard = ({ record }: { record: TriageRecord }) => (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-indigo-600" />
          <span className="text-sm font-medium text-gray-700">{formatDate(record.createdAt)}</span>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
          record.triageCategory === 'URGENT' 
            ? 'bg-red-100 text-red-700 border border-red-200' 
            : 'bg-green-100 text-green-700 border border-green-200'
        }`}>
          {record.triageCategory === 'URGENT' && <AlertTriangle className="w-3 h-3 inline mr-1" />}
          {record.triageCategory}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-gray-700">Temp</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800">{record.temperature}°C</span>
              {getStatusIcon(record.temperatureStatus)}
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-100">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Pulse</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800">{record.pulse} BPM</span>
              {getStatusIcon(record.pulseStatus)}
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-100">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">O2</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800">{record.bloodOxygenLevel}%</span>
              {getStatusIcon(record.bloodOxygenStatus)}
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-100">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">BP</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800">{record.bloodPressure}</span>
              {getStatusIcon(record.bloodPressureStatus)}
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-cyan-50 border border-cyan-100">
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-cyan-600" />
              <span className="text-sm font-medium text-gray-700">Resp</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800">{record.respirationRate}/min</span>
              {getStatusIcon(record.respirationStatus)}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 text-center">
            <span className="text-xs text-gray-500 font-medium">Overall Status</span>
            <div className={`mt-1 font-semibold ${getOverallStatusStyles(record.overallStatus).color}`}>
              {record.statusNote ? `Doctor Override: ${record.overallStatus}` : record.overallStatus}
            </div>
            {record.statusNote && (
              <div className="mt-2 text-xs text-gray-600 italic">
                Note: {record.statusNote}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 sm:p-6 lg:p-8">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-lg mb-4 transform hover:scale-105 transition-transform duration-200">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">Patient Triage Assessment</h1>
          <p className="text-gray-600 text-sm sm:text-base">Record vital signs, view automated status, and manage doctor overrides.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transform hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-md">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Patient Selection</h2>
              </div>

              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name or patient number..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors duration-200 bg-gray-50 text-sm sm:text-base"
                />
                {searchPatientsQuery.isFetching && (
                  <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 animate-spin text-blue-500" />
                )}
              </div>

              {showPatientSearch && debouncedSearchQuery && (
                <div className="mb-6 max-h-64 overflow-y-auto bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
                  {searchPatientsQuery.isLoading ? (
                    <div className="p-4 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
                      <div className="text-gray-500 text-sm">Searching patients...</div>
                    </div>
                  ) : searchPatientsQuery.data?.patients && searchPatientsQuery.data.patients.length > 0 ? (
                    searchPatientsQuery.data.patients.map((patient: Patient) => (
                      <div
                        key={patient.id}
                        onClick={() => handlePatientSelect(patient)}
                        className="p-4 hover:bg-blue-50 cursor-pointer border-b border-gray-200 last:border-b-0 transition-colors duration-200"
                      >
                        <div className="font-semibold text-gray-800 text-sm sm:text-base">{patient.fullName}</div>
                        <div className="text-xs text-gray-600">
                          {patient.patientNumber && <span>ID: {patient.patientNumber}</span>}
                          {patient.primaryPhone && <span className="ml-2">📞 {patient.primaryPhone}</span>}
                        </div>
                        {patient.address && (
                          <div className="text-xs text-gray-500 mt-1">📍 {patient.address}</div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center">
                      <div className="text-gray-500 mb-4 text-sm">No patients found matching "{debouncedSearchQuery}"</div>
                      <button
                        onClick={() => {
                          const searchParts = debouncedSearchQuery.trim().split(' ');
                          if (searchParts.length >= 1) {
                            setPatientFormData((prev) => ({
                              ...prev,
                              firstName: searchParts[0] || '',
                              lastName: searchParts[searchParts.length - 1] || '',
                              middleName: searchParts.length > 2 ? searchParts.slice(1, -1).join(' ') : '',
                            }));
                          }
                          setShowCreatePatientDrawer(true);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-400 to-blue-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 text-sm"
                      >
                        <UserPlus className="w-4 h-4" />
                        Create New Patient
                      </button>
                    </div>
                  )}
                </div>
              )}

              {selectedPatient && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <UserCheck className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-800 text-sm sm:text-base">Selected Patient</span>
                    <button
                      onClick={() => setSelectedPatient(null)}
                      className="ml-auto text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2 text-sm sm:text-base">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-600" />
                      <span className="font-bold text-gray-800">{selectedPatient.fullName}</span>
                    </div>
                    {selectedPatient.patientNumber && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">ID: {selectedPatient.patientNumber}</span>
                      </div>
                    )}
                    {selectedPatient.dateOfBirth && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-600" />
                        <span className="text-gray-600">DOB: {new Date(selectedPatient.dateOfBirth).toLocaleDateString()}</span>
                      </div>
                    )}
                    {selectedPatient.primaryPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-600" />
                        <span className="text-gray-600">Phone: {selectedPatient.primaryPhone}</span>
                      </div>
                    )}
                    {selectedPatient.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-600" />
                        <span className="text-gray-600">Address: {selectedPatient.address}</span>
                      </div>
                    )}
                  </div>
                  {triageHistoryQuery.isLoading ? (
                    <div className="mt-6 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
                      <div className="text-gray-500 text-sm">Loading triage history...</div>
                    </div>
                  ) : triageHistoryQuery.data && triageHistoryQuery.data.length > 0 ? (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-indigo-600" />
                        Recent Triage History (Last 3)
                      </h3>
                      <div className="space-y-4">
                        {triageHistoryQuery.data.slice(0, 3).map((record: TriageRecord) => (
                          <TriageHistoryCard key={record.id} record={record} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 text-center text-gray-500 text-sm">
                      No triage history available for this patient.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transform hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-red-400 to-pink-500 rounded-full flex items-center justify-center shadow-md">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Vital Signs Assessment</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Thermometer className="w-4 h-4 text-red-600" />
                    Temperature (°C)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="30"
                      max="45"
                      value={formData.temperature}
                      onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                      className={`w-full p-3 border-2 rounded-xl focus:outline-none transition-all duration-200 shadow-sm text-sm sm:text-base ${getVitalStatus('temperature', formData.temperature).borderColor} ${getVitalStatus('temperature', formData.temperature).bgColor}`}
                    />
                    <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-semibold ${getVitalStatus('temperature', formData.temperature).color}`}>
                      {getVitalStatus('temperature', formData.temperature).status}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Heart className="w-4 h-4 text-red-600" />
                    Blood Pressure
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="120/80"
                      value={formData.bloodPressure}
                      onChange={(e) => handleInputChange('bloodPressure', e.target.value)}
                      className={`w-full p-3 border-2 rounded-xl focus:outline-none transition-all duration-200 shadow-sm text-sm sm:text-base ${getVitalStatus('bloodPressure', formData.bloodPressure).borderColor} ${getVitalStatus('bloodPressure', formData.bloodPressure).bgColor}`}
                    />
                    <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-semibold ${getVitalStatus('bloodPressure', formData.bloodPressure).color}`}>
                      {getVitalStatus('bloodPressure', formData.bloodPressure).status}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Activity className="w-4 h-4 text-green-600" />
                    Pulse (BPM)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="30"
                      max="200"
                      value={formData.pulse}
                      onChange={(e) => handleInputChange('pulse', parseInt(e.target.value))}
                      className={`w-full p-3 border-2 rounded-xl focus:outline-none transition-all duration-200 shadow-sm text-sm sm:text-base ${getVitalStatus('pulse', formData.pulse).borderColor} ${getVitalStatus('pulse', formData.pulse).bgColor}`}
                    />
                    <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-semibold ${getVitalStatus('pulse', formData.pulse).color}`}>
                      {getVitalStatus('pulse', formData.pulse).status}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Droplets className="w-4 h-4 text-blue-600" />
                    Blood Oxygen (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="70"
                      max="100"
                      value={formData.bloodOxygenLevel}
                      onChange={(e) => handleInputChange('bloodOxygenLevel', parseFloat(e.target.value))}
                      className={`w-full p-3 border-2 rounded-xl focus:outline-none transition-all duration-200 shadow-sm text-sm sm:text-base ${getVitalStatus('bloodOxygen', formData.bloodOxygenLevel).borderColor} ${getVitalStatus('bloodOxygen', formData.bloodOxygenLevel).bgColor}`}
                    />
                    <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-semibold ${getVitalStatus('bloodOxygen', formData.bloodOxygenLevel).color}`}>
                      {getVitalStatus('bloodOxygen', formData.bloodOxygenLevel).status}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Wind className="w-4 h-4 text-cyan-600" />
                    Respiration Rate (breaths/min)
                  </label>
                  <div className="relative max-w-md mx-auto sm:mx-0">
                    <input
                      type="number"
                      min="5"
                      max="50"
                      value={formData.respirationRate}
                      onChange={(e) => handleInputChange('respirationRate', parseInt(e.target.value))}
                      className={`w-full p-3 border-2 rounded-xl focus:outline-none transition-all duration-200 shadow-sm text-sm sm:text-base ${getVitalStatus('respiration', formData.respirationRate).borderColor} ${getVitalStatus('respiration', formData.respirationRate).bgColor}`}
                    />
                    <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-semibold ${getVitalStatus('respiration', formData.respirationRate).color}`}>
                      {getVitalStatus('respiration', formData.respirationRate).status}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Stethoscope className="w-4 h-4 text-indigo-600" />
                    Overall Status {overrideNote ? '(Overridden)' : '(Automated)'}
                  </label>
                  <div className="relative">
                    <div className={`p-4 rounded-xl text-center font-semibold text-sm sm:text-base border-2 transform transition-all duration-300 hover:scale-105 shadow-lg ${getOverallStatusStyles(overallStatus).bgColor} ${getOverallStatusStyles(overallStatus).borderColor} ${getOverallStatusStyles(overallStatus).color}`}
                         style={{
                           background: `linear-gradient(145deg, ${getOverallStatusStyles(overallStatus).bgColor}, ${getOverallStatusStyles(overallStatus).bgColor}dd)`,
                           boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -4px -4px 8px rgba(255,255,255,0.9)'
                         }}>
                      {overallStatus}
                      {overrideNote && (
                        <div className="mt-2 text-xs italic">
                          Note: {overrideNote}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setDoctorOverrideFormData({
                          overallStatus: overallStatus,
                          statusNote: overrideNote || '',
                        });
                        setShowDoctorOverrideDrawer(true);
                      }}
                      className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:scale-110 transition-all duration-300 hover:rotate-12 border-3 border-white"
                      style={{
                        boxShadow: '0 8px 20px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                        background: 'linear-gradient(145deg, #60a5fa, #3b82f6)',
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleSubmitTriage}
                  disabled={createTriageMutation.isPending || !selectedPatient}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2 text-sm sm:text-base"
                >
                  {createTriageMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating Triage Record...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Create Triage Record
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Create Patient Drawer */}
        <div
          className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transform transition-all duration-500 ease-in-out ${showCreatePatientDrawer ? 'translate-x-0 rotate-y-0' : 'translate-x-full rotate-y-10'}`}
          style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
        >
          <div className="h-full flex flex-col">
            <div className="bg-gradient-to-r from-green-500 to-blue-600 p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <UserPlus className="w-5 h-5" />
                  <h2 className="text-lg font-bold">Create New Patient</h2>
                </div>
                <button
                  onClick={() => setShowCreatePatientDrawer(false)}
                  className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-white/90 text-sm">Fill in the patient information to create a new record.</p>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <User className="w-4 h-4 text-blue-500" />
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={patientFormData.firstName}
                    onChange={(e) => handlePatientFormChange('firstName', e.target.value)}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors duration-200 shadow-sm text-sm"
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <User className="w-4 h-4 text-gray-400" />
                    Middle Name
                  </label>
                  <input
                    type="text"
                    value={patientFormData.middleName}
                    onChange={(e) => handlePatientFormChange('middleName', e.target.value)}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors duration-200 shadow-sm text-sm"
                    placeholder="Enter middle name (optional)"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <User className="w-4 h-4 text-blue-500" />
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={patientFormData.lastName}
                    onChange={(e) => handlePatientFormChange('lastName', e.target.value)}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors duration-200 shadow-sm text-sm"
                    placeholder="Enter last name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Calendar className="w-4 h-4 text-green-500" />
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={patientFormData.dateOfBirth || ''}
                    onChange={(e) => {
                      handlePatientFormChange('dateOfBirth', e.target.value);
                      handlePatientFormChange('dateOfBirthWasManuallySet', 'true');
                    }}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors duration-200 shadow-sm text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Clock className="w-4 h-4 text-orange-500" />
                    Age (years)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={patientFormData.displayAge || ''}
                      onChange={(e) => handlePatientFormChange('displayAge', e.target.value)}
                      min="0"
                      max="150"
                      className="flex-1 p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors duration-200 shadow-sm text-sm"
                      placeholder="Enter age"
                    />
                    {patientFormData.displayAge && (
                      <div className="flex items-center px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
                        {patientFormData.displayAge} years old
                      </div>
                    )}
                  </div>
                  {patientFormData.displayAge && !patientFormData.dateOfBirthWasManuallySet && (
                    <p className="text-xs text-gray-500 mt-1">
                      Estimated birth year: {new Date().getFullYear() - parseInt(patientFormData.displayAge)}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Users className="w-4 h-4 text-purple-500" />
                    Gender
                  </label>
                  <select
                    value={patientFormData.genderId}
                    onChange={(e) => handlePatientFormChange('genderId', e.target.value)}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors duration-200 shadow-sm text-sm"
                  >
                    <option value="">Select Gender</option>
                    {gendersQuery.isLoading ? (
                      <option disabled value="">Loading genders...</option>
                    ) : gendersQuery.data && gendersQuery.data.length > 0 ? (
                      gendersQuery.data.map((gender) => (
                        <option key={gender.id} value={gender.id}>
                          {gender.gender}
                        </option>
                      ))
                    ) : (
                      <option disabled value="">No genders available</option>
                    )}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <MapPin className="w-4 h-4 text-red-500" />
                    Address
                  </label>
                  <textarea
                    value={patientFormData.address}
                    onChange={(e) => handlePatientFormChange('address', e.target.value)}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors duration-200 shadow-sm resize-none text-sm"
                    placeholder="Enter patient address"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Phone className="w-4 h-4 text-blue-500" />
                    Primary Phone *
                  </label>
                  <input
                    type="text"
                    value={patientFormData.primaryPhone}
                    onChange={(e) => handlePatientFormChange('primaryPhone', e.target.value)}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors duration-200 shadow-sm text-sm"
                    placeholder="Enter phone number (e.g., +1234567890)"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 p-5 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreatePatientDrawer(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors duration-200 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePatient}
                  disabled={createPatientMutation.isPending || !patientFormData.firstName || !patientFormData.lastName || !patientFormData.primaryPhone}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white font-semibold rounded-xl shadow-sm hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 text-sm"
                >
                  {createPatientMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Patient
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Doctor Override Drawer */}
        <div
          className={`fixed inset-0 z-50 transition-all duration-500 ease-in-out ${showDoctorOverrideDrawer ? 'visible opacity-100' : 'invisible opacity-0'}`}
        >
          <div
            className={`absolute inset-0 bg-black transition-opacity duration-500 ${showDoctorOverrideDrawer ? 'opacity-50' : 'opacity-0'}`}
            onClick={() => setShowDoctorOverrideDrawer(false)}
          />
          <div
            className={`absolute bottom-0 left-0 right-0 bg-white shadow-2xl rounded-t-3xl transform transition-all duration-500 ease-in-out max-h-[85vh] ${showDoctorOverrideDrawer ? 'translate-y-0' : 'translate-y-full'}`}
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              boxShadow: '0 -20px 40px rgba(0,0,0,0.1), 0 -10px 20px rgba(0,0,0,0.05)'
            }}
          >
            <div className="h-full flex flex-col">
              <div className="flex justify-center pt-4">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
              </div>
              <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 mx-4 mt-3 rounded-xl p-4 text-white shadow-xl"
                   style={{
                     background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                     boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
                   }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Edit2 className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold">Status Override</h2>
                  </div>
                  <button
                    onClick={() => setShowDoctorOverrideDrawer(false)}
                    className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200 hover:rotate-90"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-white/90 text-sm">Override the automated status and provide your clinical assessment.</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <div className="w-5 h-5 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-md flex items-center justify-center">
                        <Stethoscope className="w-3 h-3 text-white" />
                      </div>
                      Overall Status *
                    </label>
                    <div className="relative">
                      <select
                        value={doctorOverrideFormData.overallStatus}
                        onChange={(e) => handleDoctorOverrideChange('overallStatus', e.target.value)}
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-300 shadow-sm text-sm bg-gradient-to-r from-gray-50 to-white"
                        style={{
                          boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.1), inset -2px -2px 5px rgba(255,255,255,0.8)'
                        }}
                      >
                        <option value="STABLE">🟢 Stable</option>
                        <option value="NEEDS_ATTENTION">🟡 Needs Attention</option>
                        <option value="CRITICAL">🔴 Critical</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
                        <Edit2 className="w-3 h-3 text-white" />
                      </div>
                      Clinical Notes *
                    </label>
                    <div className="relative">
                      <textarea
                        value={doctorOverrideFormData.statusNote}
                        onChange={(e) => handleDoctorOverrideChange('statusNote', e.target.value)}
                        className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:outline-none transition-all duration-300 shadow-sm resize-none text-sm sm:text-base bg-gradient-to-r from-gray-50 to-white"
                        placeholder="Provide detailed clinical reasoning for status override (minimum 10 characters)"
                        rows={3}
                        required
                        style={{
                          boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.1), inset -2px -2px 5px rgba(255,255,255,0.8)'
                        }}
                      />
                      <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                        {doctorOverrideFormData.statusNote.length}/10 min
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 p-4 bg-gradient-to-r from-gray-50 to-white rounded-b-2xl">
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowDoctorOverrideDrawer(false)}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 text-sm transform hover:scale-105"
                    style={{
                      boxShadow: '4px 4px 8px rgba(0,0,0,0.1), -2px -2px 4px rgba(255,255,255,0.8)'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDoctorOverrideSubmit}
                    disabled={updateDoctorNoteMutation.isPending || !doctorOverrideFormData.overallStatus || doctorOverrideFormData.statusNote.trim().length < 10}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 text-sm"
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)'
                    }}
                  >
                    {updateDoctorNoteMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving Override...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Apply Override
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TriageForm;