/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { API_BASE_URL } from '../utils/constants';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${API_BASE_URL}/auth/forgotpassword`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.msg || 'Bir hata oluştu.');
            }

            setIsSent(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#E0E8D7] p-6">
            <div className="bg-white p-8 sm:p-10 rounded-4xl shadow-xl w-full max-w-xl border border-[#383a42]/5 animate-fade-in">
                
                <div className="text-center mb-8">
                    <h2 className="text-5xl font-extrabold text-[#383a42] mb-2 tracking-tight">Şifremi Unuttum</h2>
                    <p className="text-gray-500 text-sm">Endişelenme, e-posta adresini gir, sana sıfırlama bağlantısı gönderelim.</p>
                </div>

                {isSent ? (
                    <div className="text-center space-y-6 animate-fade-in">
                        <div className="w-20 h-20 bg-[#A7C080]/20 rounded-full flex items-center justify-center mx-auto text-[#A7C080]">
                            <CheckCircle className="w-10 h-10" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-[#383a42]">E-posta Gönderildi!</h3>
                            <p className="text-gray-500 text-sm mt-2">Lütfen gelen kutunu (ve spam klasörünü) kontrol et.</p>
                        </div>
                        <Link to="/" className="btn-primary w-full">
                            Giriş Yapmaya Dön
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-500 text-sm p-4 rounded-xl border border-red-100 flex items-center">
                                ⚠️ {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-[#383a42] mb-2 ml-1">E-Posta Adresi</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-[#F9FAFB] border border-gray-200 text-[#383a42] rounded-xl focus:outline-none focus:border-[#A7C080] focus:ring-2 focus:ring-[#A7C080]/20 transition font-medium"
                                    placeholder="ornek@email.com"
                                />
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="w-full py-3 text-lg text-[#A7C080] hover:text-lime-200">
                            {loading ? <Loader2 className="animate-spin w-6 h-6" /> : 'Sıfırlama Linki Gönder'}
                        </button>

                        <div className="text-center mt-4">
                            <Link to="/" className="text font-bold text-[#A7C080] hover:text-[#383a42] flex items-center justify-center transition">
                                <ArrowLeft className="w-4 h-4 mr-1" /> Giriş Ekranına Dön
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;