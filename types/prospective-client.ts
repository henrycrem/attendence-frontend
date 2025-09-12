// types/prospective-client.ts
export interface ProspectiveClient {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  address?: string;
  neighborhood?: string;
  serviceInterest?: string;
  bandwidthPlan?: string;
  monthlyBudget?: number;
  currentProvider?: string;
  contractEndDate?: string;
  installationSite?: string;
  notes?: string;
  status: string;
  source: string;
  priority: string;
  lastInteractionOutcome?: string;
  expectedRevenue?: number;
  conversionProbability?: number;
  nextFollowUpDate?: string;
  followUpCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  Task?: Array<{
    id: string;
    title: string;
    taskType: string;
    startTime: string;
  }>;
}