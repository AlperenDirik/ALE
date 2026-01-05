
import React, { useState } from 'react';
import { LANGUAGES, PRACTICE_MODES } from '../constants';
import { UserPreferences, PracticeMode } from '../types';
import { ChevronRight } from 'lucide-react';

interface Props {
  onComplete: (prefs: UserPreferences) => void;
}

export const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const [native, setNative] = useState(LANGUAGES[0]);
  const [practice, setPractice] = useState(LANGUAGES[1]);
  const [mode, setMode] = useState<PracticeMode>(PracticeMode.CASUAL);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({
      nativeLanguage: native,
      practiceLanguage: practice,
      mode
    });
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-3xl shadow-xl mt-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to ALE</h1>
        <p className="text-gray-500">Anonymous Language Exchange. Privacy first.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">I speak</label>
          <select 
            value={native}
            onChange={(e) => setNative(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          >
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">I want to practice</label>
          <select 
            value={practice}
            onChange={(e) => setPractice(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          >
            {LANGUAGES.filter(l => l !== native).map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Practice mode</label>
          <div className="grid grid-cols-1 gap-3">
            {PRACTICE_MODES.map((pm) => (
              <button
                key={pm.id}
                type="button"
                onClick={() => setMode(pm.id as PracticeMode)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  mode === pm.id 
                    ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' 
                    : 'border-gray-100 hover:border-gray-300'
                }`}
              >
                <div className="font-bold text-gray-800">{pm.label}</div>
                <div className="text-xs text-gray-500 mt-1">{pm.description}</div>
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full gradient-bg text-white font-bold py-4 rounded-xl shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          Find a Partner
          <ChevronRight size={20} />
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-gray-400">
        No accounts. No trackers. Just language.
      </p>
    </div>
  );
};
