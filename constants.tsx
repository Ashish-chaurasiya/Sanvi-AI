
import React from 'react';
import { 
  MessageSquare, 
  BookOpen, 
  Briefcase, 
  LayoutDashboard, 
  Settings, 
  Mic,
  Search,
  CheckCircle,
  Clock,
  ChevronRight,
  TrendingUp,
  FileText,
  BrainCircuit,
  LogOut,
  Target
} from 'lucide-react';

export const APP_NAME = "Sanvii.AI";

export const NAV_ITEMS = [
  { label: 'Chat', path: '/', icon: <MessageSquare className="w-5 h-5" /> },
  { label: 'Learning', path: '/learning', icon: <BookOpen className="w-5 h-5" /> },
  { label: 'Interview', path: '/interview', icon: <Mic className="w-5 h-5" /> },
  { label: 'Job Match', path: '/job-match', icon: <Briefcase className="w-5 h-5" /> },
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Settings', path: '/settings', icon: <Settings className="w-5 h-5" /> },
];

export const COLORS = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  accent: '#ec4899',
  bg: '#0f172a',
  surface: '#1e293b',
};

export const STORAGE_KEYS = {
  AUTH_USER: 'sanvii_auth_user',
  USERS_DB: 'sanvii_users_database',
  PROFILE_PREFIX: 'sanvii_profile_',
  SESSIONS: 'sanvii_chat_sessions',
  PATHS: 'sanvii_learning_paths',
  RESUME: 'sanvii_resume_analysis'
};
