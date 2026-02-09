
import React from 'react';
import { 
  TrendingUp, 
  BookOpen, 
  Target, 
  Calendar,
  ChevronRight,
  Zap,
  Award,
  Clock,
  User,
  Sparkles,
  ArrowRight,
  Mic // Fix: Added missing Mic import
} from 'lucide-react';
import { UserCareerProfile } from '../../types';

interface DashboardViewProps {
  profile: UserCareerProfile | null;
  onStartOnboarding: () => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ profile, onStartOnboarding }) => {
  const isProfileComplete = profile && profile.onboarding_completed;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Career Dashboard</h2>
          <p className="text-slate-400 mt-2">Welcome back! Your career trajectory is looking sharp.</p>
        </div>
        <div className="flex items-center gap-3 bg-indigo-600/10 border border-indigo-500/20 px-4 py-2 rounded-2xl">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-medium text-slate-300">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      {!isProfileComplete && (
        <div className="glass p-8 rounded-[2.5rem] border border-indigo-500/30 bg-indigo-500/5 shadow-2xl shadow-indigo-600/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all">
            <Sparkles className="w-24 h-24 text-indigo-400" />
          </div>
          <div className="max-w-2xl relative z-10">
            <h3 className="text-2xl font-black mb-3">Complete Your AI Career Profile</h3>
            <p className="text-slate-400 leading-relaxed mb-6">Unlock personalized learning paths, smart job matches, and deep career insights by completing your profile.</p>
            <button 
              onClick={onStartOnboarding}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black shadow-xl shadow-indigo-600/20 transition-all flex items-center gap-3"
            >
              Start Onboarding <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[
          { label: 'Learning Progress', value: '42%', icon: <BookOpen className="w-5 h-5" />, color: 'indigo' },
          { label: 'Skills Mastered', value: profile?.skills?.length || 0, icon: <Award className="w-5 h-5" />, color: 'pink' },
          { label: 'Goals Tracked', value: profile?.target_roles?.length || 0, icon: <Target className="w-5 h-5" />, color: 'emerald' },
          { label: 'Study Hours', value: '18.5', icon: <Clock className="w-5 h-5" />, color: 'amber' },
        ].map((stat) => (
          <div key={stat.label} className="glass p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all group">
            <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              {React.cloneElement(stat.icon as React.ReactElement, { className: `w-6 h-6 text-${stat.color}-400` })}
            </div>
            <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
            <h4 className="text-2xl font-bold mt-1">{stat.value}</h4>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Main Goals Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-[2.5rem] p-8 border border-slate-800">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold flex items-center gap-2"><Target className="w-5 h-5 text-indigo-400" /> Active Goals</h3>
              <button className="text-sm text-indigo-400 hover:underline">View All</button>
            </div>
            <div className="space-y-6">
              {(profile?.target_roles || []).length > 0 ? (
                (profile?.target_roles || []).map((role, idx) => (
                  <div key={role} className="relative">
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Goal {idx + 1}</span>
                        <p className="font-bold text-lg">{role}</p>
                      </div>
                      <span className="text-sm text-slate-500 font-medium">{Math.max(0, 75 - (idx * 15))}% Match</span>
                    </div>
                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full" style={{ width: `${Math.max(0, 75 - (idx * 15))}%` }} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-500 italic">No active goals found. Set up your profile to track your targets.</div>
              )}
            </div>
          </div>

          {/* New Interactive Knowledge Graph Visualization */}
          <div className="glass rounded-[2.5rem] p-8 border border-slate-800 relative overflow-hidden h-[400px]">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 relative z-10"><TrendingUp className="w-5 h-5 text-indigo-400" /> Knowledge Constellation</h3>
            <div className="absolute inset-0 flex items-center justify-center opacity-40">
              <svg width="100%" height="100%" viewBox="0 0 400 400">
                <circle cx="200" cy="200" r="150" fill="none" stroke="rgba(99, 102, 241, 0.1)" strokeDasharray="4 4" />
                <circle cx="200" cy="200" r="80" fill="none" stroke="rgba(99, 102, 241, 0.05)" />
                {/* Visual links between skills if any exist */}
                {(profile?.skills || []).slice(0, 6).map((_, i, arr) => {
                  if (i === arr.length - 1) return null;
                  const angle1 = (i / arr.length) * Math.PI * 2;
                  const angle2 = ((i + 1) / arr.length) * Math.PI * 2;
                  const r = 100;
                  return (
                    <line 
                      key={i}
                      x1={200 + Math.cos(angle1) * r} y1={200 + Math.sin(angle1) * r}
                      x2={200 + Math.cos(angle2) * r} y2={200 + Math.sin(angle2) * r}
                      stroke="rgba(99, 102, 241, 0.2)" strokeWidth="1"
                    />
                  );
                })}
              </svg>
            </div>
            <div className="relative z-10 h-full flex items-center justify-center">
              <div className="flex flex-wrap gap-3 justify-center max-w-lg">
                {(profile?.skills || []).length > 0 ? (
                  (profile?.skills || []).map((skill, idx) => {
                    const depth = skill.level === 'advanced' ? 'bg-indigo-600/30 ring-indigo-500' : skill.level === 'intermediate' ? 'bg-slate-800/80 ring-slate-700' : 'bg-slate-900/40 ring-slate-800';
                    return (
                      <div 
                        key={skill.name} 
                        className={`px-6 py-3 rounded-2xl border ${depth} ring-1 backdrop-blur-md flex flex-col items-center gap-1 transition-all hover:scale-110 hover:shadow-2xl hover:shadow-indigo-500/20 cursor-default animate-in zoom-in duration-500`}
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        <span className="text-sm font-black text-slate-100">{skill.name}</span>
                        <span className="text-[9px] uppercase font-black text-indigo-400 tracking-widest">{skill.level}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-slate-500 italic">No nodes to display in constellation.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Side Actions/Activity */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-600/30 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <Zap className="w-10 h-10 mb-6 bg-white/20 p-2.5 rounded-2xl" />
            <h3 className="text-xl font-bold mb-2">Sanvii Pro Insight</h3>
            <p className="text-white/80 text-sm leading-relaxed mb-8">
              Based on global hiring trends, we recommend adding "Cloud Native Architecture" to your roadmap. It's currently trending in your target industry.
            </p>
            <button className="w-full py-3.5 bg-white text-indigo-600 rounded-2xl font-black hover:bg-slate-100 transition-all shadow-xl hover:-translate-y-1">
              Update Roadmap
            </button>
          </div>

          <div className="glass rounded-[2.5rem] p-8 border border-slate-800">
            <h3 className="text-lg font-bold mb-6">Upcoming Milestones</h3>
            <div className="space-y-6">
              {[
                { title: 'Resume Finalization', date: 'Tomorrow', icon: <Award className="w-4 h-4" /> },
                { title: 'React Mastery Module', date: 'Oct 24', icon: <BookOpen className="w-4 h-4" /> },
                { title: 'Live Mock Interview', date: 'Oct 28', icon: <Mic className="w-4 h-4" /> },
              ].map((item, i) => (
                <div key={item.title} className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700 group-hover:border-indigo-500/50 transition-colors">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold group-hover:text-indigo-400 transition-colors">{item.title}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{item.date}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
