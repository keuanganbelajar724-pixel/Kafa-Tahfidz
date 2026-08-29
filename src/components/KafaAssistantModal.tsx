import React, { useState, useRef, useEffect } from 'react';
import { useKafa } from '../context/KafaContext';
import { 
  X, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Lightbulb, 
  RotateCcw,
  BookOpen,
  Volume2
} from 'lucide-react';

interface KafaAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

const PRESET_QUESTIONS = [
  "🎯 Apa target hafalan saya hari ini?",
  "💡 Tips agar ayat cepat nempel & tidak mudah lupa",
  "🔁 Kenapa kita harus sering muraja'ah?",
  "✨ Beri saya kata-kata penyemangat menghafal!",
];

export const KafaAssistantModal: React.FC<KafaAssistantModalProps> = ({ isOpen, onClose }) => {
  const { activeProfile } = useKafa();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      sender: 'ai',
      text: `Assalamu'alaikum ${activeProfile.name}! 👋 Aku Kak Kafa, mentor Al-Qur'anmu. Ada yang ingin kamu tanyakan tentang hafalan, tips muraja'ah, atau butuh semangat hari ini?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/kafa-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          childName: activeProfile.name,
          level: activeProfile.levelName,
          currentSurah: "An-Naba'",
        }),
      });

      const data = await response.json();
      const aiReply: Message = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: data.reply || "Masya Allah, tetap semangat terus ya menghafal Al-Qur'an!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiReply]);
    } catch {
      const fallbackReply: Message = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: `Masya Allah ${activeProfile.name}, hafalan yang terbaik adalah yang diulang-ulang dengan penuh cinta. Dengarkan murottal 3 kali, lalu tirukan perlahan-lahan ya! 🌟`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full h-[620px] max-h-[90vh] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden relative">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-xs">
              🤖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight">Kak Kafa AI Mentor</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-400/30 text-emerald-100 text-[10px] font-bold">
                  Online
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-medium">
                Teman setia hafalan Al-Qur'an {activeProfile.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message history */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
          {messages.map((m) => {
            const isAi = m.sender === 'ai';
            return (
              <div
                key={m.id}
                className={`flex gap-2.5 sm:gap-3 ${isAi ? 'justify-start' : 'justify-end'}`}
              >
                {isAi && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shrink-0 shadow-xs text-sm">
                    🤖
                  </div>
                )}

                <div className={`max-w-[82%] sm:max-w-[75%] space-y-1`}>
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      isAi
                        ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 shadow-xs rounded-tl-xs'
                        : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 rounded-tr-xs font-medium'
                    }`}
                  >
                    {m.text}
                  </div>
                  <div
                    className={`text-[10px] text-slate-400 px-1 ${
                      isAi ? 'text-left' : 'text-right'
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>

                {!isAi && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 text-sm font-bold">
                    {activeProfile.avatar}
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-2.5 sm:gap-3 items-center text-slate-400 text-xs">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shrink-0 text-sm">
                🤖
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                  Kak Kafa sedang berpikir...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Preset suggestions */}
        <div className="p-2.5 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex gap-2 overflow-x-auto no-scrollbar">
          {PRESET_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => sendMessage(q)}
              className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold whitespace-nowrap hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition shrink-0"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Tanya Kak Kafa... (Contoh: "Bantu hafalkan ayat 1-3")`}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition"
          />
          <button
            type="button"
            onClick={() => sendMessage(inputValue)}
            disabled={!inputValue.trim() || isLoading}
            className={`p-3 rounded-2xl text-white transition transform active:scale-95 shadow-md ${
              !inputValue.trim() || isLoading
                ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-50'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
