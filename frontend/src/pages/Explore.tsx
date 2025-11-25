import React, { useState, useEffect } from 'react';
import { Loader2, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Post } from '../types';
import { COLORS } from '../utils/constants';

const Explore = ({ setView, setSelectedUserId }: { setView: React.Dispatch<React.SetStateAction<string>>, setSelectedUserId: React.Dispatch<React.SetStateAction<string | null>> }) => {
    const { user, apiRequest, loading } = useAuth();
    const [allPosts, setAllPosts] = useState<Post[]>([]);
    
    useEffect(() => {
        let isMounted = true;
        const fetchAllPosts = async () => {
            try {
                const data = await apiRequest('posts/all');
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
                <h2 className={`text-5xl font-extrabold text-[${COLORS.SECONDARY}] mb-8`}>Keşfet</h2>
                
                {loading ? (
                    <div className="flex justify-center"><Loader2 className={`animate-spin w-10 h-10 text-[${COLORS.PRIMARY}]`} /></div>
                ) : (
                    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                        {allPosts.map(post => (
                            <div key={post._id} className="break-inside-avoid bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition duration-300 cursor-pointer group" onClick={() => handleViewProfile(post.user._id)}>
                                <div className="relative">
                                    <img src={post.imageUrl} alt="Explore" className="w-full h-auto object-cover" />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition duration-300"></div>
                                </div>
                                <div className="p-4">
                                    <p className={`font-bold text-[${COLORS.SECONDARY}] text-sm truncate`}>{post.caption}</p>
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

export default Explore;