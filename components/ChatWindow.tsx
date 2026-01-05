
import React, { useState, useRef, useEffect } from 'react';
import { Message, UserPreferences, Partner, PracticeMode } from '../types';
import { Send, X, ShieldAlert, Sparkles, Languages, CheckCircle2 } from 'lucide-react';
import { gemini } from '../services/gemini';

interface Props {
  prefs: UserPreferences;
  partner: Partner;
  onEnd: () => void;
}

export const ChatWindow: React.FC<Props> = ({ prefs, partner, onEnd }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'sys-1',
      sender: 'system',
      text: `Connected with an anonymous ${partner.nativeLanguage} native. Mistakes are welcome!`,
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, isTyping]);

  const addMessage = (msg: Omit<Message, 'id' | 'timestamp'>) => {
    setMessages(prev => [...prev, {
      ...msg,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    }]);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setInput('');
    addMessage({ sender: 'me', text: userText });

    // Moderation check
    const isSafe = await gemini.moderateContent(userText);
    if (!isSafe) {
       addMessage({ sender: 'system', text: "Message blocked: Please keep the conversation respectful and safe.", isModerated: true });
       return;
    }

    setIsTyping(true);
    try {
      const response = await gemini.sendMessage(userText);
      setIsTyping(false);
      if (response) {
        addMessage({ sender: 'partner', text: response });
      }
    } catch (err) {
      setIsTyping(false);
      addMessage({ sender: 'system', text: "Partner disconnected or error occurred." });
    }
  };

  const handleTranslate = async (msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg || msg.translation) return;

    const translation = await gemini.translateText(msg.text, prefs.nativeLanguage);
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, translation } : m));
  };

  const handleCorrect = async (msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg || msg.correction) return;

    const correction = await gemini.checkGrammar(msg.text, prefs.practiceLanguage);
    if (correction !== "Looks perfect!") {
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, correction } : m));
    } else {
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, correction: "Perfect! ✓" } : m));
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] max-w-2xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 gradient-bg rounded-full flex items-center justify-center text-white font-bold">
            {partner.nativeLanguage[0]}
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Anonymous Partner</h3>
            <p className="text-xs text-green-500 font-medium">Online • {prefs.practiceLanguage} Native</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => alert("Reporting feature coming soon.")} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors rounded-lg" title="Report">
            <ShieldAlert size={20} />
          </button>
          <button onClick={onEnd} className="p-2 hover:bg-gray-100 text-gray-400 hover:text-gray-800 transition-colors rounded-lg" title="End Chat">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#fcfdff]">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : msg.sender === 'system' ? 'items-center' : 'items-start'}`}>
            {msg.sender === 'system' ? (
              <span className={`px-4 py-1.5 rounded-full text-xs font-medium ${msg.isModerated ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                {msg.text}
              </span>
            ) : (
              <div className="max-w-[85%] space-y-1">
                <div className={`group relative p-4 rounded-2xl shadow-sm ${
                  msg.sender === 'me' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  
                  {/* Tool Actions */}
                  <div className={`absolute top-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${msg.sender === 'me' ? '-left-16' : '-right-16'}`}>
                    <button 
                        onClick={() => handleTranslate(msg.id)}
                        className="p-1.5 bg-white border border-gray-100 rounded-full shadow-md text-gray-400 hover:text-indigo-600 transition-all"
                        title="Translate"
                    >
                        <Languages size={14} />
                    </button>
                    {msg.sender === 'me' && (
                        <button 
                            onClick={() => handleCorrect(msg.id)}
                            className="p-1.5 bg-white border border-gray-100 rounded-full shadow-md text-gray-400 hover:text-teal-600 transition-all"
                            title="Grammar Check"
                        >
                            <Sparkles size={14} />
                        </button>
                    )}
                  </div>
                </div>

                {/* AI Features Display */}
                {msg.translation && (
                  <div className="flex items-start gap-1 text-[11px] text-gray-400 bg-gray-50 p-2 rounded-lg italic">
                    <Languages size={10} className="mt-0.5" />
                    <span>{msg.translation}</span>
                  </div>
                )}
                {msg.correction && (
                  <div className={`flex items-start gap-1 text-[11px] p-2 rounded-lg ${msg.correction.includes('Perfect') ? 'text-teal-600 bg-teal-50' : 'text-amber-600 bg-amber-50'}`}>
                    <CheckCircle2 size={10} className="mt-0.5" />
                    <span>{msg.correction}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex items-start gap-2">
            <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse"></div>
            <div className="bg-gray-100 h-10 w-24 rounded-2xl animate-pulse"></div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message in ${prefs.practiceLanguage}...`}
            className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </form>
        <div className="flex justify-between items-center mt-3 px-1">
          <p className="text-[10px] text-gray-400">Mistakes welcome • Ephemeral chat</p>
          <div className="flex gap-2">
             <span className="text-[10px] font-semibold text-indigo-500 px-2 py-0.5 bg-indigo-50 rounded-full">{prefs.mode}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
