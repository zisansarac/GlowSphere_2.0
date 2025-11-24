/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { LogOut, Home, Compass, Users, Bookmark, PlusSquare, Heart, MessageCircle, Send, Loader2, User as UserIcon, UserPlus, Zap, Settings, X, Trash2, Edit2, Save, MoreVertical } from 'lucide-react';

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
    user: User; 
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
    register: (username:string, email: string, password: string) => Promise<void>;
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
    //  Kullanıcıyı LocalStorage'dan yükle
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
    
            const data = await response.json().catch(() => null);

            if (response.ok && data && data.user) {
                console.log("Kullanıcı güncellendi:", data.user.email);
        
                setUser(data.user);
            } else if (response.status === 401) {
             
                console.warn("Token geçersiz (401), çıkış yapılıyor.");
                logout();
            } else {
         
                console.warn("Sunucudan güncel veri alınamadı ama oturum korunuyor. Status:", response.status);
            }
        } catch (error) {
    
            console.error("FetchUser hatası (Offline modda devam ediliyor):", error);
        } finally {
            setInitialLoading(false);
        }
    }, [token]);

    
    useEffect(() => {
        if (token) {
     
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

    const register = async (username:string, email: string, password: string) => {
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
const PostCard = ({ post, currentUserId, onFollowToggle, onViewProfile, onPostUpdate, initialIsFollowing }: { 
    post: Post; 
    currentUserId: string; 
    onFollowToggle: (id: string, isFollowing: boolean, setFollowing: React.Dispatch<React.SetStateAction<boolean>>) => void;
    onViewProfile: (id: string) => void;
    onPostUpdate: () => void;
    initialIsFollowing?: boolean;
}) => {
    const { apiRequest, displayAlert } = useAuth();
    
    // State'ler
    const [likesCount, setLikesCount] = useState(post.likesCount || 0);
    const [isLiked, setIsLiked] = useState(false); 
    const [isAnimating, setIsAnimating] = useState(false); 

    // Takip State'i 
    const [isUserFollowing, setIsUserFollowing] = useState(initialIsFollowing || false);
    const isOwner = post.user?._id === currentUserId;

    // Beğeni İşlemi
    const handleLikeToggle = async () => {
    
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 1000);

        try {
           
            const result = await apiRequest(`posts/like/${post._id}`, 'POST');
            
            if (result.action === 'like') {
                setIsLiked(true);
                setLikesCount(result.likesCount);
            } else {
                setIsLiked(false);
                setLikesCount(result.likesCount);
            }
        } catch (error) {
            console.error("Beğeni hatası", error);
        }
    };

    return (
        <div className={`bg-white p-4 sm:p-6 rounded-4xl shadow-sm mb-8 border border-[#383a42]/5 transition-all duration-300 hover:shadow-md animate-fade-in`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center cursor-pointer group" onClick={() => {
    
            const userId = post.user?._id;
            if (userId) {
                 onViewProfile(userId);
              } else {
        console.error("Hata: Bu postun kullanıcısı bulunamadı (ID yok).", post);
         }
   }}>
                    <div className={`w-12 h-12 rounded-full bg-[#383a42] flex items-center justify-center text-white font-bold text-lg mr-3 shadow-md group-hover:scale-105 transition`}>
                        {post.user?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                        <p className={`font-bold text-[#383a42] group-hover:text-[#A7C080] transition`}>
                            @{post.user?.username || post.user?.email?.split('@')?.[0] || 'Kullanıcı'}
                        </p>
                        <p className="text-xs text-gray-400 font-medium">
                             {new Date(post.createdAt).toLocaleDateString()} • {post.user?.email}
                        </p>
                    </div>
                </div>
                
                {/* Takip Butonu (Kendi postun değilse) */}
                {!isOwner && (
                    <button
                        onClick={() => onFollowToggle(post.user._id, isUserFollowing, setIsUserFollowing)}
                        className={`text-xs font-bold transition uppercase tracking-wider py-1 px-3 rounded-lg
                            ${isUserFollowing 
                                ? 'text-gray-400 bg-gray-100 hover:bg-gray-200' 
                                : 'text-[#A7C080] hover:text-[#383a42]' 
                            }`}
                    >
                        {isUserFollowing ? 'Takip Ediliyor' : 'Takip Et'}
                    </button>
                )}
            </div>

            {/* Caption */}
            <p className="text-[#383a42] mb-3 leading-relaxed">{post.caption}</p>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
                {(post.tags || []).map((tag, index) => (
                    <span key={index} className="text-xs font-bold text-[#A7C080] bg-[#F5F5EC] px-2 py-1 rounded-lg">
                        #{tag}
                    </span>
                ))}
            </div>

            {/* Media */}
            <div className="aspect-square w-full bg-gray-100 rounded-2xl overflow-hidden shadow-inner mb-4 relative" onDoubleClick={handleLikeToggle}>
                <img
                    src={post.imageUrl}
                    alt="Post"
                    className="w-full h-full object-cover"
                />
                {/* Çift tıklayınca çıkan büyük kalp */}
                <Heart className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 text-white fill-white drop-shadow-lg transition-all duration-500 ${isAnimating ? 'opacity-100 scale-125' : 'opacity-0 scale-50'}`} />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                    {/* Like Button */}
                    <button 
                        onClick={handleLikeToggle}
                        className="flex items-center space-x-2 group"
                    >
                        <Heart 
                            className={`w-7 h-7 transition-all duration-300 ${isLiked ? 'text-red-500 fill-red-500 scale-110' : 'text-[#383a42] group-hover:text-red-500'}`} 
                        />
                        <span className="font-bold text-[#383a42]">{likesCount}</span>
                    </button>

                    {/* Comment Button (Sadece ikon) */}
                    <button className="flex items-center space-x-2 group">
                        <MessageCircle className="w-7 h-7 text-[#383a42] group-hover:text-[#A7C080] transition" />
                        <span className="font-bold text-[#383a42]">{post.commentsCount}</span>
                    </button>

                    <button className="flex items-center space-x-2 group">
                        <Send className="w-6 h-6 text-[#383a42] group-hover:text-[#A7C080] transition transform -rotate-45 mb-1" />
                    </button>
                </div>
                
                <button>
                    <Bookmark className="w-6 h-6 text-[#383a42] hover:text-[#A7C080] transition" />
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
    const [isFeedLoading, setIsFeedLoading] = useState(true);
    const [isUserFollowing, setIsUserFollowing] = useState(false); 

    const fetchFeed = useCallback(async () => {

        if (!user) return;

        try {
            const data = await apiRequest('feed/home');
            setFeed(data);
        } catch (error) {
            console.error("Feed yüklenemedi:", error);
        }
    }, [apiRequest, user]);

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
        
        <div className="w-full min-h-screen lg:pl-80 p-6 sm:p-10 transition-all duration-300">
            
            <div className="max-w-[1600px] mx-auto">
            
                <div className="mb-10 animate-fade-in pt-4 lg:pt-0">
                    <h1 className="text-3xl font-extrabold text-[#383a42] mb-2 tracking-tight">Ana Akış</h1>
                    <p className="text-gray-500 font-medium text-lg">GlowSphere'deki en yeni paylaşımları keşfet.</p>
                </div>
                
                <div className="flex flex-col xl:flex-row gap-10 items-start">
                    {/* Sol: Feed Akışı */}
                    <div className="w-full xl:flex-1">
                        {/* Loading State */}
                        {loading && <LoadingSpinner />}
                        
                        {/* Empty State */}
                        {!loading && feed.length === 0 && (
                            <div className="p-12 bg-white rounded-4xl text-center shadow-lg border-2 border-[#383a42]/5 animate-fade-in">
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
                                initialIsFollowing={true}
                            />
                        ))}
                    </div>

                    {/* Sağ: Top Creators */}
                    <div className="hidden xl:block w-96 shrink-0 sticky top-10">
                        <TopCreators creators={mockCreators} setView={setView} setSelectedUserId={setSelectedUserId} />
                    </div>
                </div>
            </div>
        </div>
    );
};


// Create Post Page
// Create Post Page - RESİM YÜKLEME (UPLOAD) ENTEGRE EDİLMİŞ HALİ
const CreatePost = ({ setView }: { setView: React.Dispatch<React.SetStateAction<string>> }) => {
    const { apiRequest, token, displayAlert } = useAuth(); // token'ı buradan alıyoruz
    
    // State'ler
    const [caption, setCaption] = useState('');
    const [tagsInput, setTagsInput] = useState('');
    
    // Dosya Yükleme State'leri
    const [file, setFile] = useState<File | null>(null); // Seçilen ham dosya
    const [previewUrl, setPreviewUrl] = useState<string | null>(null); // Ekranda göstermek için geçici URL
    const [uploading, setUploading] = useState(false); // Yükleniyor animasyonu için

    // Dosya Seçilince Çalışır
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            // Tarayıcıda önizleme oluştur (Sunucuya gitmeden hemen göstermek için)
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) {
            displayAlert("Lütfen bir resim seçin.", 'error');
            return;
        }

        if (!caption) {
            displayAlert("Lütfen bir açıklama yazın.", 'error');
            return;
        }

        setUploading(true);

        try {
            // 1. ADIM: Resmi Sunucuya Yükle (Multer Rotası)
            const formData = new FormData();
            formData.append('image', file); // Backend 'image' adıyla bekliyor

            // Not: apiRequest JSON gönderdiği için burada manuel fetch kullanıyoruz
            // çünkü FormData gönderirken Content-Type header'ı özel olmalı.
            const uploadResponse = await fetch('http://localhost:5000/api/upload', {
                method: 'POST',
                // FormData gönderirken 'Content-Type' header'ını tarayıcı otomatik ayarlar, biz yazmıyoruz!
                body: formData, 
            });

            if (!uploadResponse.ok) {
                throw new Error('Resim yüklenemedi.');
            }

            // Backend bize dosya yolunu döner: "/uploads/resim-123.jpg"
            const imagePath = await uploadResponse.text();
            
            // Backend yolu bazen Windows ters slash (\) ile gelebilir, onu düzeltelim.
            // Ayrıca tam URL haline getirelim ki frontend'de görünsün.
            // ÖNEMLİ: Eğer backend sadece yol dönüyorsa başına localhost ekliyoruz.
            const fullImageUrl = `http://localhost:5000${imagePath}`;

            // 2. ADIM: Postu Oluştur (Resim URL'si ile)
            const tagsArray = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
            
            await apiRequest('posts', 'POST', {
                caption,
                imageUrl: fullImageUrl, // Artık sunucudaki adresi kaydediyoruz
                tags: tagsArray,
            });

            displayAlert('Post başarıyla paylaşıldı!', 'success');
            
            // Temizlik ve Yönlendirme
            setCaption('');
            setTagsInput('');
            setFile(null);
            setPreviewUrl(null);
            setTimeout(() => setView('home'), 1000);

        } catch (error: any) {
            console.error(error);
            displayAlert(error.message || 'Bir hata oluştu.', 'error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="w-full min-h-screen p-6 sm:p-10 lg:pl-80 transition-all duration-300">
            <div className="max-w-2xl mx-auto animate-fade-in">
                
                <h1 className="text-3xl font-extrabold text-[#383a42] mb-8 border-b border-gray-200 pb-4">Yeni Post Oluştur</h1>
                
                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-4xl shadow-xl space-y-8 border border-[#383a42]/5">
                    
                    {/* --- RESİM YÜKLEME ALANI --- */}
                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-[#383a42] ml-1">Görsel Seç</label>
                        
                        {/* Gizli Input */}
                        <input 
                            type="file" 
                            id="fileInput"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden" 
                        />

                        {/* Tıklanabilir Alan */}
                        <label 
                            htmlFor="fileInput" 
                            className={`flex flex-col items-center justify-center w-full aspect-video rounded-2xl border-3 border-dashed cursor-pointer transition-all duration-300 group
                                ${previewUrl 
                                    ? 'border-[#A7C080] bg-[#F5F5EC]' 
                                    : 'border-gray-300 hover:border-[#A7C080] hover:bg-gray-50'
                                }`}
                        >
                            {previewUrl ? (
                                <div className="relative w-full h-full rounded-2xl overflow-hidden group">
                                    <img src={previewUrl} alt="Önizleme" className="w-full h-full object-contain bg-black/5" />
                                    {/* Hoverda 'Değiştir' yazısı */}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                        <p className="text-white font-bold flex items-center"><Zap className="w-5 h-5 mr-2" /> Görseli Değiştir</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-gray-400 group-hover:text-[#A7C080] transition">
                                    <PlusSquare className="w-12 h-12 mb-3" />
                                    <p className="font-bold">Resim Yüklemek İçin Tıkla</p>
                                    <p className="text-xs mt-1 text-gray-400">JPG, PNG (Maks. 5MB)</p>
                                </div>
                            )}
                        </label>
                    </div>

                    {/* --- AÇIKLAMA --- */}
                    <div>
                        <label className="block text-sm font-bold text-[#383a42] mb-2 ml-1">Açıklama</label>
                        <textarea
                            rows={3}
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            className="w-full text-black border border-transparent rounded-xl p-4 outline-none focus:border-[#A7C080] focus:bg-white transition font-medium placeholder-gray-400 resize-none"
                            placeholder="Bu fotoğrafın hikayesi ne?"
                        ></textarea>
                    </div>

                    {/* --- ETİKETLER --- */}
                    <div>
                        <label className="block text-sm font-bold text-[#383a42] mb-2 ml-1">Etiketler</label>
                        <input
                            type="text"
                            value={tagsInput}
                            onChange={(e) => setTagsInput(e.target.value)}
                            className="w-full text-black border border-transparent rounded-xl p-4 outline-none focus:border-[#A7C080] focus:bg-white transition font-medium placeholder-gray-400"
                            placeholder="#doğa, #seyahat (Virgülle ayırın)"
                        />
                    </div>

                    {/* --- SUBMIT BUTONU --- */}
                    <button
                        type="submit"
                        disabled={uploading}
                        className={`w-full flex items-center justify-center py-4 px-6 rounded-xl shadow-lg text-lg font-bold text-white transition duration-300 transform hover:scale-[1.01]
                            ${uploading 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-[#383a42] hover:bg-[#4a4d57]'
                            }`}
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                Yükleniyor...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5 mr-2" />
                                Paylaş
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

// My Profile Page 

const MyProfile = ({ user, fetchUser }: { user: User, fetchUser: () => Promise<void> }) => {
    const { apiRequest, loading, displayAlert } = useAuth();
    

    const [bio, setBio] = useState(user.bio || '');
    const [username, setUsername] = useState(user.username || user.username || user.email.split('@')[0]);
    const [myPosts, setMyPosts] = useState<Post[]>([]); 
    const [isLoadingPosts, setIsLoadingPosts] = useState(true);

    const [selectedPost, setSelectedPost] = useState<Post | null>(null); 
    const [isEditingPost, setIsEditingPost] = useState(false); 
    const [editCaption, setEditCaption] = useState(''); 

  
    useEffect(() => {
        let isMounted = true;
        const fetchMyPosts = async () => {
            if (!user._id) return;
            try {
                const data = await apiRequest(`posts/user/${user._id}`);
                if (isMounted) setMyPosts(data);
            } catch (error) {
                console.error("Post hatası:", error);
            } finally {
                if (isMounted) setIsLoadingPosts(false);
            }
        };
        fetchMyPosts();
        return () => { isMounted = false; };
    }, [user._id, apiRequest]);

    
    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiRequest('interact/profile', 'PUT', { bio, username });
            displayAlert('Profil güncellendi!', 'success');
            fetchUser(); 
        } catch (error) { console.error(error); }
    };

   
    const openPostDetail = (post: Post) => {
        setSelectedPost(post);
        setEditCaption(post.caption); 
        setIsEditingPost(false); 
    };

    const closePostDetail = () => {
        setSelectedPost(null);
        setIsEditingPost(false);
    };

    const handleDeletePost = async () => {
        if (!selectedPost) return;
        if (!window.confirm("Bu postu silmek istediğinize emin misiniz?")) return;

        try {
            await apiRequest(`posts/${selectedPost._id}`, 'DELETE');

            setMyPosts(prev => prev.filter(p => p._id !== selectedPost._id));
            
            displayAlert('Post silindi.', 'success');
            closePostDetail();
        } catch (error) {
            displayAlert('Silme işlemi başarısız.', 'error');
        }
    };

    const handleUpdatePost = async () => {
        if (!selectedPost) return;
        try {
            const updatedPost = await apiRequest(`posts/${selectedPost._id}`, 'PUT', {
                caption: editCaption
            });

            setMyPosts(prev => prev.map(p => p._id === selectedPost._id ? updatedPost : p));
  
            setSelectedPost(updatedPost);
            
            setIsEditingPost(false);
            displayAlert('Post güncellendi!', 'success');
        } catch (error) {
            displayAlert('Güncelleme başarısız.', 'error');
        }
    };

    return (
        <div className="w-full min-h-screen p-6 sm:p-10 lg:pl-80 transition-all duration-300 relative">
            
            {/* --- POST DETAY MODALI --- */}
            {selectedPost && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    {/* Kapatma Butonu */}
                    <button onClick={closePostDetail} className="absolute top-5 right-5 text-white hover:text-red-400 transition">
                        <X className="w-5 h-5" />
                    </button>

                    <div className="bg-white w-full max-w-5xl h-[80vh] rounded-4xl overflow-hidden flex flex-col md:flex-row shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                        
                        {/* Sol: Resim Alanı */}
                        <div className="w-full md:w-3/5 h-1/2 md:h-full bg-black flex items-center justify-center">
                            <img src={selectedPost.imageUrl} alt="Post Detay" className="max-w-full max-h-full object-contain" />
                        </div>

                        {/* Sağ: Bilgi ve İşlem Alanı */}
                        <div className="w-full md:w-2/5 h-1/2 md:h-full bg-white flex flex-col">
                            
                            {/* Header: Kullanıcı ve İşlemler */}
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-[#383a42] flex items-center justify-center text-white font-bold">
                                        {user.email[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#383a42]">@{username}</p>
                                        <p className="text-xs text-gray-400">Post Sahibi</p>
                                    </div>
                                </div>
                                
                                {/* Edit / Delete Butonları (Sadece kendi postunsa) */}
                                <div className="flex space-x-2">
                                    {!isEditingPost ? (
                                        <>
                                            <button onClick={() => setIsEditingPost(true)} className="p-2 hover:bg-gray-100 rounded-full text-lime-500 transition" title="Düzenle">
                                                <Edit2 className="w-5 h-5" />
                                            </button>
                                            <button onClick={handleDeletePost} className="p-2 hover:bg-red-50 rounded-full text-red-600 transition" title="Sil">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={() => setIsEditingPost(false)} className="p-2 hover:bg-gray-100 rounded-full text-white hover:text-red-500 transition" title="İptal">
                                            <X className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* İçerik: Açıklama ve Yorumlar */}
                            <div className="grow p-6 overflow-y-auto">
                                {isEditingPost ? (
                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-gray-700">Açıklamayı Düzenle</label>
                                        <textarea 
                                            value={editCaption} 
                                            onChange={(e) => setEditCaption(e.target.value)}
                                            className="w-full p-4 border rounded-xl text-black focus:border-[#A7C080] outline-none resize-none h-32"
                                        />
                                        <button onClick={handleUpdatePost} className="w-full py-3 bg-[#383a42] text-white rounded-xl font-bold hover:text-[#A7C080] transition flex items-center justify-center">
                                            <Save className="w-5 h-5 mr-2" /> Kaydet
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-[#383a42] text-lg leading-relaxed mb-4">{selectedPost.caption}</p>
                                        <div className="flex flex-wrap gap-2 mb-6">
                                            {selectedPost.tags?.map((tag, i) => (
                                                <span key={i} className="text-sm text-[#A7C080] font-medium">#{tag}</span>
                                            ))}
                                        </div>
                                        
                                        <div className="border-t pt-4">
                                            <p className="text-gray-400 text-sm text-center italic">Henüz yorum yok.</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Footer: Tarih */}
                            <div className="p-4 border-t border-gray-100 text-xs text-gray-400 text-center">
                                {new Date(selectedPost.createdAt).toLocaleDateString()} tarihinde paylaşıldı
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* --- ANA PROFİL İÇERİĞİ --- */}
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
                
                {/* 1. Profil Kartı */}
                <div className="bg-white rounded-4xl p-8 shadow-lg border border-[#383a42]/5 flex flex-col md:flex-row items-center md:items-start gap-8">
                    <div className="w-32 h-32 rounded-full bg-[#383a42] flex items-center justify-center text-white font-extrabold text-5xl shadow-2xl shrink-0">
                        {user.email[0].toUpperCase()}
                    </div>

                    <div className="grow text-center md:text-left">
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

                {/* 2. Düzenleme Formu */}
                <div className="bg-[#F5F5EC] p-6 rounded-3xl border-2 border-[#A7C080]/20">
                    <h3 className="font-bold text-[#383a42] mb-6 flex items-center text-lg">
                        <Settings className="w-5 h-5 mr-2" /> Profili Düzenle
                    </h3>
                    
                    <form onSubmit={handleUpdateProfile} className="flex flex-col gap-6">
                        <div>
                            <label className="block text-sm font-bold text-[#383a42] mb-2 ml-1">Kullanıcı Adı</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-white text-[#383a42] border border-gray-200 rounded-xl p-4 outline-none focus:border-[#A7C080] focus:ring-2 focus:ring-[#A7C080]/20 transition shadow-sm font-medium placeholder-gray-400"
                                placeholder="Örn: glowmaster"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-[#383a42] mb-2 ml-1">Biyografi</label>
                            <textarea
                                rows={3}
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
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

                {/* 3. Post Izgarası (GÜNCELLENDİ: Tıklama özelliği geldi) */}
                <div>
                    <h3 className="text-2xl font-bold text-[#383a42] mb-6 border-b pb-2 inline-block">Postlarım</h3>
                    
                    {isLoadingPosts ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="animate-spin text-[#A7C080] w-10 h-10" />
                        </div>
                    ) : myPosts.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-3xl shadow-sm border border-dashed border-gray-300">
                            <p className="text-gray-500 font-medium mb-2">Henüz hiç post paylaşmadın.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {myPosts.map((post) => (
                                <div 
                                    key={post._id} 
                                    // YENİ: Tıklayınca Modalı Aç
                                    onClick={() => openPostDetail(post)}
                                    className="group relative aspect-square bg-gray-200 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
                                >
                                    <img 
                                        src={post.imageUrl} 
                                        alt={post.caption} 
                                        className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                                    />
                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col items-center justify-center gap-2 text-white font-bold">
                                        <div className="flex gap-4">
                                            <span className="flex items-center"><Heart className="w-5 h-5 mr-1 fill-white" /> {post.likesCount}</span>
                                            <span className="flex items-center"><MessageCircle className="w-5 h-5 mr-1 fill-white" /> {post.commentsCount}</span>
                                        </div>
                                        <p className="text-xs uppercase tracking-widest mt-2 border-b border-white pb-1">İncele</p>
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
    const { user, apiRequest, displayAlert } = useAuth();
    
    const [profileUser, setProfileUser] = useState<any>(null);
    const [userPosts, setUserPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    // Profil Verilerini Çek
    useEffect(() => {
        const loadProfileData = async () => {
            if (!selectedUserId) return;
            setLoading(true);
            try {
               
                const userData = await apiRequest(`users/${selectedUserId}`);
                setProfileUser(userData.user);

               
                const postsData = await apiRequest(`posts/user/${selectedUserId}`);
                setUserPosts(postsData);
              
                if (user && user._id !== selectedUserId) {
                    const followStatus = await apiRequest(`interact/is-following/${selectedUserId}`);
                    setIsFollowing(followStatus.isFollowing);
                }
                
            } catch (error) {
                console.error("Profil yüklenemedi:", error);
                displayAlert("Kullanıcı profili görüntülenemedi.", 'error');
                setView('home'); 
            } finally {
                setLoading(false);
            }
        };

        loadProfileData();
    }, [selectedUserId, apiRequest, setView, user]);

    // Takip Et / Bırak Fonksiyonu
    const handleFollow = async () => {
        if (!profileUser || followLoading) return;
        setFollowLoading(true);
        try {
            const result = await apiRequest(`interact/follow/${profileUser._id}`, 'POST');
            
            if (result.action === 'follow') {
                setIsFollowing(true); // State'i güncelle
                // undefined hatası çözümü: username yoksa email kullan
                const nameToShow = profileUser.username || profileUser.email || 'Kullanıcı';
                displayAlert(`${nameToShow} takip edildi!`, 'success');
            } else {
                setIsFollowing(false); // State'i güncelle
                const nameToShow = profileUser.username || profileUser.email || 'Kullanıcı';
                displayAlert(`${nameToShow} takipten çıkarıldı.`, 'info');
            }
        } catch (error) {
            displayAlert("İşlem başarısız.", 'error');
        } finally {
            setFollowLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-[#F5F5EC]">
                <Loader2 className="w-10 h-10 animate-spin text-[#A7C080]" />
            </div>
        );
    }

    if (!profileUser) return null;

    const isOwnProfile = user && user._id === profileUser._id;

    return (
        <div className="w-full min-h-screen p-6 sm:p-10 lg:pl-80 transition-all duration-300 relative">
            
            {/* --- DETAY MODALI (SADECE GÖRÜNTÜLEME) --- */}
            {selectedPost && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedPost(null)}>
                     {/* Kapat Butonu */}
                     <button className="absolute top-5 right-5 text-white hover:text-red-400 transition">
                        <X className="w-10 h-10" />
                    </button>

                    <div className="bg-white w-full max-w-5xl h-[80vh] rounded-4xl overflow-hidden flex flex-col md:flex-row shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                        {/* Sol: Resim */}
                        <div className="w-full md:w-3/5 h-1/2 md:h-full bg-black flex items-center justify-center">
                            <img src={selectedPost.imageUrl} alt="Detay" className="max-w-full max-h-full object-contain" />
                        </div>

                        {/* Sağ: Bilgiler (Edit/Sil butonları YOK) */}
                        <div className="w-full md:w-2/5 h-1/2 md:h-full bg-white flex flex-col">
                            {/* Header */}
                            <div className="p-6 border-b border-gray-100 flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-[#383a42] flex items-center justify-center text-white font-bold">
                                    {profileUser.email[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-[#383a42]">@{profileUser.username || profileUser.email.split('@')[0]}</p>
                                    <p className="text-xs text-gray-400">GlowSphere Üyesi</p>
                                </div>
                            </div>

                            {/* İçerik */}
                            <div className="grow p-6 overflow-y-auto">
                                <p className="text-[#383a42] text-lg leading-relaxed mb-4">{selectedPost.caption}</p>
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {selectedPost.tags?.map((tag, i) => (
                                        <span key={i} className="text-sm text-[#A7C080] font-medium">#{tag}</span>
                                    ))}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-gray-100 text-xs text-gray-400 text-center">
                                {new Date(selectedPost.createdAt).toLocaleDateString()} tarihinde paylaşıldı
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
                {/* Geri Dön */}
                <button onClick={() => setView('home')} className="flex items-center text-white hover:text-lime-200 transition font-bold">
                    &larr; Ana Akışa Dön
                </button>

                {/* Profil Kartı */}
                <div className="bg-white rounded-4xl p-8 shadow-lg border border-[#383a42]/5 flex flex-col md:flex-row items-center md:items-start gap-8">
                    <div className="w-32 h-32 rounded-full bg-[#383a42] flex items-center justify-center text-white font-extrabold text-5xl shadow-xl shrink-0">
                        {profileUser.email[0].toUpperCase()}
                    </div>

                    <div className="grow text-center md:text-left">
                        <h2 className="text-3xl font-extrabold text-[#383a42]">@{profileUser.username || profileUser.email.split('@')[0]}</h2>
                        <p className="text-gray-500 font-medium mb-4">{profileUser.email}</p>

                        <div className="flex justify-center md:justify-start gap-6 my-6">
                            <div className="text-center">
                                <span className="block font-bold text-xl text-[#383a42]">{userPosts.length}</span>
                                <span className="text-xs text-gray-500 uppercase tracking-wide">Post</span>
                            </div>
                            <div className="text-center">
                                <span className="block font-bold text-xl text-[#383a42]">0</span>
                                <span className="text-xs text-gray-500 uppercase tracking-wide">Takipçi</span>
                            </div>
                        </div>
                        
                        <p className="text-[#383a42]/80 italic max-w-lg mb-6">{profileUser.bio || "Bu kullanıcı henüz biyografi eklemedi."}</p>
                        
                        {/* --- TAKİP ET BUTONU --- */}
                        {!isOwnProfile && (
                            <button 
                                onClick={handleFollow}
                                disabled={followLoading}
                                className={`font-bold py-3 px-8 rounded-xl transition shadow-md transform hover:scale-105 flex items-center justify-center
                                    ${isFollowing 
                                        ? 'bg-gray-200 text-lime-200 hover:bg-gray-300' 
                                        : 'bg-[#383a42] text-white hover:bg-[#4a4d57]'
                                    }`}
                            >
                                {followLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isFollowing ? 'Takip Ediliyor' : 'Takip Et')}
                            </button>
                        )}
                    </div>
                </div>

                {/* Paylaşımlar */}
                <div>
                    <h3 className="text-2xl font-bold text-[#383a42] mb-6 border-b pb-2 inline-block">Paylaşımlar</h3>
                    {userPosts.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-3xl shadow-sm border border-dashed border-gray-300">
                            <p className="text-gray-500">Bu kullanıcının henüz gönderisi yok.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {userPosts.map((post) => (
                                <div 
                                    key={post._id} 
                                    onClick={() => setSelectedPost(post)} // MODALI AÇAR
                                    className="group relative aspect-square bg-gray-200 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
                                >
                                    <img src={post.imageUrl} alt={post.caption} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-4 text-white font-bold">
                                        <span className="flex items-center"><Heart className="w-5 h-5 mr-1 fill-white" /> {post.likesCount}</span>
                                        <p className="text-xs uppercase tracking-widest border-b border-white pb-1 absolute bottom-4">İncele</p>
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

// Explore Page (All Posts)
// Explore Page (Tüm Postlar)
const Explore = ({ setView, setSelectedUserId }: { setView: React.Dispatch<React.SetStateAction<string>>, setSelectedUserId: React.Dispatch<React.SetStateAction<string | null>> }) => {
    const { user, apiRequest, loading } = useAuth();
    const [allPosts, setAllPosts] = useState<Post[]>([]);
    
    // Tüm postları çek
    useEffect(() => {
        let isMounted = true;
        const fetchAllPosts = async () => {
            try {
                const data = await apiRequest('posts/all'); // Backend rotası
                if (isMounted) setAllPosts(data);
            } catch (error) {
                console.error("Explore hatası:", error);
            }
        };

        if (user) fetchAllPosts();
        return () => { isMounted = false; };
    }, [user, apiRequest]);

    const handleViewProfile = (userId: string) => {
        setSelectedUserId(userId);
        setView('publicProfile');
    };

    return (
        <div className="w-full min-h-screen p-6 sm:p-10 lg:pl-80 transition-all duration-300">
            <div className="max-w-[1600px] mx-auto animate-fade-in">
                <h1 className="text-3xl font-extrabold text-[#383a42] mb-8">Keşfet</h1>
                
                {loading ? (
                    <div className="flex justify-center"><Loader2 className="animate-spin w-10 h-10 text-[#A7C080]" /></div>
                ) : (
                    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                        {allPosts.map(post => (
                            <div key={post._id} className="break-inside-avoid bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition duration-300 cursor-pointer group" onClick={() => handleViewProfile(post.user._id)}>
                                <div className="relative">
                                    <img src={post.imageUrl} alt="Explore" className="w-full h-auto object-cover" />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition duration-300"></div>
                                </div>
                                <div className="p-4">
                                    <p className="font-bold text-[#383a42] text-sm truncate">{post.caption}</p>
                                    <div className="flex items-center justify-between mt-2">
                                         <p className="text-xs text-gray-500">@{post.user?.username || post.user?.email?.split('@')[0] || 'User'}</p>
                                         <div className="flex items-center text-xs text-gray-400">
                                            <Heart className="w-3 h-3 mr-1" /> {post.likesCount}
                                         </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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
   
        <div className="flex w-full h-screen overflow-hidden font-sans bg-[#E0E8D7]">
 
            <div className="w-full lg:w-1/2 h-full flex items-center justify-center p-6 relative z-20">
                
                <div className="w-full max-w-md bg-[#E0E8D7]"> {/* 
                    {/* Logo */}
                    <div className="flex items-center space-x-3 mb-8">
                        
                        <h1 className="text-xl font-extrabold text-[#383a42] tracking-tighter hover:text-[#5fa51e]">glowsphere.</h1>
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
                        {/* --- YENİ: KULLANICI ADI INPUTU (Sadece Kayıt Olurken Görünür) --- */}
                        {isRegister && (
                            <div className="space-y-1.5 animate-fade-in">
                                <label className="text-sm font-bold text-[#383a42] ml-1 mb-2">Kullanıcı Adı</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="kullaniciadi"
                                    className="w-full bg-[#F5F5EC] border-2 border-transparent focus:border-[#A7C080] text-[#383a42] rounded-xl p-3.5 outline-none transition-all shadow-sm placeholder-gray-400 font-medium"
                                    required
                                />
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-[#383a42] ml-1 mb-2">E-posta</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="ismin@ornek.com"
                                className="w-full bg-[#F5F5EC] border-2 border-transparent focus:border-[#A7C080] text-[#383a42] rounded-xl p-3.5 mt-2 outline-none transition-all shadow-sm placeholder-gray-400 font-medium"
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
                                className="w-full bg-[#F5F5EC] border-2 border-transparent focus:border-[#A7C080] text-[#383a42] rounded-xl p-3.5 mt-2 outline-none transition-all shadow-sm placeholder-gray-400 font-medium"
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
                            className="w-full py-3.5 px-4 rounded-xl shadow-lg text-base font-bold text-white bg-[#383a42] hover:text-lime-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 mt-2"
                        >
                            {loading ? <Loader2 className="w-7 h-7 animate-spin mx-auto" /> : (isRegister ? 'Kayıt Ol' : 'Giriş Yap')}
                        </button>
                    </form>

                    {/* Alt Link */}
                    <p className="text-center mt-6 text-gray-600 text-sm font-medium">
                        {isRegister ? 'Zaten hesabınız var mı?' : "Hesabınız yok mu?"}
                        <button onClick={toggleAuthMode} className="ml-4 font-bold text-white hover:text-[#A7C080] underline decoration-2 decoration-transparent hover:decoration-[#A7C080] transition-all">
                            {isRegister ? 'Giriş Yap' : 'Kayıt Ol'}
                        </button>
                    </p>
                </div>
            </div>

            {/* 2. SAĞ TARAF (GÖRSEL GRID ALANI) */}
            {/* Container */}
            <div className="hidden lg:flex w-1/2 h-full bg-[#1a1b1e] relative overflow-hidden items-center justify-center">
                
                {/* Glow Efekti */}
                <div className="absolute w-[500px] h-[500px] bg-[#A7C080] rounded-full blur-[150px] opacity-60 pointer-events-none z-0"></div>

                <div className="w-[140%] h-[140%] grid grid-cols-2 gap-4 transform rotate-6 origin-center animate-fade-in p-4">
                    
                    <div className="flex flex-col gap-4 -mt-20">
                        <div className="flex-1 bg-gray-800 rounded-3xl overflow-hidden relative group">
                             <img src="/images/5.jpeg" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition duration-700" alt="Aesthetic" />
                        </div>
                        <div className="flex-[1.5] bg-gray-800 rounded-3xl overflow-hidden relative group">
                             <img src="/images/3.jpeg" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition duration-700" alt="Aesthetic" />
                        </div>
                        <div className="flex-1 bg-gray-800 rounded-3xl overflow-hidden relative group">
                             <img src="/images/4.jpeg" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition duration-700" alt="Aesthetic" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 mt-20">
                         <div className="flex-[1.2] bg-gray-800 rounded-3xl overflow-hidden relative group">
                             <img src="/images/1.jpeg" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition duration-700" alt="Aesthetic" />
                        </div>
                        <div className="flex-1 bg-gray-800 rounded-3xl overflow-hidden relative group">
                             <img src="/images/2.jpeg" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition duration-700" alt="Aesthetic" />
                        </div>
                         <div className="flex-1 bg-gray-800 rounded-3xl overflow-hidden relative group">
                             <img src="/images/6.jpeg" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition duration-700" alt="Aesthetic" />
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


const AppContent = () => {
    const { user, fetchUser, initialLoading } = useAuth();
    const [view, setView] = useState(() => {
        return localStorage.getItem('currentView') || 'home';
    });
    const [isRegister, setIsRegister] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(() => {
        return localStorage.getItem('selectedUserId');
    });

    const toggleAuthMode = () => setIsRegister(prev => !prev);

    useEffect(() => {
        localStorage.setItem('currentView', view);
    }, [view]);

    useEffect(() => {
        if (selectedUserId) {
            localStorage.setItem('selectedUserId', selectedUserId);
        } else {
            localStorage.removeItem('selectedUserId');
        }
    }, [selectedUserId]);
    
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
            <div className="grow w-full">
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