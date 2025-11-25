/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Post } from '../types';
import { COLORS } from '../utils/constants';
import PostCard from '../components/PostCard';
import TopCreators from '../components/TopCreators';
import PostDetailModal from '../components/PostDetailModal';

const HomeFeed = ({ setView, setSelectedUserId }: { setView: React.Dispatch<React.SetStateAction<string>>, setSelectedUserId: React.Dispatch<React.SetStateAction<string | null>> }) => {
    const { user, apiRequest, displayAlert } = useAuth(); 
    const [feed, setFeed] = useState<Post[]>([]);
    const [isFeedLoading, setIsFeedLoading] = useState(true); 
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);

    const fetchFeed = useCallback(async () => {
        if (!user) return;
        try {
            const data = await apiRequest('feed/home');
            setFeed(data);
        } catch (error) {
            console.error("Feed yüklenemedi:", error);
        } finally {
            setIsFeedLoading(false);
        }
    }, [apiRequest, user]);

    useEffect(() => { setIsFeedLoading(true); fetchFeed(); }, [fetchFeed]);

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
        } catch (error) { displayAlert("Hata", 'error'); }
    };
    
    const handleCommentChange = (postId: string, delta: number) => {
        setFeed(prev => prev.map(p => p._id === postId ? { ...p, commentsCount: Math.max(0, p.commentsCount + delta) } : p));
    };

    const mockCreators = [
        { id: 'mock1', name: 'Hello World', handle: 'helloworld', initials: 'HW' },
        { id: 'mock2', name: 'Zisan Sarac', handle: 'zisan.sarac', initials: 'ZS' },
        { id: 'mock3', name: 'Reyyan', handle: 'reyyan', initials: 'R' },
    ];

    // DÜZELTME: lg:pl-80 burada senin orijinal kodundaki gibi duruyor.
    return (
        <div className="w-full min-h-screen lg:pl-80 p-6 sm:p-10 transition-all duration-300">
            
            {selectedPost && user && (
                <PostDetailModal 
                    post={selectedPost} 
                    currentUser={user} 
                    onClose={() => setSelectedPost(null)} 
                    onCommentChange={handleCommentChange}
                    onPostDeleted={(id) => { setFeed(prev => prev.filter(p => p._id !== id)); setSelectedPost(null); }}
                    onPostUpdated={fetchFeed}
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
                            // DÜZELTME: rounded-4xl yapıldı
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
                                onPostUpdate={fetchFeed}
                                initialIsFollowing={true}
                                onCommentClick={() => setSelectedPost(post)} 
                            />
                        ))}                    
                    </div>

                    <div className="hidden xl:block w-96 shrink-0 sticky top-10">
                        <TopCreators creators={mockCreators} setView={setView} setSelectedUserId={setSelectedUserId} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeFeed;