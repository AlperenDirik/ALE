
import React, { useEffect } from 'react';
import { UserPreferences, Partner } from '../types';
import { Globe, ShieldCheck } from 'lucide-react';

interface Props {
  prefs: UserPreferences;
  onMatch: (partner: Partner) => void;
}

export const Matcher: React.FC<Props> = ({ prefs, onMatch }) => {
  useEffect(() => {
    // Simulate finding a partner
    const timer = setTimeout(() => {
      onMatch({
        id: Math.random().toString(36).substr(2, 9),
        name: 'Anonymous Partner',
        nativeLanguage: prefs.practiceLanguage,
        practiceLanguage: prefs.nativeLanguage,
        mode: prefs.mode
      });
    }, 3500);
    return () => clearTimeout(timer);
  }, [prefs, onMatch]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="relative mb-8">
        <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center animate-pulse-soft">
          <Globe size={48} className="text-indigo-600" />
        </div>
        <div className="absolute -bottom-2 -right-2 bg-teal-500 text-white p-2 rounded-full shadow-lg">
          <ShieldCheck size={20} />
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Finding your partner...</h2>
      <p className="text-gray-500 max-w-xs">
        Searching for a native {prefs.practiceLanguage} speaker who wants to practice {prefs.nativeLanguage}.
      </p>
      
      <div className="mt-12 flex gap-4 text-sm text-gray-400">
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Global</span>
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-teal-500"></div> Secure</span>
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Private</span>
      </div>
    </div>
  );
};
