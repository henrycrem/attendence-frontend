'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createDoctor } from 'apps/user-ui/src/actions/doctorActions';
import { toast, Toaster } from 'react-hot-toast';
import { Stethoscope, User, Mail, Phone, Building } from 'lucide-react';

interface FormData {
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
}

const NewDoctorForm: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    title: '',
    firstName: '',
    lastName: '',
    middleName: '',
    emailWork: '',
    emailPersonal: '',
    mobilePrimary: '',
    mobileSecondary: '',
    entityId: '',
    ourDoctor: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createDoctor(formData);
      toast.success('Doctor created successfully!');
      router.push('/dashboard/doctor');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create doctor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="text-center mb-8 transform hover:scale-105 transition-all duration-300">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 rounded-full shadow-2xl mb-6 animate-bounce">
            <Stethoscope className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            Add New Doctor
          </h1>
          <p className="text-gray-600 text-lg mt-2">Register a new healthcare professional</p>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-6 transform hover:scale-[1.02] transition-all duration-300">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title (Optional)</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white/90 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-lg"
                    placeholder="Enter title (e.g., Dr.)"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white/90 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-lg"
                    placeholder="Enter first name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white/90 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-lg"
                    placeholder="Enter last name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name (Optional)</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white/90 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-lg"
                    placeholder="Enter middle name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Work Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    name="emailWork"
                    value={formData.emailWork}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white/90 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-lg"
                    placeholder="Enter work email address"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Personal Email (Optional)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    name="emailPersonal"
                    value={formData.emailPersonal}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white/90 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-lg"
                    placeholder="Enter personal email address"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    name="mobilePrimary"
                    value={formData.mobilePrimary}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white/90 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-lg"
                    placeholder="Enter primary phone number"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Phone (Optional)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    name="mobileSecondary"
                    value={formData.mobileSecondary}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white/90 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-lg"
                    placeholder="Enter secondary phone number"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Entity (Optional)</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="entityId"
                    value={formData.entityId}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white/90 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-lg"
                    placeholder="Enter entity ID"
                  />
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="ourDoctor"
                  checked={formData.ourDoctor}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm font-medium text-gray-700">Our Doctor</label>
              </div>
            </div>

            <div className="flex gap-4 justify-end">
              <button
                type="button"
                onClick={() => router.push('/dashboard/doctor')}
                className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold rounded-2xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg transform hover:scale-105"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white font-semibold rounded-2xl hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700 disabled:opacity-50 transition-all duration-300 shadow-lg transform hover:scale-105"
              >
                {isSubmitting ? 'Creating...' : 'Create Doctor'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewDoctorForm;