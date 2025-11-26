/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Zap, PlusSquare, Loader2, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { COLORS, API_BASE_URL, SERVER_URL } from '../utils/constants';

const CreatePost = ({ setView }: { setView: React.Dispatch<React.SetStateAction<string>> }) => {
    const { apiRequest, displayAlert } = useAuth(); 
    
    const [caption, setCaption] = useState('');
    const [tagsInput, setTagsInput] = useState('');
    const [file, setFile] = useState<File | null>(null); 
    const [previewUrl, setPreviewUrl] = useState<string | null>(null); 
    const [uploading, setUploading] = useState(false); 

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
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
            const formData = new FormData();
            formData.append('image', file); 
            
            const uploadResponse = await fetch(`${API_BASE_URL}/upload`, {
                method: 'POST',
                body: formData, 
            });

            if (!uploadResponse.ok) {
                throw new Error('Resim yüklenemedi.');
            }

            const imagePath = await uploadResponse.text();
            const fullImageUrl = imagePath.startsWith('http') 
                ? imagePath 
                : `${SERVER_URL}${imagePath}`;

            const tagsArray = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
            
            await apiRequest('posts', 'POST', {
                caption,
                imageUrl: fullImageUrl, 
                tags: tagsArray,
            });

            displayAlert('Post başarıyla paylaşıldı!', 'success');
            
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
                
                <h1 className={`text-3xl font-extrabold text-[${COLORS.SECONDARY}] mb-8 border-b border-gray-200 pb-4`}>Yeni Post Oluştur</h1>
                
                <form onSubmit={handleSubmit} className={`bg-white p-8 rounded-4xl shadow-xl space-y-8 border border-[${COLORS.SECONDARY}]/5`}>
                    
                    <div className="space-y-4">
                        <label className={`block text-sm font-bold text-[${COLORS.SECONDARY}] ml-1`}>Görsel Seç</label>
                        
                        <input 
                            type="file" 
                            id="fileInput"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden" 
                        />

                        <label 
                            htmlFor="fileInput" 
                            className={`flex flex-col items-center justify-center w-full aspect-video rounded-2xl border-3 border-dashed cursor-pointer transition-all duration-300 group
                                ${previewUrl 
                                    ? `border-[${COLORS.PRIMARY}] bg-[${COLORS.BG_LIGHT}]` 
                                    : `border-gray-300 hover:border-[${COLORS.PRIMARY}] hover:bg-gray-50`
                                }`}
                        >
                            {previewUrl ? (
                                <div className="relative w-full h-full rounded-2xl overflow-hidden group">
                                    <img src={previewUrl} alt="Önizleme" className="w-full h-full object-contain bg-black/5" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                        <p className="text-white font-bold flex items-center"><Zap className="w-5 h-5 mr-2" /> Görseli Değiştir</p>
                                    </div>
                                </div>
                            ) : (
                                <div className={`flex flex-col items-center text-gray-400 group-hover:text-[${COLORS.PRIMARY}] transition`}>
                                    <PlusSquare className="w-12 h-12 mb-3" />
                                    <p className="font-bold">Resim Yüklemek İçin Tıkla</p>
                                    <p className="text-xs mt-1 text-gray-400">JPG, PNG (Maks. 5MB)</p>
                                </div>
                            )}
                        </label>
                    </div>

                    <div>
                        <label className={`block text-sm font-bold text-[${COLORS.SECONDARY}] mb-2 ml-1`}>Açıklama</label>
                        <textarea
                            rows={3}
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            className={`w-full bg-[${COLORS.BG_LIGHT}] border border-transparent rounded-xl p-4 outline-none focus:border-[${COLORS.PRIMARY}] focus:bg-white transition font-medium placeholder-gray-400 resize-none text-black`}
                            placeholder="Bu fotoğrafın hikayesi ne?"
                        ></textarea>
                    </div>

                    <div>
                        <label className={`block text-sm font-bold text-[${COLORS.SECONDARY}] mb-2 ml-1`}>Etiketler</label>
                        <input
                            type="text"
                            value={tagsInput}
                            onChange={(e) => setTagsInput(e.target.value)}
                            className={`w-full bg-[${COLORS.BG_LIGHT}] border border-transparent rounded-xl p-4 outline-none focus:border-[${COLORS.PRIMARY}] focus:bg-white transition font-medium placeholder-gray-400 text-black`}
                            placeholder="#doğa, #seyahat (Virgülle ayırın)"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={uploading}
                        className={`w-full flex items-center justify-center py-4 px-6 rounded-xl shadow-lg text-lg font-bold text-white transition duration-300 transform hover:scale-[1.01]
                            ${uploading 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : `bg-[${COLORS.SECONDARY}] hover:bg-[#4a4d57]`
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

export default CreatePost;