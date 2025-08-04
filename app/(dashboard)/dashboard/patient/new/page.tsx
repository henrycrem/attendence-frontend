'use client';

import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, Calendar, UserCheck, CreditCard, Building2, FileText, Save, X } from 'lucide-react';
import { createPatientAction } from 'apps/user-ui/src/actions/patientActions';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import axios from 'axios';

interface Gender {
  id: string;
  gender: string;
}

export default function PatientRegistrationForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    middleName: '',
    dateOfBirth: '',
    genderId: '',
    clinicId: '',
    imagingId: '',
    countyId: '',
    billingTypeId: '',
    patientType: '',
    primaryPhone: '',
    primaryEmail: '',
    secondaryPhone: '',
    secondaryEmail: '',
    emergencyPhone: '',
    emergencyEmail: '',
  });
  const [genders, setGenders] = useState<Gender[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Fetch genders on component mount
  useEffect(() => {
    const fetchGenders = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/genders`, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        });
        setGenders(response.data.genders);
        console.log('Fetched genders:', response.data.genders);
      } catch (error: any) {
        console.error('Error fetching genders:', error);
        toast.error('Failed to load genders. Please try again.');
      }
    };

    fetchGenders();
  }, []);

  const steps = [
    {
      title: 'Personal Information',
      icon: <User className="w-6 h-6" />,
      fields: ['lastName', 'firstName', 'middleName', 'dateOfBirth', 'genderId'],
    },
    {
      title: 'Contact Details',
      icon: <Phone className="w-6 h-6" />,
      fields: ['primaryPhone', 'primaryEmail', 'secondaryPhone', 'secondaryEmail'],
    },
    {
      title: 'Emergency & Location',
      icon: <MapPin className="w-6 h-6" />,
      fields: ['emergencyPhone', 'emergencyEmail', 'countyId'],
    },
    {
      title: 'Medical Information',
      icon: <FileText className="w-6 h-6" />,
      fields: ['clinicId', 'imagingId', 'billingTypeId', 'patientType'],
    },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.lastName || !formData.firstName || !formData.patientType || !formData.primaryPhone) {
        toast.error('Please fill all required fields: Last Name, First Name, Patient Type, and Primary Phone');
        return;
      }

      const patientData = {
        ...formData,
        patientType: Number(formData.patientType),
        dateOfBirth: formData.dateOfBirth || undefined,
        clinicId: formData.clinicId || undefined,
        imagingId: formData.imagingId || undefined,
        genderId: formData.genderId || undefined,
        countyId: formData.countyId || undefined,
        billingTypeId: formData.billingTypeId || undefined,
      };

      console.log('Submitting patient data:', patientData);

      const result = await createPatientAction(patientData);
      toast.success(result.message);
      router.push('/dashboard/patient');
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast.error(error.message || 'Failed to create patient. Please check your input and try again.');
    }
  };

  const renderField = (fieldName: string) => {
    const fieldConfig: Record<string, any> = {
      lastName: { label: 'Last Name', type: 'text', icon: <User className="w-5 h-5" /> },
      firstName: { label: 'First Name', type: 'text', icon: <User className="w-5 h-5" /> },
      middleName: { label: 'Middle Name', type: 'text', icon: <User className="w-5 h-5" /> },
      dateOfBirth: { label: 'Date of Birth', type: 'date', icon: <Calendar className="w-5 h-5" /> },
      genderId: {
        label: 'Gender',
        type: 'select',
        options: [
          { value: '', label: 'Select Gender' },
          ...genders.map((g) => ({ value: g.id, label: g.gender })),
        ],
        icon: <UserCheck className="w-5 h-5" />,
      },
      primaryPhone: { label: 'Primary Phone', type: 'tel', icon: <Phone className="w-5 h-5" /> },
      primaryEmail: { label: 'Primary Email', type: 'email', icon: <Mail className="w-5 h-5" /> },
      secondaryPhone: { label: 'Secondary Phone', type: 'tel', icon: <Phone className="w-5 h-5" /> },
      secondaryEmail: { label: 'Secondary Email', type: 'email', icon: <Mail className="w-5 h-5" /> },
      emergencyPhone: { label: 'Emergency Phone', type: 'tel', icon: <Phone className="w-5 h-5" /> },
      emergencyEmail: { label: 'Emergency Email', type: 'email', icon: <Mail className="w-5 h-5" /> },
      countyId: {
        label: 'County',
        type: 'select',
        options: [
          { value: '', label: 'Select County' },
          { value: 'montserrado', label: 'Montserrado' },
          { value: 'nimba', label: 'Nimba' },
          { value: 'grand-bassa', label: 'Grand Bassa' },
          { value: 'lofa', label: 'Lofa' },
        ],
        icon: <MapPin className="w-5 h-5" />,
      },
      clinicId: { label: 'Clinic ID', type: 'text', icon: <Building2 className="w-5 h-5" /> },
      imagingId: { label: 'Imaging ID', type: 'text', icon: <FileText className="w-5 h-5" /> },
      billingTypeId: {
        label: 'Billing Type',
        type: 'select',
        options: [
          { value: '', label: 'Select Billing Type' },
          { value: 'insurance', label: 'Insurance' },
          { value: 'cash', label: 'Cash' },
          { value: 'credit', label: 'Credit' },
        ],
        icon: <CreditCard className="w-5 h-5" />,
      },
      patientType: {
        label: 'Patient Type',
        type: 'select',
        options: [
          { value: '', label: 'Select Patient Type' },
          { value: '1', label: 'Inpatient' },
          { value: '2', label: 'Outpatient' },
          { value: '3', label: 'Emergency' },
        ],
        icon: <UserCheck className="w-5 h-5" />,
      },
    };

    const config = fieldConfig[fieldName];
    if (!config) return null;

    const baseClasses =
      'w-full px-4 py-3 pl-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:border-gray-300 text-gray-800 placeholder-gray-500';

    return (
      <div key={fieldName} className="relative group">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300 z-10">
          {config.icon}
        </div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">{config.label}</label>
        {config.type === 'select' ? (
          <select
            value={formData[fieldName]}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            className={baseClasses}
          >
            {config.options.map((option: { value: string; label: string }) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={config.type}
            value={formData[fieldName]}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            placeholder={`Enter ${config.label.toLowerCase()}`}
            className={baseClasses}
          />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Patient Registration</h1>
          <p className="text-gray-600">Complete the form to register a new patient</p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="flex space-x-4">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-500 transform ${
                  index === currentStep
                    ? 'bg-blue-500 text-white scale-110 shadow-lg'
                    : index < currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step.icon}
                <span className="font-medium hidden sm:inline">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-8">
            <div
              className={`transition-all duration-500 transform ${isAnimating ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'}`}
            >
              <div className="flex items-center mb-6">
                <div className="p-3 bg-blue-500 rounded-xl text-white mr-4">{steps[currentStep].icon}</div>
                <h2 className="text-2xl font-bold text-gray-800">{steps[currentStep].title}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {steps[currentStep].fields.map((fieldName: string) => renderField(fieldName))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
              >
                <X className="w-5 h-5" />
                <span>Previous</span>
              </button>

              <div className="flex space-x-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentStep ? 'bg-blue-500 scale-125' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              {currentStep === steps.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  className="flex items-center space-x-2 px-8 py-3 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <Save className="w-5 h-5" />
                  <span>Register Patient</span>
                </button>
              ) : (
                <button
                  onClick={nextStep}
                  className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <span>Next</span>
                  <UserCheck className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            Step {currentStep + 1} of {steps.length} • All fields are optional unless marked as required
          </p>
        </div>
      </div>
    </div>
  );
}