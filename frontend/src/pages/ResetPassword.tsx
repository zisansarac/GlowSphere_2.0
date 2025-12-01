/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { API_BASE_URL } from '../utils/constants';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    const { token } = useParams(); 
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            return setError('Şifreler eşleşmiyor.');
        }
        
        if (password.length < 6) {
            return setError('Şifre en az 6 karakter olmalı.');
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${API_BASE_URL}/auth/resetpassword/${token}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.msg || 'Şifre sıfırlama başarısız.');
            }

            alert('Şifreniz başarıyla güncellendi! Giriş yapabilirsiniz.');
            navigate('/');

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#E0E8D7] p-6">
            <div className="bg-white p-8 sm:p-10 rounded-4xl shadow-xl w-full max-w-md border border-[#383a42]/5 animate-fade-in">
                
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-[#383a42] mb-2 tracking-tight">Yeni Şifre</h1>
                    <p className="text-gray-500 text-sm">Hesabın için yeni ve güçlü bir şifre belirle.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-500 text-sm p-4 rounded-xl border border-red-100 flex items-center">
                            ⚠️ {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-[#383a42] mb-2 ml-1">Yeni Şifre</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-11 pr-12 py-3 bg-[#F9FAFB] border border-gray-200 text-[#383a42] rounded-xl focus:outline-none focus:border-[#A7C080] focus:ring-2 focus:ring-[#A7C080]/20 transition font-medium"
                                placeholder="******"
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[#383a42]">
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[#383a42] mb-2 ml-1">Şifreyi Onayla</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-[#F9FAFB] border border-gray-200 text-[#383a42] rounded-xl focus:outline-none focus:border-[#A7C080] focus:ring-2 focus:ring-[#A7C080]/20 transition font-medium"
                                placeholder="******"
                            />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-lg">
                        {loading ? <Loader2 className="animate-spin w-6 h-6" /> : 'Şifreyi Güncelle'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;