
import React, { useState, useRef, useEffect } from 'react';
import { Message, UserPreferences, Partner, PracticeMode } from '../types';
import { Send, X, ShieldAlert, Sparkles, Languages, Mic, Square, Play, Pause, ImageIcon } from 'lucide-react';
import { gemini } from '../services/gemini';

interface Props {
  prefs: UserPreferences;
  partner: Partner;
  onEnd: () => void;
  onUpgradeRequest: () => void;
  updatePrefs: (newPrefs: UserPreferences) => void;
}

export const ChatWindow: React.FC<Props> = ({ prefs, partner, onEnd, onUpgradeRequest, updatePrefs }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'sys-1', sender: 'system', text: `Connected with an anonymous ${partner.nativeLanguage} native. Mistakes are welcome!`, timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, isTyping, isRecording]);

  const incrementUsage = (key: keyof UserPreferences['dailyUsage']) => {
    const newPrefs = { ...prefs };
    newPrefs.dailyUsage[key]++;
    updatePrefs(newPrefs);
  };

  const checkLimit = (key: keyof UserPreferences['dailyUsage'], limit: number) => {
    if (prefs.isPremium) return true;
    if (prefs.dailyUsage[key] >= limit) {
      onUpgradeRequest();
      return false;
    }
    return true;
  };

  const addMessage = (msg: Omit<Message, 'id' | 'timestamp'>) => {
    const newMsg = {
      ...msg,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, newMsg]);
    return newMsg;
  };

  const handleSend = async (e?: React.FormEvent, audioBase64?: string) => {
    if (e) e.preventDefault();
    if (!input.trim() && !audioBase64) return;

    const userText = input.trim();
    setInput('');
    
    let audioUrl = '';
    if (audioBase64) {
      const blob = await (await fetch(`data:audio/webm;base64,${audioBase64}`)).blob();
      audioUrl = URL.createObjectURL(blob);
    }

    addMessage({ sender: 'me', text: userText || "Voice Message", audioUrl });

    if (userText) {
      const isSafe = await gemini.moderateContent(userText);
      if (!isSafe) {
        addMessage({ sender: 'system', text: "Message blocked: Please keep it safe.", isModerated: true });
        return;
      }
    }

    setIsTyping(true);
    try {
      const responseText = await gemini.sendMessage(userText, audioBase64);
      setIsTyping(false);
      
      if (responseText) {
        let partnerAudioUrl = undefined;
        // If user sent voice, or randomly, AI responds with voice too
        if (audioBase64 || Math.random() > 0.7) {
          const ttsData = await gemini.generateTTS(responseText);
          if (ttsData) {
            const ttsBlob = await (await fetch(`data:audio/pcm;base64,${ttsData}`)).blob(); // Note: Native TTS is raw PCM, but simplified for MVP simulation
            // For MVP simplicity in browser, we assume we got a playable format or use standard TTS
            // In a real native-audio implementation we'd decode PCM.
            // Using a simplified base64 data url for now.
            partnerAudioUrl = `data:audio/mp3;base64,${ttsData}`; 
          }
        }
        addMessage({ sender: 'partner', text: responseText, audioUrl: partnerAudioUrl });
      }
    } catch (err) {
      setIsTyping(false);
      addMessage({ sender: 'system', text: "Partner disconnected." });
    }
  };

  const startRecording = async () => {
    if (!checkLimit('voiceMessages', 3)) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = (reader.result as string).split(',')[1];
          handleSend(undefined, base64data);
          incrementUsage('voiceMessages');
        };
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch (err) {
      console.error("Recording failed", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
  };

  const handleTranslate = async (msgId: string) => {
    if (!checkLimit('translations', 5)) return;
    const msg = messages.find(m => m.id === msgId);
    if (!msg || msg.translation) return;

    const translation = await gemini.translateText(msg.text, prefs.nativeLanguage);
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, translation } : m));
    incrementUsage('translations');
  };

  const handleCreateVocabCard = async (msgId: string) => {
    if (!checkLimit('vocabCards', 2)) return;
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;

    const imageUrl = await gemini.generateVocabCard(msg.text.split(' ')[0], msg.text);
    if (imageUrl) {
      const win = window.open();
      win?.document.write(`<img src="${imageUrl}" style="max-width:100%; border-radius: 20px;">`);
      incrementUsage('vocabCards');
    }
  };

  const playAudio = (url: string, id: string) => {
    if (playingId === id) {
      setPlayingId(null);
      return;
    }
    const audio = new Audio(url);
    audio.onended = () => setPlayingId(null);
    setPlayingId(id);
    audio.play();
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-100">
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 gradient-bg rounded-full flex items-center justify-center text-white font-bold">{partner.nativeLanguage[0]}</div>
          <div>
            <h3 className="font-bold text-gray-800">Anonymous Partner</h3>
            <p className="text-xs text-green-500 font-medium">Online • {prefs.practiceLanguage} Native</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!prefs.isPremium && (
            <button onClick={onUpgradeRequest} className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full flex items-center gap-1">
              <Sparkles size={10} /> FREE PLAN
            </button>
          )}
          <button onClick={onEnd} className="p-2 hover:bg-gray-100 text-gray-400 hover:text-gray-800 transition-colors rounded-lg"><X size={20} /></button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#fcfdff]">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : msg.sender === 'system' ? 'items-center' : 'items-start'}`}>
            {msg.sender === 'system' ? (
              <span className={`px-4 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500`}>{msg.text}</span>
            ) : (
              <div className="max-w-[85%] space-y-1">
                <div className={`group relative p-4 rounded-2xl shadow-sm ${msg.sender === 'me' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'}`}>
                  {msg.audioUrl && (
                    <button onClick={() => playAudio(msg.audioUrl!, msg.id)} className={`flex items-center gap-3 mb-2 p-2 rounded-xl border ${msg.sender === 'me' ? 'bg-indigo-500/50 border-white/20' : 'bg-indigo-50 border-indigo-100'}`}>
                      {playingId === msg.id ? <Pause size={16} /> : <Play size={16} />}
                      <div className="h-1 w-24 bg-current/20 rounded-full overflow-hidden">
                        <div className={`h-full bg-current ${playingId === msg.id ? 'animate-progress' : ''}`} style={{ width: playingId === msg.id ? '100%' : '0%' }}></div>
                      </div>
                    </button>
                  )}
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  
                  <div className={`absolute top-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${msg.sender === 'me' ? '-left-24' : '-right-24'}`}>
                    <button onClick={() => handleTranslate(msg.id)} className="p-1.5 bg-white border border-gray-100 rounded-full shadow-md text-gray-400 hover:text-indigo-600 transition-all"><Languages size={14} /></button>
                    <button onClick={() => handleCreateVocabCard(msg.id)} className="p-1.5 bg-white border border-gray-100 rounded-full shadow-md text-gray-400 hover:text-pink-600 transition-all"><ImageIcon size={14} /></button>
                  </div>
                </div>
                {msg.translation && <div className="text-[11px] text-gray-400 bg-gray-50 p-2 rounded-lg italic flex items-center gap-1"><Languages size={10} />{msg.translation}</div>}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <form onSubmit={handleSend} className="flex gap-2 items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isRecording}
            placeholder={isRecording ? "Recording..." : `Message in ${prefs.practiceLanguage}...`}
            className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
          />
          
          <div className="flex gap-1">
            {isRecording ? (
              <button type="button" onClick={stopRecording} className="p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 animate-pulse flex items-center gap-2">
                <Square size={20} />
                <span className="text-xs font-mono">{recordingTime}s</span>
              </button>
            ) : (
              <button type="button" onClick={startRecording} className="p-3 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition-colors">
                <Mic size={20} />
              </button>
            )}
            
            <button
              type="submit"
              disabled={!input.trim() || isRecording}
              className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
