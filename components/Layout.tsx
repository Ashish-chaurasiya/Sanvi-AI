
import React, { useState } from 'react';
import { Menu, X, BrainCircuit, Bell, Search, User, LogOut } from 'lucide-react';
import { APP_NAME, NAV_ITEMS, COLORS } from '../constants';
import { User as UserType } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onNavigate: (path: string) => void;
  user: UserType;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onNavigate, user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-[#0f172a] overflow-hidden">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 glass transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <BrainCircuit className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">
              {APP_NAME}
            </span>
          </div>

          <nav className="flex-1 space-y-2">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  onNavigate(item.path);
                  setIsSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${activeTab === item.path 
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/30' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}
                `}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-800">
            <div className="flex items-center gap-3 px-2 mb-4 group cursor-pointer" onClick={() => onNavigate('/settings')}>
              <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden ring-2 ring-transparent group-hover:ring-indigo-500 transition-all">
                <img src={user.avatar || "https://picsum.photos/seed/user/100"} alt="Avatar" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold truncate text-slate-200">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-rose-400 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Log Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-20 glass flex items-center justify-between px-6 lg:px-10 z-30 shrink-0 border-b border-slate-800/50">
          <div className="flex items-center gap-4">
            <button 
              className="p-2 -ml-2 lg:hidden text-slate-400 hover:text-white"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold capitalize lg:text-2xl">
              {NAV_ITEMS.find(n => n.path === activeTab)?.label || 'Page'}
            </h1>
          </div>

          <div className="flex items-center gap-3 lg:gap-6">
            <div className="hidden md:flex relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400" />
              <input 
                type="text" 
                placeholder="Search career resources..."
                className="bg-slate-900/50 border border-slate-700 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all w-48 lg:w-64"
              />
            </div>
            <button className="relative p-2 text-slate-400 hover:text-indigo-400 transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
            </button>
            <div className="h-8 w-[1px] bg-slate-800 mx-2 hidden sm:block"></div>
            <button 
              onClick={() => onNavigate('/settings')}
              className="flex items-center gap-2 group"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all overflow-hidden">
                <img src={user.avatar} className="w-full h-full object-cover" />
              </div>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar gradient-bg">
          <div className="max-w-6xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
