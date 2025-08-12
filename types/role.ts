export type Role = {
  id: string;
  displayName: string;
  roleName: string;
  description: string | null;
  createdAt: string; // Assuming ISO string
  updatedAt: string; // Assuming ISO string
};

export type Pagination = {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  hasNext: boolean;
  hasPrev: boolean;
};