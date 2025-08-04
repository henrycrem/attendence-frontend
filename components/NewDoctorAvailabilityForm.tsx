'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createDoctorAvailability, getDoctors, getDoctorAvailabilities } from '../actions/appointmentActions';
import { toast, Toaster } from 'react-hot-toast';
import { Calendar as CalendarIcon, Clock, User, Plus, Trash2, Save, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, set, startOfWeek, getDay, addDays, isSameDay, addMinutes } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

interface Doctor {
  id: string;
  fullName: string;
}

interface DoctorAvailability {
  id: string;
  doctorId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isRecurring: boolean;
  validFrom: string;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  doctorId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isRecurring: boolean;
  validFrom: string;
  validUntil?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: DoctorAvailability;
}

interface TimeSlot {
  start: string;
  end: string;
  id: string;
}

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const COMMON_SLOT_DURATIONS = [15, 30, 45, 60];
const WORKING_HOURS = {
  start: 8, // 8 AM
  end: 18   // 6 PM
};

const NewDoctorAvailabilityForm: React.FC = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    doctorId: '',
    dayOfWeek: '',
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: 30,
    isRecurring: true,
    validFrom: format(new Date(), 'yyyy-MM-dd'),
  });
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availabilities, setAvailabilities] = useState<DoctorAvailability[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [calendarView, setCalendarView] = useState<'week' | 'day'>('week');

  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 
    'Friday', 'Saturday', 'Sunday'
  ];

  // Generate time slots based on duration
  const generateTimeSlots = (start: string, end: string, duration: number) => {
    const slots: TimeSlot[] = [];
    const startTime = parse(start, 'HH:mm', new Date());
    const endTime = parse(end, 'HH:mm', new Date());
    
    let currentTime = startTime;
    let id = 0;
    
    while (currentTime < endTime) {
      const slotEnd = addMinutes(currentTime, duration);
      if (slotEnd <= endTime) {
        slots.push({
          id: `slot-${id++}`,
          start: format(currentTime, 'HH:mm'),
          end: format(slotEnd, 'HH:mm')
        });
      }
      currentTime = slotEnd;
    }
    
    return slots;
  };

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const data = await getDoctors();
        setDoctors(data);
      } catch (error: any) {
        toast.error('Failed to load doctors');
      }
    };
    fetchDoctors();
  }, []);

 useEffect(() => {
  if (formData.doctorId) {
    const fetchAvailabilities = async () => {
      try {
        const data = await getDoctorAvailabilities(formData.doctorId);
        console.log('Fetched availabilities:', data);
        setAvailabilities(data);
        
        const calendarEvents = data.flatMap((avail) => {
          const start = new Date(avail.startTime);
          const end = new Date(avail.endTime);
          const validFrom = new Date(avail.validFrom);
          const validUntil = avail.validUntil ? new Date(avail.validUntil) : null;
          const eventDay = daysOfWeek.indexOf(avail.dayOfWeek);
          const events: CalendarEvent[] = [];

          if (avail.isRecurring) {
            const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
            const eventDate = addDays(weekStart, eventDay);
            if ((!validUntil || eventDate <= validUntil) && eventDate >= validFrom) {
              events.push({
                id: avail.id,
                title: `Available`,
                start: set(eventDate, {
                  hours: start.getHours(),
                  minutes: start.getMinutes(),
                }),
                end: set(eventDate, {
                  hours: end.getHours(),
                  minutes: end.getMinutes(),
                }),
                resource: avail,
              });
            }
          } else {
            if (isSameDay(validFrom, start)) {
              events.push({
                id: avail.id,
                title: `Available`,
                start,
                end,
                resource: avail,
              });
            }
          }
          return events;
        });
        setEvents(calendarEvents);
        if (data.length === 0) {
          console.log('No availabilities found for doctor:', formData.doctorId);
        }
      } catch (error: any) {
        console.error('fetchAvailabilities error:', error);
        if (error.statusCode !== 404) { // Don't show toast for "not found" if it means no availabilities
          toast.error(error.message || 'Failed to load availabilities');
        }
      }
    };
    fetchAvailabilities();
  } else {
    setAvailabilities([]);
    setEvents([]);
  }
}, [formData.doctorId]);

  useEffect(() => {
    const slots = generateTimeSlots(formData.startTime, formData.endTime, formData.slotDuration);
    setTimeSlots(slots);
  }, [formData.startTime, formData.endTime, formData.slotDuration]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setSelectedSlot({ start, end });
    setFormData((prev) => ({
      ...prev,
      dayOfWeek: format(start, 'EEEE'),
      startTime: format(start, 'HH:mm'),
      endTime: format(end, 'HH:mm'),
      validFrom: format(start, 'yyyy-MM-dd'),
    }));
  };

  const handleQuickTimeSet = (startHour: number, endHour: number) => {
    setFormData(prev => ({
      ...prev,
      startTime: `${startHour.toString().padStart(2, '0')}:00`,
      endTime: `${endHour.toString().padStart(2, '0')}:00`
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.doctorId) {
      toast.error('Please select a doctor');
      return;
    }
    if (!formData.dayOfWeek && !formData.isRecurring) {
      toast.error('Please select a specific day or enable recurring availability');
      return;
    }
    if (!formData.startTime || !formData.endTime) {
      toast.error('Please set start and end times');
      return;
    }
    if (formData.startTime >= formData.endTime) {
      toast.error('End time must be after start time');
      return;
    }
    if (formData.validUntil && new Date(formData.validFrom) > new Date(formData.validUntil)) {
      toast.error('Valid-from date must be before valid-until date');
      return;
    }

    const baseDate = parse(formData.validFrom, 'yyyy-MM-dd', new Date());
    const [startHours, startMinutes] = formData.startTime.split(':').map(Number);
    const [endHours, endMinutes] = formData.endTime.split(':').map(Number);

    const startTime = set(baseDate, {
      hours: startHours,
      minutes: startMinutes,
      seconds: 0,
      milliseconds: 0,
    }).toISOString();
    
    const endTime = set(baseDate, {
      hours: endHours,
      minutes: endMinutes,
      seconds: 0,
      milliseconds: 0,
    }).toISOString();
    
    const validFrom = new Date(formData.validFrom).toISOString();
    const validUntil = formData.validUntil ? new Date(formData.validUntil).toISOString() : undefined;

    const submissionData = {
      doctorId: formData.doctorId,
      dayOfWeek: formData.dayOfWeek || 'Monday',
      startTime,
      endTime,
      slotDuration: Number(formData.slotDuration),
      isRecurring: formData.isRecurring,
      validFrom,
      validUntil,
    };

    setIsSubmitting(true);

    try {
      await createDoctorAvailability(submissionData);
      toast.success('Availability scheduled successfully!');
      setTimeout(() => router.push('/dashboard/doctor'), 1500);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create availability');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDoctor = doctors.find(d => d.id === formData.doctorId);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '12px',
          },
        }}
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mx-auto mb-4">
            <CalendarIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Doctor Availability Scheduler
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Set up when doctors are available for appointments. Create recurring schedules or one-time availability blocks.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > step ? <CheckCircle2 className="w-5 h-5" /> : step}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Schedule Configuration
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Doctor Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Doctor *
                  </label>
                  <select
                    name="doctorId"
                    value={formData.doctorId}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">Choose a doctor...</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        Dr. {doctor.fullName}
                      </option>
                    ))}
                  </select>
                  {selectedDoctor && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Selected:</strong> Dr. {selectedDoctor.fullName}
                      </p>
                    </div>
                  )}
                </div>

                {/* Working Hours */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Working Hours
                  </h3>
                  
                  {/* Quick Time Presets */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickTimeSet(9, 17)}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      9 AM - 5 PM
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickTimeSet(8, 18)}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      8 AM - 6 PM
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickTimeSet(7, 19)}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      7 AM - 7 PM
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Start Time</label>
                      <input
                        type="time"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">End Time</label>
                      <input
                        type="time"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Slot Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Appointment Duration
                  </label>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {COMMON_SLOT_DURATIONS.map(duration => (
                      <button
                        key={duration}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, slotDuration: duration }))}
                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                          formData.slotDuration === duration
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {duration}m
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    name="slotDuration"
                    value={formData.slotDuration}
                    onChange={handleChange}
                    min="5"
                    max="240"
                    step="5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Custom duration (minutes)"
                  />
                </div>

                {/* Schedule Type */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Schedule Type
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="scheduleType"
                        checked={formData.isRecurring}
                        onChange={() => setFormData(prev => ({ ...prev, isRecurring: true }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Recurring Weekly Schedule
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="scheduleType"
                        checked={!formData.isRecurring}
                        onChange={() => setFormData(prev => ({ ...prev, isRecurring: false }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        One-time Availability
                      </span>
                    </label>
                  </div>
                </div>

                {/* Date Range */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valid From *
                    </label>
                    <input
                      type="date"
                      name="validFrom"
                      value={formData.validFrom}
                      onChange={handleChange}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  {formData.isRecurring && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valid Until (Optional)
                      </label>
                      <input
                        type="date"
                        name="validUntil"
                        value={formData.validUntil || ''}
                        onChange={handleChange}
                        min={formData.validFrom}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>

                {/* Time Slots Preview */}
                {timeSlots.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Generated Time Slots ({timeSlots.length} slots)
                    </h4>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {timeSlots.slice(0, 6).map((slot, index) => (
                        <div key={slot.id} className="text-xs text-gray-600 bg-white px-2 py-1 rounded">
                          {slot.start} - {slot.end}
                        </div>
                      ))}
                      {timeSlots.length > 6 && (
                        <p className="text-xs text-gray-500">
                          ...and {timeSlots.length - 6} more slots
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard/doctors')}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.doctorId}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Scheduling...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Schedule Availability
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Calendar View */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Schedule Calendar
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCalendarView('week')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      calendarView === 'week'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => setCalendarView('day')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      calendarView === 'day'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Day
                  </button>
                </div>
              </div>

              {!formData.doctorId ? (
                <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl">
                  <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Please select a doctor to view the calendar</p>
                  </div>
                </div>
              ) : (
                <div className="calendar-container">
                                                <Calendar
                                localizer={localizer}
                                events={events}
                                startAccessor="start"
                                endAccessor="end"
                                style={{ height: 600 }}
                                view={calendarView}
                                onView={setCalendarView}
                                onSelectSlot={handleSelectSlot}
                                selectable
                                step={formData.slotDuration}
                                timeslots={Math.floor(60 / formData.slotDuration)} // Ensure integer
                                min={new Date(0, 0, 0, 6, 0, 0)}
                                max={new Date(0, 0, 0, 22, 0, 0)}
                                views={['week', 'day']}
                                eventPropGetter={(event) => ({
                                    style: {
                                    backgroundColor: '#3B82F6',
                                    borderColor: '#2563EB',
                                    color: 'white',
                                    borderRadius: '6px',
                                    border: 'none',
                                    fontSize: '12px',
                                    }
                                })}
                                dayPropGetter={(date) => ({
                                    style: {
                                    backgroundColor: new Date().toDateString() === date.toDateString() 
                                        ? '#EFF6FF' 
                                        : 'white'
                                    }
                                })}
                                />
                </div>
              )}

              {selectedSlot && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-800 mb-1">
                        Time Slot Selected
                      </h4>
                      <p className="text-sm text-green-700">
                        <strong>{format(selectedSlot.start, 'EEEE, MMMM d, yyyy')}</strong>
                        <br />
                        {format(selectedSlot.start, 'h:mm a')} - {format(selectedSlot.end, 'h:mm a')}
                        {formData.isRecurring && (
                          <span className="block mt-1 text-xs">
                            This will repeat weekly for the selected date range
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .calendar-container .rbc-calendar {
          font-family: inherit;
        }
        
        .calendar-container .rbc-toolbar {
          padding: 1rem 0;
          margin-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .calendar-container .rbc-toolbar button {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          color: #374151;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .calendar-container .rbc-toolbar button:hover {
          background: #e5e7eb;
        }
        
        .calendar-container .rbc-toolbar button.rbc-active {
          background: #3b82f6;
          color: white;
          border-color: #2563eb;
        }
        
        .calendar-container .rbc-header {
          padding: 0.75rem 0.5rem;
          font-weight: 600;
          background: #f9fafb;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .calendar-container .rbc-time-slot {
          border-top: 1px solid #f3f4f6;
        }
        
        .calendar-container .rbc-time-slot:hover {
          background-color: #f0f9ff;
        }
        
        .calendar-container .rbc-day-slot .rbc-time-slot {
          height: 40px;
        }
        
        .calendar-container .rbc-current-time-indicator {
          background-color: #ef4444;
          height: 2px;
        }
        
        .calendar-container .rbc-today {
          background-color: #fef3f2;
        }
      `}</style>
    </div>
  );
};

export default NewDoctorAvailabilityForm;