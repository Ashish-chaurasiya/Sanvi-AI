
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import ChatInterface from './components/Chat/ChatInterface';
import OnboardingWizard from './components/Profile/OnboardingWizard';
import DashboardView from './components/Dashboard/DashboardView';
import LearningView from './components/Learning/LearningView';
import JobMatchView from './components/JobMatch/JobMatchView';
import InterviewView from './components/Interview/InterviewView';
import SettingsView from './components/Settings/SettingsView';
import AuthScreen from './components/Auth/AuthScreen';
import { UserCareerProfile, User } from './types';
import { STORAGE_KEYS } from './constants';
import { dbService } from './services/dbService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('/');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserCareerProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        const userProfile = dbService.getProfile(user.id);
        setProfile(userProfile);
      } catch (e) {
        localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
      }
    }
    setIsLoaded(true);
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
    setProfile(dbService.getProfile(user.id));
    setActiveTab('/dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setProfile(null);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    setActiveTab('/');
  };

  const handleOnboardingComplete = (newProfile: UserCareerProfile) => {
    if (!currentUser) return;
    const finalProfile = { ...newProfile, userId: currentUser.id };
    setProfile(finalProfile);
    dbService.saveProfile(finalProfile);
    setShowOnboardingModal(false);
  };

  const handleUpdateProfile = (updatedProfile: UserCareerProfile) => {
    if (!currentUser) return;
    setProfile(updatedProfile);
    dbService.saveProfile(updatedProfile);
  };

  if (!isLoaded) return null;
  if (!currentUser) return <AuthScreen onLogin={handleLogin} />;

  const currentProfile = profile || { userId: currentUser.id, skills: [], target_roles: ['Professional'], onboarding_completed: false } as any;

  const renderContent = () => {
    switch (activeTab) {
      case '/':
        return <ChatInterface profile={currentProfile} />;
      case '/learning':
        return <LearningView profile={currentProfile} />;
      case '/interview':
        return <InterviewView profile={currentProfile} />;
      case '/job-match':
        return <JobMatchView profile={currentProfile} />;
      case '/dashboard':
        return <DashboardView profile={profile as any} onStartOnboarding={() => setShowOnboardingModal(true)} />;
      case '/settings':
        return <SettingsView profile={currentProfile} onUpdate={handleUpdateProfile} user={currentUser} onLogout={handleLogout} />;
      default:
        return <ChatInterface profile={currentProfile} />;
    }
  };

  return (
    <Layout activeTab={activeTab} onNavigate={setActiveTab} user={currentUser} onLogout={handleLogout}>
      {renderContent()}
      {showOnboardingModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <OnboardingWizard 
            onComplete={handleOnboardingComplete} 
            onClose={() => setShowOnboardingModal(false)} 
          />
        </div>
      )}
    </Layout>
  );
};

export default App;
