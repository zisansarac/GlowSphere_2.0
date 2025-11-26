/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Home, Compass, Users, Bookmark, PlusSquare, LogOut} from 'lucide-react';
import { useAuth } from '../context/AuthContext';


const SidebarNavItem = ({ Icon, name, isActive, onClick }: { Icon: any, name: string, isActive?: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center p-3.5 rounded-xl font-bold text-base transition-all duration-300 ease-in-out transform hover:scale-[1.02] mb-3 shadow-md
            ${isActive
                ? ` text-lime-200` 
                : ` text-white hover:text-lime-200` 
            }`
        }
    >
        <Icon className="w-5 h-5 mr-3" />
        <span className="hidden lg:inline">{name}</span>
    </button>
);

interface SidebarProps {
    view: string;
    setView: React.Dispatch<React.SetStateAction<string>>;
}

const Sidebar = ({ view, setView }: SidebarProps) => {
    const { logout, user } = useAuth();

    const navItems = [
        { name: 'Home', icon: Home, view: 'home' },
        { name: 'Explore', icon: Compass, view: 'explore' },
        { name: 'People', icon: Users, view: 'people' },
        { name: 'Saved', icon: Bookmark, view: 'saved' },
        {name: 'Create Post', icon: PlusSquare, view:'createPost'}
    ];

    return (
        <div className={`hidden lg:flex w-72 h-full fixed left-0 top-0 bg-[#E0E8D7] p-6 flex-col justify-between shadow-2xl z-50 border-r border-[#A7C080]/30`}>
            <div>
                {/* Logo */}
                <div className="flex items-center space-x-4 mb-10 px-1 overflow-hidden">
                    
                    <h3 className="text-3xl font-extrabold text-[#383a42] tracking-tighter truncate">glowsphere.</h3>
                </div>

                {/* Profil Kartı */}
                {user && (
                    <div className="flex items-center mb-10 p-4 rounded-2xl bg-[#F5F5EC] border-2 border-[#383a42]/5 cursor-pointer hover:border-[#A7C080] transition-all shadow-sm group" onClick={() => setView('profile')}>
                        <div className="w-10 h-10 rounded-full bg-[#383a42] flex items-center justify-center text-white font-bold text-lg mr-3 shadow-md group-hover:scale-110 transition duration-300 shrink-0 overflow-hidden">
                            {user.profileImage ? (
                                <img src={user.profileImage} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                user.email[0].toUpperCase()
                            )}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-[#383a42] font-bold text-sm truncate">@{user.username || user.email.split('@')[0]}</p>
                            <p className="text-gray-500 text-xs">Profili Düzenle</p>
                        </div>
                    </div>
                )}

                {/* Menü */}
                <nav>
                    {navItems.map((item) => (
                        <SidebarNavItem
                            key={item.name}
                            Icon={item.icon}
                            name={item.name}
                            isActive={view === item.view}
                            onClick={() => setView(item.view)}
                        />
                    ))}
                </nav>

            </div>

            <div>
                 <SidebarNavItem Icon={LogOut} name="Log Out" onClick={logout} />
            </div>
        </div>
    );
};

export default Sidebar;