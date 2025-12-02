/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'; 
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
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

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
 
    const userImageKey = user?.profileImage ? user.profileImage : 'no-image';

    return (
        <Routes>
            
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/resetpassword/:token" element={<ResetPassword />} />
            

            <Route path="/login" element={!user ? <AuthForm isRegister={false} toggleAuthMode={toggleAuthMode} /> : <Navigate to="/" />} />
            <Route path="/register" element={!user ? <AuthForm isRegister={true} toggleAuthMode={toggleAuthMode} /> : <Navigate to="/" />} />

          
            <Route path="/*" element={
                !user ? (
                    <AuthForm isRegister={isRegister} toggleAuthMode={toggleAuthMode} />
                ) : (
                    <div className="flex w-full min-h-screen bg-[#F5F5EC] relative">
                        <Sidebar 
                          key={`sidebar-${userImageKey}`} 
                          view={view} 
                          setView={setView} 
                        />

                        <MobileBottomBar 
                          key={`mobilebar-${userImageKey}`} 
                          view={view} 
                          setView={setView} 
                        />
                        
                        <div className="grow w-full lg:pl-0"> 
                             {renderView()}
                        </div>
                        
                        <GlobalAlert />
                    </div>
                )
            } />
        </Routes>
    );
};

const App = () => (
    <BrowserRouter>
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    </BrowserRouter>
);

export default App;