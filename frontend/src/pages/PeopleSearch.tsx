/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Loader2, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../utils/constants';

const PeopleSearch = ({ setView, setSelectedUserId }: { setView: React.Dispatch<React.SetStateAction<string>>, setSelectedUserId: React.Dispatch<React.SetStateAction<string | null>> }) => {
    const { apiRequest } = useAuth();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setIsSearching(false);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            try {
                const data = await apiRequest(`users/search/${query}`);
                setResults(data);
            } catch (error) {
                console.error("Arama hatası:", error);
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 500); 

        return () => clearTimeout(delayDebounceFn);
    }, [query, apiRequest]); 

    const handleViewProfile = (userId: string) => {
        setSelectedUserId(userId);
        setView('publicProfile');
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
    };

    return (
        <div className="w-full min-h-screen p-6 sm:p-10 lg:pl-80 transition-all duration-300">
            <div className="max-w-[1600px]  mx-auto animate-fade-in">
                
                <h2 className={`text-5xl font-extrabold text-[${COLORS.SECONDARY}] mb-8`}>Kişileri Bul</h2>

                <form onSubmit={handleFormSubmit} className="mb-10 relative">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Kullanıcı adı ara..."
                        className={`w-full bg-white border-2 border-transparent focus:border-[${COLORS.PRIMARY}] rounded-2xl py-4 pl-6 pr-14 text-lg shadow-sm outline-none transition font-medium text-[${COLORS.SECONDARY}] placeholder-gray-400`}
                        autoFocus
                    />
                    <div className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[${COLORS.PRIMARY}]`}>
                        {isSearching ? <Loader2 className="w-6 h-6 animate-spin" /> : <Users className="w-6 h-6" />}
                    </div>
                </form>

                <div className="space-y-4">
                    {results.length > 0 ? (
                        results.map((user) => (
                            <div key={user._id} className={`flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition duration-300 border border-[${COLORS.SECONDARY}]/5 animate-fade-in`}>
                                <div className="flex items-center space-x-4">
                                    <div className={`w-14 h-14 rounded-full bg-[${COLORS.SECONDARY}] flex items-center justify-center text-white font-bold text-xl shrink-0 overflow-hidden shadow-sm`}>
                                        {user.profileImage ? (
                                            <img src={user.profileImage} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            user.email[0].toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <p className={`font-bold text-[${COLORS.SECONDARY}] text-lg`}>@{user.username || user.email.split('@')[0]}</p>
                                        <p className="text-sm text-gray-400">{user.bio ? user.bio.substring(0, 50) + '...' : 'GlowSphere Üyesi'}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleViewProfile(user._id)}
                                    className={`px-5 py-2 bg-[${COLORS.BG_LIGHT}] text-[${COLORS.SECONDARY}] font-bold rounded-xl hover:text-[${COLORS.PRIMARY}] transition text-sm whitespace-nowrap`}
                                >
                                    Profili Gör
                                </button>
                            </div>
                        ))
                    ) : (
                        !isSearching && query && (
                            <div className="text-center py-10 text-gray-400">
                                <p>Kullanıcı bulunamadı.</p>
                            </div>
                        )
                    )}
                    
                    {!query && (
                        <div className="text-center py-20 opacity-50">
                            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-gray-400 text-lg">Aramaya başlamak için bir isim yazın.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PeopleSearch;