/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../utils/constants';
import { Link } from 'react-router-dom';

const AuthForm = ({ isRegister, toggleAuthMode }: { isRegister: boolean, toggleAuthMode: () => void }) => {
    const { login, register, loading } = useAuth();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            if (isRegister) {
                await register(username, email, password); 
            } else {
                await login(email, password);
            }
        } catch (err: any) {
            setError(err.message || 'Bir hata oluştu.');
        }
    };

    return (
        <div className={`flex w-full h-screen overflow-hidden font-sans bg-[${COLORS.BG_DARK}]`}>
            {/* SOL TARA (FORM) */}
            <div className="w-full lg:w-1/2 h-full flex items-center justify-center p-6 relative z-20">
                <div className={`w-full max-w-md bg-[${COLORS.BG_DARK}]`}>
                    <div className="flex items-center space-x-3 mb-8">
                        <h1 className={`text-xl font-extrabold text-[${COLORS.SECONDARY}] tracking-tighter hover:text-[#5fa51e]`}>glowsphere.</h1>
                    </div>

                    <div className="mb-8">
                        <h2 className={`text-2xl lg:text-3xl font-bold text-[${COLORS.SECONDARY}] mb-2`}>
                            {isRegister ? 'Hesap Oluştur' : 'Tekrar Hoş Geldiniz'}
                        </h2>
                        <p className="text-gray-600 text-sm lg:text-base">
                            {isRegister ? 'GlowSphere dünyasına katılmak için bilgilerini gir.' : 'Kaldığınız yerden devam edin.'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        {isRegister && (
                            <div className="space-y-1.5 animate-fade-in">
                                <label className={`text-sm font-bold text-[${COLORS.SECONDARY}] ml-1 mb-2`}>Kullanıcı Adı</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="kullaniciadin"
                                    className={`w-full bg-[${COLORS.BG_LIGHT}] border-2 border-transparent focus:border-[${COLORS.PRIMARY}] text-[${COLORS.SECONDARY}] rounded-xl p-3.5 outline-none transition-all shadow-sm placeholder-gray-400 font-mono`}
                                    required
                                />
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className={`text-sm font-bold text-[${COLORS.SECONDARY}] ml-1 mb-2`}>E-posta</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="glowsphere@gmail.com"
                                className={`w-full bg-[${COLORS.BG_LIGHT}] border-2 border-transparent focus:border-[${COLORS.PRIMARY}] text-[${COLORS.SECONDARY}] rounded-xl p-3.5 mt-2 outline-none transition-all shadow-sm placeholder-gray-400 font-mono`}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className={`text-sm font-bold text-[${COLORS.SECONDARY}] ml-1`}>Şifre</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className={`w-full bg-[${COLORS.BG_LIGHT}] border-2 border-transparent focus:border-[${COLORS.PRIMARY}] text-[${COLORS.SECONDARY}] rounded-xl p-3.5 mt-2 outline-none transition-all shadow-sm placeholder-gray-400 font-mono`}
                                required
                            />
                            <div className="flex justify-end">
                       {!isRegister && (
                        <div className="flex justify-end ">
                            <Link to="/forgot-password" className="text font-bold text-[#A7C080] hover:text-[#383a42] transition">
                                Şifreni mi unuttun?
                            </Link>
                        </div>
                    )}
                     </div>
                        </div>

                        {error && (
                            <div className="bg-red-100 text-red-600 p-3 rounded-lg text-sm font-bold flex items-center animate-pulse">
                                <span className="mr-2">⚠️</span> {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3.5 px-4 rounded-xl shadow-lg text-base font-bold text-[#A7C080] bg-[${COLORS.SECONDARY}] hover:text-lime-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 mt-2`}
                        >
                            {loading ? <Loader2 className="w-7 h-7 animate-spin mx-auto" /> : (isRegister ? 'Kayıt Ol' : 'Giriş Yap')}
                        </button>
                    </form>

                    <p className="text-center mt-6 text-gray-600 text-sm font-medium">
                        {isRegister ? 'Zaten hesabınız var mı?' : "Hesabınız yok mu?"}
                        <button onClick={toggleAuthMode} className={`ml-4 font-bold text-[#A7C080] hover:text-lime-200 underline decoration-2 decoration-transparent hover:decoration-[${COLORS.PRIMARY}] transition-all`}>
                            {isRegister ? 'Giriş Yap' : 'Kayıt Ol'}
                        </button>
                    </p>
                </div>
            </div>

            {/* SAĞ TARA (GÖRSEL GRID) */}
            <div className="hidden lg:flex w-1/2 h-full bg-[#1a1b1e] relative overflow-hidden items-center justify-center">
                <div className={`absolute w-[500px] h-[500px] bg-[${COLORS.PRIMARY}] rounded-full blur-[150px] opacity-60 pointer-events-none z-0`}></div>
                <div className="w-[140%] h-[140%] grid grid-cols-2 gap-4 transform rotate-6 origin-center animate-fade-in p-4">
                    <div className="flex flex-col gap-4 -mt-20">
                        <div className="flex-1 bg-gray-800 rounded-3xl overflow-hidden relative group"><img src="/images/5.jpeg" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition duration-700" alt="Aesthetic" /></div>
                        <div className="flex-[1.5] bg-gray-800 rounded-3xl overflow-hidden relative group"><img src="/images/3.jpeg" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition duration-700" alt="Aesthetic" /></div>
                        <div className="flex-1 bg-gray-800 rounded-3xl overflow-hidden relative group"><img src="/images/4.jpeg" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition duration-700" alt="Aesthetic" /></div>
                    </div>
                    <div className="flex flex-col gap-4 mt-20">
                         <div className="flex-[1.2] bg-gray-800 rounded-3xl overflow-hidden relative group"><img src="/images/1.jpeg" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition duration-700" alt="Aesthetic" /></div>
                        <div className="flex-1 bg-gray-800 rounded-3xl overflow-hidden relative group"><img src="/images/2.jpeg" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition duration-700" alt="Aesthetic" /></div>
                         <div className="flex-1 bg-gray-800 rounded-3xl overflow-hidden relative group"><img src="/images/6.jpeg" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition duration-700" alt="Aesthetic" /></div>
                    </div>
                </div>
                <div className="absolute bottom-8 right-8 z-10 text-right">
                    <p className="text-white/40 text-sm font-light tracking-widest uppercase">Designed for</p>
                    <p className="text-white/80 text-xl font-bold tracking-widest uppercase">Creators</p>
                </div>
            </div>
        </div>
    );
};

export default AuthForm;