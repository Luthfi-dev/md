
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
let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

const onRefreshed = (token: string | null) => {
    refreshSubscribers.forEach(callback => callback(token));
    refreshSubscribers = [];
}

const addRefreshSubscriber = (callback: (token: string | null) => void) => {
    refreshSubscribers.push(callback);
}


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
        setAccessToken(null); 
        try {
            await axios.post('/api/auth/logout');
        } catch (error) {
            console.error("Logout fetch failed:", error);
        } finally {
            setIsLoading(false);
            window.location.href = '/login'; 
        }
    }, [setAccessToken]);


    const silentRefresh = useCallback(async (): Promise<string | null> => {
        if (isRefreshing) {
            return new Promise(resolve => {
                addRefreshSubscriber(token => {
                    resolve(token);
                });
            });
        }
        isRefreshing = true;

        try {
            const { data } = await axios.post('/api/auth/refresh');
            if (data.success && data.accessToken) {
                setAccessToken(data.accessToken);
                onRefreshed(data.accessToken);
                return data.accessToken;
            }
             throw new Error(data.message || 'Refresh token invalid or expired');
        } catch (error) {
            console.warn('Silent refresh failed.');
            onRefreshed(null);
            setAccessToken(null); // This will set isAuthenticated to false
            return null;
        } finally {
             isRefreshing = false;
        }
    }, [setAccessToken]);
    
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

        const makeRequest = async (currentToken: string | null) => {
             if (!currentToken) {
                throw new Error('Sesi berakhir. Silakan login kembali.');
             }
             const headers: any = { ...options.headers };
             headers['Authorization'] = `Bearer ${currentToken}`;

             if (!headers['Content-Type'] && !(options.data instanceof FormData)) {
                headers['Content-Type'] = 'application/json';
             }
             return axios({ url, ...options, headers });
        };

        try {
            // Check if token is expired before making the request
            if (!token || isTokenExpired(token)) {
                token = await silentRefresh();
            }
            return await makeRequest(token);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                console.log("Access token expired or invalid. Retrying with refresh...");
                try {
                    const newToken = await silentRefresh();
                    if (newToken) {
                        return await makeRequest(newToken);
                    } else {
                         await logout();
                         throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
                    }
                } catch (refreshError) {
                     await logout();
                     throw refreshError;
                }
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
