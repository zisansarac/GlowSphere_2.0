/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Post } from '../types';
import PostCard from '../components/PostCard';
import TopCreators from '../components/TopCreators';
import PostDetailModal from '../components/PostDetailModal';


const HomeFeed = ({ setView, setSelectedUserId }: { setView: React.Dispatch<React.SetStateAction<string>>, setSelectedUserId: React.Dispatch<React.SetStateAction<string | null>> }) => {
    const { user, apiRequest, displayAlert } = useAuth(); 
    const [feed, setFeed] = useState<Post[]>([]);
    const [isFeedLoading, setIsFeedLoading] = useState(true); 
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);

    // 1. TEK BİR VERİ ÇEKME FONKSİYONU (Sadece Feed'i güncellemek için)
    // Bunu PostCard'lara 'onPostUpdate' olarak geçeceğiz.
    const refreshFeedOnly = useCallback(async () => {
        if (!user) return;
        try {
            const data = await apiRequest('feed/home');
            setFeed(data);
        } catch (error) {
            console.error("Feed güncellenemedi:", error);
        }
    }, [apiRequest, user]);

    // 2. ANA VERİ YÜKLEME (Sayfa ilk açıldığında çalışır)
    useEffect(() => {
        let isMounted = true; // Component unmount olursa state güncellemesini engellemek için

        const initData = async () => {
            if (!user) return;
            
            setIsFeedLoading(true);
            try {
                // Promise.all ile paralel istek atıyoruz
                const [feedData, suggestionsData] = await Promise.all([
                    apiRequest('feed/home'),
                    apiRequest('users/suggestions/random') 
                ]);
                
                if (isMounted) {
                    setFeed(feedData);
                    
                    const formattedSuggestions = suggestionsData.map((u: any) => ({
                        id: u._id,
                        name: u.username || u.email.split('@')[0],
                        handle: u.email, 
                        initials: u.email[0].toUpperCase(), 
                        profileImage: u.profileImage 
                    }));
                    setSuggestedUsers(formattedSuggestions);
                }

            } catch (error) {
                console.error("Veri yüklenemedi:", error);
                if (isMounted) displayAlert("Akış yüklenirken hata oluştu.", "error");
            } finally {
                if (isMounted) setIsFeedLoading(false);
            }
        };

        initData();

        return () => { isMounted = false; };
        
        // ÖNEMLİ: Bağımlılık dizisine [apiRequest, user] koyuyoruz ama
        // eğer 'apiRequest' context içinde useCallback ile sarılmamışsa yine döngü yapabilir.
        // Eğer döngü devam ederse burayı sadece [user] yapabilirsin.
    }, [apiRequest, user, displayAlert]); 


    const handleFollowToggle = async (targetUserId: string, _isUserFollowing: boolean, setIsUserFollowing: React.Dispatch<React.SetStateAction<boolean>>) => {
        try {
            const result = await apiRequest(`interact/follow/${targetUserId}`, 'POST');
            if (result.action === 'follow') {
                setIsUserFollowing(true);
                displayAlert(result.msg, 'success');
            } else {
                setIsUserFollowing(false);
                displayAlert(result.msg, 'info');
            }
        } catch (error) { displayAlert("Hata", 'error'); }
    };
    
    const handleCommentChange = (postId: string, delta: number) => {
        setFeed(prev => prev.map(p => p._id === postId ? { ...p, commentsCount: Math.max(0, p.commentsCount + delta) } : p));
    };

    return (
        <div className="w-full min-h-screen lg:pl-80 p-6 sm:p-10 transition-all duration-300">
            
            {selectedPost && user && (
                <PostDetailModal 
                    post={selectedPost} 
                    currentUser={user} 
                    onClose={() => setSelectedPost(null)} 
                    onCommentChange={handleCommentChange}
                    onPostDeleted={(id) => { setFeed(prev => prev.filter(p => p._id !== id)); setSelectedPost(null); }}
                    onPostUpdated={refreshFeedOnly}
                />
            )}

            <div className="max-w-[1600px] mx-auto">
                <div className="mb-10 animate-fade-in pt-4 lg:pt-0">
                    <h1 className="text-3xl font-extrabold text-[#383a42] mb-2 tracking-tight">Ana Akış</h1>
                    <p className="text-gray-500 font-medium text-lg">GlowSphere'deki en yeni paylaşımları keşfet.</p>
                </div>
                
                <div className="flex flex-col xl:flex-row gap-10 items-start">
                    <div className="w-full xl:flex-1">
                        {isFeedLoading && <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#A7C080] w-12 h-12" /></div>}
                        
                        {!isFeedLoading && feed.length === 0 && (
                          
                            <div className="p-12 bg-white rounded-4xl text-center shadow-lg border-2 border-[#383a42]/5 animate-fade-in">
                                <p className="text-2xl font-bold mb-3 text-[#383a42]">Akışınızda Henüz Post Yok</p>
                                <p className="text-gray-500">Takip ettiğin kişilerin paylaşımları burada görünür.</p>
                            </div>
                        )}

                        {feed.map(post => (
                            <PostCard
                                key={post._id}
                                post={post}
                                currentUserId={user!._id}
                                onFollowToggle={handleFollowToggle}
                                onViewProfile={(id) => { setSelectedUserId(id); setView('publicProfile'); }}
                                onPostUpdate={refreshFeedOnly}
                                initialIsFollowing={true}
                                onCommentClick={() => setSelectedPost(post)} 
                            />
                        ))}                    
                    </div>

                   <div className="hidden xl:block w-96 shrink-0 sticky top-10">
                    <TopCreators 
                        creators={suggestedUsers} 
                        setView={setView} 
                        setSelectedUserId={setSelectedUserId} 
                    />
                </div>
                </div>
            </div>
        </div>
    );
};

export default HomeFeed;