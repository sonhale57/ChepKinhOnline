import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserInfo } from '../types';
import { apiClient } from '../api/client';

interface AuthContextType {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithCredentials: (email: string, pass: string) => Promise<void>;
  register: (fullName: string, email: string, pass: string) => Promise<void>;
  loginAsAdmin: (email: string, pass: string) => Promise<void>;
  updateUserLocal: (updated: Partial<UserInfo>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(() => {
    const saved = localStorage.getItem('chepkinh_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyToken = async () => {
      const accessToken = localStorage.getItem('chepkinh_access_token');
      const refreshToken = localStorage.getItem('chepkinh_refresh_token');

      if (!accessToken && !refreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await apiClient.get('/auth/me');
        if (res.data?.success) {
          setUser(res.data.data);
          localStorage.setItem('chepkinh_user', JSON.stringify(res.data.data));
        }
      } catch (err) {
        console.warn('Access token verification failed, trying refresh token', err);
        if (refreshToken) {
          try {
            const refreshRes = await apiClient.post('/auth/refresh-token', { refreshToken });
            if (refreshRes.data?.success) {
              const { accessToken: newAccess, refreshToken: newRefresh, user: newUser } = refreshRes.data.data;
              localStorage.setItem('chepkinh_access_token', newAccess);
              localStorage.setItem('chepkinh_refresh_token', newRefresh);
              localStorage.setItem('chepkinh_user', JSON.stringify(newUser));
              setUser(newUser);
            } else {
              logout();
            }
          } catch (refErr) {
            logout();
          }
        } else {
          logout();
        }
      } finally {
        setIsLoading(false);
      }
    };
    verifyToken();
  }, []);

  const saveAuthSession = (accessToken: string, refreshToken: string, userData: UserInfo) => {
    localStorage.setItem('chepkinh_access_token', accessToken);
    localStorage.setItem('chepkinh_refresh_token', refreshToken);
    localStorage.setItem('chepkinh_user', JSON.stringify(userData));
    setUser(userData);
  };

  const loginWithGoogle = async (idToken: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/google-login', { idToken });
      if (res.data?.success) {
        const { accessToken, refreshToken, user: userData } = res.data.data;
        saveAuthSession(accessToken, refreshToken, userData);
      } else {
        throw new Error(res.data?.message || 'Đăng nhập Google thất bại');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithCredentials = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/user-login', { email, password: pass });
      if (res.data?.success) {
        const { accessToken, refreshToken, user: userData } = res.data.data;
        saveAuthSession(accessToken, refreshToken, userData);
      } else {
        throw new Error(res.data?.message || 'Đăng nhập thất bại');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (fullName: string, email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/register', { fullName, email, password: pass });
      if (res.data?.success) {
        const { accessToken, refreshToken, user: userData } = res.data.data;
        saveAuthSession(accessToken, refreshToken, userData);
      } else {
        throw new Error(res.data?.message || 'Đăng ký thất bại');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsAdmin = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/admin-login', { email, password: pass });
      if (res.data?.success) {
        const { accessToken, refreshToken, user: userData } = res.data.data;
        saveAuthSession(accessToken, refreshToken, userData);
      } else {
        throw new Error(res.data?.message || 'Đăng nhập quản trị thất bại');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserLocal = (updated: Partial<UserInfo>) => {
    setUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updated };
      localStorage.setItem('chepkinh_user', JSON.stringify(next));
      return next;
    });
  };

  const logout = () => {
    apiClient.post('/auth/logout').catch(() => { /* ignore */ });
    localStorage.removeItem('chepkinh_access_token');
    localStorage.removeItem('chepkinh_refresh_token');
    localStorage.removeItem('chepkinh_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginWithGoogle,
        loginWithCredentials,
        register,
        loginAsAdmin,
        updateUserLocal,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
