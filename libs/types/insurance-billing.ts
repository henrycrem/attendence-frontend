export interface BillItem {
  id?: string;
  description: string;
  amount: number;
  category?: string;
}

export interface InsuranceClaimRequest {
  patientId: string;
  insuranceId: string;
  billItems: BillItem[];
  userId: string;
  activityType?: 'triage' | 'appointment';
  triageData?: {
    firstName?: string;
    lastName?: string;
    temperature?: number;
    bloodPressure?: string;
    pulse?: number;
    bloodOxygenLevel?: number;
    respirationRate?: number;
  };
  appointmentData?: {
    doctorId?: string;
    startTime?: string;
    endTime?: string;
  };
}

export interface NotificationPayload {
  id: string;
  type: 'INSURANCE_CLAIM_SENT' | 'INSURANCE_CLAIM_RESPONSE';
  title: string;
  message: string;
  data: any;
  timestamp: Date;
  read: boolean;
}