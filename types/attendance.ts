export type AttendanceRecord = {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    position: string | null;
    department: { name: string } | null;
  };
  date: string; // ISO string
  status: 'SIGNED_IN' | 'SIGNED_OUT';
  signInTime: string | null; // ISO string
  signOutTime: string | null; // ISO string
  signInLocation: {
    latitude: number | null;
    longitude: number | null;
    address: string | null;
    method: string;
    accuracy: number | null;
    timestamp: string;
    validation: any;
  } | null;
  signOutLocation: {
    latitude: number | null;
    longitude: number | null;
    address: string | null;
    method: string;
    accuracy: number | null;
    timestamp: string;
    validation: any;
  } | null;
  workplaceId: string | null;
  workplace: {
    id: string;
    name: string;
  } | null;
  method: string;
  createdAt: string;
  updatedAt: string;
};

export type AttendanceFilter = 'day' | 'week' | 'month' | 'custom';

export type AttendanceStatusFilter = 'All' | 'SIGNED_IN' | 'SIGNED_OUT';

export type PaginatedAttendanceResponse = {
  data: AttendanceRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message: string;
  status: string;
};

export type ExportAttendanceResponse = {
  success: boolean;
  blob?: Blob;
  filename?: string;
  message?: string;
};

export type LocationData = {
  latitude: number
  longitude: number
  accuracy?: number
  method: 'gps' | 'ip' | 'qr' | 'manual'
  address?: string
  ipAddress?: string
}
