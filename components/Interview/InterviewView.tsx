
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, PhoneOff, Play, Info, Award, MessageSquare, Loader2, Sparkles } from 'lucide-react';
import { UserCareerProfile } from '../../types';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai'; // Fix: Corrected imports from @google/genai

interface InterviewViewProps {
  profile: UserCareerProfile;
}

// Implement base64 encoding/decoding as per API requirements
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const InterviewView: React.FC<InterviewViewProps> = ({ profile }) => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcriptions, setTranscriptions] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const startInterview = async () => {
    if (isSessionActive || isConnecting) return;
    setIsConnecting(true);
    setTranscriptions([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const outCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const inCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = outCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inCtx.createMediaStreamSource(stream);
            const scriptProcessor = inCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inCtx.destination);
            setIsSessionActive(true);
            setIsConnecting(false);
          },
          onmessage: async (message: LiveServerMessage) => { // Fix: Typed message as LiveServerMessage
            // Audio output
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && audioContextRef.current) {
              const ctx = audioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            // Transcription
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setTranscriptions(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'ai') {
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...last, text: last.text + text };
                  return updated;
                }
                return [...prev, { role: 'ai', text }];
              });
            } else if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              setTranscriptions(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'user') {
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...last, text: last.text + text };
                  return updated;
                }
                return [...prev, { role: 'user', text }];
              });
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => setIsSessionActive(false),
          onerror: (e) => console.error("Session Error:", e),
        },
        config: {
          responseModalities: [Modality.AUDIO], // Fix: Used Modality.AUDIO from @google/genai
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: `You are a high-fidelity Senior Interviewer at a top tech company. 
          The user is applying for: ${profile.target_roles[0] || 'Software Engineer'}.
          Their background includes: ${profile.skills.map(s => s.name).join(', ')}.
          Conduct a realistic behavioral and technical interview. Be professional, challenging but fair.`
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setIsConnecting(false);
    }
  };

  const endInterview = () => {
    if (sessionRef.current) sessionRef.current.close();
    setIsSessionActive(false);
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Live Interview Coach</h2>
          <p className="text-slate-400 mt-2">Practice real-time technical and behavioral scenarios with low-latency AI.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Interview Stage */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass rounded-[3rem] border border-slate-800 p-12 relative overflow-hidden h-[500px] flex flex-col items-center justify-center bg-slate-900/40">
            {/* AI Visualizer Orb */}
            <div className="relative mb-12">
              <div className={`absolute inset-0 bg-indigo-500/20 blur-[120px] rounded-full scale-[2] transition-all duration-1000 ${isSessionActive ? 'animate-pulse opacity-100' : 'opacity-0'}`} />
              <div className={`w-40 h-40 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-400 to-pink-500 shadow-[0_0_50px_rgba(99,102,241,0.5)] flex items-center justify-center relative z-10 transition-transform duration-500 ${isSessionActive ? 'scale-110' : 'scale-100'}`}>
                {isSessionActive ? (
                  <div className="flex gap-1.5 items-end">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="w-1.5 bg-white/40 rounded-full animate-bounce" style={{ height: `${Math.random() * 40 + 20}px`, animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                ) : (
                  <Mic className="w-12 h-12 text-white" />
                )}
              </div>
            </div>

            <div className="text-center space-y-4 max-w-sm relative z-10">
              <h3 className="text-2xl font-black">
                {isSessionActive ? 'Interview in Progress' : isConnecting ? 'Initializing Neural Link...' : 'Ready for Practice?'}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {isSessionActive ? `The AI is currently evaluating your response for ${profile.target_roles[0] || 'the role'}.` : 'Prepare for a live technical session using high-fidelity voice. Speak naturally as you would in a real interview.'}
              </p>
            </div>

            <div className="absolute bottom-12 flex items-center gap-6">
              {!isSessionActive ? (
                <button 
                  onClick={startInterview}
                  disabled={isConnecting}
                  className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-lg shadow-2xl shadow-indigo-600/30 transition-all flex items-center gap-3 disabled:opacity-50"
                >
                  {isConnecting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6" />}
                  {isConnecting ? 'Connecting...' : 'Start Live Session'}
                </button>
              ) : (
                <button 
                  onClick={endInterview}
                  className="px-10 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-lg shadow-2xl shadow-rose-600/30 transition-all flex items-center gap-3"
                >
                  <PhoneOff className="w-6 h-6" />
                  End Session
                </button>
              )}
            </div>
          </div>

          {/* Transcription Feed */}
          {transcriptions.length > 0 && (
            <div className="glass p-8 rounded-[2.5rem] border border-slate-800 space-y-6">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Live Conversation Feed
              </h4>
              <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-4">
                {transcriptions.map((t, i) => (
                  <div key={i} className={`flex flex-col ${t.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] font-black text-slate-600 uppercase mb-1 ml-1">{t.role === 'user' ? 'You' : 'AI Recruiter'}</span>
                    <div className={`px-5 py-3 rounded-2xl text-sm ${t.role === 'user' ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/20' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                      {t.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Prep Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass p-8 rounded-[2.5rem] border border-slate-800">
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-6 flex items-center gap-2">
              <Award className="w-4 h-4" /> Prep Checklist
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Technical Accuracy', status: 'Good' },
                { label: 'Communication Clarity', status: 'Pending' },
                { label: 'Confidence Score', status: 'Low' },
                { label: 'Problem Solving', status: 'Pending' },
              ].map(stat => (
                <div key={stat.label} className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-400">{stat.label}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${stat.status === 'Good' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                    {stat.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 p-8 rounded-[2.5rem] border border-indigo-500/20 relative overflow-hidden">
            <Sparkles className="absolute top-4 right-4 w-12 h-12 text-indigo-500/10" />
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-200 mb-4">AI Pro Insight</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6 italic">
              "Based on your profile as a {profile.target_roles[0]}, expect questions about System Design and Cross-functional Leadership. The AI will push you on your '{profile.skills[0]?.name || 'primary skill'}' expertise today."
            </p>
            <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-black uppercase text-indigo-400">Pro Tip</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Use the STAR method for behavioral questions to score higher on the AI analysis.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewView;
