/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { LogOut, Home, Compass, Users, Bookmark, PlusSquare, Heart, MessageCircle, Send, Loader2, User as UserIcon, UserPlus, Zap, Settings, X } from 'lucide-react';

// --- ORTAK STİL VE SABİTLER ---
const API_BASE_URL = 'http://localhost:5000/api'; 

const COLORS = {
    BG_LIGHT: '#F5F5EC',  
    BG_DARK: '#E0E8D7',   
    PRIMARY: '#A7C080',   
    SECONDARY: '#383a42', 
    TEXT_GREY: '#6B7280', 
};

// --- TS INTERFACES (Veri Tipleri) ---

interface User {
    _id: string;
    email: string;
    username?: string;
    bio?: string;
    createdAt: string;
}

interface Post {
    _id: string;
    user: User; // Backend'den gelen kullanıcı bilgisi (populated)
    caption: string;
    imageUrl: string;
    tags: string[];
    likesCount: number;
    commentsCount: number;
    createdAt: string;
    location?: string;
}

interface AlertState {
    msg: string;
    type: 'error' | 'success' | 'info';
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    initialLoading: boolean;
    alert: AlertState | null;
    apiRequest: (endpoint: string, method?: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: any) => Promise<any>;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => void;
    fetchUser: () => Promise<void>;
    displayAlert: (msg: string, type?: 'error' | 'success' | 'info') => void;
}

// --- 1. GLOBAL STATE VE CONTEXT YÖNETİMİ ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

const AuthProvider = ({ children }: { children: ReactNode }) => {
    // 1. Kullanıcıyı LocalStorage'dan yükle
    const [user, setUser] = useState<User | null>(() => {
        try {
            const savedUser = localStorage.getItem('user');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (e) {
            return null;
        }
    });

    const [token, setToken] = useState<string | null>(localStorage.getItem('token') || null);
    
    // Eğer user hafızada varsa loading FALSE başlar, böylece sayfa hemen açılır.
    // Eğer token var ama user yoksa (nadir durum), loading TRUE başlar.
    const [initialLoading, setInitialLoading] = useState<boolean>(!user && !!token);
    
    const [loading, setLoading] = useState<boolean>(false);
    const [alert, setAlert] = useState<AlertState | null>(null);

    // Değişiklikleri LocalStorage'a yaz
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
                // Sadece API isteği atarken 401 alırsak logout yap
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
    }, [token]);

    // --- KRİTİK BÖLÜM: ARKA PLAN GÜNCELLEMESİ ---
    const fetchUser = useCallback(async () => {
        if (!token) {
            setInitialLoading(false);
            return;
        }

        try {
            console.log("Kullanıcı bilgisi güncelleniyor...");
            const response = await fetch(`${API_BASE_URL}/users/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            // Eğer backend JSON dönmezse kod patlamasın diye önlem
            const data = await response.json().catch(() => null);

            if (response.ok && data && data.user) {
                console.log("Kullanıcı güncellendi:", data.user.email);
                // Backend'den başarılı veri geldi, güncelle
                setUser(data.user);
            } else if (response.status === 401) {
                // SADECE Token gerçekten geçersizse at
                console.warn("Token geçersiz (401), çıkış yapılıyor.");
                logout();
            } else {
                // Diğer durumlarda (500 hatası, veri yapısı bozuksa vs.)
                // SAKIN user'ı null yapma! Eski veriyle devam et.
                console.warn("Sunucudan güncel veri alınamadı ama oturum korunuyor. Status:", response.status);
            }
        } catch (error) {
            // İnternet yoksa veya sunucu kapalıysa buraya düşer.
            // SAKIN logout yapma!
            console.error("FetchUser hatası (Offline modda devam ediliyor):", error);
        } finally {
            setInitialLoading(false);
        }
    }, [token]);

    // Mount olduğunda çalışır
    useEffect(() => {
        if (token) {
            // User zaten localStorage'da varsa, fetchUser'ı beklemeden akışı başlatabiliriz.
            // Ama güncel veri için fetchUser'ı yine de çağırırız.
            fetchUser();
        } else {
            setInitialLoading(false);
        }
    }, []); 

    const login = async (email: string, password: string) => {
        const data = await apiRequest('auth/login', 'POST', { email, password });
        setToken(data.token);
        setUser(data.user);
        displayAlert('Giriş başarılı!', 'success');
    };

    const register = async (email: string, password: string) => {
        const data = await apiRequest('auth/register', 'POST', { email, password });
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


// --- 2. TEMEL VE ORTAK COMPONENTLER ---

// Global Alert Kutusu
const GlobalAlert = () => {
    const { alert } = useAuth();
    if (!alert) return null;

    const baseStyle = "fixed top-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl z-50 text-white font-semibold transition-all duration-500 ease-in-out transform";
    
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

// Yükleniyor Spinner'ı
const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-8">
        <Loader2 className={`w-8 h-8 animate-spin text-[${COLORS.PRIMARY}]`} />
        <p className="ml-2 text-lg text-[#383a42]">Yükleniyor...</p>
    </div>
);

// Sidebar/BottomBar'daki tek bir navigasyon öğesi
const NavItem = ({ Icon, name, isActive, onClick }: { Icon: any, name: string, isActive?: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center p-3 rounded-xl font-medium text-lg transition duration-300 ease-in-out transform hover:scale-[1.02]
            ${isActive
                ? `bg-[${COLORS.PRIMARY}] text-[${COLORS.SECONDARY}] shadow-md`
                : `text-[${COLORS.SECONDARY}] hover:bg-[#c5cfb8]`
            }`
        }
    >
        <Icon className="w-6 h-6 mr-4 sm:mr-4 lg:mr-4" />
        <span className="hidden lg:inline">{name}</span>
    </button>
);


// Post Card Component
const PostCard = ({ post, currentUserId, onFollowToggle, onViewProfile, onPostUpdate, isInitialLiked }: { 
    post: Post; 
    currentUserId: string; 
    onFollowToggle: (id: string, isFollowing: boolean, setFollowing: React.Dispatch<React.SetStateAction<boolean>>) => void;
    onViewProfile: (id: string) => void;
    onPostUpdate: () => void;
    isInitialLiked?: boolean;
}) => {
    const { apiRequest, displayAlert } = useAuth();
    const [isLiked, setIsLiked] = useState(isInitialLiked || false); 
    const [likesCount, setLikesCount] = useState(post.likesCount || 0);
    const [isSaving, setIsSaving] = useState(false);
    const isOwner = post.user._id === currentUserId;

    // Simülasyon: Takip durumu (gerçekte backend'den gelmeli)
    const [isUserFollowing, setIsUserFollowing] = useState(false); 

    
    const handleLikeToggle = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            const result = await apiRequest(`interact/like/${post._id}`, 'POST');
            
            if (result.action === 'like') {
                setIsLiked(true);
                setLikesCount(result.likesCount);
                displayAlert('Post beğenildi!', 'success');
            } else {
                setIsLiked(false);
                setLikesCount(result.likesCount);
                displayAlert('Beğeni kaldırıldı.', 'info');
            }
        } catch (error) {
            displayAlert("Beğeni işlemi başarısız.", 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDelete = async () => {
        if (window.confirm("Bu postu silmek istediğinizden emin misiniz?")) {
            try {
                await apiRequest(`posts/${post._id}`, 'DELETE');
                displayAlert("Post başarıyla silindi.", 'success');
                onPostUpdate(); // Feed/Profil yenile
            } catch (error) {
                displayAlert("Silme işlemi başarısız.", 'error');
            }
        }
    }


    return (
        <div className={`bg-white p-4 sm:p-6 rounded-3xl shadow-lg mb-8 border border-gray-100 transition-all duration-500 hover:shadow-xl hover:scale-[1.005] animate-fade-in`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full bg-[${COLORS.BG_DARK}] flex items-center justify-center text-[${COLORS.SECONDARY}] font-bold text-lg mr-3 shadow-md`}>
                        {post.user?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                        <p className={`font-semibold text-[${COLORS.SECONDARY}] cursor-pointer hover:text-[${COLORS.PRIMARY}]`} onClick={() => onViewProfile(post.user._id)}>{post.user?.email?.split('@')?.[0] || 'Bilinmeyen Kullanıcı'}</p>
                        <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()} • {post.location || 'GlowSphere'}</p>
                    </div>
                </div>
                {/* Takip Etme veya Ayarlar */}
                <div className="flex items-center space-x-2">
                    {isOwner && (
                        <button 
                             onClick={handleDelete}
                            className={`text-sm font-semibold py-1 px-3 rounded-lg transition duration-200 transform hover:scale-105 bg-red-100 text-red-600 hover:bg-red-200`}
                        >
                            Sil
                        </button>
                    )}
                    {!isOwner && (
                        <button
                            onClick={() => onFollowToggle(post.user._id, isUserFollowing, setIsUserFollowing)}
                            className={`text-sm font-semibold py-1 px-3 rounded-lg transition duration-200 transform hover:scale-105 ${isUserFollowing
                                ? 'bg-gray-200 text-[#383a42] hover:bg-gray-300'
                                : `bg-[${COLORS.PRIMARY}] text-white hover:bg-[#86a86c]`
                            }`}
                        >
                            {isUserFollowing ? 'Takip Ediliyor' : 'Takip Et'}
                        </button>
                    )}
                </div>
            </div>

            {/* Caption ve Tags */}
            <p className={`text-[${COLORS.SECONDARY}] mb-3`}>{post.caption}</p>
            <div className="flex flex-wrap gap-2 mb-4 text-sm">
                {(post.tags || []).map((tag, index) => (
                    <span key={index} className={`text-[${COLORS.PRIMARY}] bg-[${COLORS.BG_DARK}]/50 px-2 py-1 rounded-full font-medium transition duration-200 hover:bg-[${COLORS.BG_DARK}] cursor-pointer`}>
                        #{tag}
                    </span>
                ))}
            </div>

            {/* Media */}
            <div className="aspect-4/3 w-full bg-gray-100 rounded-xl overflow-hidden shadow-inner">
                <img
                    src={post.imageUrl || 'https://placehold.co/600x450/cccccc/383a42?text=Görsel+Yok'}
                    alt="Post Görseli"
                    className="w-full h-full object-cover transition duration-500 hover:scale-[1.05] ease-in-out"
                    onError={(e: any) => e.target.src = 'https://placehold.co/600x450/cccccc/383a42?text=Görsel+Yüklenemedi'}
                />
            </div>

            {/* Footer / Interactions */}
            <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={handleLikeToggle}
                        disabled={isSaving}
                        className={`flex items-center space-x-1 p-2 rounded-full transition duration-300 ${isLiked ? 'text-red-500 bg-red-100' : 'text-gray-500 hover:text-red-500 hover:bg-red-50'}`}
                    >
                        <Heart className={`w-6 h-6 ${isLiked ? 'fill-red-500 animate-bounce' : ''}`} />
                        <span className="font-semibold text-sm">{likesCount}</span>
                    </button>
                    <button className={`flex items-center space-x-1 p-2 rounded-full text-gray-500 hover:text-[${COLORS.PRIMARY}] hover:bg-[${COLORS.BG_DARK}]/50 transition duration-300`}>
                        <MessageCircle className="w-6 h-6" />
                        <span className="font-semibold text-sm">{post.commentsCount || 0}</span>
                    </button>
                    <button className={`p-2 rounded-full text-gray-500 hover:text-[${COLORS.PRIMARY}] hover:bg-[${COLORS.BG_DARK}]/50 transition duration-300`}>
                        <Send className="w-6 h-6" />
                    </button>
                </div>
                <button className={`p-2 rounded-full text-gray-500 hover:text-[${COLORS.SECONDARY}] hover:bg-[${COLORS.BG_DARK}]/50 transition duration-300`}>
                    <Bookmark className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

const SidebarNavItem = ({ Icon, name, isActive, onClick }: { Icon: any, name: string, isActive?: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center p-3.5 rounded-xl font-bold text-base transition-all duration-300 ease-in-out transform hover:scale-[1.02] mb-3 shadow-md
            ${isActive
                ? ` text-lime-200`
                : ` text-white 
                hover:text-lime-200` 
            }`
        }
    >
        <Icon className="w-5 h-5 mr-3" />
        <span className="hidden lg:inline">{name}</span>
    </button>
);

const Sidebar = ({ view, setView }: { view: string, setView: React.Dispatch<React.SetStateAction<string>> }) => {
    const { logout, user } = useAuth();

    const navItems = [
        { name: 'Home', icon: Home, view: 'home' },
        { name: 'Explore', icon: Compass, view: 'explore' },
        { name: 'People', icon: Users, view: 'people' },
        { name: 'Saved', icon: Bookmark, view: 'saved' },
    ];

    return (
       
        <div className={`hidden lg:flex w-72 h-full fixed left-0 top-0 bg-[#E0E8D7] p-6 flex-col justify-between shadow-2xl z-50 border-r border-[#A7C080]/30`}>
            <div>
             
                <div className="flex items-center space-x-2 mb-10 px-1 overflow-hidden">
                    <div className="bg-[#383a42] p-1.5 rounded-lg shadow-lg shrink-0">
                         <Zap className="w-6 h-6 text-[#A7C080]" />
                    </div>
                    <h3 className="text-3xl font-extrabold text-[#383a42] tracking-tighter truncate">glowsphere.</h3>
                </div>

                {/* Profil Kartı */}
                {user && (
                    <div className="flex items-center mb-10 p-4 rounded-2xl bg-[#F5F5EC] border-2 border-[#383a42]/5 cursor-pointer hover:border-[#A7C080] transition-all shadow-sm group" onClick={() => setView('profile')}>
                        <div className="w-12 h-12 rounded-full bg-[#383a42] flex items-center justify-center text-white font-bold text-xl mr-3 shadow-md group-hover:scale-110 transition duration-300">
                            {user.email[0].toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-[#383a42] font-bold text-sm truncate">@{user.email.split('@')[0]}</p>
                            <p className="text-gray-500 text-xs">Profili Düzenle</p>
                        </div>
                    </div>
                )}

                {/* Menü */}
                <nav>
                    {navItems.map((item) => (
                        <SidebarNavItem
                            key={item.name}
                            Icon={item.icon}
                            name={item.name}
                            isActive={view === item.view}
                            onClick={() => setView(item.view)}
                        />
                    ))}
                </nav>

                <div className="mt-8 pt-8 border-t border-[#383a42]/10">
                    <SidebarNavItem
                        Icon={PlusSquare}
                        name="Create Post"
                        isActive={view === 'createPost'}
                        onClick={() => setView('createPost')}
                    />
                </div>
            </div>

            <div>
                 <SidebarNavItem Icon={LogOut} name="Log Out" onClick={logout} />
            </div>
        </div>
    );
};

// Mobile Bottom Bar (Responsive)
const MobileBottomBar = ({ view, setView }: { view: string, setView: React.Dispatch<React.SetStateAction<string>> }) => {
     const { logout } = useAuth();
     const navItems = [
        { name: 'Home', icon: Home, view: 'home' },
        { name: 'Explore', icon: Compass, view: 'explore' },
        { name: 'Create', icon: PlusSquare, view: 'createPost' },
        { name: 'Profile', icon: UserIcon, view: 'profile' },
        { name: 'Logout', icon: LogOut, action: logout },
    ];
    return (
        <div className={`lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[${COLORS.BG_DARK}] shadow-2xl flex justify-around items-center z-30 transition-all duration-300`}>
            {navItems.map(item => (
                <button
                    key={item.name}
                    onClick={item.action || (() => setView(item.view))}
                    className={`p-2 rounded-full transition duration-300 transform hover:scale-110
                        ${view === item.view && !item.action
                            ? ` text-lime-200 shadow-md`
                            : `text-white hover:text-lime-200`
                        }`
                    }
                >
                    <item.icon className="w-6 h-6" />
                </button>
            ))}
        </div>
    );
}


// Top Creators (Right Sidebar)
const TopCreators = ({ creators, setView, setSelectedUserId }: { creators: any[], setView: React.Dispatch<React.SetStateAction<string>>, setSelectedUserId: React.Dispatch<React.SetStateAction<string | null>> }) => {
    const handleCheckProfile = (userId: string) => {
        setSelectedUserId(userId);
        setView('publicProfile');
    }
    return (
        <div className={`w-full p-6 bg-[${COLORS.BG_DARK}] rounded-3xl shadow-lg sticky top-8 animate-fade-in hidden xl:block border border-[${COLORS.PRIMARY}]/20`}>
            <h2 className={`text-xl font-extrabold text-[#383a42] mb-6`}>En İyi İçerik Üreticileri</h2>
            <div className="space-y-4">
                {creators.slice(0, 3).map((c, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-md rounded-2xl shadow-sm transition duration-300 hover:shadow-md transform hover:scale-[1.02]">
                        <div className="flex items-center">
                            <div className={`w-10 h-10 rounded-full bg-[${COLORS.PRIMARY}] flex items-center justify-center text-[#383a42] font-extrabold text-lg mr-3 shadow-sm`}>
                                {c.initials}
                            </div>
                            <div>
                                <p className={`font-bold text-[#383a42] text-sm`}>{c.name}</p>
                                <p className="text-xs text-gray-600 font-medium">@{c.handle}</p>
                            </div>
                        </div>
                       
                        <button
                            onClick={() => handleCheckProfile(c.id)}
                            className={`text-sm font-bold bg-[${COLORS.PRIMARY}] text-white py-2 px-4 rounded-xl hover:text-lime-200 transition duration-200 shadow-sm transform  hover:scale-[1.05]`}
                        >
                            Profili Gör
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Home Feed Page
const HomeFeed = ({ setView, setSelectedUserId }: { setView: React.Dispatch<React.SetStateAction<string>>, setSelectedUserId: React.Dispatch<React.SetStateAction<string | null>> }) => {
    const { user, apiRequest, loading, displayAlert } = useAuth();
    const [feed, setFeed] = useState<Post[]>([]);
    
    // Simülasyon: Takip durumu
    const [isUserFollowing, setIsUserFollowing] = useState(false); 

    const fetchFeed = useCallback(async () => {
        try {
            const data = await apiRequest('feed/home');
            setFeed(data);
        } catch (error) {
            console.error("Feed yüklenemedi:", error);
        }
    }, [apiRequest]);

    useEffect(() => {
        const loadFeed = async () => {
            if (user) {
                await fetchFeed();
            }
        };
        loadFeed();
    }, [user, fetchFeed])

    const handleFollowToggle = async (targetUserId: string, isUserFollowing: boolean, setIsUserFollowing: React.Dispatch<React.SetStateAction<boolean>>) => {
        try {
            const result = await apiRequest(`interact/follow/${targetUserId}`, 'POST');
            
            if (result.action === 'follow') {
                setIsUserFollowing(true);
                displayAlert(result.msg, 'success');
            } else {
                setIsUserFollowing(false);
                displayAlert(result.msg, 'info');
            }
            fetchFeed(); 
        } catch (error) {
            displayAlert("Takip işlemi başarısız.", 'error');
        }
    };
    
    const handlePostUpdate = () => {
        fetchFeed(); 
    }

    const mockCreators = [
        { id: 'mock1', name: 'Hello World', handle: 'helloworld', initials: 'HW' },
        { id: 'mock2', name: 'Zisan Sarac', handle: 'zisan.sarac', initials: 'ZS' },
        { id: 'mock3', name: 'Reyyan', handle: 'reyyan', initials: 'R' },
    ];
    
    const onViewProfile = (userId: string) => {
        setSelectedUserId(userId);
        setView('publicProfile');
    }

   return (
        // DÜZELTME: 
        // lg:pl-80 -> Masaüstünde soldan 80 birim (Sidebar genişliği + boşluk) bırak.
        // w-full -> Ekranı kapla.
        <div className="w-full min-h-screen lg:pl-80 p-6 sm:p-10 transition-all duration-300">
            
            <div className="max-w-[1600px] mx-auto">
                {/* Header - Artık Sidebar'ın altında kalmayacak */}
                <div className="mb-10 animate-fade-in pt-4 lg:pt-0">
                    <h1 className="text-4xl font-extrabold text-[#383a42] mb-2 tracking-tight">Ana Akış</h1>
                    <p className="text-gray-500 font-medium text-lg">GlowSphere'deki en yeni paylaşımları keşfet.</p>
                </div>
                
                <div className="flex flex-col xl:flex-row gap-10 items-start">
                    {/* Sol: Feed Akışı */}
                    <div className="w-full xl:flex-1">
                        {/* Loading State */}
                        {loading && <LoadingSpinner />}
                        
                        {/* Empty State */}
                        {!loading && feed.length === 0 && (
                            <div className="p-12 bg-white rounded-[2rem] text-center shadow-lg border-2 border-[#383a42]/5 animate-fade-in">
                                <p className="text-2xl font-bold mb-3 text-[#383a42]">Akışınızda Henüz Post Yok</p>
                                <p className="text-gray-500">İçerik üreticilerini takip edin veya Keşfet bölümünü kontrol edin!</p>
                            </div>
                        )}

                        {/* Posts */}
                        {feed.map(post => (
                            <PostCard
                                key={post._id}
                                post={post}
                                currentUserId={user!._id}
                                onFollowToggle={handleFollowToggle}
                                onViewProfile={onViewProfile}
                                onPostUpdate={handlePostUpdate}
                            />
                        ))}
                    </div>

                    {/* Sağ: Top Creators */}
                    <div className="hidden xl:block w-96 flex-shrink-0 sticky top-10">
                        <TopCreators creators={mockCreators} setView={setView} setSelectedUserId={setSelectedUserId} />
                    </div>
                </div>
            </div>
        </div>
    );
};


// Create Post Page
const CreatePost = ({ setView }: { setView: React.Dispatch<React.SetStateAction<string>> }) => {
    const { apiRequest, loading, displayAlert } = useAuth();
    const [caption, setCaption] = useState('');
    const [imageUrl, setImageUrl] = useState('https://placehold.co/600x400/A7C080/FFFFFF?text=GlowSphere+Post');
    const [tagsInput, setTagsInput] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const tagsArray = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        
        if (!imageUrl || !caption) {
            displayAlert("Lütfen bir resim URL'si ve açıklama girin.", 'error');
            return;
        }

        try {
            await apiRequest('posts', 'POST', {
                caption,
                imageUrl,
                tags: tagsArray,
            });
            displayAlert('Post başarıyla oluşturuldu!', 'success');
            // Formu temizle ve ana sayfaya yönlendir
            setCaption('');
            setTagsInput('');
            setImageUrl('https://placehold.co/600x400/A7C080/FFFFFF?text=GlowSphere+Post');
            setTimeout(() => setView('home'), 1000);
        } catch (error) {
            // Hata zaten apiRequest içinde gösteriliyor.
        }
    };

    return (
        <div className={`grow p-4 sm:p-8 lg:ml-64 bg-[${COLORS.BG_LIGHT}] min-h-screen pb-20 lg:pb-8 animate-fade-in`}>
            <h1 className={`text-3xl font-extrabold text-[${COLORS.SECONDARY}] mb-8 border-b border-gray-300 pb-4`}>Yeni Post Oluştur</h1>
            
            <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-white p-8 rounded-3xl shadow-2xl space-y-6">
                
                {/* Image Preview */}
                <div className="aspect-4/3 w-full bg-gray-100 rounded-xl overflow-hidden shadow-inner border-4 border-[#A7C080]/50 transition duration-300 hover:scale-[1.01] transform">
                    <img
                        src={imageUrl}
                        alt="Post Önizleme"
                        className="w-full h-full object-cover"
                        onError={(e: any) => e.target.src = 'https://placehold.co/600x450/cccccc/383a42?text=Görsel+Yüklenemedi'}
                    />
                </div>

                {/* Image URL (Placeholder) */}
                <div>
                    <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">Görsel URL (Gerçekte dosya yükleme)</label>
                    <input
                        type="url"
                        id="imageUrl"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className={`mt-1 block w-full border border-gray-300 rounded-xl shadow-sm p-3 focus:ring-[${COLORS.PRIMARY}] focus:border-[${COLORS.PRIMARY}] transition`}
                        placeholder="e.g., https://via.placeholder.com/600x400"
                        required
                    />
                </div>

                {/* Caption */}
                <div>
                    <label htmlFor="caption" className="block text-sm font-medium text-gray-700">Açıklama</label>
                    <textarea
                        id="caption"
                        rows={3}
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        className={`mt-1 block w-full border border-gray-300 rounded-xl shadow-sm p-3 focus:ring-[${COLORS.PRIMARY}] focus:border-[${COLORS.PRIMARY}] transition`}
                        placeholder="Ne düşünüyorsun?"
                        required
                    ></textarea>
                </div>

                {/* Tags */}
                <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Etiketler (Virgülle Ayırın)</label>
                    <input
                        type="text"
                        id="tags"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        className={`mt-1 block w-full border border-gray-300 rounded-xl shadow-sm p-3 focus:ring-[${COLORS.PRIMARY}] focus:border-[${COLORS.PRIMARY}] transition`}
                        placeholder="#sanat, #tasarım, #glowsphere"
                    />
                </div>
                

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white bg-[${COLORS.PRIMARY}] hover:bg-[#86a86c] focus:outline-none focus:ring-4 focus:ring-[${COLORS.PRIMARY}]/50 transition duration-300 transform hover:scale-[1.01]`}
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <PlusSquare className="w-5 h-5 mr-2" />}
                    {loading ? 'Yayınlanıyor...' : 'Postu Yayınla'}
                </button>
            </form>
        </div>
    );
};

// My Profile Page - V3 (Inputlar Düzeltildi & Loading Fix)
const MyProfile = ({ user, fetchUser }: { user: User, fetchUser: () => Promise<void> }) => {
    const { apiRequest, loading, displayAlert } = useAuth();
    
    // State'ler
    const [bio, setBio] = useState(user.bio || '');
    const [username, setUsername] = useState(user.username || user.email.split('@')[0]);
    const [myPosts, setMyPosts] = useState<Post[]>([]); 
    const [isLoadingPosts, setIsLoadingPosts] = useState(true);

    // Postları Çekme
    useEffect(() => {
        let isMounted = true; // Memory leak önlemi

        const fetchMyPosts = async () => {
            if (!user._id) return;
            
            try {
                // Backend isteği
                const data = await apiRequest(`posts/user/${user._id}`);
                if (isMounted) setMyPosts(data);
            } catch (error) {
                console.error("Postlar çekilemedi (Sunucu kapalı veya rota yok):", error);
            } finally {
                if (isMounted) setIsLoadingPosts(false);
            }
        };

        fetchMyPosts();

        return () => { isMounted = false; };
    }, [user._id, apiRequest]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiRequest('interact/profile', 'PUT', { bio, username });
            displayAlert('Profil güncellendi!', 'success');
            fetchUser(); 
        } catch (error) {
            console.error("Güncelleme hatası:", error);
        }
    };

    return (
        <div className="w-full min-h-screen p-6 sm:p-10 lg:pl-80 transition-all duration-300">
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
                
                {/* 1. Profil Kartı */}
                <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-[#383a42]/5 flex flex-col md:flex-row items-center md:items-start gap-8">
                    <div className="w-32 h-32 rounded-full bg-[#383a42] flex items-center justify-center text-white font-extrabold text-5xl shadow-2xl shrink-0">
                        {user.email[0].toUpperCase()}
                    </div>

                    <div className="flex-grow text-center md:text-left">
                        <h2 className="text-3xl font-extrabold text-[#383a42]">@{username}</h2>
                        <p className="text-gray-500 font-medium mb-4">{user.email}</p>
                        
                        <div className="flex justify-center md:justify-start gap-6 mb-6">
                            <div className="text-center">
                                <span className="block font-bold text-xl text-[#383a42]">{myPosts.length}</span>
                                <span className="text-xs text-gray-500 uppercase tracking-wide">Post</span>
                            </div>
                            <div className="text-center">
                                <span className="block font-bold text-xl text-[#383a42]">0</span>
                                <span className="text-xs text-gray-500 uppercase tracking-wide">Takipçi</span>
                            </div>
                        </div>
                        <p className="text-[#383a42]/80 italic max-w-lg">{bio || "Henüz bir biyografi eklenmedi."}</p>
                    </div>
                </div>

                {/* 2. Düzenleme Formu (INPUTLAR DÜZELTİLDİ) */}
                <div className="bg-[#F5F5EC] p-6 rounded-3xl border-2 border-[#A7C080]/20">
                    <h3 className="font-bold text-[#383a42] mb-6 flex items-center text-lg">
                        <Settings className="w-5 h-5 mr-2" /> Profili Düzenle
                    </h3>
                    
                    <form onSubmit={handleUpdate} className="flex flex-col gap-6">
                        
                        {/* Kullanıcı Adı Inputu */}
                        <div>
                            <label className="block text-sm font-bold text-[#383a42] mb-2 ml-1">Kullanıcı Adı</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                // text-[#383a42] eklendi (Koyu renk yazı)
                                className="w-full bg-white text-[#383a42] border border-gray-200 rounded-xl p-4 outline-none focus:border-[#A7C080] focus:ring-2 focus:ring-[#A7C080]/20 transition shadow-sm font-medium placeholder-gray-400"
                                placeholder="Örn: glowmaster"
                            />
                        </div>

                        {/* Biyografi Inputu */}
                        <div>
                            <label className="block text-sm font-bold text-[#383a42] mb-2 ml-1">Biyografi</label>
                            <textarea
                                rows={3}
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                // text-[#383a42] eklendi
                                className="w-full bg-white text-[#383a42] border border-gray-200 rounded-xl p-4 outline-none focus:border-[#A7C080] focus:ring-2 focus:ring-[#A7C080]/20 transition shadow-sm font-medium placeholder-gray-400 resize-none"
                                placeholder="Kendinden bahset..."
                            ></textarea>
                        </div>

                        <div className="flex justify-end">
                            <button 
                                type="submit"
                                disabled={loading}
                                className="bg-[#383a42] text-white font-bold py-3 px-8 rounded-xl hover:bg-[#4a4d57] transition disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* 3. Post Izgarası */}
                <div>
                    <h3 className="text-2xl font-bold text-[#383a42] mb-6 border-b pb-2 inline-block">Postlarım</h3>
                    
                    {isLoadingPosts ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="animate-spin text-[#A7C080] w-10 h-10" />
                        </div>
                    ) : myPosts.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-3xl shadow-sm border border-dashed border-gray-300">
                            <p className="text-gray-500 font-medium mb-2">Henüz hiç post paylaşmadın.</p>
                            <p className="text-sm text-gray-400">İlk postunu oluşturarak profilini renklendir!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {myPosts.map((post) => (
                                <div key={post._id} className="group relative aspect-square bg-gray-200 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300">
                                    <img 
                                        src={post.imageUrl} 
                                        alt={post.caption} 
                                        className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center gap-4 text-white font-bold">
                                        <span className="flex items-center"><Heart className="w-5 h-5 mr-1 fill-white" /> {post.likesCount}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};


// Public Profile Page (View another user)
const PublicProfile = ({ selectedUserId, setView }: { selectedUserId: string | null, setView: React.Dispatch<React.SetStateAction<string>> }) => {
     // Bu sayfada seçilen kullanıcının verileri backend'den çekilmelidir.
     const mockUser = { id: selectedUserId, email: "public_user@example.com", bio: "GlowSphere kullanıcısı." } 
     const mockPosts = [1, 2, 3, 4, 5, 6]; 

     if (!selectedUserId) {
         return <div className="grow p-8 text-center">Kullanıcı seçilmedi.</div>
     }

     return (
        <div className={`grow p-4 sm:p-8 lg:ml-64 bg-[${COLORS.BG_LIGHT}] min-h-screen pb-20 lg:pb-8 animate-fade-in`}>
             <button onClick={() => setView('home')} className={`text-[${COLORS.SECONDARY}] mb-4 flex items-center hover:text-[${COLORS.PRIMARY}] transition`}>
                &larr; Ana Akışa Dön
            </button>
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-2xl space-y-8">
                {/* Profil Header */}
                <div className="flex flex-col items-center border-b pb-6 border-gray-200">
                    <div className={`w-24 h-24 rounded-full bg-gray-400 flex items-center justify-center text-white font-extrabold text-3xl mb-4 shadow-xl`}>
                        {mockUser.email[0].toUpperCase()}
                    </div>
                    <h2 className={`text-2xl font-bold text-[${COLORS.SECONDARY}]`}>@{mockUser.email.split('@')[0]}</h2>
                    <p className="text-gray-500 text-sm">{mockUser.email}</p>
                    <p className="mt-3 text-center max-w-sm italic">{mockUser.bio}</p>
                    <div className="flex space-x-4 mt-4">
                         <button className={`text-lg font-bold py-2 px-6 rounded-full text-white bg-blue-500 hover:bg-blue-600 transition duration-300 transform hover:scale-[1.05]`}>
                            Takip Et
                        </button>
                        <button className={`text-lg font-bold py-2 px-6 rounded-full text-[${COLORS.SECONDARY}] bg-gray-200 hover:bg-gray-300 transition duration-300 transform hover:scale-[1.05]`}>
                            Mesaj Gönder
                        </button>
                    </div>
                </div>
                
                {/* Kullanıcı Postları Izgarası */}
                <h3 className={`text-xl font-semibold text-[${COLORS.SECONDARY}] border-b pb-2`}>Postları ({mockPosts.length})</h3>
                <div className="grid grid-cols-3 gap-2">
                    {mockPosts.map((p, index) => (
                        <div key={index} className="aspect-square bg-gray-100 rounded-lg shadow-inner overflow-hidden hover:opacity-80 transition duration-300">
                            <img src={`https://placehold.co/300x300/F0F0F0/${COLORS.SECONDARY}?text=Post+${index+1}`} alt="Kullanıcı Postu" className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
     )
}


// Explore Page (All Posts)
const Explore = ({ setView, setSelectedUserId }: { setView: React.Dispatch<React.SetStateAction<string>>, setSelectedUserId: React.Dispatch<React.SetStateAction<string | null>> }) => {
    const { user, apiRequest, loading } = useAuth();
    const [allPosts, setAllPosts] = useState<Post[]>([]);
    
    const fetchAllPosts = useCallback(async () => {
        try {
            const data = await apiRequest('posts/all');
            setAllPosts(data);
        } catch (error) {
            console.error("Explore postları yüklenemedi:", error);
        }
    }, [apiRequest]);

    useEffect(() => {
        const loadAllPosts = async () => {
            if (user && allPosts.length === 0 && !loading) {
                await fetchAllPosts();
            }
        };
        loadAllPosts();
    }, [user, fetchAllPosts, allPosts.length, loading]);

    const handleFollowToggle = (targetUserId: string) => {
        console.log(`Takip denemesi: ${targetUserId}`);
    };
    
    const onViewProfile = (userId: string) => {
        setSelectedUserId(userId);
        setView('publicProfile');
    }

    return (
         <div className={`grow p-4 sm:p-8 lg:ml-64 bg-[${COLORS.BG_LIGHT}] min-h-screen pb-20 lg:pb-8 animate-fade-in`}>
            <h1 className={`text-3xl font-extrabold text-[${COLORS.SECONDARY}] mb-8 border-b border-gray-300 pb-4`}>Keşfet ve Yeni İçerikler</h1>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {loading && <LoadingSpinner />}
                {!loading && allPosts.length === 0 && (
                    <div className="col-span-full p-10 bg-white rounded-xl text-center text-gray-500 shadow-lg">
                        <p className="text-xl font-semibold mb-2">Henüz Post Yok</p>
                    </div>
                )}
                {allPosts.map(post => (
                    <div key={post._id} onClick={() => onViewProfile(post.user._id)} className="bg-white rounded-xl shadow-lg overflow-hidden transition duration-300 hover:shadow-2xl transform hover:scale-[1.03] cursor-pointer">
                         <div className="aspect-square w-full">
                            <img
                                src={post.imageUrl || 'https://placehold.co/400x400/cccccc/383a42?text=Keşfet'}
                                alt="Keşfet Postu"
                                className="w-full h-full object-cover"
                            />
                        </div>
                         <div className="p-3">
                            <p className={`font-semibold text-sm text-[${COLORS.SECONDARY}] truncate`}>{post.caption}</p>
                            <p className="text-xs text-gray-500">@{post.user?.email?.split('@')?.[0]}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


// Simple Placeholder Page
const PlaceholderPage = ({ title }: { title: string }) => (
    <div className={`grow p-4 sm:p-8 lg:ml-64 bg-[${COLORS.BG_LIGHT}] min-h-screen pb-20 lg:pb-8 animate-fade-in`}>
        <h1 className={`text-3xl font-extrabold text-[${COLORS.SECONDARY}] mb-8 border-b border-gray-300 pb-4`}>{title}</h1>
        <div className={`p-10 bg-white rounded-xl shadow-xl text-center text-gray-500`}>
            <p className="text-2xl font-semibold mb-2">GlowSphere - {title} Yapım Aşamasında</p>
            <p>Bu bölüm geliştirme aşamasındadır, ancak back-end rotaları hazırdır!</p>
        </div>
    </div>
);


// Auth Form (Login/Register)
// Auth Form - TAM EKRAN KAPLAYAN & RESPONSIVE VERSİYON
const AuthForm = ({ isRegister, toggleAuthMode }: { isRegister: boolean, toggleAuthMode: () => void }) => {
    const { login, register, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            if (isRegister) {
                await register(email, password); 
            } else {
                await login(email, password);
            }
        } catch (err: any) {
            setError(err.message || 'Bir hata oluştu.');
        }
    };

    return (
        // ANA KAPLAYICI: h-screen ile ekran boyuna sabitlenir, overflow-hidden ile taşmalar engellenir.
        <div className="flex w-full h-screen overflow-hidden font-sans bg-[#E0E8D7]">
            
            {/* 1. SOL TARA (FORM ALANI) */}
            {/* Form alanı her zaman ekranın sol yarısını (veya mobilde tamamını) kaplar ve ortalanır. */}
            <div className="w-full lg:w-1/2 h-full flex items-center justify-center p-6 relative z-20">
                
                <div className="w-full max-w-md bg-[#E0E8D7]"> {/* Arkaplan rengi form ile bütünleşti */}
                    {/* Logo */}
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="bg-[#383a42] p-2.5 rounded-xl shadow-lg">
                            <Zap className="w-6 h-6 text-[#A7C080]" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-[#383a42] tracking-tighter">glowsphere.</h1>
                    </div>

                    {/* Başlıklar */}
                    <div className="mb-8">
                        <h2 className="text-2xl lg:text-3xl font-bold text-[#383a42] mb-2">
                            {isRegister ? 'Hesap Oluştur' : 'Tekrar Hoş Geldiniz'}
                        </h2>
                        <p className="text-gray-600 text-sm lg:text-base">
                            {isRegister ? 'GlowSphere dünyasına katılmak için bilgilerini gir.' : 'Kaldığınız yerden devam edin.'}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-[#383a42] ml-1">E-posta</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="ismin@ornek.com"
                                className="w-full bg-[#F5F5EC] border-2 border-transparent focus:border-[#A7C080] text-[#383a42] rounded-xl p-3.5 outline-none transition-all shadow-sm placeholder-gray-400 font-medium"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-[#383a42] ml-1">Şifre</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-[#F5F5EC] border-2 border-transparent focus:border-[#A7C080] text-[#383a42] rounded-xl p-3.5 outline-none transition-all shadow-sm placeholder-gray-400 font-medium"
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-100 text-red-600 p-3 rounded-lg text-sm font-bold flex items-center animate-pulse">
                                <span className="mr-2">⚠️</span> {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 px-4 rounded-xl shadow-lg text-base font-bold text-white bg-[#383a42] hover:bg-[#232429] hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 mt-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (isRegister ? 'Kayıt Ol' : 'Giriş Yap')}
                        </button>
                    </form>

                    {/* Alt Link */}
                    <p className="text-center mt-6 text-gray-600 text-sm font-medium">
                        {isRegister ? 'Zaten hesabınız var mı?' : "Hesabınız yok mu?"}
                        <button onClick={toggleAuthMode} className="ml-1.5 font-bold text-[#383a42] hover:text-[#A7C080] underline decoration-2 decoration-transparent hover:decoration-[#A7C080] transition-all">
                            {isRegister ? 'Giriş Yap' : 'Kayıt Ol'}
                        </button>
                    </p>
                </div>
            </div>

            {/* 2. SAĞ TARAF (GÖRSEL GRID ALANI) */}
            {/* Container */}
            <div className="hidden lg:flex w-1/2 h-full bg-[#1a1b1e] relative overflow-hidden items-center justify-center">
                
                {/* Glow Efekti */}
                <div className="absolute w-[500px] h-[500px] bg-[#A7C080] rounded-full blur-[150px] opacity-10 pointer-events-none z-0"></div>

                {/* GRID WRAPPER:
                   Bu kısım çok önemli. w-[140%] ve h-[140%] vererek ekranın dışına taşırıyoruz.
                   Böylece rotate yaptığımızda kenarlarda boşluk kalmıyor.
                   flex-shrink-0 sayesinde resimler sıkışmıyor.
                */}
                <div className="w-[140%] h-[140%] grid grid-cols-2 gap-4 transform rotate-6 origin-center animate-fade-in p-4">
                    
                    {/* Sol Sütun (Yukarı kayıyormuş hissi) */}
                    <div className="flex flex-col gap-4 -mt-20">
                        <div className="flex-1 bg-gray-800 rounded-3xl overflow-hidden relative group">
                             <img src="https://images.unsplash.com/photo-1629196914375-f7e48f477b6d?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition duration-700" alt="Aesthetic" />
                        </div>
                        <div className="flex-[1.5] bg-gray-800 rounded-3xl overflow-hidden relative group">
                             <img src="https://images.unsplash.com/photo-1615887023516-9b6c50f886f6?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition duration-700" alt="Aesthetic" />
                        </div>
                        <div className="flex-1 bg-gray-800 rounded-3xl overflow-hidden relative group">
                             <img src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition duration-700" alt="Aesthetic" />
                        </div>
                    </div>

                    {/* Sağ Sütun (Aşağı kayıyormuş hissi) */}
                    <div className="flex flex-col gap-4 mt-20">
                         <div className="flex-[1.2] bg-gray-800 rounded-3xl overflow-hidden relative group">
                             <img src="https://images.unsplash.com/photo-1507643179173-442f01eb0932?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition duration-700" alt="Aesthetic" />
                        </div>
                        <div className="flex-1 bg-gray-800 rounded-3xl overflow-hidden relative group">
                             <img src="https://images.unsplash.com/photo-1490750967868-58cb75069ed6?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition duration-700" alt="Aesthetic" />
                        </div>
                         <div className="flex-1 bg-gray-800 rounded-3xl overflow-hidden relative group">
                             <img src="https://images.unsplash.com/photo-1523678802981-959dc4f70b96?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition duration-700" alt="Aesthetic" />
                        </div>
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

// --- 5. ANA UYGULAMA YAPISI ---

// --- 5. ANA UYGULAMA YAPISI (DÜZELTİLMİŞ) ---

const AppContent = () => {
    const { user, fetchUser, initialLoading } = useAuth();
    const [view, setView] = useState('home'); 
    const [isRegister, setIsRegister] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null); 

    const toggleAuthMode = () => setIsRegister(prev => !prev);
    
    // Loading Ekranı
    if (initialLoading) {
        return (
            <div className={`fixed inset-0 w-full h-full flex flex-col items-center justify-center bg-[#F5F5EC] z-50`}>
                <Loader2 className={`w-16 h-16 animate-spin text-[#A7C080] mb-6`} />
                <p className="text-[#383a42] font-bold text-xl animate-pulse tracking-wide">GlowSphere Başlatılıyor...</p>
            </div>
        );
    }

    if (!user) {
        return <AuthForm isRegister={isRegister} toggleAuthMode={toggleAuthMode} />;
    }
    
    const renderView = () => {
        switch (view) {
            case 'home': return <HomeFeed setView={setView} setSelectedUserId={setSelectedUserId} />;
            case 'createPost': return <CreatePost setView={setView} />;
            case 'explore': return <Explore setView={setView} setSelectedUserId={setSelectedUserId} />;
            case 'people': return <PlaceholderPage title="Kişileri Bul" />;
            case 'saved': return <PlaceholderPage title="Kaydedilen Postlar" />;
            case 'profile': return <MyProfile user={user} fetchUser={fetchUser} />;
            case 'publicProfile': return <PublicProfile selectedUserId={selectedUserId} setView={setView} />;
            default: return <HomeFeed setView={setView} setSelectedUserId={setSelectedUserId} />;
        }
    };

    return (
     
        <div className="flex w-full min-h-screen bg-[#F5F5EC] relative">
            <Sidebar view={view} setView={setView} />
            <MobileBottomBar view={view} setView={setView} />
            
            {/* İçerik alanı */}
            <div className="flex-grow w-full">
                 {renderView()}
            </div>
            <GlobalAlert />
        </div>
    );
};

const App = () => (
    <AuthProvider>
        <AppContent />
    </AuthProvider>
);

export default App;