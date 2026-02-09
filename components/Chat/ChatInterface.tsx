
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Trash2, Sparkles } from 'lucide-react';
import { ChatMessage, MessageRole, UserCareerProfile } from '../../types';
import { geminiService } from '../../services/geminiService';
import { dbService } from '../../services/dbService';

interface ChatInterfaceProps {
  profile: UserCareerProfile;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ profile }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = dbService.getMessages(profile.userId);
    setMessages(saved);
  }, [profile.userId]);

  useEffect(() => {
    if (messages.length > 0) {
      dbService.saveMessages(profile.userId, messages);
    }
  }, [messages, profile.userId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      content: textToSend,
      timestamp: Date.now()
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await geminiService.chat(updatedMessages.map(m => ({ role: m.role, content: m.content })), profile);
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.ASSISTANT,
        content: response,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (window.confirm("Clear all messages?")) {
      setMessages([]);
      dbService.saveMessages(profile.userId, []);
    }
  };

  const parseOptions = (content: string) => {
    const optionsMatch = content.match(/OPTIONS:\s*\[(.*?)\]/i);
    if (optionsMatch) return optionsMatch[1].split(',').map(o => o.trim());
    return null;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Assistant Session</h3>
        {messages.length > 0 && (
          <button onClick={clearChat} className="text-xs text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors">
            <Trash2 className="w-3 h-3" /> Clear History
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 pb-8 px-2 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-20 h-20 rounded-3xl bg-indigo-600/20 flex items-center justify-center border border-indigo-500/20">
              <Sparkles className="w-10 h-10 text-indigo-400" />
            </div>
            <div className="max-w-md">
              <h3 className="text-2xl font-bold mb-2">Hello, {profile.job_role || 'Explorer'}</h3>
              <p className="text-slate-400">
                How can I help you progress toward being a {profile.target_roles[0]} today?
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
              {["Map my next career move", "How do I clear my current blockers?", "Analyze my target role match", "Suggest a revision for a weak skill"].map(q => (
                <button key={q} onClick={() => handleSend(q)} className="px-4 py-3 glass rounded-xl text-xs font-bold hover:border-indigo-500 hover:bg-indigo-500/10 transition-all text-left border-slate-800">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.role === MessageRole.USER ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
              msg.role === MessageRole.USER ? 'bg-indigo-600' : 'bg-slate-800 border border-slate-700'
            }`}>
              {msg.role === MessageRole.USER ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-indigo-400" />}
            </div>
            <div className="max-w-[85%] lg:max-w-[75%] space-y-2">
              <div className={`px-5 py-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                msg.role === MessageRole.USER ? 'bg-indigo-600 text-white rounded-tr-none' : 'glass text-slate-200 rounded-tl-none border-slate-800'
              }`}>
                <div className="whitespace-pre-wrap">{msg.content.replace(/QUESTION:.*|OPTIONS:.*|#BLOCKER_DETECTED|#READY_FOR_VALIDATION/gi, '').trim()}</div>
              </div>
              {msg.role === MessageRole.ASSISTANT && parseOptions(msg.content) && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {parseOptions(msg.content)?.map(option => (
                    <button key={option} onClick={() => handleSend(option)} className="px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/5 text-[10px] font-bold text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all">{option}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
            <div className="glass px-5 py-4 rounded-2xl rounded-tl-none flex items-center gap-2 border-slate-800">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-800 bg-[#0f172a] pb-4">
        <div className="relative glass rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 transition-all border-slate-800">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Type your message..."
            className="w-full bg-transparent p-4 pr-16 text-sm focus:outline-none resize-none min-h-[56px] max-h-32 text-slate-200"
            rows={1}
          />
          <button onClick={() => handleSend()} disabled={!input.trim() || isLoading} className={`absolute right-3 bottom-3 p-2 rounded-xl transition-all ${input.trim() && !isLoading ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}><Send className="w-5 h-5" /></button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
