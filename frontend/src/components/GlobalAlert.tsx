import React from 'react';
import { useAuth } from '../context/AuthContext';

const GlobalAlert = () => {
    const { alert } = useAuth();
    if (!alert) return null;

    const baseStyle = "fixed top-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl z-[100] text-white font-semibold transition-all duration-500 ease-in-out transform";
    
    let colorStyle = '';
    if (alert.type === 'error') colorStyle = 'bg-red-500';
    if (alert.type === 'success') colorStyle = 'bg-green-500';
    if (alert.type === 'info') colorStyle = 'bg-blue-500';
    
    return (
        <div className={`${baseStyle} ${colorStyle} ${alert ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'}`}>
            {alert.msg}
        </div>
    );
};

export default GlobalAlert;