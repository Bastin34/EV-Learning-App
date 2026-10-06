import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  MessageSquare,
  Bot,
  User,
  Zap,
  Activity,
  Layers,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

export const AITutorLab: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [level, setLevel] = useState<'Beginner' | 'Engineering' | 'Advanced' | 'Interview'>('Engineering');
  const [messages, setMessages] = useState<
    { sender: 'user' | 'tutor'; text: string; source?: string }[]
  >([
    {
      sender: 'tutor',
      text: `Hello! I am your lead Chief EV Powertrain & Systems AI Tutor for VOLTX.
      
Ask me any question regarding high-voltage architectures, Silicon Carbide inverters, FOC motor controls, battery electrochemistry, or pre-charge contactor sequencing. You can select your desired depth: **Beginner**, **Engineering**, **Advanced**, or **Interview**!`,
    },
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const sampleQuestions = [
    'Why do electric vehicles need a pre-charge circuit?',
    'What happens electrically when I press the accelerator pedal?',
    'Why use 800V architecture instead of 400V?',
    'Why choose a PMSM motor instead of an AC induction motor?',
    'How does regenerative braking recharge the battery during high speeds?',
    'How does a BMS calculate State of Charge using an Extended Kalman Filter?',
  ];

  const handleSend = async (questionText?: string) => {
    const textToSend = questionText || query;
    if (!textToSend.trim() || isLoading) return;

    setMessages((prev) => [...prev, { sender: 'user', text: textToSend }]);
    setQuery('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToSend, level }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { sender: 'tutor', text: data.answer || 'No response returned.', source: data.source },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'tutor',
          text: 'Unable to reach backend tutor service. Please check your network connection.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">AI EV Engineering Tutor & Research Engine</h2>
            <p className="text-xs text-slate-400">
              Technical Q&A across physical principles, circuit calculations & OEM interview formulations
            </p>
          </div>
        </div>

        {/* Level Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
          {(['Beginner', 'Engineering', 'Advanced', 'Interview'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
                level === l ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {l} Level
            </button>
          ))}
        </div>
      </div>

      {/* Suggested Quick Questions */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-400 mr-1">Suggested Inquiries:</span>
        {sampleQuestions.map((sq, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(sq)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs transition-colors"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl h-[520px] flex flex-col justify-between">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  msg.sender === 'user'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`p-4 rounded-2xl max-w-3xl text-xs leading-relaxed whitespace-pre-wrap ${
                  msg.sender === 'user'
                    ? 'bg-cyan-500/10 border border-cyan-500/30 text-slate-100'
                    : 'bg-slate-950/80 border border-slate-800 text-slate-300'
                }`}
              >
                {msg.text}
                {msg.source && (
                  <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 flex justify-between">
                    <span>Generated by {msg.source}</span>
                    <span>Level: {level}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                Synthesizing engineering explanation...
              </div>
            </div>
          )}
        </div>

        {/* Query Input Box */}
        <div className="pt-4 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Ask a question at the ${level} engineering level...`}
            className="flex-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={!query.trim() || isLoading}
            className="px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Ask Tutor</span>
          </button>
        </div>
      </div>
    </div>
  );
};
