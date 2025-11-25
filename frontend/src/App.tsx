/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import MobileBottomBar from './components/MobileBottomBar';
import GlobalAlert from './components/GlobalAlert';
import HomeFeed from './pages/HomeFeed';
import Explore from './pages/Explore';
import SavedPosts from './pages/SavedPosts';
import PeopleSearch from './pages/PeopleSearch';
import CreatePost from './pages/CreatePost';
import MyProfile from './pages/MyProfile';
import PublicProfile from './pages/PublicProfile';
import AuthForm from './pages/AuthForm';
import { COLORS } from './utils/constants';

const AppContent = () => {
    const { user, initialLoading } = useAuth();
    
    const [view, setView] = useState(() => localStorage.getItem('currentView') || 'home');
    const [selectedUserId, setSelectedUserId] = useState<string | null>(() => localStorage.getItem('selectedUserId')); 
    const [isRegister, setIsRegister] = useState(false);

    const toggleAuthMode = () => setIsRegister(prev => !prev);

    useEffect(() => { localStorage.setItem('currentView', view); }, [view]);
    useEffect(() => {
        if (selectedUserId) localStorage.setItem('selectedUserId', selectedUserId);
        else localStorage.removeItem('selectedUserId');
    }, [selectedUserId]);
    
    if (initialLoading) {
        return (
            <div className={`fixed inset-0 w-full h-full flex flex-col items-center justify-center bg-[#F5F5EC] z-50`}>
                <Loader2 className={`w-16 h-16 animate-spin text-[#A7C080] mb-6`} />
                <p className="text-[#383a42] font-bold text-xl animate-pulse tracking-wide">GlowSphere Başlatılıyor...</p>
            </div>
        );
    }

    if (!user) {
        return <AuthForm isRegister={isRegister} toggleAuthMode={toggleAuthMode} />;
    }
    
    const renderView = () => {
        switch (view) {
            case 'home': return <HomeFeed setView={setView} setSelectedUserId={setSelectedUserId} />;
            case 'createPost': return <CreatePost setView={setView} />;
            case 'explore': return <Explore setView={setView} setSelectedUserId={setSelectedUserId} />;
            case 'people': return <PeopleSearch setView={setView} setSelectedUserId={setSelectedUserId} />;
            case 'saved': return <SavedPosts setView={setView} setSelectedUserId={setSelectedUserId} />;
            case 'profile': return <MyProfile />;
            case 'publicProfile': return <PublicProfile selectedUserId={selectedUserId} setView={setView} />;
            default: return <HomeFeed setView={setView} setSelectedUserId={setSelectedUserId} />;
        }
    };

    return (
        <div className="flex w-full min-h-screen bg-[#F5F5EC] relative">
            <Sidebar view={view} setView={setView} />
            <MobileBottomBar view={view} setView={setView} />
            
         
            <div className="grow w-full lg:pl-0"> 
            
                 {renderView()}
            </div>
            
            <GlobalAlert />
        </div>
    );
};

const App = () => (
    <AuthProvider>
        <AppContent />
    </AuthProvider>
);

export default App;