'use server';

import { cookies } from 'next/headers';
import { getCurrentUserAction } from './auth';
import { handleError, errorHandlers } from '../errorHandler';

class AuthenticationError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AuthenticationError';
  }
}

// ✅ Reuse your existing helpers
const getAuthHeaders = async () => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    console.error('getAuthHeaders: No access token found');
    throw new AuthenticationError('Your session has expired. Please log in again.', 401);
  }

  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
};

const checkUserRole = async () => {
  try {
    const user = await getCurrentUserAction();
    return {
      user,
      role: user?.role?.roleName,
      isAdmin: user?.role?.roleName === 'super_admin',
      isEmployee: user?.role?.roleName === 'employee',
      isSales: user?.role?.roleName === 'sales',
    };
  } catch (error) {
    throw new AuthenticationError('Unable to verify your account. Please log in again.', 401);
  }
};

const fetchWithRetry = async (url: string, options: RequestInit, retries = 2): Promise<Response> => {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 401) {
        throw new AuthenticationError('Your session has expired. Please log in again.', 401);
      }

      return response;
    } catch (error) {
      if (i === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }

  throw new Error('Maximum retries exceeded');
};

// ✅ ACTION: Update Sales Targets for a User
export async function updateSalesTargetsAction(
  userId: string,
  data: {
    weeklySalesTarget: number | null;
    monthlySalesTarget: number | null;
    yearlySalesTarget: number | null;
    weeklyRevenueTarget?: number | null;
    monthlyRevenueTarget?: number | null;
    yearlyRevenueTarget?: number | null;
  }
) {
  try {
    const { isAdmin } = await checkUserRole();

    if (!isAdmin) {
      throw new AuthenticationError('Access denied. Administrator privileges required.', 403);
    }

    const headers = await getAuthHeaders();

    const response = await fetchWithRetry(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/sales-targets/${userId}`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('updateSalesTargetsAction: Error response:', errorText);

      if (response.status === 403) {
        throw new AuthenticationError('Access denied. Administrator privileges required.', 403);
      }

      throw new Error(`Failed to update sales targets: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Sales targets updated successfully for user:', userId);

    return { success: true, data: result.user };
  } catch (error: any) {
    console.error('updateSalesTargetsAction: Error:', error);

    const friendlyMessage = errorHandlers.auth(error, false);
    return { success: false, error: friendlyMessage };
  }
}

// ✅ ACTION: Get All Sales Users (for form population)
export async function getSalesUsersAction() {
  try {
    const { isAdmin } = await checkUserRole();

    if (!isAdmin) {
      throw new AuthenticationError('Access denied. Administrator privileges required.', 403);
    }

    const headers = await getAuthHeaders();

    const response = await fetchWithRetry(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/users?role=sales`,
      {
        method: 'GET',
        headers,
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('getSalesUsersAction: Error response:', errorText);

      if (response.status === 403) {
        throw new AuthenticationError('Access denied. Administrator privileges required.', 403);
      }

      throw new Error(`Failed to load sales users: ${response.status}`);
    }

    const result = await response.json();
    console.log('📡 Raw API response:', result);
    console.log('✅ Loaded sales users:', result.users?.length || 0); // ✅ FIXED!

    return { success: true, data: result.users || [] }; // ✅ FIXED!
  } catch (error: any) {
    console.error('getSalesUsersAction: Error:', error);

    const friendlyMessage = errorHandlers.auth(error, false);
    return { success: false, error: friendlyMessage };
  }
}