export type Task = {
  id: string;
  title: string;
  description: string | null;
  taskType: string; // Maps to TaskType enum (e.g., "CLIENT_VISIT", "FOLLOW_UP")
  clientId: string | null;
  client: {
    id: string;
    fullName: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    neighborhood: string | null;
    serviceInterest: string | null;
    status: string | null;
  } | null;
  clientLocation: { latitude: number; longitude: number } | null;
  address: string;
  startTime: string;
  endTime: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  outcome: string | null; // Maps to InteractionOutcome enum (e.g., "INTERESTED", "CONVERTED")
  actualDuration: number | null;
  duration: number | null; // Added by getTaskById controller
  potentialRevenue: number | null;
  actualRevenue: number | null;
  conversionAchieved: boolean;
  userId: string;
  user: { id: string; name: string; email: string; position: string | null; department: { id: string; name: string } | null };
  notes: string | null;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
  // Fields for TasksTable (from getTasksByUserAction)
  status?: string; // e.g., "completed", "pending", "overdue"
  priority?: string; // e.g., "LOW", "MEDIUM", "HIGH", "URGENT"
};