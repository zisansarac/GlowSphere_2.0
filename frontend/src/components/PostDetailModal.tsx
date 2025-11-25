/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { X, Edit2, Trash2, Loader2, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Post, User } from '../types';
import { COLORS } from '../utils/constants';

interface PostDetailModalProps {
    post: Post;
    currentUser: User;
    onClose: () => void;
    onCommentChange?: (postId: string, delta: number) => void;
    onPostDeleted?: (postId: string) => void;
    onPostUpdated?: () => void;
}

const PostDetailModal = ({ 
    post, 
    currentUser, 
    onClose, 
    onCommentChange, 
    onPostDeleted, 
    onPostUpdated 
}: PostDetailModalProps) => {
    const { apiRequest, displayAlert } = useAuth();
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [editCaption, setEditCaption] = useState(post.caption);
    const [currentPost, setCurrentPost] = useState(post);
    
    const isPostOwner = currentPost.user?._id === currentUser._id;

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const data = await apiRequest(`posts/${post._id}/comments`);
                setComments(data);
            } catch (error) { console.error(error); } 
            finally { setLoadingComments(false); }
        };
        fetchComments();
    }, [post._id, apiRequest]);

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setSubmitting(true);
        try {
            const addedComment = await apiRequest(`posts/${post._id}/comment`, 'POST', { text: newComment });
            setComments(prev => [addedComment, ...prev]);
            setNewComment('');
            
            if (onPostUpdated) onPostUpdated(); 

        } catch (error) { displayAlert("Hata", 'error'); } 
        finally { setSubmitting(false); }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!window.confirm("Yorumu silmek istiyor musunuz?")) return;
        try {
            await apiRequest(`posts/comment/${commentId}`, 'DELETE');
            setComments(prev => prev.filter(c => c._id !== commentId));
            displayAlert("Yorum silindi.", 'success');
            
            if (onPostUpdated) onPostUpdated();

        } catch (error) { displayAlert("Silinemedi.", 'error'); }
    };

    const handleDeletePost = async () => {
        if (!window.confirm("Silmek istediğinize emin misiniz?")) return;
        try {
            await apiRequest(`posts/${currentPost._id}`, 'DELETE');
            if (onPostDeleted) onPostDeleted(currentPost._id);
            onClose();
        } catch (error) { displayAlert("Hata", 'error'); }
    };

    const handleUpdatePost = async () => {
        try {
            await apiRequest(`posts/${currentPost._id}`, 'PUT', { caption: editCaption });
            setCurrentPost(prev => ({ ...prev, caption: editCaption }));
            setIsEditing(false);
            if (onPostUpdated) onPostUpdated();
        } catch (error) { displayAlert("Hata", 'error'); }
    };

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            
            {/* Kapatma Butonu - FIXED konumda */}
            <button 
                onClick={onClose} 
                className="fixed top-6 right-6 z-70 bg-black/50 p-2 rounded-full text-white hover:bg-white hover:text-black transition duration-300 shadow-lg"
            >
                <X className="w-8 h-8" />
            </button>

            <div className="bg-white w-full max-w-6xl h-[85vh] rounded-4xl overflow-hidden flex flex-col md:flex-row shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                <div className="w-full md:w-[60%] h-1/2 md:h-full bg-black flex items-center justify-center">
                    <img src={currentPost.imageUrl} alt="Detay" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="w-full md:w-[40%] h-1/2 md:h-full bg-white flex flex-col">
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-[#383a42] flex items-center justify-center text-white font-bold overflow-hidden">
                                {currentPost.user?.profileImage ? (
                                    <img src={currentPost.user.profileImage} className="w-full h-full object-cover" alt="avatar" />
                                ) : (
                                    currentPost.user?.email?.[0]?.toUpperCase()
                                )}
                            </div>
                            <div>
                                <p className="font-bold text-[#383a42] text-sm">@{currentPost.user?.username || 'User'}</p>
                                <p className="text-xs text-gray-400">Post Detayı</p>
                            </div>
                        </div>
                        {isPostOwner && !isEditing && (
                            <div className="flex space-x-1">
                                <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-gray-100 rounded-full text-blue-600"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={handleDeletePost} className="p-2 hover:bg-red-50 rounded-full text-red-600"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        )}
                        {isEditing && <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><X className="w-4 h-4" /></button>}
                    </div>
                    <div className="grow p-5 overflow-y-auto space-y-4 bg-gray-50">
                        {isEditing ? (
                            <div className="space-y-2">
                                <textarea value={editCaption} onChange={(e) => setEditCaption(e.target.value)} className={`w-full p-2 border rounded-lg outline-none focus:border-[${COLORS.PRIMARY}] text-sm`} rows={3} />
                                <button onClick={handleUpdatePost} className="text-xs bg-[#383a42] text-white px-3 py-1 rounded-lg w-full">Kaydet</button>
                            </div>
                        ) : (
                            <p className="text-[#383a42] text-sm leading-relaxed">{currentPost.caption}</p>
                        )}
                        
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-4">Yorumlar</h4>
                        
                        {loadingComments ? (
                            <div className="flex justify-center"><Loader2 className={`animate-spin text-[${COLORS.PRIMARY}] w-6 h-6`} /></div>
                        ) : comments.length === 0 ? (
                            <p className="text-center text-gray-400 text-xs italic">İlk yorumu sen yap.</p>
                        ) : (
                            comments.map((comment: any) => (
                                <div key={comment._id} className="flex space-x-3 group w-full">
                                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold text-xs shrink-0 overflow-hidden">
                                        {comment.user?.profileImage ? (
                                            <img src={comment.user.profileImage} alt="U" className="w-full h-full object-cover" />
                                        ) : (
                                            comment.user?.username?.[0]?.toUpperCase() || 'U'
                                        )}
                                    </div>
                                    <div className="grow min-w-0">
                                        <div className="bg-white p-3 rounded-r-xl rounded-bl-xl shadow-sm border border-gray-100">
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="wrap-break-word w-full">
                                                    <span className="text-xs font-bold text-[#383a42] mr-2 block sm:inline">{comment.user?.username || 'Anonim'}</span>
                                                    <span className="text-sm text-gray-700">{comment.text}</span>
                                                </div>
                                                {(comment.user?._id === currentUser._id || isPostOwner) && (
                                                    <button onClick={() => handleDeleteComment(comment._id)} className="text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100 p-0.5 shrink-0" title="Yorumu Sil"><Trash2 className="w-4 h-4" /></button>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1 ml-1">{new Date(comment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="p-4 border-t border-gray-200 bg-white shrink-0">
                        <form onSubmit={handleSubmitComment} className="flex items-center gap-2">
                            <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Yorum ekle..." className={`grow bg-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[${COLORS.PRIMARY}]/50 transition text-sm`} />
                            <button type="submit" disabled={submitting || !newComment.trim()} className={`text-[${COLORS.PRIMARY}] font-bold text-sm hover:text-[#383a42] disabled:opacity-50 px-2 transition`}><Send className="w-5 h-5 transform -rotate-45" /></button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostDetailModal;