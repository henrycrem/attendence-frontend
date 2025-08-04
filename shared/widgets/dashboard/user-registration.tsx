'use client'

import { useState, useEffect } from 'react';

export default function UserRegistration() {
  const [isVisible, setIsVisible] = useState(false);
  const [formState, setFormState] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'patient'
  });
  const [formStep, setFormStep] = useState(1);
  const [focusedField, setFocusedField] = useState(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    // Simple password strength calculator
    if (formState.password) {
      let strength = 0;
      if (formState.password.length > 6) strength += 1;
      if (formState.password.match(/[A-Z]/)) strength += 1;
      if (formState.password.match(/[0-9]/)) strength += 1;
      if (formState.password.match(/[^A-Za-z0-9]/)) strength += 1;
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [formState.password]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState({
      ...formState,
      [name]: value
    });
  };

  const handleNextStep = () => {
    if (formStep < 3) {
      setFormStep(formStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (formStep > 1) {
      setFormStep(formStep - 1);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add your registration logic here
    console.log('Form submitted:', formState);
    // Show success message or redirect
  };

  return (
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

      <form onSubmit={handleSubmit}>
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
                  focusedField === 'fullName' ? 'scale-105' : ''
                }`}>
                  <input
                    type="text"
                    name="fullName"
                    value={formState.fullName}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField('fullName')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm hover:shadow transition-all"
                    placeholder="Enter your full name"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm text-gray-600 mb-1">Email Address</label>
                <div className={`relative transform transition-all duration-300 ${
                  focusedField === 'email' ? 'scale-105' : ''
                }`}>
                  <input
                    type="email"
                    name="email"
                    value={formState.email}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm hover:shadow transition-all"
                    placeholder="Enter your email"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border border-gray-200 hover:bg-gray-50 rounded-md transition-all hover:shadow-sm transform hover:scale-105 flex items-center cursor-pointer" onClick={() => setFormState({...formState, userType: 'patient'})}>
                  <div className={`w-4 h-4 rounded-full mr-2 border ${formState.userType === 'patient' ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'}`}></div>
                  <div className="text-gray-600 font-medium">Patient</div>
                </div>
                <div className="p-3 border border-gray-200 hover:bg-gray-50 rounded-md transition-all hover:shadow-sm transform hover:scale-105 flex items-center cursor-pointer" onClick={() => setFormState({...formState, userType: 'doctor'})}>
                  <div className={`w-4 h-4 rounded-full mr-2 border ${formState.userType === 'doctor' ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'}`}></div>
                  <div className="text-gray-600 font-medium">Doctor</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Security */}
        <div className={`transition-all duration-500 ${formStep === 2 ? 'block' : 'hidden'}`}>
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <div className="p-2 bg-gray-100 rounded-lg mr-3 shadow-inner">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <h4 className="text-md font-medium text-gray-700">Security Information</h4>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm text-gray-600 mb-1">Password</label>
                <div className={`relative transform transition-all duration-300 ${
                  focusedField === 'password' ? 'scale-105' : ''
                }`}>
                  <input
                    type={isPasswordVisible ? "text" : "password"}
                    name="password"
                    value={formState.password}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm hover:shadow transition-all"
                    placeholder="Create password"
                    required
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
                {formState.password && (
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
                    name="confirmPassword"
                    value={formState.confirmPassword}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 shadow-sm hover:shadow transition-all ${
                      formState.password && formState.confirmPassword && 
                      formState.password !== formState.confirmPassword 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-emerald-500'
                    }`}
                    placeholder="Confirm password"
                    required
                  />
                </div>
                {formState.password && formState.confirmPassword && formState.password !== formState.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Confirmation */}
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
                <span className="text-gray-800 font-medium">{formState.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email:</span>
                <span className="text-gray-800 font-medium">{formState.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">User Type:</span>
                <span className="text-gray-800 font-medium capitalize">{formState.userType}</span>
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
              className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 transition-all transform hover:scale-105 hover:shadow-lg"
            >
              Submit Registration
            </button>
          )}
        </div>
      </form>

      {/* 3D decoration element */}
      <div className="h-1 w-full mt-8 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-full shadow-sm"></div>
    </div>
  );
}