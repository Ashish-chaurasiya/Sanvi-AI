
import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Search, 
  Filter,
  CheckCircle,
  Building2,
  ExternalLink,
  Sparkles,
  Loader2,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Target
} from 'lucide-react';
import { UserCareerProfile } from '../../types';
import { geminiService } from '../../services/geminiService';

interface JobMatchViewProps {
  profile: UserCareerProfile;
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  matchPercentage: number;
  missingSkills: string[];
  sourceUrl: string;
}

const JobMatchView: React.FC<JobMatchViewProps> = ({ profile }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [grounding, setGrounding] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchMatches = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await geminiService.findJobs(profile);
      setJobs(result.jobs);
      setGrounding(result.grounding);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch real-time jobs. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (profile.onboarding_completed) {
      fetchMatches();
    }
  }, [profile.userId]);

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Smart Career Matching</h2>
          <p className="text-slate-400 mt-2">Discover real-time opportunities tailored to your unique profile.</p>
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <button 
            onClick={fetchMatches}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh Jobs
          </button>
        </div>
      </div>

      {!profile.onboarding_completed ? (
        <div className="glass p-12 rounded-[2.5rem] border border-amber-500/20 text-center space-y-6">
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-10 h-10 text-amber-500" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-2xl font-black">Profile Incomplete</h3>
            <p className="text-slate-400 mt-2">Complete your career onboarding to unlock personalized job matching with real-time AI analysis.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Stats & Intelligence Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass p-8 rounded-[2rem] border border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-6 flex items-center gap-2">
                <Target className="w-4 h-4" /> Market Fit
              </h3>
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Target Focus</p>
                  <p className="text-sm font-black text-slate-200">{profile.target_roles[0]}</p>
                </div>
                <div className="pt-4 border-t border-slate-800">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-3">Core Technical Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.slice(0, 6).map(s => (
                      <span key={s.name} className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-400">
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 p-8 rounded-[2rem] border border-indigo-500/20">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">AI Intelligence</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-6 italic">
                "We found that most companies hiring for {profile.target_roles[0]} roles are currently prioritizing candidates with System Design proficiency. Consider adding a specialized module to your roadmap."
              </p>
              <button className="w-full py-3 bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 rounded-xl text-xs font-black hover:bg-indigo-600 hover:text-white transition-all">
                Update Learning Path
              </button>
            </div>
          </div>

          {/* Job Listing Panel */}
          <div className="lg:col-span-3 space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-6 glass rounded-[3rem] border border-slate-800">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
                  <Loader2 className="w-12 h-12 text-indigo-400 animate-spin relative z-10" />
                </div>
                <div className="text-center">
                  <p className="text-xl font-black text-slate-200">Searching the live web...</p>
                  <p className="text-sm text-slate-500 mt-1">Cross-referencing your profile with live opportunities.</p>
                </div>
              </div>
            ) : jobs.length > 0 ? (
              <>
                {jobs.map(job => (
                  <div 
                    key={job.id} 
                    className="glass p-8 rounded-[2.5rem] border border-slate-800 hover:border-indigo-500/30 transition-all group flex flex-col md:flex-row gap-8 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-indigo-600/10 transition-all" />
                    
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-all shadow-lg">
                      <Building2 className="w-8 h-8 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                    </div>

                    <div className="flex-1 space-y-4 relative z-10">
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="text-2xl font-black group-hover:text-indigo-400 transition-colors">{job.title}</h3>
                          <div className="text-right">
                            <span className="text-[10px] font-black text-slate-500 uppercase block">Match Confidence</span>
                            <span className={`text-2xl font-black ${job.matchPercentage > 90 ? 'text-emerald-400' : 'text-indigo-400'}`}>{job.matchPercentage}%</span>
                          </div>
                        </div>
                        <p className="font-bold text-slate-400 flex items-center gap-2">
                          {job.company}
                          <span className="w-1 h-1 rounded-full bg-slate-700" />
                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.location}</span>
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-4 py-2">
                        <div className="space-y-2 w-full">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <AlertTriangle className="w-3 h-3 text-amber-500" /> Your Skills Gap
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {job.missingSkills.map(skill => (
                              <span key={skill} className="px-3 py-1 bg-amber-500/5 border border-amber-500/20 rounded-lg text-[10px] font-bold text-amber-500">
                                + {skill}
                              </span>
                            ))}
                            {job.missingSkills.length === 0 && <span className="text-xs text-emerald-400 font-bold">Perfect Skill Match!</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="md:self-center flex flex-col gap-3 min-w-[140px]">
                      <a 
                        href={job.sourceUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
                      >
                        Apply Now
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button className="w-full px-6 py-3 glass border-slate-800 text-slate-500 hover:text-white rounded-xl text-xs font-black transition-all">
                        Save Job
                      </button>
                    </div>
                  </div>
                ))}
                
                {grounding.length > 0 && (
                  <div className="mt-12 p-8 glass rounded-3xl border border-slate-800">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" /> Search Verification Sources
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {grounding.map((chunk, i) => (
                        chunk.web && (
                          <a 
                            key={i} 
                            href={chunk.web.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-indigo-500/50 transition-all group flex items-center justify-between"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-300 truncate group-hover:text-white">{chunk.web.title}</p>
                              <p className="text-[10px] text-slate-500 truncate">{chunk.web.uri}</p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-slate-700 group-hover:text-indigo-400 shrink-0 ml-4" />
                          </a>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-32 text-center glass rounded-[3rem] border border-slate-800 border-dashed">
                <Search className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500 font-bold">No active job matches found in this region.</p>
                <button onClick={fetchMatches} className="mt-4 text-indigo-400 font-black text-sm hover:underline">Try searching again</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobMatchView;
