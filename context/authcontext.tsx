'use client';

import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/slices/authSlice';
import { checkAuthStatus, logoutAction, getClientToken } from '../actions/auth';
import { useWebSocket } from '../hooks/useWebSocket';

interface AuthContextType {
  token: string | null;
  user: any | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUserState] = useState<any | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch();

  // Initialize WebSocket when authenticated
  useWebSocket(isAuthenticated, token);

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      setError(null);

      console.log('AuthContext: Initializing auth check...');

      try {
        // Use server action to check auth status
        const authStatus = await checkAuthStatus();
        console.log('AuthContext: Auth status:', authStatus);

        if (authStatus.isAuthenticated && authStatus.user) {
          setUserState(authStatus.user);
          dispatch(setUser(authStatus.user));
          setIsAuthenticated(true);
          setError(null);

          // Get the token for WebSocket authentication
          try {
            const clientToken = await getClientToken();
            console.log('AuthContext: Got client token:', clientToken ? clientToken.slice(0, 10) + '...' : 'null');
            setToken(clientToken);
          } catch (tokenError) {
            console.error('AuthContext: Failed to get client token:', tokenError);
            // Still authenticated, just no WebSocket connection
            setToken(null);
          }

          console.log('AuthContext: User authenticated:', authStatus.user);
        } else {
          setUserState(null);
          setIsAuthenticated(false);
          setToken(null);
          setError(authStatus.error);
          console.log('AuthContext: User not authenticated:', authStatus.error);
        }
      } catch (error: any) {
        console.error('AuthContext: Failed to check auth status:', error);
        setUserState(null);
        setIsAuthenticated(false);
        setToken(null);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [dispatch]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log('AuthContext: Attempting login for:', email);
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('AuthContext: Login failed:', errorData);
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      console.log('AuthContext: Login response:', data);
      const { accessToken, user } = data;

      if (accessToken && user) {
        setToken(accessToken);
        setUserState(user);
        dispatch(setUser(user));
        setIsAuthenticated(true);
        setError(null);
        console.log('AuthContext: Login successful, token:', accessToken.slice(0, 10) + '...');
      } else {
        console.error('AuthContext: No token or user data received');
        throw new Error('No token or user data received');
      }
    } catch (error: any) {
      console.error('AuthContext: Login error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    console.log('AuthContext: Logging out');
    try {
      await logoutAction();
    } catch (error) {
      console.error('AuthContext: Logout error:', error);
    }

    setToken(null);
    setUserState(null);
    setIsAuthenticated(false);
    setError(null);
    dispatch(setUser(null));
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated,
        loading,
        error,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};