"use client"

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, Globe, ArrowRight, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { loginUserAction } from '../../actions/auth';
import { useFormStatus, useFormState} from 'react-dom';
import { useActionState } from 'react';

function LoginFormContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formActive, setFormActive] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [clientValidationFailed, setClientValidationFailed] = useState(false);
  const router = useRouter();
  const [state, formAction] = useActionState(loginUserAction, { error: '', success: false, message: null });

  useEffect(() => {
    setTimeout(() => setFormActive(true), 300);
  }, []);

  useEffect(() => {
    if (state.success) {
      setTimeout(() => router.push('/dashboard'), 2000);
    }
  }, [state.success, router]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validateEmail = (email: string) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    } else if (!regex.test(email)) {
      setEmailError('Invalid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleClientValidation = (e: React.FormEvent) => {
    const emailValid = validateEmail(email);
    const passwordValid = validatePassword(password);

    if (!emailValid || !passwordValid) {
      e.preventDefault();
      setClientValidationFailed(true);
    } else {
      setClientValidationFailed(false);
    }
  };

  const { pending } = useFormStatus();

  return (
    <form action={formAction} onSubmit={handleClientValidation} className="px-8 py-10 relative">
      {/* Email Field */}
      <div className={`mb-6 relative transition-all duration-700 ease-out 
        ${formActive ? 'translate-x-0 opacity-100' : 'translate-x-40 opacity-0'}`}>
        <label
          htmlFor="email"
          className="absolute left-10 text-xs text-red-400 -top-2 bg-slate-800 px-2 rounded 
          transition-all duration-300 z-20"
        >
          Email Address
        </label>
        <div className="flex items-center relative overflow-hidden group
          before:absolute before:left-0 before:bottom-0 before:h-0.5 before:w-0 
          before:bg-gradient-to-r before:from-red-400 before:to-red-500 before:transition-all hover:before:w-full">
          <span className="absolute left-3 text-slate-400 transition-all duration-300 group-focus-within:text-red-400">
            <Mail className="w-5 h-5" />
          </span>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              validateEmail(e.target.value);
            }}
            className="w-full pl-10 pr-3 py-3 bg-slate-800 text-slate-100 border-2 border-slate-600 
            rounded-xl outline-none transition-all duration-300 focus:border-red-400
            focus:shadow-[0_0_20px_rgba(239,68,68,0.3)] focus:bg-slate-750"
            placeholder="employee@telecel.lr"
            required
          />
        </div>
        {emailError && (
          <p className="text-red-400 text-sm mt-1 animate-pulse flex items-center">
            <div className="w-1 h-1 bg-red-400 rounded-full mr-2 animate-ping"></div>
            {emailError}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className={`mb-6 relative transition-all duration-700 ease-out 
        ${formActive ? 'translate-x-0 opacity-100 delay-100' : 'translate-x-40 opacity-0'}`}>
        <label
          htmlFor="password"
          className="absolute left-10 text-xs text-red-400 -top-2 bg-slate-800 px-2 rounded
          transition-all duration-300 z-20"
        >
          Password
        </label>
        <div className="flex items-center relative overflow-hidden group
          before:absolute before:left-0 before:bottom-0 before:h-0.5 before:w-0 
          before:bg-gradient-to-r before:from-red-400 before:to-red-500 before:transition-all hover:before:w-full">
          <span className="absolute left-3 text-slate-400 transition-all duration-300 group-focus-within:text-red-400">
            <Lock className="w-5 h-5" />
          </span>
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              validatePassword(e.target.value);
            }}
            className="w-full pl-10 pr-12 py-3 bg-slate-800 text-slate-100 border-2 border-slate-600 
            rounded-xl outline-none transition-all duration-300 focus:border-red-400
            focus:shadow-[0_0_20px_rgba(239,68,68,0.3)] focus:bg-slate-750"
            placeholder="••••••••"
            required
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 text-slate-400 hover:text-red-400 focus:outline-none 
            transition-all duration-300 transform hover:scale-110"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {passwordError && (
          <p className="text-red-400 text-sm mt-1 animate-pulse flex items-center">
            <div className="w-1 h-1 bg-red-400 rounded-full mr-2 animate-ping"></div>
            {passwordError}
          </p>
        )}
      </div>

      {/* Remember Me & Forgot Password */}
      <div className={`flex items-center justify-between mb-8 transition-all duration-700 ease-out
        ${formActive ? 'translate-y-0 opacity-100 delay-200' : 'translate-y-10 opacity-0'}`}>
        <label className="flex items-center text-sm text-slate-400 group cursor-pointer">
          <input
            type="checkbox"
            name="rememberMe"
            className="w-4 h-4 text-red-500 rounded border-slate-600 focus:ring-red-500 
            focus:ring-offset-slate-800 bg-slate-800"
            checked={rememberMe}
            onChange={() => setRememberMe(!rememberMe)}
          />
          <span className="ml-2 transition-colors duration-300 group-hover:text-slate-300">Remember me</span>
        </label>

        <a href="/forgot-password" className="text-sm text-red-400 hover:text-red-300 
          transition-all duration-300 transform hover:translate-x-1 inline-flex items-center">
          Forgot password?
          <ArrowRight className="w-3 h-3 ml-1" />
        </a>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={pending || clientValidationFailed}
        className={`w-full py-3 rounded-xl font-medium text-white
          transition-all duration-500 ease-out transform
          ${formActive ? 'translate-y-0 opacity-100 delay-300' : 'translate-y-10 opacity-0'}
          ${
            pending || clientValidationFailed
              ? 'bg-slate-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 hover:shadow-lg hover:shadow-red-500/30 active:scale-[0.98]'
          }
          relative overflow-hidden border border-red-400/20
          before:absolute before:inset-0 before:bg-white/10 before:translate-x-[-100%] hover:before:translate-x-[100%]
          before:transition-transform before:duration-700 before:skew-x-12
        `}
      >
        {pending ? (
          <div className="flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
            Connecting...
          </div>
        ) : (
          <span className="relative z-10 flex items-center justify-center">
            <Globe className="w-4 h-4 mr-2" />
            Access Portal
          </span>
        )}
      </button>

      {state.error && (
        <p className="text-red-400 text-sm mt-4 animate-pulse flex items-center">
          <div className="w-1 h-1 bg-red-400 rounded-full mr-2 animate-ping"></div>
          {state.error}
        </p>
      )}

      {state.success && state.message && (
        <p className="text-green-500 text-sm mt-4 animate-pulse flex items-center">
          <div className="w-1 h-1 bg-green-500 rounded-full mr-2 animate-ping"></div>
          {state.message}
        </p>
      )}
    </form>
  );
}

export default function LoginForm() {
  return (
    <div className="w-full max-w-md relative">
      {/* Background network animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-red-400/20 rounded-full animate-ping"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-red-500/20 rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/2 w-1.5 h-1.5 bg-red-300/20 rounded-full animate-bounce"></div>
      </div>
      
      <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 
        overflow-hidden hover:shadow-red-500/10 transition-all duration-500">
        
        {/* Form Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5"></div>
          <div className="relative z-10">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                <Globe className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold">Attendance System</h2>
            </div>
            <p className="text-red-100 text-sm">Access your Telecel Liberia account</p>
          </div>
        </div>

        <LoginFormContent />
      </div>

      {/* Security Notice */}
      <div className="mt-6 text-center text-sm text-slate-400 flex items-center justify-center">
        <Shield className="w-4 h-4 mr-2 text-red-400" />
        <span>Protected by enterprise-grade security</span>
      </div>
    </div>
  );
}