"use client";
import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, usePathname } from 'next/navigation';
import { Tab } from '@headlessui/react';
import { 
  User, Activity, Calendar, Image, MapPin, Phone, Mail, AlertTriangle, 
  CheckCircle, TrendingUp, TrendingDown, ArrowLeft, Edit, Share, Download,
  Heart, Thermometer, Droplets, Zap, Wind, Clock, FileText, DollarSign,
  Shield, AlertCircle, CheckCircle2, XCircle, Camera, Eye, Plus
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { getPatientById } from '../actions/patientActions';
import { format } from 'date-fns';

interface PatientData {
  id: string;
  patientNumber: string;
  firstName?: string;
  middleName?: string;
  lastName: string;
  fullName?: string;
  dateOfBirth?: string;
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
    bloodOxygenLevel?: number;
    bloodOxygenStatus?: string;
    respirationRate?: number;
    respirationStatus?: string;
    triageCategory: string;
    overallStatus?: string;
    statusNote?: string;
    createdAt: string;
  }>;
  visitsClinic: Array<{
    id: string;
    visitCode: string;
    entryDate: string;
    consultationFee?: number;
    billingCategory?: string;
    doctor?: { fullName: string };
  }>;
  appointments: Array<{
    id: string;
    startTime: string;
    endTime?: string;
    status?: string;
    notes?: string;
    doctor: { fullName: string };
  }>;
  images?: Array<{
    id: string;
    url: string;
  }>;
}

interface PatientDetailProps {
  initialPatient: PatientData;
}

const PatientDetail: React.FC<PatientDetailProps> = ({ initialPatient }) => {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  console.log('PatientDetail: useParams id:', id);
  console.log('PatientDetail: pathname:', pathname);

  useEffect(() => {
    console.log('PatientDetail: initialPatient:', JSON.stringify(initialPatient, null, 2));
  }, [initialPatient]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('PatientDetail: Client-side rendered HTML:', document.querySelector('.min-h-screen')?.outerHTML);
    }
  }, []);

  const fallbackId = pathname.split('/').pop();
  console.log('PatientDetail: fallbackId from pathname:', fallbackId);

  const queryId = id || fallbackId;
  console.log('PatientDetail: queryId:', queryId);

  const { data: patient, isLoading, error } = useQuery<PatientData, Error>({
    queryKey: ['patient', queryId],
    queryFn: () => getPatientById(queryId!),
    initialData: queryId === initialPatient.id ? initialPatient : undefined,
    staleTime: 5 * 60 * 1000,
    enabled: !!queryId,
  });

  useEffect(() => {
    console.log('PatientDetail: useQuery patient:', JSON.stringify(patient, null, 2));
    if (error) {
      console.error('PatientDetail: Query error:', error.message);
      toast.error(error.message || 'Failed to load patient data');
    }
  }, [patient, error]);

  const formatDate = (date?: string) => {
    if (!date) return 'N/A';
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return 'N/A';
      return format(dateObj, 'MMM d, yyyy HH:mm', { timeZone: 'UTC' });
    } catch (err) {
      console.error('PatientDetail: Date formatting error:', err);
      return 'N/A';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'HIGH':
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'LOW':
        return <TrendingDown className="w-4 h-4 text-blue-500" />;
      case 'NORMAL':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusStyles = (status?: string) => {
    switch (status) {
      case 'CRITICAL':
        return { 
          color: 'text-red-700', 
          bgColor: 'bg-gradient-to-r from-red-100 to-red-200', 
          borderColor: 'border-red-300',
          shadowColor: 'shadow-red-100'
        };
      case 'NEEDS_ATTENTION':
        return { 
          color: 'text-amber-700', 
          bgColor: 'bg-gradient-to-r from-amber-100 to-yellow-200', 
          borderColor: 'border-amber-300',
          shadowColor: 'shadow-amber-100'
        };
      case 'STABLE':
        return { 
          color: 'text-green-700', 
          bgColor: 'bg-gradient-to-r from-green-100 to-emerald-200', 
          borderColor: 'border-green-300',
          shadowColor: 'shadow-green-100'
        };
      default:
        return { 
          color: 'text-gray-700', 
          bgColor: 'bg-gradient-to-r from-gray-100 to-gray-200', 
          borderColor: 'border-gray-300',
          shadowColor: 'shadow-gray-100'
        };
    }
  };

  const getTriageColor = (category: string) => {
    switch (category?.toUpperCase()) {
      case 'URGENT':
        return 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-200';
      case 'MODERATE':
        return 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-lg shadow-yellow-200';
      case 'LOW':
        return 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg shadow-green-200';
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg shadow-gray-200';
    }
  };

  const getAppointmentStatusColor = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'SCHEDULED':
        return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 border-blue-300';
      case 'COMPLETED':
        return 'bg-gradient-to-r from-green-100 to-green-200 text-green-700 border-green-300';
      case 'CANCELLED':
        return 'bg-gradient-to-r from-red-100 to-red-200 text-red-700 border-red-300';
      case 'IN_PROGRESS':
        return 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-700 border-amber-300';
      default:
        return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300';
    }
  };

  const VitalCard = ({ icon, label, value, status, unit = '' }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    status?: string;
    unit?: string;
  }) => (
    <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-all duration-300 hover:border-blue-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
            {icon}
          </div>
          <span className="text-sm font-medium text-gray-600">{label}</span>
        </div>
        {status && getStatusIcon(status)}
      </div>
      <div className="text-2xl font-bold text-gray-900">
        {value}{unit}
      </div>
    </div>
  );

  if (!queryId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <div className="text-red-600 text-lg font-semibold">Invalid patient ID</div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="text-gray-600 text-lg">Loading patient data...</div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <div className="text-red-600 text-lg font-semibold">Patient not found</div>
        </div>
      </div>
    );
  }

  // Sort triage records by createdAt (newest first)
  const sortedTriageRecords = [...patient.triageRecords].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const latestTriage = sortedTriageRecords[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {patient.fullName?.charAt(0).toUpperCase() || patient.firstName?.charAt(0).toUpperCase() || 'P'}
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    {patient.fullName || `${patient.firstName || ''} ${patient.lastName}`.trim()}
                  </h1>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-gray-600">ID: {patient.patientNumber}</span>
                    {latestTriage && (
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTriageColor(latestTriage.triageCategory)}`}>
                        {latestTriage.triageCategory}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                <Share className="w-4 h-4 text-gray-600" />
                <span className="text-gray-700 font-medium">Share</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                <Download className="w-4 h-4 text-gray-600" />
                <span className="text-gray-700 font-medium">Export</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                <Edit className="w-4 h-4" />
                <span className="font-medium">Edit Patient</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        {latestTriage && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <VitalCard
              icon={<Thermometer className="w-5 h-5 text-red-500" />}
              label="Temperature"
              value={latestTriage.temperature.toFixed(1)}
              status={latestTriage.temperatureStatus}
              unit="°C"
            />
            <VitalCard
              icon={<Heart className="w-5 h-5 text-pink-500" />}
              label="Pulse"
              value={latestTriage.pulse}
              status={latestTriage.pulseStatus}
              unit=" BPM"
            />
            <VitalCard
              icon={<Droplets className="w-5 h-5 text-blue-500" />}
              label="Blood Pressure"
              value={latestTriage.bloodPressure}
              status={latestTriage.bloodPressureStatus}
            />
            <VitalCard
              icon={<Zap className="w-5 h-5 text-yellow-500" />}
              label="Oxygen Level"
              value={latestTriage.bloodOxygenLevel ?? 'N/A'}
              status={latestTriage.bloodOxygenStatus}
              unit="%"
            />
            <VitalCard
              icon={<Wind className="w-5 h-5 text-green-500" />}
              label="Respiration"
              value={latestTriage.respirationRate ?? 'N/A'}
              status={latestTriage.respirationStatus}
              unit="/min"
            />
            <VitalCard
              icon={<Activity className="w-5 h-5 text-purple-500" />}
              label="Overall Status"
              value={latestTriage.overallStatus || 'N/A'}
            />
          </div>
        )}

        {/* Tabs */}
        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-2xl bg-white/70 backdrop-blur-sm p-1 mb-8 border border-gray-200 shadow-sm">
            {[
              { name: 'Personal Information', icon: User },
              { name: 'Triage Records', icon: Activity },
              { name: 'Clinic Visits', icon: Calendar },
              { name: 'Appointments', icon: Clock },
              { name: 'Images', icon: Image }
            ].map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  `flex items-center space-x-2 rounded-xl py-3 px-4 text-sm font-medium transition-all duration-200 ${
                    selected
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-white/60 hover:text-gray-800'
                  }`
                }
              >
                {({ selected }) => (
                  <>
                    <tab.icon className={`w-4 h-4 ${selected ? 'text-white' : 'text-gray-500'}`} />
                    <span>{tab.name}</span>
                  </>
                )}
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels>
            {/* Personal Information */}
            <Tab.Panel>
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { label: 'Full Name', value: patient.fullName || 'N/A', icon: User },
                    { label: 'Date of Birth', value: formatDate(patient.dateOfBirth), icon: Calendar },
                    { label: 'Age', value: patient.age ?? 'N/A', icon: User },
                    { label: 'Gender', value: patient.gender?.gender || 'N/A', icon: User },
                    { label: 'Primary Phone', value: patient.primaryPhone || 'N/A', icon: Phone },
                    { label: 'Primary Email', value: patient.primaryEmail || 'N/A', icon: Mail },
                    { label: 'Secondary Phone', value: patient.secondaryPhone || 'N/A', icon: Phone },
                    { label: 'Secondary Email', value: patient.secondaryEmail || 'N/A', icon: Mail },
                    { label: 'Emergency Phone', value: patient.emergencyPhone || 'N/A', icon: Phone },
                    { label: 'Emergency Email', value: patient.emergencyEmail || 'N/A', icon: Mail },
                    { label: 'Address', value: patient.address || 'N/A', icon: MapPin },
                    { label: 'County', value: patient.county?.countyName || 'N/A', icon: MapPin },
                    { label: 'Billing Type', value: patient.billingType?.billingType || 'N/A', icon: DollarSign }
                  ].map((field, index) => (
                    <div key={index} className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center space-x-2 mb-2">
                        <field.icon className="w-4 h-4 text-gray-500" />
                        <label className="text-sm font-semibold text-gray-600">{field.label}</label>
                      </div>
                      <p className="text-gray-900 font-medium">{field.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Tab.Panel>

            {/* Triage Records */}
            <Tab.Panel>
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl">
                      <Activity className="w-6 h-6 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Triage Records</h2>
                  </div>
                  <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                    <Plus className="w-4 h-4" />
                    <span className="font-medium">New Record</span>
                  </button>
                </div>

                {/* Latest Triage Record */}
                {latestTriage && (
                  <div className="mb-8 bg-gradient-to-br from-red-50/50 to-pink-50/50 rounded-2xl p-6 border border-red-200 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-br from-red-100 to-pink-100 rounded-lg">
                          <Clock className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">Latest Triage Record</h3>
                          <p className="text-sm text-gray-600">{formatDate(latestTriage.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusStyles(latestTriage.overallStatus).bgColor} ${getStatusStyles(latestTriage.overallStatus).color} ${getStatusStyles(latestTriage.overallStatus).borderColor} shadow-lg`}>
                          {latestTriage.overallStatus || 'N/A'}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTriageColor(latestTriage.triageCategory)}`}>
                          {latestTriage.triageCategory}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
                      <VitalCard
                        icon={<Thermometer className="w-4 h-4 text-red-500" />}
                        label="Temperature"
                        value={latestTriage.temperature.toFixed(1)}
                        status={latestTriage.temperatureStatus}
                        unit="°C"
                      />
                      <VitalCard
                        icon={<Heart className="w-4 h-4 text-pink-500" />}
                        label="Pulse"
                        value={latestTriage.pulse}
                        status={latestTriage.pulseStatus}
                        unit=" BPM"
                      />
                      <VitalCard
                        icon={<Droplets className="w-4 h-4 text-blue-500" />}
                        label="Blood Pressure"
                        value={latestTriage.bloodPressure}
                        status={latestTriage.bloodPressureStatus}
                      />
                      <VitalCard
                        icon={<Zap className="w-4 h-4 text-yellow-500" />}
                        label="Oxygen Level"
                        value={latestTriage.bloodOxygenLevel ?? 'N/A'}
                        status={latestTriage.bloodOxygenStatus}
                        unit="%"
                      />
                      <VitalCard
                        icon={<Wind className="w-4 h-4 text-green-500" />}
                        label="Respiration"
                        value={latestTriage.respirationRate ?? 'N/A'}
                        status={latestTriage.respirationStatus}
                        unit="/min"
                      />
                    </div>
                    {latestTriage.statusNote && (
                      <div className="bg-white p-4 rounded-xl border border-gray-200">
                        <div className="flex items-start space-x-2">
                          <FileText className="w-5 h-5 text-gray-500 mt-0.5" />
                          <div>
                            <span className="font-semibold text-gray-700">Clinical Notes:</span>
                            <p className="text-gray-600 mt-1">{latestTriage.statusNote}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* All Triage Records Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-separate border-spacing-y-2">
                    <thead>
                      <tr className="text-sm font-semibold text-gray-600 bg-gray-50 rounded-lg">
                        <th className="py-3 px-4 rounded-l-lg">Date</th>
                        <th className="py-3 px-4">Temperature</th>
                        <th className="py-3 px-4">Pulse</th>
                        <th className="py-3 px-4">Blood Pressure</th>
                        <th className="py-3 px-4">Oxygen Level</th>
                        <th className="py-3 px-4">Respiration</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4 rounded-r-lg">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedTriageRecords.map((record) => {
                        const statusStyle = getStatusStyles(record.overallStatus);
                        return (
                          <tr key={record.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                            <td className="py-3 px-4 rounded-l-lg text-gray-700">{formatDate(record.createdAt)}</td>
                            <td className="py-3 px-4 text-gray-900">
                              {record.temperature.toFixed(1)}°C
                              {record.temperatureStatus && getStatusIcon(record.temperatureStatus)}
                            </td>
                            <td className="py-3 px-4 text-gray-900">
                              {record.pulse} BPM
                              {record.pulseStatus && getStatusIcon(record.pulseStatus)}
                            </td>
                            <td className="py-3 px-4 text-gray-900">
                              {record.bloodPressure}
                              {record.bloodPressureStatus && getStatusIcon(record.bloodPressureStatus)}
                            </td>
                            <td className="py-3 px-4 text-gray-900">
                              {record.bloodOxygenLevel ?? 'N/A'}%
                              {record.bloodOxygenStatus && getStatusIcon(record.bloodOxygenStatus)}
                            </td>
                            <td className="py-3 px-4 text-gray-900">
                              {record.respirationRate ?? 'N/A'}/min
                              {record.respirationStatus && getStatusIcon(record.respirationStatus)}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyle.bgColor} ${statusStyle.color}`}>
                                {record.overallStatus || 'N/A'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTriageColor(record.triageCategory)}`}>
                                {record.triageCategory}
                              </span>
                            </td>
                            <td className="py-3 px-4 rounded-r-lg text-gray-600">
                              {record.statusNote || 'None'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </Tab.Panel>

            {/* Clinic Visits */}
            <Tab.Panel>
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                      <Calendar className="w-6 h-6 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Clinic Visits</h2>
                  </div>
                  <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                    <Plus className="w-4 h-4" />
                    <span className="font-medium">New Visit</span>
                  </button>
                </div>

                {patient.visitsClinic.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 text-lg">No clinic visits recorded</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {patient.visitsClinic.map((visit) => (
                      <div key={visit.id} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                              <Calendar className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <span className="text-lg font-semibold text-gray-800">{formatDate(visit.entryDate)}</span>
                              <p className="text-sm text-gray-600">Visit: {visit.visitCode}</p>
                            </div>
                          </div>
                          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                            <Eye className="w-5 h-5 text-gray-400" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center space-x-3">
                            <User className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-600">Doctor</p>
                              <p className="text-gray-900">{visit.doctor?.fullName || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <DollarSign className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-600">Consultation Fee</p>
                              <p className="text-gray-900 font-semibold">${visit.consultationFee?.toFixed(2) || '0.00'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Shield className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-600">Billing Category</p>
                              <p className="text-gray-900">{visit.billingCategory || 'Standard'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Tab.Panel>

            {/* Appointments */}
            <Tab.Panel>
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Appointments</h2>
                  </div>
                  <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                    <Plus className="w-4 h-4" />
                    <span className="font-medium">Schedule Appointment</span>
                  </button>
                </div>

                {patient.appointments.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 text-lg">No appointments scheduled</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {patient.appointments.map((appointment) => (
                      <div key={appointment.id} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
                              <Clock className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <span className="text-lg font-semibold text-gray-800">{formatDate(appointment.startTime)}</span>
                              {appointment.endTime && (
                                <p className="text-sm text-gray-600">Ends: {formatDate(appointment.endTime)}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`px-4 py-2 rounded-full text-sm font-semibold border shadow-sm ${getAppointmentStatusColor(appointment.status)}`}>
                              {appointment.status || 'Scheduled'}
                            </span>
                            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                              <Eye className="w-5 h-5 text-gray-400" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center space-x-3">
                            <User className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-600">Doctor</p>
                              <p className="text-gray-900">{appointment.doctor?.fullName || 'N/A'}</p>
                            </div>
                          </div>
                          {appointment.notes && (
                            <div className="flex items-start space-x-3">
                              <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-gray-600">Notes</p>
                                <p className="text-gray-900 text-sm">{appointment.notes}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Tab.Panel>

            {/* Images */}
            <Tab.Panel>
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                      <Image className="w-6 h-6 text-purple-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Medical Images</h2>
                  </div>
                  <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                    <Camera className="w-4 h-4" />
                    <span className="font-medium">Upload Image</span>
                  </button>
                </div>

                {(!patient.images || patient.images.length === 0) ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Image className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 text-lg">No medical images available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {patient.images.map((image, index) => (
                      <div key={image.id} className="group relative bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer"
                           onClick={() => setSelectedImageIndex(index)}>
                        <img 
                          src={image.url} 
                          alt={`Medical image ${index + 1}`} 
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <div className="flex items-center justify-between">
                              <p className="text-white text-sm font-medium">Image {index + 1}</p>
                              <div className="flex items-center space-x-2">
                                <button className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors">
                                  <Eye className="w-4 h-4 text-white" />
                                </button>
                                <button className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors">
                                  <Download className="w-4 h-4 text-white" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
      
      {/* Image Modal */}
      {selectedImageIndex !== null && patient.images && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
             onClick={() => setSelectedImageIndex(null)}>
          <div className="relative max-w-4xl max-h-full bg-white rounded-2xl overflow-hidden shadow-2xl"
               onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
              <button className="p-2 bg-black/20 backdrop-blur-sm rounded-lg hover:bg-black/30 transition-colors text-white">
                <Download className="w-5 h-5" />
              </button>
              <button 
                className="p-2 bg-black/20 backdrop-blur-sm rounded-lg hover:bg-black/30 transition-colors text-white"
                onClick={() => setSelectedImageIndex(null)}>
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <img 
              src={patient.images[selectedImageIndex].url} 
              alt={`Medical image ${selectedImageIndex + 1}`} 
              className="w-full h-auto max-h-[80vh] object-contain" 
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
              <div className="flex items-center justify-between text-white">
                <p className="text-lg font-semibold">Medical Image {selectedImageIndex + 1}</p>
                <div className="flex items-center space-x-2">
                  <button 
                    className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
                    disabled={selectedImageIndex === 0}
                    onClick={() => setSelectedImageIndex(selectedImageIndex - 1)}>
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-sm">
                    {selectedImageIndex + 1} of {patient.images.length}
                  </span>
                  <button 
                    className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
                    disabled={selectedImageIndex === patient.images.length - 1}
                    onClick={() => setSelectedImageIndex(selectedImageIndex + 1)}>
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDetail;