/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Send, Bookmark } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Post } from '../types';
import { formatTimeAgo } from '../utils/dateUtils';

interface PostCardProps {
    post: Post;
    currentUserId: string;
    onFollowToggle: (id: string, isFollowing: boolean, setFollowing: React.Dispatch<React.SetStateAction<boolean>>) => void;
    onViewProfile: (id: string) => void;
    onPostUpdate: () => void;
    initialIsFollowing?: boolean;
    onCommentClick?: () => void;
}

const PostCard = ({ 
    post, 
    currentUserId, 
    onFollowToggle, 
    onViewProfile, 
    onPostUpdate, 
    initialIsFollowing, 
    onCommentClick 
}: PostCardProps) => {
    const { apiRequest } = useAuth();
    
    const [likesCount, setLikesCount] = useState(post.likesCount || 0);
    const [isLiked, setIsLiked] = useState(false); 
    const [isAnimating, setIsAnimating] = useState(false);
    const [isUserFollowing, setIsUserFollowing] = useState(initialIsFollowing || false); 
    const [isSaved, setIsSaved] = useState(false);
    
    const isOwner = post.user?._id === currentUserId;

    useEffect(() => {
        let isMounted = true;
        const checkStatus = async () => {
            try {
                const [likeData, saveData] = await Promise.all([
                    apiRequest(`posts/is-liked/${post._id}`),
                    apiRequest(`posts/is-saved/${post._id}`)
                ]);

                if (isMounted) {
                    setIsLiked(likeData.isLiked);
                    setIsSaved(saveData.isSaved);
                }
            } catch (error) {
                console.error("Durum kontrol hatası", error);
            }
        };
        checkStatus();
        return () => { isMounted = false; };
    }, [post._id, apiRequest]);

    const handleLikeToggle = async (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 1000);
        
        const previousLiked = isLiked;
        const previousCount = likesCount;
        
        setIsLiked(!previousLiked);
        setLikesCount(prev => previousLiked ? Math.max(0, prev - 1) : prev + 1);

        try {
            const result = await apiRequest(`posts/like/${post._id}`, 'PUT'); 
            if (result.action === 'like') {
                setIsLiked(true);
                setLikesCount(result.likesCount);
            } else {
                setIsLiked(false);
                setLikesCount(result.likesCount);
            }
        } catch (error) {
            setIsLiked(previousLiked);
            setLikesCount(previousCount);
        }
    };

    const handleSaveToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const previousSaved = isSaved;
        setIsSaved(!previousSaved);

        try {
            const result = await apiRequest(`interact/save/${post._id}`, 'PUT');
            if (result.action === 'save') setIsSaved(true);
            else setIsSaved(false);
        } catch (error) { setIsSaved(previousSaved); }
    };

    return (
        <div 
            onClick={onCommentClick} 
            className={`bg-white p-4 sm:p-6 rounded-4xl shadow-sm mb-8 border border-[#383a42]/5 transition-all duration-300 hover:shadow-md animate-fade-in cursor-pointer group/card`}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center cursor-pointer group" onClick={(e) => { 
                    e.stopPropagation();
                    if (post.user?._id) onViewProfile(post.user._id); 
                }}>
                    <div className={`w-12 h-12 rounded-full bg-[#383a42] flex items-center justify-center text-white font-bold text-lg mr-3 shadow-md group-hover:scale-105 transition overflow-hidden`}>
                        {post.user?.profileImage ? (
                            <img src={post.user.profileImage} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            post.user?.email?.[0]?.toUpperCase() || 'U'
                        )}
                    </div>
                    <div>
                        <p className={`font-bold text-lg text-[#383a42] group-hover:text-[#A7C080] transition`}>
                            @{post.user?.username || post.user?.email?.split('@')?.[0] || 'Kullanıcı'}
                        </p>
                        <p className="text-s text-gray-500 font-medium">
                             {formatTimeAgo(post.createdAt)}
                        </p>
                    </div>
                </div>
                
                {!isOwner && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onFollowToggle(post.user._id, isUserFollowing, setIsUserFollowing);
                        }}
                        className={`text-xs font-bold transition uppercase tracking-wider py-1 px-3 rounded-lg
                            ${isUserFollowing 
                                ? 'text-[#A7C080]hover:text-[#A7C080]' 
                                : 'text-white hover:text-[#A7C080] '
                            }`}
                    >
                        {isUserFollowing ? 'Takip Ediliyor' : 'Takip Et'}
                    </button>
                )}
            </div>

            <p className="text-[#383a42] mb-3 leading-relaxed">{post.caption}</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
                {(post.tags || []).map((tag, index) => (
                    <span key={index} className="text-xs font-bold text-[#A7C080] bg-[#F5F5EC] px-2 py-1 rounded-lg">#{tag}</span>
                ))}
            </div>

            <div className="aspect-square w-full bg-gray-100 rounded-2xl overflow-hidden shadow-inner mb-4 relative" onDoubleClick={handleLikeToggle}>
                <img src={post.imageUrl} alt="Post" className="w-full h-full object-cover" />
                <Heart className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 text-white fill-white drop-shadow-lg transition-all duration-500 ${isAnimating ? 'opacity-100 scale-125' : 'opacity-0 scale-50'}`} />
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                    <button onClick={handleLikeToggle} className="flex items-center space-x-2 group">
                        <Heart className={`w-7 h-7 transition-all duration-300 ${isLiked ? 'text-red-500 fill-red-500 scale-110' : 'text-gray-400 group-hover:text-red-500'}`} />
                        <span className="font-bold text-gray-400">{likesCount}</span>
                    </button>

                    <button onClick={onCommentClick} className="flex items-center space-x-2 group">
                        <MessageCircle className="w-7 h-7 text-gray-400 group-hover:text-[#A7C080] transition" />
                        <span className="font-bold text-gray-400">{post.commentsCount}</span>
                    </button>

                    {/* <button className="flex items-center space-x-2 group">
                        <Send className="w-6 h-6 text-[#383a42] group-hover:text-[#A7C080] transition transform -rotate-45 mb-1" />
                    </button> */}
                </div>
                
                <button onClick={handleSaveToggle}>
                    <Bookmark 
                        className={`w-6 h-6 transition-all duration-300 
                            ${isSaved ? 'text-[#A7C080] fill-[#A7C080]' : 'text-gray-400 hover:text-[#A7C080]'}
                        `} 
                    />
                </button>
            </div>
        </div>
    );
};

export default PostCard;