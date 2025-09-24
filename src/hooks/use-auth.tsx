
'use client';
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';
import { getRefreshTokenName } from '@/lib/jwt';
import { getCookie } from '@/lib/utils';
import axios, { type AxiosRequestConfig } from 'axios';

export interface User {
    id: number;
    name: string;
    email: string;
    role: number;
    avatar?: string;
    phone?: string;
    points?: number;
    referralCode?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean | undefined; // undefined: checking, false: no, true: yes
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{success: boolean, message: string, user?: User}>;
    register: (data: any) => Promise<{success: boolean, message: string}>;
    logout: () => Promise<void>;
    fetchWithAuth: (url: string, options?: AxiosRequestConfig) => Promise<any>;
    updateUser: (newUser: Partial<User>) => void;
    setAccessToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isTokenExpired = (token: string): boolean => {
  try {
    const decoded: { exp: number } = jwtDecode(token);
    return Date.now() >= decoded.exp * 1000;
  } catch (err) {
    return true;
  }
};

let accessToken: string | null = null;

const getAccessTokenClient = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('accessToken');
    }
    return accessToken;
};

// Define the key for guest reward state
const GUEST_STORAGE_KEY = 'guestRewardState_v3';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const setAccessToken = useCallback((token: string | null) => {
        accessToken = token;
        if (typeof window !== 'undefined') {
            if(token) {
                localStorage.setItem('accessToken', token);
                try {
                    const decodedUser: User = jwtDecode(token);
                    setUser(decodedUser);
                    setIsAuthenticated(true);
                } catch(e) {
                    console.error("Failed to decode new access token", e);
                    setUser(null);
                    setIsAuthenticated(false);
                }
            } else {
                localStorage.removeItem('accessToken');
                setUser(null);
                setIsAuthenticated(false);
            }
        }
    }, []);

    const logout = useCallback(async () => {
        setIsLoading(true);
        
        // Immediately clear client state
        setAccessToken(null); 
        
        try {
            await axios.post('/api/auth/logout');
        } catch (error) {
            console.error("Logout fetch failed:", error);
        } finally {
            setIsLoading(false);
            // Force a full page reload to the login page to ensure all state is reset
            window.location.href = '/login'; 
        }
    }, [setAccessToken]);


    const silentRefresh = useCallback(async (): Promise<string | null> => {
        try {
            const { data } = await axios.post('/api/auth/refresh');
            if (data.success && data.accessToken) {
                setAccessToken(data.accessToken);
                return data.accessToken;
            }
            throw new Error(data.message || 'Refresh token invalid or expired');
        } catch (error) {
            console.warn('Silent refresh failed:', error);
            await logout(); // Logout if silent refresh fails
            return null;
        }
    }, [setAccessToken, logout]);
    
    // Auth Check Effect
    useEffect(() => {
        const initializeAuth = async () => {
            const token = getAccessTokenClient();
            if (token && !isTokenExpired(token)) {
                setAccessToken(token);
            } else {
                 const hasRefreshToken = getCookie(getRefreshTokenName(1)) || getCookie(getRefreshTokenName(2)) || getCookie(getRefreshTokenName(3));
                 if(hasRefreshToken) {
                    await silentRefresh();
                 } else {
                    setIsAuthenticated(false);
                    setUser(null);
                 }
            }
        };
        initializeAuth();
    }, [silentRefresh, setAccessToken]);


    const fetchWithAuth = useCallback(async (url: string, options: AxiosRequestConfig = {}) => {
        let token = getAccessTokenClient();
        
        if (!token || isTokenExpired(token)) {
            token = await silentRefresh();
        }

        if (!token) {
            // No need to call logout() here, silentRefresh already does it on failure
            throw new Error('Sesi berakhir. Silakan login kembali.');
        }

        const headers = new Headers(options.headers || {});
        headers.set('Authorization', `Bearer ${token}`);
        if (!headers.has('Content-Type') && !(options.data instanceof FormData)) {
            headers.set('Content-Type', 'application/json');
        }

        try {
            const response = await axios({ url, ...options, headers: Object.fromEntries(headers.entries()) });
            return response;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                 await logout();
                 throw new Error('Akses ditolak oleh server. Sesi Anda mungkin telah berakhir.');
            }
            throw error;
        }
    }, [silentRefresh, logout]);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const { data } = await axios.post('/api/auth/login', { email, password });
            if (data.success && data.accessToken) {
                setAccessToken(data.accessToken);
                if (typeof window !== 'undefined') {
                    localStorage.removeItem(GUEST_STORAGE_KEY);
                }
            }
            return data;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (payload: any) => {
        setIsLoading(true);
        try {
            const { data } = await axios.post('/api/auth/register', payload);
            return data;
        } finally {
            setIsLoading(false);
        }
    };
    
    const updateUser = (newUser: Partial<User>) => {
        setUser(prevUser => {
            if (!prevUser) return null;
            return { ...prevUser, ...newUser };
        });
    }

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, register, logout, fetchWithAuth, updateUser, setAccessToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
