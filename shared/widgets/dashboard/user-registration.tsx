'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import axios from 'axios'

interface FormData {
  name: string
  email: string
  roleId: string
  departmentId: string
  position: string
  password: string
  confirmPassword: string
}

interface Role {
  id: string
  roleName: string
  displayName: string
}

interface Department {
  id: string
  name: string
  description?: string
}

export default function UserRegistration() {
  const [isVisible, setIsVisible] = useState(false)
  const [formStep, setFormStep] = useState(1)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const router = useRouter()

  // Initialize React Hook Form
  const methods = useForm<FormData>({
    defaultValues: {
      name: '',
      email: '',
      roleId: '',
      departmentId: '',
      position: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  })

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
    trigger,
  } = methods

  // Watch form values
  const password = watch('password')
  const confirmPassword = watch('confirmPassword')
  const roleId = watch('roleId')
  const departmentId = watch('departmentId')

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Password strength calculator
  useEffect(() => {
    if (password) {
      let strength = 0
      if (password.length > 6) strength += 1
      if (password.match(/[A-Z]/)) strength += 1
      if (password.match(/[0-9]/)) strength += 1
      if (password.match(/[^A-Za-z0-9]/)) strength += 1
      setPasswordStrength(strength)
    } else {
      setPasswordStrength(0)
    }
  }, [password])

  // Fetch roles from the API
  const { data: roles = [], isLoading: rolesLoading, error: rolesError } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/roles`)
      console.log('Roles fetched:', response.data)
      return response.data
    },
  })

  // Fetch departments from the API
  const { data: departments = [], isLoading: departmentsLoading, error: departmentsError } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/departments`)
      console.log('Departments fetched:', response.data)
      return response.data
    },
  })

  // Set default roleId if roles are loaded
  useEffect(() => {
    if (roles.length > 0 && !roleId) {
      setValue('roleId', roles[0].id)
    }
  }, [roles, roleId, setValue])

  // Get selected role name for display
  const getSelectedRoleName = () => {
    return roles.find((role) => role.id === roleId)?.displayName || ''
  }

  // Get selected department name for display
  const getSelectedDepartmentName = () => {
    return departments.find((dept) => dept.id === departmentId)?.name || ''
  }

  const handleNextStep = async () => {
    let isValid = false
    
    if (formStep === 1) {
      isValid = await trigger(['name', 'email', 'roleId'])
    } else if (formStep === 2) {
      isValid = await trigger(['departmentId', 'position', 'password', 'confirmPassword'])
    }
    
    if (isValid && formStep < 3) {
      setFormStep(formStep + 1)
    }
  }

  const handlePrevStep = () => {
    if (formStep > 1) {
      setFormStep(formStep - 1)
    }
  }

  const signUpMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/user-registration`, data)
      return response.data
    },
    onSuccess: (data) => {
      console.log('Registration successful:', data)
      // Handle success (e.g., show success message, redirect)
    },
    onError: (error) => {
      console.error('Registration error:', error)
    },
  })

  const onSubmit = (data: FormData) => {
    console.log('Form submitted:', data)
    signUpMutation.mutate(data)
  }

  return (
    <FormProvider {...methods}>
      <div 
        className={`bg-white p-4 sm:p-6 rounded-lg shadow-sm mb-6 transform transition-all duration-700 hover:shadow-lg ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="flex items-center justify-between mb-6 flex-wrap sm:flex-nowrap gap-4">
          <h3 className="text-lg font-medium text-gray-700">User Registration</h3>
          <div className="flex space-x-2">
            {[1, 2, 3].map((step) => (
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

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: Basic Information */}
          <div className={`transition-all duration-500 ${formStep === 1 ? 'block' : 'hidden'}`}>
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <div className="p-2 bg-gray-100 rounded-lg mr-3 shadow-inner">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <h4 className="text-md font-medium text-gray-700">Personal Information</h4>
              </div>
              
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-sm text-gray-600 mb-1">Full Name</label>
                  <div className={`relative transform transition-all duration-300 ${
                    focusedField === 'name' ? 'scale-105' : ''
                  }`}>
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
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </div>
                  </div>
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                </div>

                <div className="relative">
                  <label className="block text-sm text-gray-600 mb-1">Email Address</label>
                  <div className={`relative transform transition-all duration-300 ${
                    focusedField === 'email' ? 'scale-105' : ''
                  }`}>
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
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                    </div>
                  </div>
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">User Role</label>
                  <div className="relative">
                    <select
                      {...register('roleId', { required: 'User role is required' })}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none bg-white shadow-sm hover:shadow transition-all"
                      disabled={rolesLoading}
                    >
                      {rolesLoading ? (
                        <option value="">Loading roles...</option>
                      ) : rolesError ? (
                        <option value="">Error loading roles</option>
                      ) : (
                        <>
                          <option value="">Select a role</option>
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.displayName}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </div>
                  {errors.roleId && <p className="text-red-500 text-sm mt-1">{errors.roleId.message}</p>}
                  
                  {/* Display selected role */}
                  {getSelectedRoleName() && (
                    <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-md">
                      <p className="text-sm text-emerald-700">
                        <span className="font-medium">Selected Role:</span> {getSelectedRoleName()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Employee Details & Security */}
          <div className={`transition-all duration-500 ${formStep === 2 ? 'block' : 'hidden'}`}>
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <div className="p-2 bg-gray-100 rounded-lg mr-3 shadow-inner">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <h4 className="text-md font-medium text-gray-700">Employee Details & Security</h4>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Department</label>
                  <div className="relative">
                    <select
                      {...register('departmentId', { required: 'Department is required' })}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none bg-white shadow-sm hover:shadow transition-all"
                      disabled={departmentsLoading}
                    >
                      {departmentsLoading ? (
                        <option value="">Loading departments...</option>
                      ) : departmentsError ? (
                        <option value="">Error loading departments</option>
                      ) : (
                        <>
                          <option value="">Select a department</option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </div>
                  {errors.departmentId && <p className="text-red-500 text-sm mt-1">{errors.departmentId.message}</p>}
                </div>

                <div className="relative">
                  <label className="block text-sm text-gray-600 mb-1">Position/Job Title</label>
                  <div className={`relative transform transition-all duration-300 ${
                    focusedField === 'position' ? 'scale-105' : ''
                  }`}>
                    <input
                      type="text"
                      {...register('position', {
                        required: 'Position is required',
                        minLength: {
                          value: 2,
                          message: 'Position must be at least 2 characters',
                        },
                      })}
                      onFocus={() => setFocusedField('position')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm hover:shadow transition-all"
                      placeholder="e.g., Software Engineer, Manager, etc."
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                        <line x1="8" y1="21" x2="16" y2="21"></line>
                        <line x1="12" y1="17" x2="12" y2="21"></line>
                      </svg>
                    </div>
                  </div>
                  {errors.position && <p className="text-red-500 text-sm mt-1">{errors.position.message}</p>}
                </div>

                <div className="relative">
                  <label className="block text-sm text-gray-600 mb-1">Password</label>
                  <div className={`relative transform transition-all duration-300 ${
                    focusedField === 'password' ? 'scale-105' : ''
                  }`}>
                    <input
                      type={isPasswordVisible ? "text" : "password"}
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters',
                        },
                      })}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm hover:shadow transition-all"
                      placeholder="Create password"
                    />
                    <div 
                      className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                      onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                    >
                      {isPasswordVisible ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      )}
                    </div>
                  </div>
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
                  
                  {password && (
                    <div className="mt-2">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-gray-500">Password Strength</span>
                        <span className="text-xs font-medium text-gray-700">
                          {passwordStrength < 2 ? 'Weak' : passwordStrength < 4 ? 'Medium' : 'Strong'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full transition-all ${
                            passwordStrength < 2 ? 'bg-red-500' :
                            passwordStrength < 4 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${passwordStrength * 25}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <label className="block text-sm text-gray-600 mb-1">Confirm Password</label>
                  <div className={`relative transform transition-all duration-300 ${
                    focusedField === 'confirmPassword' ? 'scale-105' : ''
                  }`}>
                    <input
                      type={isPasswordVisible ? "text" : "password"}
                      {...register('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: (value) => value === password || 'Passwords do not match',
                      })}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField(null)}
                      className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 shadow-sm hover:shadow transition-all ${
                        password && confirmPassword && password !== confirmPassword
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-emerald-500'
                      }`}
                      placeholder="Confirm password"
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Review Information */}
          <div className={`transition-all duration-500 ${formStep === 3 ? 'block' : 'hidden'}`}>
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-gray-100 rounded-lg mr-3 shadow-inner">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
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
                  <span className="text-gray-500">Role:</span>
                  <span className="text-gray-800 font-medium">{getSelectedRoleName()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Department:</span>
                  <span className="text-gray-800 font-medium">{getSelectedDepartmentName()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Position:</span>
                  <span className="text-gray-800 font-medium">{watch('position')}</span>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-gray-500 text-sm">
                  By clicking Submit, you agree to our
                  <a href="#" className="text-emerald-500 hover:text-emerald-600 ml-1">Terms and Conditions</a>
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
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
            
            {formStep < 3 ? (
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
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-600'
                }`}
                disabled={signUpMutation.status === 'pending'}
              >
                {signUpMutation.status === 'pending' ? 'Submitting...' : 'Submit Registration'}
              </button>
            )}
          </div>
        </form>

        {/* Debug Panel - Development Only */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h5 className="text-sm font-medium text-yellow-800 mb-2">Debug Info (Dev Only)</h5>
            <div className="text-xs text-yellow-700">
              <p><strong>Roles:</strong> {JSON.stringify(roles, null, 2)}</p>
              <p><strong>Departments:</strong> {JSON.stringify(departments, null, 2)}</p>
              <p><strong>Form Data:</strong> {JSON.stringify(watch(), null, 2)}</p>
            </div>
          </div>
        )}

        {/* 3D decoration element */}
        <div className="h-1 w-full mt-8 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-full shadow-sm"></div>
      </div>
    </FormProvider>
  )
}
