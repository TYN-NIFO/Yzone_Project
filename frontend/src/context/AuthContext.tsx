import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { authService, type LoginCredentials, type AuthResponse } from '../services/auth.service';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
  cohortId?: string;
}

interface AuthContextType {
  currentUser: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const response: AuthResponse = await authService.login(credentials);
      setCurrentUser(response.user);
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setCurrentUser(null);
  }, []);

  return (
    <AuthContext.Provider 
      value={{ 
        currentUser, 
        login, 
        logout, 
        isAuthenticated: !!currentUser,
        loading 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
