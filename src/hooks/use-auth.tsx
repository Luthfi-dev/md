
'use client';
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';
import { getCookie } from '@/lib/utils'; 

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
    fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
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

    const logout = useCallback(async (redirect = true) => {
        setIsLoading(true);
        setAccessToken(null);
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error("Logout fetch failed:", error);
        } finally {
            setIsLoading(false);
            if (redirect) {
                window.location.href = '/login'; // Use window.location to force a full refresh and ensure middleware runs
            }
        }
    }, [setAccessToken]);

    const silentRefresh = useCallback(async () => {
        const refreshToken = getCookie('refreshToken');
        if (!refreshToken) {
            setIsAuthenticated(false);
            return null;
        }

        try {
            const res = await fetch('/api/auth/refresh', { method: 'POST' });
            if (!res.ok) throw new Error('Refresh failed');
            
            const data = await res.json();
            if (data.success && data.accessToken) {
                setAccessToken(data.accessToken);
                return data.accessToken;
            }
            throw new Error('Refresh token invalid');
        } catch (error) {
            console.error('Silent refresh failed:', error);
            await logout(false);
            return null;
        }
    }, [logout, setAccessToken]);
    
    // Auth Check Effect
    useEffect(() => {
        const initializeAuth = async () => {
            const token = getAccessTokenClient();
            if (token && !isTokenExpired(token)) {
                setAccessToken(token);
            } else {
                if (getCookie('refreshToken')) {
                    await silentRefresh();
                } else {
                    setIsAuthenticated(false);
                }
            }
        };
        initializeAuth();
    }, [silentRefresh, setAccessToken]);


    const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
        let token = getAccessTokenClient();
        
        if (!token || isTokenExpired(token)) {
            token = await silentRefresh();
        }

        if (!token) {
            await logout(true);
            throw new Error('Not authenticated');
        }

        const headers = new Headers(options.headers || {});
        headers.set('Authorization', `Bearer ${token}`);
        if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
            headers.set('Content-Type', 'application/json');
        }

        const response = await fetch(url, { ...options, headers });

        if (response.status === 401) {
             await logout(true);
        }

        return response;
    }, [silentRefresh, logout]);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (data.success && data.accessToken) {
                setAccessToken(data.accessToken);
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('guestRewardState_v3');
                }
            }
            return data;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (data: any) => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return await res.json();
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
