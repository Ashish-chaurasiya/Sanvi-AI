
import React, { useState } from 'react';
import { 
  GraduationCap, 
  Briefcase, 
  Code, 
  Target, 
  MousePointer2, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2,
  X,
  Sparkles
} from 'lucide-react';
import { UserCareerProfile, Skill } from '../../types';

interface OnboardingWizardProps {
  onComplete: (profile: UserCareerProfile) => void;
  onClose?: () => void;
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete, onClose }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 5;
  const [formData, setFormData] = useState<Partial<UserCareerProfile>>({
    skills: [],
    target_roles: [],
    learning_style: 'self-paced'
  });

  const nextStep = () => setStep(s => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleFinish = () => {
    onComplete({
      ...formData as UserCareerProfile,
      id: 'user-' + Math.random().toString(36).substr(2, 9),
      onboarding_completed: true
    });
  };

  const addSkill = (name: string) => {
    if (!name.trim()) return;
    if (formData.skills?.find(s => s.name.toLowerCase() === name.toLowerCase())) return;
    setFormData({
      ...formData,
      skills: [...(formData.skills || []), { name, level: 'intermediate' }]
    });
  };

  const removeSkill = (name: string) => {
    setFormData({
      ...formData,
      skills: (formData.skills || []).filter(s => s.name !== name)
    });
  };

  const toggleTargetRole = (role: string) => {
    const current = formData.target_roles || [];
    if (current.includes(role)) {
      setFormData({ ...formData, target_roles: current.filter(r => r !== role) });
    } else {
      setFormData({ ...formData, target_roles: [...current, role] });
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 flex items-center justify-center mx-auto mb-4 border border-indigo-500/30">
                <GraduationCap className="w-8 h-8 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold">Educational Background</h2>
              <p className="text-slate-400">Tell us about your foundation</p>
            </div>
            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Highest Degree</label>
                <input 
                  type="text" 
                  placeholder="e.g. B.S. in Computer Science"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={formData.education_degree || ''}
                  onChange={(e) => setFormData({...formData, education_degree: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Field of Study</label>
                <input 
                  type="text" 
                  placeholder="e.g. Software Engineering"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={formData.education_field || ''}
                  onChange={(e) => setFormData({...formData, education_field: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Graduation Year</label>
                <input 
                  type="number" 
                  placeholder="2024"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={formData.graduation_year || ''}
                  onChange={(e) => setFormData({...formData, graduation_year: parseInt(e.target.value)})}
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 flex items-center justify-center mx-auto mb-4 border border-indigo-500/30">
                <Briefcase className="w-8 h-8 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold">Work Experience</h2>
              <p className="text-slate-400">Your professional footprint</p>
            </div>
            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Current / Last Job Role</label>
                <input 
                  type="text" 
                  placeholder="e.g. Junior Web Developer"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={formData.job_role || ''}
                  onChange={(e) => setFormData({...formData, job_role: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Employment Status</label>
                <select 
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                  value={formData.employment_status || ''}
                  onChange={(e) => setFormData({...formData, employment_status: e.target.value})}
                >
                  <option value="">Select Status</option>
                  <option value="employed">Employed</option>
                  <option value="student">Student</option>
                  <option value="self-employed">Self-Employed</option>
                  <option value="unemployed">Searching for Opportunities</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Years of Experience</label>
                <input 
                  type="number" 
                  placeholder="e.g. 3"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={formData.years_of_experience || ''}
                  onChange={(e) => setFormData({...formData, years_of_experience: parseInt(e.target.value)})}
                />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 flex items-center justify-center mx-auto mb-4 border border-indigo-500/30">
                <Code className="w-8 h-8 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold">Skills & Proficiencies</h2>
              <p className="text-slate-400">What are you good at?</p>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Add a skill (press Enter)..."
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[100px] p-4 glass rounded-xl border-dashed border-2 border-slate-700">
                {(formData.skills || []).length === 0 && <p className="text-slate-500 text-sm italic m-auto">No skills added yet</p>}
                {(formData.skills || []).map((s) => (
                  <div 
                    key={s.name} 
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600/20 border border-indigo-500/30 rounded-lg text-sm group"
                  >
                    <span>{s.name}</span>
                    <button 
                      onClick={() => removeSkill(s.name)}
                      className="hover:text-rose-400 text-slate-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="pt-2">
                <p className="text-xs text-slate-500 mb-2 font-medium">Suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {['React', 'Python', 'UX Design', 'Project Management', 'Data Analysis'].map(suggestion => (
                    <button 
                      key={suggestion}
                      onClick={() => addSkill(suggestion)}
                      className="text-xs px-2.5 py-1 rounded-full border border-slate-700 hover:border-indigo-500 hover:bg-indigo-500/10 transition-all"
                    >
                      + {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 flex items-center justify-center mx-auto mb-4 border border-indigo-500/30">
                <Target className="w-8 h-8 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold">Career Intent</h2>
              <p className="text-slate-400">Where do you want to go?</p>
            </div>
            <div className="space-y-5">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-300">Target Roles (select multiple)</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Senior Developer', 'Product Manager', 'Data Scientist', 'CTO', 'Engineering Manager', 'Freelancer'].map(role => (
                    <button
                      key={role}
                      onClick={() => toggleTargetRole(role)}
                      className={`
                        px-4 py-2.5 rounded-xl border text-sm font-medium transition-all text-left
                        ${formData.target_roles?.includes(role) 
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
                          : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-indigo-500/50'}
                      `}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Short-term Goal (1-2 years)</label>
                <textarea 
                  placeholder="e.g. Master cloud architecture and lead a team of 3"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none h-20"
                  value={formData.short_term_goal || ''}
                  onChange={(e) => setFormData({...formData, short_term_goal: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Long-term Vision</label>
                <textarea 
                  placeholder="e.g. Founded my own tech-ed startup"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none h-20"
                  value={formData.long_term_goal || ''}
                  onChange={(e) => setFormData({...formData, long_term_goal: e.target.value})}
                />
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 flex items-center justify-center mx-auto mb-4 border border-indigo-500/30">
                <MousePointer2 className="w-8 h-8 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold">Preferences</h2>
              <p className="text-slate-400">How do you prefer to grow?</p>
            </div>
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-300">Preferred Learning Style</label>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { id: 'self-paced', label: 'Self-paced / Research-based', desc: 'I like reading and exploring at my own speed.' },
                    { id: 'mentor-led', label: 'Mentor-led / Interactive', desc: 'I prefer guided sessions and feedback.' },
                    { id: 'hands-on', label: 'Hands-on / Project-based', desc: 'I learn by building real things.' },
                    { id: 'academic', label: 'Academic / Structured', desc: 'I prefer theory and formal courses.' },
                  ].map(style => (
                    <button
                      key={style.id}
                      onClick={() => setFormData({...formData, learning_style: style.id as any})}
                      className={`
                        p-4 rounded-xl border transition-all text-left flex gap-4
                        ${formData.learning_style === style.id 
                          ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500' 
                          : 'bg-slate-900/50 border-slate-700 hover:border-slate-500'}
                      `}
                    >
                      <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        formData.learning_style === style.id ? 'border-white bg-white' : 'border-slate-600'
                      }`}>
                        {formData.learning_style === style.id && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
                      </div>
                      <div>
                        <p className={`font-semibold ${formData.learning_style === style.id ? 'text-indigo-400' : 'text-slate-300'}`}>{style.label}</p>
                        <p className="text-xs text-slate-500">{style.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="p-4 glass rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-600/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-indigo-400">Ready to start?</p>
                  <p className="text-slate-400 mt-1">We'll use these preferences to tailor your learning paths and AI interactions.</p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-2xl glass rounded-3xl overflow-hidden shadow-2xl border border-slate-800 relative">
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800 transition-all z-20"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-slate-900">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-500 ease-out"
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>

      <div className="p-8 lg:p-12">
        {renderStep()}

        <div className="mt-12 flex items-center justify-between pt-8 border-t border-slate-800">
          <div className="flex gap-4">
            <button
              onClick={prevStep}
              disabled={step === 1}
              className={`
                flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all
                ${step === 1 ? 'text-slate-600 cursor-not-allowed opacity-50' : 'text-slate-300 hover:text-white hover:bg-slate-800'}
              `}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            
            {step === 1 && onClose && (
               <button
               onClick={onClose}
               className="px-6 py-2.5 rounded-xl font-medium text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
             >
               Skip for now
             </button>
            )}
          </div>

          {step < totalSteps ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-600/20 transition-all"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl font-bold shadow-xl shadow-indigo-600/30 transition-all transform hover:scale-105"
            >
              Complete Setup
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
