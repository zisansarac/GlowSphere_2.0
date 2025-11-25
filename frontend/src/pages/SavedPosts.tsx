import React, { useState, useEffect } from 'react';
import { Loader2, Bookmark } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Post } from '../types';
import { COLORS } from '../utils/constants';

const SavedPosts = ({ setView, setSelectedUserId }: { setView: React.Dispatch<React.SetStateAction<string>>, setSelectedUserId: React.Dispatch<React.SetStateAction<string | null>> }) => {
    const { apiRequest } = useAuth();
    const [savedPosts, setSavedPosts] = useState<Post[]>([]);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        const fetchSaved = async () => {
            try {
                const data = await apiRequest('posts/saved/all');
                setSavedPosts(data);
            } catch (error) {
                console.error("Kaydedilenler alınamadı", error);
            } finally {
                setFetching(false);
            }
        };
        fetchSaved();
    }, [apiRequest]);

    const handleViewProfile = (userId: string) => {
        setSelectedUserId(userId);
        setView('publicProfile');
    };

    return (
        <div className="w-full min-h-screen p-6 sm:p-10 lg:pl-80 transition-all duration-300">
            <div className="max-w-[1600px] mx-auto animate-fade-in">
                <h2 className={`text-5xl font-extrabold text-[${COLORS.SECONDARY}] mb-8 flex items-center`}>
                    <Bookmark className={`w-11 h-11 mr-3 mt-1 text-[${COLORS.PRIMARY}] fill-[${COLORS.PRIMARY}]`} /> 
                    Kaydedilenler
                </h2>
                
                {fetching ? (
                    <div className="flex justify-center py-20"><Loader2 className={`animate-spin w-10 h-10 text-[${COLORS.PRIMARY}]`} /></div>
                ) : savedPosts.length === 0 ? (
                    <div className="text-center py-20 opacity-50">
                        <Bookmark className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-400 text-lg">Henüz kaydedilmiş bir gönderi yok.</p>
                    </div>
                ) : (
                    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                        {savedPosts.map(post => (
                            <div key={post._id} className="break-inside-avoid bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition duration-300 cursor-pointer group">
                                <div className="relative">
                                    <img src={post.imageUrl} alt="Saved" className="w-full h-auto object-cover" />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition duration-300"></div>
                                </div>
                                <div className="p-4">
                                    <p className={`font-bold text-[${COLORS.SECONDARY}] text-sm truncate`}>{post.caption}</p>
                                    <div className="flex items-center justify-between mt-2">
                                         <p 
                                            onClick={(e) => { e.stopPropagation(); handleViewProfile(post.user._id); }}
                                            className={`text-xs text-gray-500 hover:text-[${COLORS.PRIMARY}] transition`}
                                         >
                                            @{post.user?.username || 'User'}
                                         </p>
                                         <Bookmark className={`w-4 h-4 text-[${COLORS.PRIMARY}] fill-[${COLORS.PRIMARY}]`} />
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

export default SavedPosts;