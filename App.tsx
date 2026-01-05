
import React, { useState, useEffect } from 'react';
import { AppState, UserPreferences, Partner, PracticeMode } from './types';
import { Onboarding } from './components/Onboarding';
import { Matcher } from './components/Matcher';
import { ChatWindow } from './components/ChatWindow';
import { gemini } from './services/gemini';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.ONBOARDING);
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('ale_prefs');
    if (saved) {
      setPrefs(JSON.parse(saved));
    }
  }, []);

  const handleOnboardingComplete = (newPrefs: UserPreferences) => {
    setPrefs(newPrefs);
    setAppState(AppState.MATCHING);
    localStorage.setItem('ale_prefs', JSON.stringify(newPrefs));
  };

  const handleMatchFound = async (matchedPartner: Partner) => {
    if (!prefs) return;
    setPartner(matchedPartner);
    // Initialize Gemini chat backend as the partner
    try {
        await gemini.startChatSession(prefs, matchedPartner);
        setAppState(AppState.CHAT);
    } catch (err) {
        console.error("Failed to start AI session", err);
        setAppState(AppState.ONBOARDING);
    }
  };

  const handleEndChat = () => {
    setAppState(AppState.ONBOARDING);
    setPartner(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Dynamic Header */}
      {appState !== AppState.CHAT && (
        <header className="p-6 flex items-center justify-between max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-bg rounded-lg"></div>
            <h1 className="text-xl font-black tracking-tight text-gray-900">ALE</h1>
          </div>
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Privacy First Exchange
          </div>
        </header>
      )}

      <main className="flex-1 flex flex-col justify-center py-6 px-4">
        {appState === AppState.ONBOARDING && (
          <Onboarding onComplete={handleOnboardingComplete} />
        )}

        {appState === AppState.MATCHING && prefs && (
          <Matcher prefs={prefs} onMatch={handleMatchFound} />
        )}

        {appState === AppState.CHAT && prefs && partner && (
          <ChatWindow prefs={prefs} partner={partner} onEnd={handleEndChat} />
        )}
      </main>

      {/* Footer / Disclaimer */}
      {appState !== AppState.CHAT && (
        <footer className="p-6 text-center text-gray-400 text-xs">
          &copy; 2026 ALE — Anonymous Language Exchange. All conversations are ephemeral.
        </footer>
      )}
    </div>
  );
};

export default App;
