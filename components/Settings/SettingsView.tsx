
import React, { useState } from 'react';
import { 
  User, 
  Shield, 
  Bell, 
  Globe, 
  FileText, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Save,
  Loader2,
  Sparkles,
  LogOut,
  Mail,
  Key,
  Target,
  ArrowRight
} from 'lucide-react';
import { UserCareerProfile, ResumeAnalysis, User as UserType } from '../../types';
import { geminiService } from '../../services/geminiService';

interface SettingsViewProps {
  profile: UserCareerProfile;
  onUpdate: (profile: UserCareerProfile) => void;
  user: UserType;
  onLogout: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ profile, onUpdate, user, onLogout }) => {
  const [activeSection, setActiveSection] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(null);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
    }, 1500);
  };

  const simulateResumeUpload = async () => {
    setIsAnalyzing(true);
    try {
      const mockResume = "Experienced Full Stack Developer with 5 years of React, Node.js and AWS experience. Built several scalable SaaS products.";
      const analysis = await geminiService.analyzeResume(mockResume);
      setResumeAnalysis(analysis);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pb-20 animate-in fade-in duration-700">
      {/* Sidebar Nav */}
      <div className="lg:col-span-1 space-y-2">
        {[
          { id: 'profile', label: 'Career Profile', icon: <User className="w-4 h-4" /> },
          { id: 'account', label: 'Account Details', icon: <Shield className="w-4 h-4" /> },
          { id: 'resume', label: 'Resume & Documents', icon: <FileText className="w-4 h-4" /> },
          { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm
              ${activeSection === item.id 
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}
            `}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
        
        <div className="pt-8 px-2">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all font-bold text-sm border border-transparent hover:border-rose-500/20"
          >
            <LogOut className="w-4 h-4" />
            Logout Session
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="lg:col-span-3">
        <div className="glass rounded-3xl border border-slate-800 p-8 lg:p-10 shadow-xl">
          
          {activeSection === 'profile' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">Career Profile Settings</h3>
                  <p className="text-xs text-slate-500 mt-1">Manage how Sanvii.AI understands your professional self.</p>
                </div>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-400">Current Role</label>
                  <input type="text" defaultValue={profile.job_role} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-400">Target Goal</label>
                  <input type="text" defaultValue={profile.target_roles[0]} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-400">Short-term Focus</label>
                  <textarea defaultValue={profile.short_term_goal} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none h-24 resize-none" />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'resume' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
              <h3 className="text-xl font-bold">Resume Intelligence</h3>
              
              {!resumeAnalysis ? (
                <div className="border-2 border-dashed border-slate-800 rounded-3xl p-12 text-center hover:border-indigo-500/50 transition-all cursor-pointer group bg-slate-900/20">
                  <div className="w-16 h-16 rounded-full bg-indigo-600/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h4 className="text-lg font-bold mb-2">Upload for Deep Analysis</h4>
                  <p className="text-sm text-slate-500 mb-6">Our AI will scan for ATS keywords and actionable career improvements.</p>
                  <button 
                    onClick={simulateResumeUpload}
                    disabled={isAnalyzing}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {isAnalyzing ? 'Analyzing Neural Patterns...' : 'Analyze Resume'}
                  </button>
                </div>
              ) : (
                <div className="space-y-10 animate-in fade-in duration-500">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-black flex items-center gap-2">
                      <FileText className="w-5 h-5 text-indigo-400" /> Analysis Report
                    </h4>
                    <button onClick={() => setResumeAnalysis(null)} className="text-xs font-bold text-slate-500 hover:text-white">Upload Different File</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Actionable Recommendations */}
                    <div className="space-y-4 md:col-span-2">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">High Impact Recommendations</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {resumeAnalysis.actionable_recommendations.map((rec, i) => (
                          <div key={i} className="p-4 glass rounded-2xl border border-indigo-500/10 bg-indigo-500/5">
                            <span className="text-[10px] font-black text-indigo-400 uppercase block mb-1">{rec.category}</span>
                            <p className="text-xs text-slate-200 leading-relaxed">{rec.advice}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Keywords for ATS */}
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ATS Optimized Keywords</p>
                      <div className="flex flex-wrap gap-2">
                        {resumeAnalysis.keywords.map(kw => (
                          <span key={kw} className="px-3 py-1 bg-slate-900 border border-slate-800 text-slate-400 rounded-lg text-[10px] font-bold">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Improvement Areas */}
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Structural Weaknesses</p>
                      <div className="space-y-2">
                        {resumeAnalysis.improvement_areas.map((area, i) => (
                          <div key={i} className="flex items-start gap-3 text-xs text-slate-400 leading-relaxed">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                            <span>{area}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
