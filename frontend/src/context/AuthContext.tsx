/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, AlertState } from '../types'; 
import { API_BASE_URL } from '../utils/constants'; 
interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    initialLoading: boolean;
    alert: AlertState | null;
    apiRequest: (endpoint: string, method?: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: any) => Promise<any>;
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    fetchUser: () => Promise<void>;
    displayAlert: (msg: string, type?: 'error' | 'success' | 'info') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(() => {
        try {
            const savedUser = localStorage.getItem('user');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (e) {
            return null;
        }
    });

    const [token, setToken] = useState<string | null>(localStorage.getItem('token') || null);
    const [initialLoading, setInitialLoading] = useState<boolean>(!user && !!token);
    const [loading, setLoading] = useState<boolean>(false);
    const [alert, setAlert] = useState<AlertState | null>(null);

    useEffect(() => {
        if (token) localStorage.setItem('token', token);
        else localStorage.removeItem('token');

        if (user) localStorage.setItem('user', JSON.stringify(user));
        else localStorage.removeItem('user');
    }, [token, user]);

    const displayAlert = (msg: string, type: 'error' | 'success' | 'info' = 'error') => {
        setAlert({ msg, type });
        setTimeout(() => setAlert(null), 4000);
    };

    const logout = () => {
        console.log("Logout tetiklendi.");
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('currentView');
        localStorage.removeItem('selectedUserId');
        setInitialLoading(false);
        displayAlert('Oturum sonlandırıldı.', 'info');
    };

    const apiRequest = useCallback(async (endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body: any = null): Promise<any> => {
        setLoading(true);
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
        };

        try {
            const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
            });
            
            const data = await response.json();
            setLoading(false);

            if (!response.ok) {
                if (response.status === 401) {
                    console.warn("API isteği 401 döndü, çıkış yapılıyor.");
                    logout();
                }
                const errorMsg = data.msg || 'İşlem başarısız.';
                displayAlert(errorMsg, 'error');
                throw new Error(errorMsg);
            }
            return data;
        } catch (error: any) {
            setLoading(false);
            throw error;
        }
    }, [logout, token]);

    const fetchUser = useCallback(async () => {
        if (!token) {
            setInitialLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/users/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json().catch(() => null);

            if (response.ok && data && data.user) {
                if (data.user.profileImage) {
                    data.user.profileImage = `${data.user.profileImage}?t=${new Date().getTime()}`;
                }

                setUser(data.user);
            } else if (response.status === 401) {
                logout();
            }
        } catch (error) {
            console.error("FetchUser hatası:", error);
        } finally {
            setInitialLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) fetchUser();
        else setInitialLoading(false);
    }, []); 

    const login = async (email: string, password: string) => {
        const data = await apiRequest('auth/login', 'POST', { email, password });
        setToken(data.token);
        setUser(data.user);
        displayAlert('Giriş başarılı!', 'success');
    };

    const register = async (username: string, email: string, password: string) => {
        const data = await apiRequest('auth/register', 'POST', { username, email, password });
        setToken(data.token);
        setUser(data.user);
        displayAlert('Kayıt başarılı! Hoş geldiniz.', 'success');
    };

    const value: AuthContextType = {
        user,
        token,
        loading,
        initialLoading,
        alert,
        apiRequest,
        login,
        register,
        logout,
        fetchUser,
        displayAlert
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};