import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from 'date-fns';

export const formatDate = (date: Date | string | null | undefined, formatStr: string = 'PPP'): string => {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, formatStr);
  } catch (e) {
    console.error("Error formatting date:", e);
    return '';
  }
};

export const formatTime = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'p'); // e.g., 4:30 PM
  } catch (e) {
    console.error("Error formatting time:", e);
    return '';
  }
};

export const getDayRange = (date: Date) => ({
  startDate: startOfDay(date),
  endDate: endOfDay(date),
});

export const getWeekRange = (date: Date) => ({
  startDate: startOfWeek(date, { weekStartsOn: 1 }), // Monday as start of week
  endDate: endOfWeek(date, { weekStartsOn: 1 }),
});

export const getMonthRange = (date: Date) => ({
  startDate: startOfMonth(date),
  endDate: endOfMonth(date),
});
