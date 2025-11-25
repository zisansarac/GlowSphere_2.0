import React from 'react';
import { Home, Compass, PlusSquare, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../utils/constants';

interface MobileBottomBarProps {
    view: string;
    setView: React.Dispatch<React.SetStateAction<string>>;
}

const MobileBottomBar = ({ view, setView }: MobileBottomBarProps) => {
     const { logout } = useAuth();
     const navItems = [
        { name: 'Home', icon: Home, view: 'home' },
        { name: 'Explore', icon: Compass, view: 'explore' },
        { name: 'Create', icon: PlusSquare, view: 'createPost' },
        { name: 'Profile', icon: UserIcon, view: 'profile' },
        { name: 'Logout', icon: LogOut, action: logout },
    ];
    
    return (
        <div className={`lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[${COLORS.BG_DARK}] shadow-2xl flex justify-around items-center z-30 transition-all duration-300`}>
            {navItems.map(item => (
                <button
                    key={item.name}
                    onClick={item.action || (() => setView(item.view))}
                    className={`p-2 rounded-full transition duration-300 transform hover:scale-110
                        ${view === item.view && !item.action
                            ? ` text-lime-200 shadow-md`
                            : `text-white hover:text-lime-200`
                        }`
                    }
                >
                    <item.icon className="w-6 h-6" />
                </button>
            ))}
        </div>
    );
};

export default MobileBottomBar;