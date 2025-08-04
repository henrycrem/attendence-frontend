"use client"

import { useState } from 'react';
import { Phone, Mail, MapPin, Facebook, Twitter, Linkedin, ChevronRight, Shield, Users, Signal, Wifi } from 'lucide-react';

const LoginFooter = () => {
  const currentYear = new Date().getFullYear();
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  
  const socialLinks = [
    { icon: Facebook, label: 'Facebook', color: 'hover:text-blue-400' },
    { icon: Twitter, label: 'Twitter', color: 'hover:text-red-400' },
    { icon: Linkedin, label: 'LinkedIn', color: 'hover:text-blue-500' }
  ];
  
  const contactInfo = [
    { icon: Phone, text: '+231-776-933-986', color: 'text-green-400' },
    { icon: Mail, text: 'info@teleceliberia.com', color: 'text-red-400' },
    { icon: MapPin, text: 'Monrovia, Liberia', color: 'text-yellow-400' }
  ];
  
  const quickLinks = [
    'About System', 'Features', 'Requirements', 
    'Data Security', 'Documentation', 'Support'
  ];
  
  const policyLinks = [
    'Privacy Policy', 'Terms of Service', 'Data Protection'
  ];

  return (
    <footer className="relative mt-3 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-red-900 to-red-800"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-red-500/5 to-red-600/5"></div>
      
      {/* Network pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-1/4 w-1 h-1 bg-red-400 rounded-full animate-ping"></div>
        <div className="absolute top-20 right-1/3 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 left-1/2 w-1.5 h-1.5 bg-red-300 rounded-full animate-bounce"></div>
      </div>
      
      {/* Top border with signal effect */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-red-600 to-red-500"></div>
      <div className="absolute top-1 left-0 right-0 h-px bg-red-400/30 animate-pulse"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          
          {/* Company Info */}
          <div className="transform hover:translate-y-1 transition-transform duration-300">
            <div className="flex items-center mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 
                rounded-xl shadow-lg transform rotate-3 relative overflow-hidden border border-red-300/20">
                <Signal className="w-6 h-6 text-white relative z-10" />
                <div className="absolute inset-0">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-2 h-2 bg-white/20 rounded-full animate-ping"></div>
                  </div>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-white text-xl font-bold">Telecel Liberia</h3>
                <p className="text-red-300 text-sm">Attendance System</p>
              </div>
            </div>
            <p className="text-slate-300 mb-6">
              Advanced attendance tracking solutions for Telecel Liberia employees.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a 
                  key={index}
                  href="#" 
                  className="group relative"
                  onMouseEnter={() => setHoveredLink(social.label)}
                  onMouseLeave={() => setHoveredLink(null)}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-full 
                    opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300"></div>
                  <div className={`relative flex items-center justify-center w-10 h-10 
                    bg-slate-800 rounded-full border border-red-500/20
                    transform transition-all duration-300 
                    ${hoveredLink === social.label ? 'scale-110 -translate-y-1 shadow-lg shadow-red-500/20' : ''}
                  `}>
                    <social.icon className={`w-4 h-4 text-slate-400 group-hover:text-white transition-colors ${social.color}`} />
                  </div>
                </a>
              ))}
            </div>
          </div>
          
          {/* Contact Info */}
          <div className="transform md:translate-y-4 transition-transform duration-500">
            <h3 className="text-white text-lg font-bold mb-6 relative flex items-center">
              <Phone className="w-5 h-5 mr-2 text-red-400" />
              Contact Support
              <span className="absolute -bottom-2 left-0 w-16 h-0.5 bg-gradient-to-r from-red-500 to-transparent"></span>
            </h3>
            <ul className="space-y-4">
              {contactInfo.map((item, index) => (
                <li key={index} className="flex items-start group cursor-pointer">
                  <div className={`flex items-center justify-center w-8 h-8 mr-3 rounded-lg bg-slate-800/80 
                    border border-slate-600/50 shadow-inner group-hover:border-red-500/30 transition-colors`}>
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Quick Links */}
          <div className="transform md:translate-y-2 transition-transform duration-500">
            <h3 className="text-white text-lg font-bold mb-6 relative flex items-center">
              <Wifi className="w-5 h-5 mr-2 text-red-400" />
              Services
              <span className="absolute -bottom-2 left-0 w-16 h-0.5 bg-gradient-to-r from-red-500 to-transparent"></span>
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {quickLinks.map((link, index) => (
                <a 
                  key={index} 
                  href="#" 
                  className="group flex items-center text-sm text-slate-300 hover:text-white 
                    transition-all duration-300 py-1 px-2 rounded hover:bg-slate-800/50"
                >
                  <ChevronRight className="w-3 h-3 text-red-400 mr-2 opacity-0 group-hover:opacity-100 
                    transition-opacity transform group-hover:translate-x-1" />
                  <span className="group-hover:translate-x-1 transition-transform duration-300">{link}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Copyright Bar */}
      <div className="relative border-t border-slate-700/50">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-slate-400 text-center md:text-left flex items-center">
              <Shield className="w-3 h-3 mr-1 text-red-400" />
              © {currentYear} Telecel Liberia. All rights reserved. | Secure Attendance System
            </p>
            <div className="flex items-center space-x-6 mt-3 md:mt-0">
              <span className="text-xs text-slate-500 flex items-center">
                <Users className="w-3 h-3 mr-1" />
                Secure Employee Portal
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default LoginFooter;