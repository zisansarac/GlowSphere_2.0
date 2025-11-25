import React from 'react';
import { COLORS } from '../utils/constants';

interface Creator {
    id: string;
    name: string;
    handle: string;
    initials: string;
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
                            <div className={`w-10 h-10 rounded-full bg-[${COLORS.PRIMARY}] flex items-center justify-center text-[#383a42] font-extrabold text-lg mr-3 shadow-sm`}>
                                {c.initials}
                            </div>
                            <div>
                                <p className="font-bold text-[#383a42] text-sm">{c.name}</p>
                                <p className="text-xs text-gray-600 font-medium">@{c.handle}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleCheckProfile(c.id)}
                            className={`text-xs font-bold bg-[${COLORS.PRIMARY}] text-[#383a42] py-2 px-3 rounded-xl hover:bg-[#95ad72] transition duration-200 shadow-sm`}
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