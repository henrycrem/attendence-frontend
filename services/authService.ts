import { verifyUserAction, loginUserAction } from '../actions/auth';

export interface VerifyUserInput {
  email: string;
  otp: string;
  password: string;
  name: string;
  roleId: string;
}

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  success?: boolean;
  error?: string | null;
  message?: string | null;
  user?: any;
}

/**
 * Verify a user account with OTP using the server action
 * Adapted to work with TanStack React Query
 */
export async function verifyUserOTP(formData: FormData): Promise<AuthResponse> {
  try {
    // Call the server action directly
    const result = await verifyUserAction(formData);
    
    // Return the response in a format that React Query can work with
    return result;
  } catch (error) {
    console.error('Verification error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An error occurred during verification'
    };
  }
}

/**
 * Log in a user using the server action
 * Adapted to work with TanStack React Query
 */
export async function loginUserOTP(formData: FormData): Promise<AuthResponse> {
  try {
    // Call the server action directly
    const result = await loginUserAction(formData);
    
    // Return the response in a format that React Query can work with
    return result;
  } catch (error) {
    console.error('Login error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Login failed. Please try again.'
    };
  }
}

/**
 * Alternative approach to verify user that takes an object and creates FormData
 * This is often more convenient to use with React Query
 */
export async function verifyUser(userData: VerifyUserInput): Promise<AuthResponse> {
  try {
    const formData = new FormData();
    formData.append('email', userData.email);
    formData.append('otp', userData.otp);
    formData.append('password', userData.password);
    formData.append('name', userData.name);
    formData.append('roleId', userData.roleId);
    
    // Call the server action directly
    return await verifyUserAction(formData);
  } catch (error) {
    console.error('Verification error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An error occurred during verification'
    };
  }
}

/**
 * Alternative approach to login user that takes an object and creates FormData
 * This is often more convenient to use with React Query
 */
export async function loginUser(credentials: LoginUserInput): Promise<AuthResponse> {
  try {
    const formData = new FormData();
    formData.append('email', credentials.email);
    formData.append('password', credentials.password);
    
    // Call the server action directly
    return await loginUserAction(formData);
  } catch (error) {
    console.error('Login error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Login failed. Please try again.'
    };
  }
}

/**
 * Check if the user is currently authenticated
 * This would typically call an API endpoint or use a server action
 */
export async function getCurrentUser(): Promise<any | null> {
  try {
    // You would implement this based on your authentication approach
    // For example, calling a server action that checks the user's session
    
    // Placeholder implementation:
    // const result = await checkSessionAction();
    // return result.user;
    
    return null;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}