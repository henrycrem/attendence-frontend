'use server';

import axios from 'axios';
import { cookies } from 'next/headers';



export async function verifyUserAction(formData: FormData) {
  const email = formData.get('email') as string;
  const otp = formData.get('otp') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;
  const roleId = formData.get('roleId') as string;

  if (!email || !otp || !password || !name || !roleId) {
    return { error: 'All fields are required' };
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verify-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, password, name, roleId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Verification failed');
    }

    // Clear temporary storage (if any)
    // Note: localStorage is client-side; in a real app, you might use a different mechanism
    return { success: true, message: 'Verification successful! Redirecting to login...' };
  } catch (error) {
    const errorMessage = (error instanceof Error) ? error.message : 'An error occurred during verification';
    return { error: errorMessage };
  }
}

export async function loginUserAction(
  state: { error: string; success: boolean; message: null } | { success: boolean; message: string; error: null },
  formData: FormData
): Promise<{ error: string; success: boolean; message: null } | { success: boolean; message: string; error: null }> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Validate input
  if (!email || !password) {
    return { error: 'Email and password are required', success: false, message: null };
  }

  // Validate email format
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return { error: 'Please enter a valid email address', success: false, message: null };
  }

  // Validate password length
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long', success: false, message: null };
  }

  try {
    // Debug: Log the API URL being used
    const apiUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/login`;
    console.log('Making request to:', apiUrl);
    console.log('Request payload:', { email, password: '***' }); // Don't log actual password

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      // Add credentials if needed for CORS
      credentials: 'include',
    });

    // Log response details for debugging
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    // Check if response is actually JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // If it's not JSON, get the text to see what was returned
      const responseText = await response.text();
      console.error('Non-JSON response received:', responseText);
      
      if (response.status === 404) {
        return { error: 'Login endpoint not found. Please check your API configuration.', success: false, message: null };
      } else if (response.status >= 500) {
        return { error: 'Server error. Please try again later.', success: false, message: null };
      } else {
        return { error: 'Invalid response from server. Please try again.', success: false, message: null };
      }
    }

    // Parse JSON response
    const data = await response.json();
    console.log('Response data:', data);

    if (!response.ok) {
      throw new Error(data.message || data.error || `Request failed with status ${response.status}`);
    }

    // Handle successful response
    try {
      // Extract cookies from response headers and set them
      const cookieHeader = response.headers.get('set-cookie');
      if (cookieHeader) {
        const cookieStore = await cookies();
        
        // More robust cookie parsing
        const cookieStrings = cookieHeader.includes(',') 
          ? cookieHeader.split(',').map(c => c.trim())
          : [cookieHeader];
        
        cookieStrings.forEach((cookieString) => {
          if (!cookieString || typeof cookieString !== 'string') return;
          
          const parts = cookieString.split(';');
          const nameValue = parts[0];
          
          if (!nameValue || !nameValue.includes('=')) return;
          
          const equalIndex = nameValue.indexOf('=');
          const name = nameValue.substring(0, equalIndex);
          const value = nameValue.substring(equalIndex + 1);
          
          if (name && value && typeof name === 'string' && typeof value === 'string') {
            try {
              cookieStore.set(name.trim(), value.trim(), {
                expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
              });
            } catch (setCookieError) {
              console.error('Error setting individual cookie:', setCookieError);
            }
          }
        });
      }
    } catch (cookieError) {
      console.error('Error parsing cookies:', cookieError);
      // Don't fail the login just because of cookie issues
    }

    return { success: true, message: 'Login successful! Redirecting...', error: null };

  } catch (error) {
    console.error('Login error:', error);
    
    // More specific error handling
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { error: 'Network error. Please check your connection and try again.', success: false, message: null };
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
    return { error: errorMessage, success: false, message: null };
  }
}

export async function getCurrentUserAction() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("access_token")?.value
  const refreshToken = cookieStore.get("refresh_token")?.value

  console.log("getCurrentUserAction: Access token:", accessToken ? accessToken.slice(0, 10) + "..." : "null")
  console.log("getCurrentUserAction: Refresh token:", refreshToken ? refreshToken.slice(0, 10) + "..." : "null")

  if (!accessToken) {
    console.error("getCurrentUserAction: No access token found. Please log in.")
    throw new Error("No access token found. Please log in.")
  }

  try {
    console.log("getCurrentUserAction: Sending request to /api/me...")
    const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/me`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        Cookie: `access_token=${accessToken}; refresh_token=${refreshToken || ""}`,
      },
      withCredentials: true,
    })

    console.log("getCurrentUserAction: Fetched user data:", response.data.user)
    return response.data.user
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("getCurrentUserAction: Axios error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      })

      const statusCode = error.response?.status
      throw new Error(`Failed to fetch current user: ${statusCode} - ${error.response?.data?.message || error.message}`)
    } else {
      console.error("getCurrentUserAction: Unexpected error:", error)
      throw new Error("Failed to fetch current user: Unexpected error")
    }
  }
}

export async function checkAuthStatus() {
  try {
    const user = await getCurrentUserAction()
    return { isAuthenticated: true, user, error: null }
  } catch (error: any) {
    return { isAuthenticated: false, user: null, error: error.message }
  }
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete("access_token")
  cookieStore.delete("refresh_token")
  return { success: true }
}



export async function getClientToken() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("access_token")?.value

  console.log("getClientToken: Access token:", accessToken ? accessToken.slice(0, 10) + "..." : "null")

  if (!accessToken) {
    throw new Error("No access token found")
  }

  return accessToken
}