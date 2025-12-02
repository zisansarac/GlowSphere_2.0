/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Home, Compass, PlusSquare, Users, Bookmark, User, Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MobileBottomBarProps {
    view: string;
    setView: React.Dispatch<React.SetStateAction<string>>;
}

const MobileBottomBar = ({ view, setView }: MobileBottomBarProps) => {
    const { user, imageVersion, logout } = useAuth(); 
    const [isMenuOpen, setIsMenuOpen] = useState(false); 

    let profileImageSrc = null;
    if (user?.profileImage) {
        const cleanUrl = user.profileImage.split('?')[0];
        profileImageSrc = `${cleanUrl}?v=${imageVersion}`;
    }

    const handleNavigation = (viewName: string) => {
        setView(viewName);
        setIsMenuOpen(false);
    };

    return (
        <>
            {/* 1. AÇILIR MENÜ */}
            {isMenuOpen && (
                <>
              
                    <div 
                        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 lg:hidden animate-fade-in" 
                        onClick={() => setIsMenuOpen(false)}
                    />
                    
   
                    <div className="fixed bottom-24 right-4 flex flex-col gap-3 z-50 lg:hidden animate-slide-up origin-bottom-right w-45">
                        
                        {/* Kişi Ara Butonu */}
                        <button 
                            onClick={() => handleNavigation('people')}
                            className="flex items-center gap-3 px-5 py-3 text-[#A7C080] hover:text-lime-200 font-bold text-sm rounded-full shadow-xl border border-gray-100 hover:scale-105 transition-transform"
                        >
                            <div className="p-1.5 rounded-full text-[#A7C080] hover:text-lime-200">
                                <Users className="w-5 h-5" />
                            </div>
                            <span>Kişi Ara</span>
                            
                        </button>

                        {/* Kaydedilenler Butonu */}
                        <button 
                            onClick={() => handleNavigation('saved')}
                            className="flex items-center gap-3 px-5 py-3 text-[#A7C080] hover:text-lime-200 font-bold text-sm rounded-full shadow-xl border border-gray-100 hover:scale-105 transition-transform"
                        >
                             <div className="p-1.5 rounded-full text-[#A7C080] hover:text-lime-200">
                                <Bookmark className="w-5 h-5" />
                            </div>
                            <span>Kaydedilenler</span>
                           
                        </button>

                        {/* Çıkış Yap Butonu */}
                        <button 
                            onClick={() => { logout(); setIsMenuOpen(false); }}
                            className="flex items-center gap-3 px-5 py-3 text-red-600 hover:text-red-400 font-bold text-sm rounded-full shadow-xl border border-gray-100 hover:scale-105 transition-transform"
                        >
                             <div className="p-1.5 rounded-full text-red-600 hover:text-red-400">
                                <LogOut className="w-5 h-5" />
                            </div>

                            <span>Çıkış Yap</span>
                           
                        </button>

                    </div>
                </>
            )}

            {/* 2. ALT BAR (SABİT) */}
            <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-lg border-t border-gray-200/50 px-6 py-3 flex justify-between items-center z-50 safe-area-pb shadow-lg">
                
                <button
                    onClick={() => handleNavigation('home')}
                    className={`p-2 transition-all duration-300 hover:text-lime-200 ${view === 'home' ? 'text-[#A7C080] scale-110' : 'text-gray-200'}`}
                >
                    <Home className={`w-7 h-7 ${view === 'home' ? 'fill-transparent' : ''}`} />
                </button>

                <button
                    onClick={() => handleNavigation('explore')}
                    className={`p-2 transition-all duration-300 hover:text-lime-200 ${view === 'explore' ? 'text-[#A7C080] scale-110' : 'text-gray-200'}`}
                >
                    <Compass className={`w-7 h-7 ${view === 'explore' ? 'fill-transparent' : ''}`} />
                </button>

                {/* Create Post */}
                <button
                    onClick={() => handleNavigation('createPost')}
                    className={`p-2 transition-all duration-300 hover:text-lime-200 ${view === 'createPost' ? 'text-[#A7C080] scale-110' : 'text-gray-200'}`}
                >
                    <PlusSquare className={`w-7 h-7 ${view === 'createPost' ? 'fill-transparent' : ''}`} />
                </button>

                <button
                    onClick={() => handleNavigation('profile')}
                    className={`p-0.5 rounded-full border-2 transition-all hover:text-lime-200 ${view === 'profile' ? 'text-[#A7C080] scale-110' : 'text-gray-200'}`}
                >
                    <div className="w-8 h-8 rounded-full bg-transparent flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                        {profileImageSrc ? (
                            <img 
                                key={profileImageSrc} 
                                src={profileImageSrc} 
                                alt="Me" 
                                className="w-full h-full object-cover" 
                            />
                        ) : (
                            <User className={`w-7 h-7 ${view === 'profile' ? 'fill-transparent' : ''}`} />
                        )}
                    </div>
                </button>

                {/* MENÜ BUTONU */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`p-2 transition-all duration-300 ${isMenuOpen ? 'text-[#A7C080] scale-110' : 'text-gray-200 hover:text-lime-200'}`}
                >
                    {isMenuOpen ? <X className="w-7 h-7 text-[#A7C080] hover:text-lime-200" /> : <Menu className="w-7 h-7" />}
                </button>

                

            </div>
        </>
    );
};

export default MobileBottomBar;