
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  RotateCcw,
  Sparkles,
  Clock,
  BrainCircuit,
  Plus,
  ChevronRight,
  Target,
  LayoutGrid,
  Zap,
  Trash2,
  ArrowLeft,
  Loader2,
  Settings2,
  ToggleLeft,
  ToggleRight,
  Info,
  Lock,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import { UserCareerProfile, LearningPath, TopicStatus, TopicChat, LearningTopic, MessageRole } from '../../types';
import { geminiService } from '../../services/geminiService';
import { dbService } from '../../services/dbService';
import LessonInlineChat from './LessonInlineChat';

interface LearningViewProps {
  profile: UserCareerProfile;
}

interface Suggestion {
  title: string;
  description: string;
  reasoning: string;
  estimatedTime: string;
}

const REASSURING_MESSAGES = [
  "Analyzing your unique career goals...",
  "Synthesizing industry requirements for your role...",
  "Phasing your learning for maximum retention...",
  "Sequencing modules for logical progression...",
  "Calculating estimated completion timelines...",
  "Fine-tuning your personalized mastery roadmap...",
  "Optimizing your curriculum for high performance...",
  "Almost there! Preparing your learning environment..."
];

const LearningView: React.FC<LearningViewProps> = ({ profile }) => {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [activePathId, setActivePathId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [topicChats, setTopicChats] = useState<Record<string, TopicChat>>({});
  const [viewMode, setViewMode] = useState<'focus' | 'manager' | 'create'>('focus');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  
  // Creation Form State
  const [creationMode, setCreationMode] = useState<'ai' | 'manual'>('ai');
  const [newPathTitle, setNewPathTitle] = useState('');
  const [newPathDesc, setNewPathDesc] = useState('');
  const [newPathScope, setNewPathScope] = useState('');
  const [newPathTimeline, setNewPathTimeline] = useState('6');
  const [newPathTechs, setNewPathTechs] = useState('');
  const [useProfileData, setUseProfileData] = useState(true);
  const [manualTopics, setManualTopics] = useState(['']);

  const activePath = useMemo(() => paths.find(p => p.id === activePathId) || null, [paths, activePathId]);

  useEffect(() => {
    const savedPaths = dbService.getLearningPaths(profile.userId);
    const activeId = dbService.getActivePathId(profile.userId);
    const savedChats = dbService.getTopicChats(profile.userId);
    
    setPaths(savedPaths || []);
    setTopicChats(savedChats || {});

    if (activeId && savedPaths && savedPaths.some(p => p.id === activeId)) {
      setActivePathId(activeId);
    } else if (savedPaths && savedPaths.length > 0) {
      setActivePathId(savedPaths[0].id);
      dbService.setActivePathId(profile.userId, savedPaths[0].id);
    } else {
      setViewMode('manager');
    }

    fetchSuggestions();
  }, [profile.userId]);

  const fetchSuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const data = await geminiService.getLearningSuggestions(profile);
      setSuggestions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleApplySuggestion = (suggestion: Suggestion) => {
    setNewPathTitle(suggestion.title);
    setNewPathDesc(suggestion.description);
    setCreationMode('ai');
    setViewMode('create');
  };

  // Loading message rotation
  useEffect(() => {
    let interval: number;
    if (isGenerating) {
      interval = window.setInterval(() => {
        setLoadingMessageIndex(prev => (prev + 1) % REASSURING_MESSAGES.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  useEffect(() => {
    dbService.saveLearningPaths(profile.userId, paths);
  }, [paths, profile.userId]);

  useEffect(() => {
    if (Object.keys(topicChats).length > 0) {
      dbService.saveTopicChats(profile.userId, topicChats);
    }
  }, [topicChats, profile.userId]);

  const handleGenerateAIPath = async () => {
    if (!newPathTitle) return;
    setIsGenerating(true);
    setLoadingMessageIndex(0);
    try {
      const data = await geminiService.generateLearningPath(
        newPathTitle, 
        newPathDesc, 
        profile,
        {
          scope: newPathScope,
          timeline: newPathTimeline,
          technologies: newPathTechs,
          useProfile: useProfileData
        }
      );
      
      const newPath: LearningPath = {
        id: 'lp-' + Date.now(),
        title: data.title || newPathTitle,
        description: data.description || newPathDesc || `Personalized path for ${newPathTitle}`,
        goal_role: data.goal_role || newPathTitle,
        progress: 0,
        status: 'active',
        phases: (data.phases || []).map((p: any, idx: number) => ({
          id: `ph-${idx}-${Date.now()}`,
          title: p.title,
          topics: (p.topics || []).map((t: any, tidx: number) => ({
            id: `t-${idx}-${tidx}-${Date.now()}`,
            title: t.title,
            description: t.description,
            status: TopicStatus.NOT_STARTED,
            estimated_minutes: t.estimated_minutes || 30,
            difficulty_level: t.difficulty_level || 'beginner',
            prerequisites: t.prerequisites || []
          }))
        }))
      };
      
      const updatedPaths = [...paths, newPath];
      setPaths(updatedPaths);
      setActivePathId(newPath.id);
      dbService.setActivePathId(profile.userId, newPath.id);
      setViewMode('focus');
      resetForm();
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateManualPath = () => {
    if (!newPathTitle || manualTopics.filter(t => t.trim()).length === 0) return;
    const newPath: LearningPath = {
      id: 'lp-' + Date.now(),
      title: newPathTitle,
      description: newPathDesc,
      goal_role: newPathTitle,
      progress: 0,
      status: 'active',
      phases: [{
        id: 'ph-manual-1',
        title: 'Custom Curriculum',
        topics: manualTopics.filter(t => t.trim()).map((t, idx) => ({
          id: `t-manual-${idx}-${Date.now()}`,
          title: t,
          description: 'A custom topic you defined.',
          status: TopicStatus.NOT_STARTED,
          estimated_minutes: 45,
          difficulty_level: 'intermediate',
          prerequisites: [] 
        }))
      }]
    };
    const updatedPaths = [...paths, newPath];
    setPaths(updatedPaths);
    setActivePathId(newPath.id);
    dbService.setActivePathId(profile.userId, newPath.id);
    setViewMode('focus');
    resetForm();
  };

  const resetForm = () => {
    setNewPathTitle('');
    setNewPathDesc('');
    setNewPathScope('');
    setNewPathTimeline('6');
    setNewPathTechs('');
    setManualTopics(['']);
  };

  const deletePath = (id: string) => {
    if (window.confirm("Delete this curriculum? This cannot be undone.")) {
      const updated = paths.filter(p => p.id !== id);
      setPaths(updated);
      if (activePathId === id) {
        const nextId = updated.length > 0 ? updated[0].id : null;
        setActivePathId(nextId);
        if (nextId) dbService.setActivePathId(profile.userId, nextId);
      }
    }
  };

  const selectPath = (id: string) => {
    setActivePathId(id);
    dbService.setActivePathId(profile.userId, id);
    setViewMode('focus');
  };

  const getChatData = (topicId: string): TopicChat => {
    return topicChats[topicId] || { topicId, messages: [], blockers: [], isLocked: false, mode: 'learning' };
  };

  const updateChatData = (topicId: string, updates: Partial<TopicChat>) => {
    setTopicChats(prev => ({ ...prev, [topicId]: { ...getChatData(topicId), ...updates } }));
  };

  const markTopicComplete = (topicId: string) => {
    if (!activePath || !activePath.phases) return;
    const newPhases = activePath.phases.map(ph => ({
      ...ph,
      topics: (ph.topics || []).map(t => t.id === topicId ? { ...t, status: TopicStatus.COMPLETED, completedAt: Date.now() } : t)
    }));
    
    const total = newPhases.reduce((acc, ph) => acc + (ph.topics?.length || 0), 0);
    const completed = newPhases.reduce((acc, ph) => acc + (ph.topics?.filter(t => t.status === TopicStatus.COMPLETED).length || 0), 0);
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    const updatedPath = { ...activePath, phases: newPhases, progress };
    setPaths(paths.map(p => p.id === activePath.id ? updatedPath : p));
    updateChatData(topicId, { isLocked: true });
  };

  const setTopicNeedsRevision = (topicId: string) => {
    if (!activePath || !activePath.phases) return;
    const newPhases = activePath.phases.map(ph => ({
      ...ph,
      topics: (ph.topics || []).map(t => t.id === topicId ? { ...t, status: TopicStatus.NEEDS_REVISION } : t)
    }));
    const updatedPath = { ...activePath, phases: newPhases };
    setPaths(paths.map(p => p.id === activePath.id ? updatedPath : p));
  };

  const nextTopicData = useMemo(() => {
    if (!activePath || !activePath.phases) return null;
    for (const phase of activePath.phases) {
      const next = (phase.topics || []).find(t => t.status !== TopicStatus.COMPLETED);
      if (next) return { phase, topic: next };
    }
    return null;
  }, [activePath]);

  const upcomingTopics = useMemo(() => {
    if (!activePath || !activePath.phases) return [];
    const allTopics = activePath.phases.flatMap(ph => ph.topics || []);
    return allTopics.filter(t => t.status !== TopicStatus.COMPLETED);
  }, [activePath]);

  if (isGenerating) return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-20rem)] text-center space-y-10 animate-in fade-in duration-500">
      <div className="relative">
        <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full scale-150 animate-pulse"></div>
        <div className="w-24 h-24 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center relative animate-bounce">
          <BrainCircuit className="w-12 h-12 text-indigo-400" />
        </div>
      </div>
      <div className="space-y-4 max-w-lg">
        <div className="h-2 w-48 bg-slate-800 rounded-full mx-auto overflow-hidden">
          <div className="h-full bg-indigo-500 animate-loading-bar"></div>
        </div>
        <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">
          Curating Your Success
        </h2>
        <p className="text-slate-400 font-medium text-lg min-h-[1.5em] animate-in fade-in slide-in-from-bottom-2 key={loadingMessageIndex}">
          {REASSURING_MESSAGES[loadingMessageIndex]}
        </p>
      </div>
      
      <style>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-loading-bar {
          animation: loading-bar 1.5s infinite linear;
        }
      `}</style>
    </div>
  );

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      {/* Header Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-4">
          {viewMode !== 'focus' && paths.length > 0 && (
            <button onClick={() => setViewMode('focus')} className="p-2 glass rounded-xl text-slate-400 hover:text-white transition-all">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h2 className="text-3xl font-black tracking-tight">
            {viewMode === 'focus' ? 'Current Focus' : viewMode === 'manager' ? 'Curriculum Manager' : 'Path Creation'}
          </h2>
        </div>
        <div className="flex gap-3 w-full lg:w-auto">
          <button 
            onClick={() => setViewMode('manager')}
            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${viewMode === 'manager' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'glass text-slate-400 hover:text-white'}`}
          >
            <LayoutGrid className="w-4 h-4" />
            My Paths
          </button>
          <button 
            onClick={() => { setViewMode('create'); resetForm(); }}
            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${viewMode === 'create' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'glass text-emerald-500 hover:text-emerald-400'}`}
          >
            <Plus className="w-4 h-4" />
            New Path
          </button>
        </div>
      </div>

      {/* AI Suggestions Box */}
      {viewMode === 'manager' && suggestions.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-lg">
              <Lightbulb className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold">Recommended for You</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isLoadingSuggestions ? (
              [1, 2, 3].map(i => <div key={i} className="h-48 glass rounded-3xl animate-pulse border border-slate-800" />)
            ) : (
              suggestions.map((s, i) => (
                <div key={i} className="glass p-6 rounded-3xl border border-slate-800 hover:border-indigo-500/30 transition-all flex flex-col group relative overflow-hidden h-full">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Sparkles className="w-12 h-12 text-indigo-400" />
                  </div>
                  <h4 className="font-black text-slate-200 mb-2">{s.title}</h4>
                  <p className="text-xs text-slate-500 mb-4 line-clamp-2">{s.reasoning}</p>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-600 uppercase">{s.estimatedTime} Roadmap</span>
                    <button 
                      onClick={() => handleApplySuggestion(s)}
                      className="p-2 bg-indigo-600/10 text-indigo-400 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {viewMode === 'focus' && activePath ? (
        <div className="space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Focus Sidebar Info */}
            <div className="lg:col-span-4 space-y-6">
              <div className="glass p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group h-full">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-pink-500" />
                
                <div className="space-y-1 mb-8">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Active Curriculum</p>
                  <h3 className="text-2xl font-black leading-tight">{activePath.title}</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{activePath.goal_role}</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-tighter">Overall Progress</span>
                    <span className="text-2xl font-black text-white">{activePath.progress}%</span>
                  </div>
                  <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-1000" style={{ width: `${activePath.progress}%` }} />
                  </div>
                </div>

                <div className="mt-12 space-y-6">
                  <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Current Phase</p>
                      <p className="text-xs font-black text-slate-200 line-clamp-1">{nextTopicData?.phase.title || 'Curriculum Finished'}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Time Remaining</p>
                      <p className="text-xs font-black text-slate-200">~7h 30m</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Topic Main Panel */}
            <div className="lg:col-span-8">
              {nextTopicData ? (
                <div className="glass p-10 rounded-[3rem] border border-indigo-500/30 shadow-2xl shadow-indigo-600/10 relative overflow-hidden h-full flex flex-col group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all">
                    <Zap className="w-16 h-16 text-indigo-400" />
                  </div>
                  
                  <div className="mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600/10 border border-indigo-500/20 text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6">
                      Next Module Up
                    </div>
                    <h2 className="text-4xl font-black tracking-tight mb-4 group-hover:text-indigo-400 transition-colors">{nextTopicData.topic.title}</h2>
                    <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">{nextTopicData.topic.description}</p>
                    {nextTopicData.topic.status === TopicStatus.NEEDS_REVISION && (
                      <div className="mt-4 flex items-center gap-2 text-amber-500">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-bold">Revision Required: Previous skill check failed.</span>
                      </div>
                    )}
                  </div>

                  <div className="glass bg-indigo-500/5 p-6 rounded-3xl border border-indigo-500/10 mb-8 mt-4">
                    <h4 className="text-sm font-black text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> The Purpose
                    </h4>
                    <p className="text-sm text-slate-300 leading-relaxed italic">
                      This topic provides the critical foundation required to bridge theoretical knowledge with practical implementation. Mastering this now ensures you have the mental models needed to debug complex scenarios later in your journey.
                    </p>
                  </div>

                  <div className="mt-auto flex flex-col sm:flex-row items-center justify-between gap-8 pt-6">
                    <div className="flex gap-8">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Difficulty</span>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={`w-2 h-2 rounded-full ${nextTopicData.topic.difficulty_level === 'beginner' ? 'bg-emerald-400' : nextTopicData.topic.difficulty_level === 'intermediate' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                          <span className="text-sm font-black text-slate-200 capitalize">{nextTopicData.topic.difficulty_level}</span>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Duration</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-sm font-black text-slate-200">{nextTopicData.topic.estimated_minutes} Min</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setExpandedTopicId(nextTopicData.topic.id)}
                      className="w-full sm:w-auto px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-lg shadow-2xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-3 group"
                    >
                      {nextTopicData.topic.status === TopicStatus.NEEDS_REVISION ? 'Begin Revision' : 'Start Learning'}
                      <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>

                  {expandedTopicId === nextTopicData.topic.id && (
                    <div className="mt-12 pt-10 border-t border-slate-800">
                      <LessonInlineChat 
                        topic={nextTopicData.topic} 
                        chatData={getChatData(nextTopicData.topic.id)} 
                        profile={profile}
                        onUpdateChat={updateChatData} 
                        onMarkComplete={() => { markTopicComplete(nextTopicData.topic.id); setExpandedTopicId(null); window.scrollTo({top: 0, behavior: 'smooth'}); }} 
                        onFailedCheck={() => { setTopicNeedsRevision(nextTopicData.topic.id); setExpandedTopicId(null); }}
                        activeBlockers={getChatData(nextTopicData.topic.id).blockers} 
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="glass p-10 rounded-[3rem] border border-emerald-500/30 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
                  <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center mb-8 border border-emerald-500/20">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                  </div>
                  <h3 className="text-4xl font-black mb-4">Curriculum Accomplished</h3>
                  <p className="text-slate-400 max-w-sm mb-10 text-lg leading-relaxed">You've successfully navigated every module in this mastery path. Ready to explore a new dimension of your career?</p>
                  <button onClick={() => setViewMode('create')} className="px-12 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black shadow-xl shadow-emerald-600/20 transition-all">Explore New Horizons</button>
                </div>
              )}
            </div>
          </div>

          {/* UPCOMING TOPICS - Fully accessible list */}
          {upcomingTopics.length > 0 && (
            <div className="space-y-8 pt-10">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-2xl font-black flex items-center gap-3">
                  Upcoming Roadmap
                  <span className="text-xs font-bold text-slate-600 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 uppercase tracking-widest">{upcomingTopics.length} Modules</span>
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {upcomingTopics.map((t) => {
                  return (
                    <div 
                      key={t.id} 
                      onClick={() => setExpandedTopicId(t.id)}
                      className="p-6 glass rounded-[2rem] border border-slate-800 hover:border-indigo-500/30 transition-all group relative cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-indigo-500/30 transition-all">
                          <Clock className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.estimated_minutes} MIN</span>
                          <span className={`text-[8px] font-black uppercase mt-1 ${t.difficulty_level === 'beginner' ? 'text-emerald-500' : t.difficulty_level === 'intermediate' ? 'text-amber-500' : 'text-rose-500'}`}>{t.difficulty_level}</span>
                        </div>
                      </div>
                      <h4 className="font-bold text-slate-200 mb-2 truncate group-hover:text-white transition-colors">{t.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{t.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : viewMode === 'manager' ? (
        /*MANAGER VIEW*/
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {paths.map(p => (
            <div key={p.id} className="glass p-8 rounded-[2.5rem] border border-slate-800 hover:border-indigo-500/30 transition-all flex flex-col group relative overflow-hidden h-full">
              {p.id === activePathId && <div className="absolute top-0 right-0 m-6 w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-pulse" />}
              
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-slate-400" />
                  </div>
                  <h3 className="text-2xl font-black line-clamp-1">{p.title}</h3>
                </div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest line-clamp-1">Focus: {p.goal_role}</p>
                <p className="text-sm text-slate-400 mt-4 line-clamp-3 leading-relaxed">{p.description}</p>
              </div>
              
              <div className="mt-auto space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <span>Path Mastery</span>
                    <span>{p.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full bg-indigo-600 rounded-full transition-all duration-700" style={{ width: `${p.progress}%` }} />
                  </div>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button onClick={() => selectPath(p.id)} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${p.id === activePathId ? 'bg-indigo-600 text-white shadow-lg' : 'glass text-slate-300 hover:bg-slate-800'}`}>
                    {p.id === activePathId ? 'Active Focus' : 'Focus on Path'}
                  </button>
                  <button onClick={() => deletePath(p.id)} className="p-3 glass rounded-xl text-slate-600 hover:text-rose-500 hover:border-rose-500/20 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          <button 
            onClick={() => { setViewMode('create'); resetForm(); }}
            className="p-8 rounded-[2.5rem] border-2 border-dashed border-slate-800 flex flex-col items-center justify-center gap-4 text-slate-500 hover:text-indigo-400 hover:border-indigo-500/50 transition-all bg-slate-900/10 group h-full min-h-[300px]"
          >
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-indigo-600/20 transition-all group-hover:scale-110">
              <Plus className="w-8 h-8" />
            </div>
            <div className="text-center">
              <span className="font-black text-xl block mb-1">Architect New Path</span>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">AI or Manual Builder</span>
            </div>
          </button>
        </div>
      ) : (
        /*CREATE VIEW*/
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="glass p-10 lg:p-14 rounded-[3.5rem] border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5">
              <Sparkles className="w-48 h-48 text-indigo-400" />
            </div>

            <div className="flex bg-slate-900/50 p-1.5 rounded-2xl mb-14 border border-slate-800 max-w-sm mx-auto shadow-inner">
              <button onClick={() => setCreationMode('ai')} className={`flex-1 py-3.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${creationMode === 'ai' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>
                <Zap className="w-4 h-4" /> AI GENERATOR
              </button>
              <button onClick={() => setCreationMode('manual')} className={`flex-1 py-3.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${creationMode === 'manual' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>
                <Settings2 className="w-4 h-4" /> MANUAL
              </button>
            </div>

            <div className="space-y-10 relative z-10">
              {creationMode === 'ai' ? (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="text-center mb-10">
                    <h3 className="text-3xl font-black mb-3">AI Learning Path Generator</h3>
                    <p className="text-slate-400 font-medium">Let AI create a personalized learning path based on your target role</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3 md:col-span-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        Target Role <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. Full-Stack Developer, Data Scientist, AI Engineer" 
                        value={newPathTitle}
                        onChange={(e) => setNewPathTitle(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
                      />
                    </div>

                    <div className="space-y-3 md:col-span-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Description (Optional)</label>
                      <textarea 
                        placeholder="Describe your learning goals, what you want to achieve, or any specific focus areas..."
                        value={newPathDesc}
                        onChange={(e) => setNewPathDesc(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-indigo-500 transition-all min-h-[120px] resize-none shadow-inner"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Scope (Optional)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Beginner to Pro, Frontend only" 
                        value={newPathScope}
                        onChange={(e) => setNewPathScope(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Timeline (months)</label>
                      <div className="flex items-center gap-4">
                        <input 
                          type="range"
                          min="1"
                          max="24"
                          value={newPathTimeline}
                          onChange={(e) => setNewPathTimeline(e.target.value)}
                          className="flex-1 accent-indigo-500"
                        />
                        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center font-black text-indigo-400 border border-slate-700">
                          {newPathTimeline}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 md:col-span-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Technologies (Optional)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. React, Node.js, Python, AWS" 
                        value={newPathTechs}
                        onChange={(e) => setNewPathTechs(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
                      />
                    </div>

                    <div className="md:col-span-2 pt-4">
                      <div className="p-6 glass rounded-[2.5rem] border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                            <Info className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-black text-slate-200">Use Profile Data</p>
                            <p className="text-xs text-slate-500 font-medium">AI will consider your skills and experience</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setUseProfileData(!useProfileData)}
                          className="transition-transform active:scale-95"
                        >
                          {useProfileData ? (
                            <ToggleRight className="w-14 h-14 text-indigo-500" />
                          ) : (
                            <ToggleLeft className="w-14 h-14 text-slate-700" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="text-center mb-10">
                    <h3 className="text-3xl font-black mb-3">Manual Path Architect</h3>
                    <p className="text-slate-400 font-medium">Design every module of your custom curriculum</p>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Curriculum Title</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Master Backend Design Patterns" 
                        value={newPathTitle}
                        onChange={(e) => setNewPathTitle(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
                      />
                    </div>

                    <div className="space-y-6">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Learning Topics</label>
                      <div className="space-y-4">
                        {manualTopics.map((topic, idx) => (
                          <div key={idx} className="flex gap-4 group">
                            <div className="flex-1 relative">
                              <input 
                                type="text" 
                                placeholder={`Module ${idx + 1} focus area...`}
                                value={topic}
                                onChange={(e) => {
                                  const updated = [...manualTopics];
                                  updated[idx] = e.target.value;
                                  setManualTopics(updated);
                                }}
                                className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-indigo-500 transition-all pr-12"
                              />
                            </div>
                            {manualTopics.length > 1 && (
                              <button 
                                onClick={() => setManualTopics(manualTopics.filter((_, i) => i !== idx))}
                                className="p-4 glass rounded-2xl text-slate-600 hover:text-rose-500 transition-all"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button 
                          onClick={() => setManualTopics([...manualTopics, ''])}
                          className="flex items-center gap-3 px-8 py-4 glass border-dashed border-2 border-slate-800 rounded-2xl text-sm font-black text-slate-500 hover:text-indigo-400 hover:border-indigo-500/50 transition-all w-full justify-center group"
                        >
                          <Plus className="w-5 h-5 group-hover:scale-125 transition-transform" />
                          Add Module Topic
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-12 flex flex-col sm:flex-row gap-4 border-t border-slate-800">
                <button 
                  onClick={() => setViewMode('manager')}
                  className="flex-1 py-4 glass border-slate-800 text-slate-500 hover:text-white rounded-2xl font-black text-sm transition-all"
                >
                  Discard Changes
                </button>
                <button 
                  onClick={creationMode === 'ai' ? handleGenerateAIPath : handleCreateManualPath}
                  disabled={isGenerating || !newPathTitle}
                  className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl font-black text-lg shadow-2xl shadow-indigo-600/30 flex items-center justify-center gap-4 transition-all"
                >
                  {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : creationMode === 'ai' ? <Sparkles className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                  {creationMode === 'ai' ? 'Generate Learning Path' : 'Finalize Curriculum'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningView;
