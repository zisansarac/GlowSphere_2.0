import React from 'react';
import { COLORS } from '../utils/constants';

interface Creator {
    id: string;
    name: string;
    handle: string;
    initials: string;
    profileImage?: string;
}

interface TopCreatorsProps {
    creators: Creator[];
    setView: React.Dispatch<React.SetStateAction<string>>;
    setSelectedUserId: React.Dispatch<React.SetStateAction<string | null>>;
}

const TopCreators = ({ creators, setView, setSelectedUserId }: TopCreatorsProps) => {
    const handleCheckProfile = (userId: string) => {
        setSelectedUserId(userId);
        setView('publicProfile');
    };

    return (
        <div className={`w-full p-6 bg-[${COLORS.BG_DARK}] rounded-3xl shadow-lg sticky top-8 animate-fade-in hidden xl:block border border-[${COLORS.PRIMARY}]/20`}>
            <h2 className="text-xl font-extrabold text-[#383a42] mb-6">En İyi İçerik Üreticileri</h2>
            <div className="space-y-4">
                {creators.slice(0, 3).map((c, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-md rounded-2xl shadow-sm transition duration-300 hover:shadow-md transform hover:scale-[1.02]">
                        <div className="flex items-center">
                            <div className={`w-10 h-10 rounded-full bg-[#383a42] flex items-center justify-center text-white font-extrabold text-lg mr-3 shadow-sm overflow-hidden`}>
                           {c.profileImage ? (
                            <img src={c.profileImage} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                 c.initials
                               )}
                        </div>
                            <div className="min-w-0">
                                <p className="font-bold text-[#383a42] text-sm truncate">{c.name}</p>
                                <p className="text-xs text-gray-600 font-medium truncate">@{c.handle}</p>
                            </div>
                        </div>
                        
                        <button
                            onClick={() => handleCheckProfile(c.id)}
                            className={`ml-5 mr-5 text-xs font-bold bg-[${COLORS.PRIMARY}] text-lime-600 py-1.5 px-1 rounded-lg hover:text-[${COLORS.PRIMARY}] transition duration-200 shadow-sm whitespace-nowrap`}
                        >
                            Profili Gör
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TopCreators;