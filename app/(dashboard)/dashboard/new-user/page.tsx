'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import axios from 'axios';

interface FormData {
  name: string;
  email: string;
  roleId: string;
}

interface Role {
  id: string;
  name: string;
}

export default function UserRegistration() {
  const [isVisible, setIsVisible] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [userData, setUserData] = useState<FormData | null>(null);
  const router = useRouter();

  // Initialize React Hook Form
  const methods = useForm<FormData>({
    defaultValues: {
      name: '',
      email: '',
      roleId: '',
    },
    mode: 'onChange',
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = methods;

  // Fetch roles from the API
  const { data: roles = [], isLoading, error } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/roles`);
      return response.data;
    },
  });

  // Watch form values for dynamic updates
  const roleId = watch('roleId');

  // Animation on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleNextStep = () => {
    if (formStep < 2) {
      setFormStep(formStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (formStep > 1) {
      setFormStep(formStep - 1);
    }
  };

  const signUpMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/user-registration`, data);
      return response.data;
    },
    onSuccess: (_, formData) => {
      setUserData(formData);
    },
    onError: (error) => {
      console.error('Mutation error:', error);
    },
  });

  const onSubmit = (data: FormData) => {
    signUpMutation.mutate(data);
    console.log('Form submitted:', data);
  };

  // Set default roleId if roles are loaded
  useEffect(() => {
    if (roles.length > 0 && !roleId) {
      setValue('roleId', roles[0].id); // Default to first role
    }
  }, [roles, roleId, setValue]);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div
          className={`bg-white p-4 sm:p-6 rounded-lg shadow-sm mb-6 transform transition-all duration-700 hover:shadow-lg ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className="flex items-center justify-between mb-6 flex-wrap sm:flex-nowrap gap-4">
            <h3 className="text-lg font-medium text-gray-700">User Registration</h3>
            <div className="flex space-x-2">
              {[1, 2].map((step) => (
                <div
                  key={step}
                  className={`w-8 h-1 rounded-full transition-all ${
                    step === formStep
                      ? 'bg-emerald-500 w-12'
                      : step < formStep
                      ? 'bg-emerald-200'
                      : 'bg-gray-200'
                  }`}
                ></div>
              ))}
            </div>
          </div>

          {/* Step 1: Basic Information */}
          <div className={`transition-all duration-500 ${formStep === 1 ? 'block' : 'hidden'}`}>
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <div className="p-2 bg-gray-100 rounded-lg mr-3 shadow-inner">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-600"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <h4 className="text-md font-medium text-gray-700">Personal Information</h4>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-sm text-gray-600 mb-1">Full Name</label>
                  <div
                    className={`relative transform transition-all duration-300 ${
                      focusedField === 'name' ? 'scale-105' : ''
                    }`}
                  >
                    <input
                      type="text"
                      {...register('name', {
                        required: 'Full name is required',
                        minLength: {
                          value: 2,
                          message: 'Full name must be at least 2 characters',
                        },
                      })}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm hover:shadow transition-all"
                      placeholder="Enter your full name"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-400"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </div>
                  </div>
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div className="relative">
                  <label className="block text-sm text-gray-600 mb-1">Email Address</label>
                  <div
                    className={`relative transform transition-all duration-300 ${
                      focusedField === 'email' ? 'scale-105' : ''
                    }`}
                  >
                    <input
                      type="email"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                          message: 'Invalid email address',
                        },
                      })}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm hover:shadow transition-all"
                      placeholder="Enter your email"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-400"
                      >
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                    </div>
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>

                <div className="relative">
                  <label className="block text-sm text-gray-600 mb-1">User Role</label>
                  <div
                    className={`relative transform transition-all duration-300 ${
                      focusedField === 'roleId' ? 'scale-105' : ''
                    }`}
                  >
                    <select
                      {...register('roleId', { required: 'User role is required' })}
                      onFocus={() => setFocusedField('roleId')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm hover:shadow transition-all"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <option value="">Loading roles...</option>
                      ) : error ? (
                        <option value="">Error loading roles</option>
                      ) : (
                        <>
                          <option value="">Select a role</option>
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-400"
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </div>
                  {errors.roleId && <p className="text-red-500 text-xs mt-1">{errors.roleId.message}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Confirmation */}
          <div className={`transition-all duration-500 ${formStep === 2 ? 'block' : 'hidden'}`}>
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-gray-100 rounded-lg mr-3 shadow-inner">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-600"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <h4 className="text-md font-medium text-gray-700">Review Information</h4>
              </div>

              <div className="space-y-4 p-4 bg-gray-50 rounded-lg transform transition-all hover:shadow-md">
                <div className="flex justify-between">
                  <span className="text-gray-500">Full Name:</span>
                  <span className="text-gray-800 font-medium">{watch('name')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email:</span>
                  <span className="text-gray-800 font-medium">{watch('email')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">User Role:</span>
                  <span className="text-gray-800 font-medium">
                    {roles.find((role) => role.id === roleId)?.name || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-gray-500 text-sm">
                  By clicking Submit, you agree to our
                  <a href="#" className="text-emerald-500 hover:text-emerald-600 ml-1">
                    Terms and Conditions
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Buttons with 3D hover effects */}
          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={handlePrevStep}
              className={`px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all transform hover:translate-y-px hover:shadow ${
                formStep === 1 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={formStep === 1}
            >
              Back
            </button>

            {formStep < 2 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 transition-all transform hover:translate-y-px hover:shadow-md"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                className={`px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-all transform hover:scale-105 hover:shadow-lg ${
                  signUpMutation.status === 'pending'
                    ? 'bg-gray-400 cursor-not-allowed hover:bg-gray-400'
                    : 'bg-emerald-500 hover:bg-emerald-600'
                }`}
                disabled={signUpMutation.status === 'pending'}
              >
                {signUpMutation.status === 'pending' ? 'Submitting...' : 'Submit Registration'}
              </button>
            )}
          </div>
        </div>
      </form>

      {/* 3D decoration element */}
      <div className="h-1 w-full mt-8 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-full shadow-sm"></div>
    </FormProvider>
  );
}