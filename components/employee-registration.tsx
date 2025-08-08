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
  const [formStep, setFormStep] = useState(1)
  const router = useRouter()

  // Initialize React Hook Form
  const methods = useForm<FormData>({
    defaultValues: {
      name: '',
      email: '',
      roleId: '',
      departmentId: '',
      position: '',
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
  const roleId = watch('roleId')
  const departmentId = watch('departmentId')

  // Fetch roles
  const { data: roles = [], isLoading: rolesLoading, error: rolesError } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/roles`)
      return response.data
    },
  })

  // Fetch departments
  const { data: departments = [], isLoading: departmentsLoading, error: departmentsError } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/departments`)
      return response.data
    },
  })

  // Set default roleId if roles are loaded
  useEffect(() => {
    if (roles.length > 0 && !roleId) {
      setValue('roleId', roles[0].id)
    }
  }, [roles, roleId, setValue])

  // Get selected role name
  const getSelectedRoleName = () => {
    return roles.find((role) => role.id === roleId)?.displayName || 'Not selected'
  }

  // Get selected department name
  const getSelectedDepartmentName = () => {
    return departments.find((dept) => dept.id === departmentId)?.name || 'Not selected'
  }

  // Handle going to next step
  const handleNextStep = async () => {
    let isValid = false
    if (formStep === 1) {
      isValid = await trigger(['name', 'email', 'roleId'])
    } else if (formStep === 2) {
      isValid = await trigger(['departmentId', 'position'])
    }
    if (isValid && formStep < 3) {
      setFormStep(formStep + 1)
    }
  }

  // Go back
  const handlePrevStep = () => {
    if (formStep > 1) {
      setFormStep(formStep - 1)
    }
  }

  // Mutation for form submission
  const signUpMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/user-registration`, data)
      return response.data
    },
    onSuccess: (data) => {
      console.log('Registration successful:', data)
      // Optionally redirect or show success message
      alert('User registered successfully!')
      router.push('/dashboard/users') // or wherever appropriate
    },
    onError: (error) => {
      console.error('Registration error:', error)
      alert('Failed to register user. Please try again.')
    },
  })

  // Only submit when clicking "Submit" on Step 3
  const onSubmit = (data: FormData) => {
    signUpMutation.mutate(data)
  }

  return (
    <FormProvider {...methods}>
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-700">User Registration</h3>
          <div className="flex space-x-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`w-8 h-1 rounded-full ${
                  step === formStep
                    ? 'bg-emerald-500'
                    : step < formStep
                    ? 'bg-emerald-200'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Form */}
        <form>
          {/* Step 1: Personal Information */}
          {formStep === 1 && (
            <div className="space-y-6">
              <h4 className="text-md font-medium text-gray-700 border-b pb-2">Personal Information</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    {...register('name', {
                      required: 'Full name is required',
                      minLength: { value: 2, message: 'Must be at least 2 characters' },
                    })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter your full name"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Email Address</label>
                  <input
                    type="email"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                        message: 'Invalid email address',
                      },
                    })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter your email"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">User Role</label>
                  <select
                    {...register('roleId', { required: 'Role is required' })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    disabled={rolesLoading}
                  >
                    {rolesLoading ? (
                      <option>Loading roles...</option>
                    ) : rolesError ? (
                      <option>Error loading roles</option>
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
                  {errors.roleId && <p className="text-red-500 text-sm mt-1">{errors.roleId.message}</p>}
                  {getSelectedRoleName() && (
                    <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded">
                      <p className="text-sm text-emerald-700">
                        <strong>Selected Role:</strong> {getSelectedRoleName()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Employee Details */}
          {formStep === 2 && (
            <div className="space-y-6">
              <h4 className="text-md font-medium text-gray-700 border-b pb-2">Employee Details</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Department</label>
                  <select
                    {...register('departmentId', { required: 'Department is required' })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    disabled={departmentsLoading}
                  >
                    {departmentsLoading ? (
                      <option>Loading departments...</option>
                    ) : departmentsError ? (
                      <option>Error loading departments</option>
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
                  {errors.departmentId && (
                    <p className="text-red-500 text-sm mt-1">{errors.departmentId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Position / Job Title</label>
                  <input
                    type="text"
                    {...register('position', {
                      required: 'Position is required',
                      minLength: { value: 2, message: 'Must be at least 2 characters' },
                    })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., Software Engineer, Manager"
                  />
                  {errors.position && (
                    <p className="text-red-500 text-sm mt-1">{errors.position.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {formStep === 3 && (
            <div className="space-y-6">
              <h4 className="text-md font-medium text-gray-700 border-b pb-2">Review Information</h4>
              <div className="bg-gray-50 p-5 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Full Name</span>
                  <span className="font-medium">{watch('name')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email</span>
                  <span className="font-medium">{watch('email')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Role</span>
                  <span className="font-medium">{getSelectedRoleName()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Department</span>
                  <span className="font-medium">{getSelectedDepartmentName()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Position</span>
                  <span className="font-medium">{watch('position')}</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 text-center mt-4">
                Please review your information. Click "Submit" to confirm registration.
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={handlePrevStep}
              className={`px-4 cursor-pointer py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 ${
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
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                className={`px-6 py-2 cursor-pointer border border-transparent rounded-md text-sm font-medium text-white ${
                  signUpMutation.isPending
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-600'
                }`}
                disabled={signUpMutation.isPending}
              >
                {signUpMutation.isPending ? 'Submitting...' : 'Submit Registration'}
              </button>
            )}
          </div>
        </form>


        {/* Bottom accent line */}
        <div className="h-1 w-full mt-8 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"></div>
      </div>
    </FormProvider>
  )
}