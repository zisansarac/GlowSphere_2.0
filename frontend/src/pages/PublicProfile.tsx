/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Loader2, Heart} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Post } from '../types';
import { COLORS } from '../utils/constants';
import PostDetailModal from '../components/PostDetailModal';

const PublicProfile = ({ selectedUserId, setView }: { selectedUserId: string | null, setView: React.Dispatch<React.SetStateAction<string>> }) => {
    const { user, apiRequest, displayAlert } = useAuth();
    
    const [profileUser, setProfileUser] = useState<any>(null);
    const [userPosts, setUserPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

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
    }, [selectedUserId, apiRequest, setView, user, displayAlert]);


const handleFollow = async () => {
        if (!profileUser || followLoading) return;
        
        const prevFollowing = isFollowing;
        
        const prevFollowers = profileUser.followersCount || 0;

        setFollowLoading(true);
        
        try {
            if (isFollowing) {
              
                setIsFollowing(false);
                setProfileUser((prev: any) => ({ 
                    ...prev, 
     
                    followersCount: Math.max(0, (prev.followersCount || 0) - 1) 
                }));
            } else {
               
                setIsFollowing(true);
                setProfileUser((prev: any) => ({ 
                    ...prev, 
                    followersCount: (prev.followersCount || 0) + 1 
                }));
            }

            const result = await apiRequest(`interact/follow/${profileUser._id}`, 'POST');
            const nameToShow = profileUser.username || profileUser.email || 'Kullanıcı';
            displayAlert(`${nameToShow} ${result.action === 'follow' ? 'takip edildi!' : 'takipten çıkarıldı.'}`, 'success');

        } catch (error) {
            setIsFollowing(prevFollowing);
            setProfileUser((prev: any) => ({ ...prev, followersCount: prevFollowers }));
            displayAlert("İşlem başarısız.", 'error');
        } finally {
            setFollowLoading(false);
        }
    };

    if (loading) {
        return <div className={`w-full h-screen flex items-center justify-center bg-[${COLORS.BG_LIGHT}]`}><Loader2 className={`w-10 h-10 animate-spin text-[${COLORS.PRIMARY}]`} /></div>;
    }

    if (!profileUser) return null;

    const isOwnProfile = user && user._id === profileUser._id;

    return (
        <div className="w-full min-h-screen p-6 sm:p-10 lg:pl-80 transition-all duration-300 relative">
            
            {selectedPost && user && (
                <PostDetailModal 
                    post={selectedPost} 
                    currentUser={user} 
                    onClose={() => setSelectedPost(null)} 
                 
                />
            )}

            <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
                <button onClick={() => setView('home')} className={`flex items-center text-white hover:text-[${COLORS.PRIMARY}] transition font-bold`}>&larr; Ana Akışa Dön</button>

                <div className={`bg-white rounded-4xl p-8 shadow-lg border border-[${COLORS.SECONDARY}]/5 flex flex-col md:flex-row items-center md:items-start gap-8`}>
                    <div className={`w-32 h-32 rounded-full bg-[${COLORS.SECONDARY}] flex items-center justify-center text-white font-extrabold text-5xl shadow-xl shrink-0 overflow-hidden border-4 border-white ring-2 ring-[${COLORS.PRIMARY}]/50`}>
                        {profileUser.profileImage ? (
                            <img src={profileUser.profileImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            profileUser.email[0].toUpperCase()
                        )}
                    </div>

                    <div className="grow text-center md:text-left">
                        <h2 className={`text-3xl font-extrabold text-[${COLORS.SECONDARY}]`}>@{profileUser.username || profileUser.email.split('@')[0]}</h2>
                        <div className="flex justify-center md:justify-start gap-6 my-6">
                            <div className="text-center">
        <span className={`block font-bold text-xl text-[${COLORS.SECONDARY}]`}>
            {profileUser.followersCount || 0}
        </span>
        <span className="text-xs text-gray-500 uppercase tracking-wide">Takipçi</span>
    </div>
    <div className="text-center">
        <span className={`block font-bold text-xl text-[${COLORS.SECONDARY}]`}>
            {profileUser.followingCount || 0}
        </span>
        <span className="text-xs text-gray-500 uppercase tracking-wide">Takip</span>
    </div>
                        </div>
                        <p className={`text-[${COLORS.SECONDARY}]/80 italic max-w-lg mb-6`}>{profileUser.bio || "Bu kullanıcı henüz biyografi eklemedi."}</p>
                        
                        {!isOwnProfile && (
                            <button 
                                onClick={handleFollow}
                                disabled={followLoading}
                                className={`font-bold py-2 px-5 rounded-xl transition shadow-md transform hover:scale-105 flex items-center justify-center w-full md:w-auto ${isFollowing ? `text-[${COLORS.PRIMARY}] hover:bg-gray-300` : `bg-[${COLORS.SECONDARY}] text-white hover:bg-[${COLORS.PRIMARY}] hover:text-white`}`}
                            >
                                {followLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isFollowing ? 'Takip Ediliyor' : 'Takip Et')}
                            </button>
                        )}
                    </div>
                </div>

                <div>
                    <h3 className={`text-2xl font-bold text-[${COLORS.SECONDARY}] mb-6 border-b pb-2 inline-block`}>Paylaşımlar</h3>
                    {userPosts.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-3xl shadow-sm"><p className="text-gray-500">Bu kullanıcının henüz gönderisi yok.</p></div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {userPosts.map((post) => (
                                <div key={post._id} onClick={() => setSelectedPost(post)} className="group relative aspect-square bg-gray-200 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300">
                                    <img src={post.imageUrl} alt={post.caption} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-4 text-white font-bold"><span className="flex items-center"><Heart className="w-5 h-5 mr-1 fill-white" /> {post.likesCount}</span></div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PublicProfile;