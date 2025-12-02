/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Heart, Settings, Edit2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Post } from '../types';
import { COLORS, API_BASE_URL, SERVER_URL } from '../utils/constants';
import PostDetailModal from '../components/PostDetailModal';

const MyProfile = () => {
    const { user, apiRequest, displayAlert, fetchUser, imageVersion, triggerImageRefresh } = useAuth(); 
    
    const [profileData, setProfileData] = useState<any>(null);
    const [myPosts, setMyPosts] = useState<Post[]>([]); 
    const [isLoading, setIsLoading] = useState(true);
    

    const [bio, setBio] = useState('');
    const [username, setUsername] = useState('');
    
    const [uploadingImg, setUploadingImg] = useState(false);
    const [isSaving, setIsSaving] = useState(false); 
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);


    const displayUser = profileData || user;
   
    const finalImageSrc = useMemo(() => {
        if (!displayUser?.profileImage) return null;

        const cleanUrl = displayUser.profileImage.split('?')[0];
        return `${cleanUrl}?v=${imageVersion}`; 
    }, [displayUser?.profileImage, imageVersion]);

    useEffect(() => {
        let isMounted = true;

        const loadMyData = async () => {
            if (!user?._id) return;
            if(!profileData) setIsLoading(true);

            try {
                const [userData, postsData] = await Promise.all([
                    apiRequest(`users/${user._id}`), 
                    apiRequest(`posts/user/${user._id}`)
                ]);
                
                if (isMounted) {
                    setProfileData(userData.user);
                    setMyPosts(postsData);
                    setBio(userData.user.bio || '');
                    setUsername(userData.user.username || userData.user.email?.split('@')[0] || '');
                }
            } catch (error) { 
                console.error("Profil yükleme hatası:", error); 
            } finally { 
                if (isMounted) setIsLoading(false); 
            }
        };

        loadMyData();
        return () => { isMounted = false; };
    }, [user?._id]); 


   if (!user) return <div className="flex justify-center mt-20"><Loader2 className="animate-spin" /></div>;


    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImg(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const uploadRes = await fetch(`${API_BASE_URL}/upload`, {
                method: 'POST',
                body: formData
            });
            
            if (!uploadRes.ok) throw new Error('Resim yüklenemedi');
            
            const imagePath = await uploadRes.text();
            const fullImageUrl = imagePath.startsWith('http') ? imagePath : `${SERVER_URL}${imagePath}`;

            await apiRequest('interact/profile', 'PUT', { profileImage: fullImageUrl });
            
            displayAlert('Profil fotoğrafı güncellendi!', 'success');

            setProfileData((prev: any) => ({ ...prev, profileImage: fullImageUrl }));

            triggerImageRefresh();

            fetchUser(); 

        } catch (error) {
            displayAlert('Fotoğraf yüklenirken hata oluştu.', 'error');
        } finally {
            setUploadingImg(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true); 
        try {
            await apiRequest('interact/profile', 'PUT', { bio, username });
            displayAlert('Profil bilgileri güncellendi!', 'success');
            setProfileData((prev: any) => ({ ...prev, bio, username }));
            fetchUser(); 
        } catch (error) { 
            console.error(error); 
            displayAlert('Güncelleme başarısız.', 'error');
        } finally {
            setIsSaving(false); 
        }
    };


    return (
        <div className="w-full min-h-screen p-6 sm:p-10 lg:pl-80 transition-all duration-300">
            
            {selectedPost && (
                <PostDetailModal 
                    post={selectedPost}
                    currentUser={user}
                    onClose={() => setSelectedPost(null)}
                    onPostDeleted={(deletedId) => {
                        setMyPosts(prev => prev.filter(p => p._id !== deletedId));
                        setSelectedPost(null);
                    }}
                    onPostUpdated={() => {}}
                />
            )}

            <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
                <div className={`bg-white rounded-4xl p-8 shadow-lg border border-[${COLORS.SECONDARY}]/5 flex flex-col md:flex-row items-center md:items-start gap-8`}>
                    
                    <div className="relative group cursor-pointer">
                        <input 
                            type="file" 
                            id="profilePicInput" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleImageUpload} 
                            disabled={uploadingImg} 
                        />
                        <label htmlFor="profilePicInput" className="cursor-pointer block relative">
                            <div className={`w-32 h-32 rounded-full bg-[${COLORS.SECONDARY}] flex items-center justify-center text-white font-extrabold text-5xl shadow-2xl overflow-hidden border-4 border-white ring-2 ring-[${COLORS.PRIMARY}]/50`}>
                                {finalImageSrc ? (
                                    <img
                                    key={finalImageSrc}
                                    src={finalImageSrc} 
                                    alt="Profil" className="w-full h-full object-cover" />
                                ) : (
                                    displayUser.email[0].toUpperCase()
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                                {uploadingImg ? (
                                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                                ) : (
                                    <Edit2 className="w-8 h-8 text-white" />
                                )}
                            </div>
                        </label>
                    </div>

                    <div className="grow text-center md:text-left pt-2">
                        <h2 className={`text-3xl font-extrabold text-[${COLORS.SECONDARY}]`}>@{username}</h2>
                        <p className="text-gray-500 font-medium mb-4">{user.email}</p>
                        
                        <div className="flex justify-center md:justify-start gap-6 mb-6">
                      <div className="text-center">
                        <span className={`block font-bold text-xl text-[${COLORS.SECONDARY}]`}>{myPosts.length}</span>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Post</span>
                     </div>
                    <div className="text-center">
                       <span className={`block font-bold text-xl text-[${COLORS.SECONDARY}]`}>{displayUser.followersCount || 0}</span>
                       <span className="text-xs text-gray-500 uppercase tracking-wide">Takipçi</span>
                    </div>

                <div className="text-center">
                     <span className={`block font-bold text-xl text-[${COLORS.SECONDARY}]`}>{displayUser.followingCount || 0}</span>
                     <span className="text-xs text-gray-500 uppercase tracking-wide">Takip</span>
                </div>
              </div>
              
              <p className={`text-[${COLORS.SECONDARY}]/80 italic max-w-lg`}>{bio || "Henüz bir biyografi eklenmedi."}</p>
                    </div>
                </div>

                <div className={`bg-[${COLORS.BG_LIGHT}] p-6 rounded-3xl border-2 border-[${COLORS.PRIMARY}]/20`}>
                    <h3 className={`font-bold text-[${COLORS.SECONDARY}] mb-6 flex items-center text-lg`}>
                        <Settings className="w-5 h-5 mr-2" /> Profili Düzenle
                    </h3>
                    <form onSubmit={handleUpdate} className="flex flex-col gap-6">
                        <div>
                            <label className={`block text-sm font-bold text-[${COLORS.SECONDARY}] mb-2 ml-1`}>Kullanıcı Adı</label>
                            <input 
                                type="text" 
                                value={username} 
                                onChange={(e) => setUsername(e.target.value)} 
                                className={`w-full bg-white text-[${COLORS.SECONDARY}] border border-gray-200 rounded-xl p-4 outline-none focus:border-[${COLORS.PRIMARY}] transition shadow-sm font-medium`} 
                            />
                        </div>
                        <div>
                            <label className={`block text-sm font-bold text-[${COLORS.SECONDARY}] mb-2 ml-1`}>Biyografi</label>
                            <textarea 
                                rows={3} 
                                value={bio} 
                                onChange={(e) => setBio(e.target.value)} 
                                className={`w-full bg-white text-[${COLORS.SECONDARY}] border border-gray-200 rounded-xl p-4 outline-none focus:border-[${COLORS.PRIMARY}] transition shadow-sm font-medium resize-none`} 
                            />
                        </div>
                        <div className="flex justify-end">
                            <button 
                                type="submit" 
                                disabled={isSaving} 
                                className={`bg-[${COLORS.SECONDARY}] text-white font-bold py-3 px-8 rounded-xl hover:bg-[#4a4d57] transition disabled:opacity-50 shadow-lg`}
                            >
                                {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                            </button>
                        </div>
                    </form>
                </div>

                <div>
                    <h3 className={`text-2xl font-bold text-[${COLORS.SECONDARY}] mb-6 border-b pb-2 inline-block`}>Postlarım</h3>
                    
                    {isLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className={`animate-spin text-[${COLORS.PRIMARY}] w-10 h-10`} /></div>
                    ) : myPosts.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-3xl shadow-sm border border-dashed border-gray-300">
                            <p className="text-gray-500 font-medium mb-2">Henüz hiç post paylaşmadın.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {myPosts.map((post) => (
                                <div 
                                    key={post._id} 
                                    onClick={() => setSelectedPost(post)} 
                                    className="group relative aspect-square bg-gray-200 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
                                >
                                    <img src={post.imageUrl} alt={post.caption} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-4 text-white font-bold">
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

export default MyProfile;