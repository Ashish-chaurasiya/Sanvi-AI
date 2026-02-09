
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Sparkles, CheckCircle2, AlertCircle, Loader2, RotateCcw, Target, BrainCircuit, X, Award } from 'lucide-react';
import { ChatMessage, MessageRole, LearningTopic, LessonBlocker, TopicChat, TopicStatus, SkillCheck, UserCareerProfile } from '../../types';
import { geminiService } from '../../services/geminiService';

interface LessonInlineChatProps {
  topic: LearningTopic;
  chatData: TopicChat;
  profile: UserCareerProfile;
  onUpdateChat: (topicId: string, updates: Partial<TopicChat>) => void;
  onMarkComplete: () => void;
  onFailedCheck: () => void;
  activeBlockers: LessonBlocker[];
}

const LessonInlineChat: React.FC<LessonInlineChatProps> = ({ 
  topic, 
  chatData, 
  profile,
  onUpdateChat, 
  onMarkComplete,
  onFailedCheck,
  activeBlockers
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatData.messages]);

  const handleSend = async (customInput?: string) => {
    const text = customInput || input;
    if (!text.trim() || isLoading || chatData.isLocked) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      content: text,
      timestamp: Date.now()
    };

    const newMessages = [...chatData.messages, userMsg];
    onUpdateChat(topic.id, { messages: newMessages });
    setInput('');
    setIsLoading(true);

    try {
      // Deeply personalized tutor chat
      const response = await geminiService.lessonTutorChat(topic, newMessages, activeBlockers, profile, chatData.mode);
      
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.ASSISTANT,
        content: response,
        timestamp: Date.now()
      };

      let blockers = [...chatData.blockers];
      if (response.includes('#BLOCKER_DETECTED')) {
        blockers.push({
          id: 'b-' + Date.now(),
          topicId: topic.id,
          text: response.split('#BLOCKER_DETECTED')[1]?.split('\n')[0].trim() || "Concept gap identified",
          resolved: false,
          createdAt: Date.now()
        });
      }

      onUpdateChat(topic.id, { 
        messages: [...newMessages, assistantMsg],
        blockers 
      });

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const startSkillCheck = async () => {
    setIsEvaluating(true);
    try {
      const questions = await geminiService.generateSkillCheck(topic);
      onUpdateChat(topic.id, {
        mode: 'skill-check',
        skillCheck: {
          id: 'sc-' + Date.now(),
          topicId: topic.id,
          questions,
          createdAt: Date.now()
        }
      });
      handleSend("Ready for my Skill Check. Please ask me the questions one by one.");
    } catch (e) {
      console.error(e);
    } finally {
      setIsEvaluating(false);
    }
  };

  const evaluatePerformance = async () => {
    setIsEvaluating(true);
    try {
      const results = await geminiService.evaluateSkillCheck(topic, chatData.messages);
      onUpdateChat(topic.id, {
        skillCheck: {
          ...chatData.skillCheck!,
          results
        }
      });

      if (results.passed) {
        onMarkComplete();
      } else {
        onFailedCheck();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleAddBlocker = () => {
    const blockerText = prompt("What's specifically blocking you?");
    if (blockerText) {
      const newBlocker: LessonBlocker = {
        id: 'b-' + Date.now(),
        topicId: topic.id,
        text: blockerText,
        resolved: false,
        createdAt: Date.now()
      };
      onUpdateChat(topic.id, { blockers: [...chatData.blockers, newBlocker] });
      handleSend(`I'm stuck: ${blockerText}`);
    }
  };

  const parseOptions = (content: string) => {
    const optionsMatch = content.match(/OPTIONS:\s*\[(.*?)\]/i);
    if (optionsMatch) return optionsMatch[1].split(',').map(o => o.trim());
    return null;
  };

  return (
    <div className="mt-6 flex flex-col space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
      {/* Mode Indicator */}
      <div className="flex items-center gap-3">
        <div className={`px-4 py-2 rounded-xl flex items-center gap-2 border transition-colors ${
          chatData.mode === 'revision' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 
          chatData.mode === 'skill-check' ? 'bg-pink-500/10 border-pink-500/30 text-pink-400' :
          'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
        }`}>
          {chatData.mode === 'revision' ? <RotateCcw className="w-4 h-4" /> : 
           chatData.mode === 'skill-check' ? <BrainCircuit className="w-4 h-4" /> :
           <Target className="w-4 h-4" />}
          <span className="text-xs font-bold uppercase tracking-widest">{chatData.mode} Active</span>
        </div>
        
        {chatData.skillCheck?.results && (
          <div className={`px-4 py-2 rounded-xl flex items-center gap-2 border ${chatData.skillCheck.results.passed ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
            <Award className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-widest">Score: {chatData.skillCheck.results.score}%</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="max-h-[500px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {chatData.messages.length === 0 && (
          <div className="py-8 text-center glass rounded-2xl border-dashed border-2 border-slate-800">
            <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-3 opacity-50" />
            <p className="text-sm text-slate-500">Start your {chatData.mode} session for "{topic.title}".</p>
            <button 
              onClick={() => handleSend("I'm ready.")}
              className="mt-4 px-6 py-2 bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 rounded-xl text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all"
            >
              Begin
            </button>
          </div>
        )}

        {chatData.messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === MessageRole.USER ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              msg.role === MessageRole.USER ? 'bg-indigo-600' : 'bg-slate-800 border border-slate-700'
            }`}>
              {msg.role === MessageRole.USER ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-indigo-400" />}
            </div>
            <div className="max-w-[85%] space-y-2">
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === MessageRole.USER 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'glass text-slate-200 rounded-tl-none border-slate-800 shadow-xl'
              }`}>
                <div className="whitespace-pre-wrap">
                  {msg.content.replace(/QUESTION:.*|OPTIONS:.*|#BLOCKER_DETECTED|#READY_FOR_VALIDATION/gi, '').trim()}
                </div>
              </div>

              {msg.content.includes('#READY_FOR_VALIDATION') && !chatData.isLocked && chatData.mode !== 'skill-check' && (
                <div className="p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl mt-4 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-xs text-indigo-400 font-bold mb-1 uppercase tracking-widest">Mastery Detected</p>
                      <p className="text-xs text-slate-400">You seem to have a solid grasp. To officially complete this module and unlock the next, let's verify with a Skill Check.</p>
                    </div>
                  </div>
                  <button 
                    onClick={startSkillCheck}
                    disabled={isEvaluating}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-500 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    {isEvaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                    Take Skill Check
                  </button>
                </div>
              )}
              
              {msg.role === MessageRole.ASSISTANT && parseOptions(msg.content) && !chatData.isLocked && (
                <div className="flex flex-wrap gap-2">
                  {parseOptions(msg.content)?.map(option => (
                    <button
                      key={option}
                      onClick={() => handleSend(option)}
                      className="px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/5 text-[10px] font-bold text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {chatData.skillCheck?.results && (
          <div className={`p-6 rounded-[2rem] border animate-in slide-in-from-bottom-4 duration-700 ${chatData.skillCheck.results.passed ? 'glass border-emerald-500/30' : 'glass border-rose-500/30'}`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${chatData.skillCheck.results.passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {chatData.skillCheck.results.passed ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h4 className={`text-lg font-black ${chatData.skillCheck.results.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {chatData.skillCheck.results.passed ? 'Skill Check Passed!' : 'Revision Needed'}
                  </h4>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Score: {chatData.skillCheck.results.score}%</p>
                </div>
                
                <p className="text-sm text-slate-300 leading-relaxed italic">"{chatData.skillCheck.results.feedback}"</p>
                
                {chatData.skillCheck.results.weakConcepts.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Focus Areas</p>
                    <div className="flex flex-wrap gap-2">
                      {chatData.skillCheck.results.weakConcepts.map(c => (
                        <span key={c} className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-400">{c}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Advisor's Advice</p>
                  <p className="text-xs text-slate-400">{chatData.skillCheck.results.actionableAdvice}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input or Locked State */}
      {!chatData.isLocked ? (
        <div className="space-y-3 pt-2">
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={chatData.mode === 'skill-check' ? "Answer the question..." : "Explain back or ask a question..."}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 pr-12 text-sm focus:outline-none focus:border-indigo-500 transition-all resize-none h-12"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading || isEvaluating}
              className={`absolute right-2 top-2 p-1.5 rounded-lg transition-all ${
                input.trim() && !isLoading && !isEvaluating ? 'text-indigo-400' : 'text-slate-700'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex gap-3">
            {chatData.mode === 'skill-check' ? (
              <button 
                onClick={evaluatePerformance}
                disabled={isEvaluating}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-pink-600/20 disabled:opacity-50"
              >
                {isEvaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                Submit Answers for Evaluation
              </button>
            ) : (
              <>
                <button 
                  onClick={startSkillCheck}
                  disabled={isEvaluating}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {isEvaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                  Final Skill Check
                </button>
                <button 
                  onClick={handleAddBlocker}
                  className="flex items-center gap-2 px-4 py-2.5 glass border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 rounded-xl text-xs font-bold transition-all"
                >
                  <AlertCircle className="w-4 h-4" />
                  Stuck?
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-[2rem] flex flex-col items-center text-center gap-2 animate-in fade-in duration-500">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <p className="text-sm font-black text-emerald-400 uppercase tracking-widest">Lesson Accomplished</p>
          <p className="text-xs text-slate-500">Mastery verified via skill check. You can move to the next module.</p>
        </div>
      )}
    </div>
  );
};

export default LessonInlineChat;
