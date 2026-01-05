
import React, { useState, useEffect } from 'react';
import { AppState, UserPreferences, Partner, PracticeMode } from './types';
import { Onboarding } from './components/Onboarding';
import { Matcher } from './components/Matcher';
import { ChatWindow } from './components/ChatWindow';
import { SubscriptionModal } from './components/SubscriptionModal';
import { gemini } from './services/gemini';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.ONBOARDING);
  const [prefs, setPrefs] = useState<UserPreferences>({
    nativeLanguage: 'English',
    practiceLanguage: 'Spanish',
    mode: PracticeMode.CASUAL,
    isPremium: false,
    dailyUsage: {
      translations: 0,
      voiceMessages: 0,
      chatsStarted: 0,
      vocabCards: 0
    }
  });
  const [partner, setPartner] = useState<Partner | null>(null);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ale_prefs_v2');
    if (saved) {
      setPrefs(JSON.parse(saved));
    }
  }, []);

  const updatePrefs = (newPrefs: UserPreferences) => {
    setPrefs(newPrefs);
    localStorage.setItem('ale_prefs_v2', JSON.stringify(newPrefs));
  };

  // Fixed handleOnboardingComplete to accept a specific subset of fields and merge them with current state
  const handleOnboardingComplete = (newPrefs: Pick<UserPreferences, 'nativeLanguage' | 'practiceLanguage' | 'mode'>) => {
    if (!prefs.isPremium && prefs.dailyUsage.chatsStarted >= 5) {
      setIsPaywallOpen(true);
      return;
    }
    const updated: UserPreferences = { 
      ...prefs, 
      ...newPrefs,
      dailyUsage: { ...prefs.dailyUsage, chatsStarted: prefs.dailyUsage.chatsStarted + 1 } 
    };
    updatePrefs(updated);
    setAppState(AppState.MATCHING);
  };

  const handleMatchFound = async (matchedPartner: Partner) => {
    setPartner(matchedPartner);
    try {
        await gemini.startChatSession(prefs, matchedPartner);
        setAppState(AppState.CHAT);
    } catch (err) {
        setAppState(AppState.ONBOARDING);
    }
  };

  const handleUpgrade = () => {
    updatePrefs({ ...prefs, isPremium: true });
    setIsPaywallOpen(false);
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {appState !== AppState.CHAT && (
        <header className="p-6 flex items-center justify-between max-w-5xl mx-auto w-full shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-bg rounded-lg"></div>
            <h1 className="text-xl font-black tracking-tight text-gray-900">ALE</h1>
          </div>
          <button onClick={() => setIsPaywallOpen(true)} className="text-xs font-bold text-indigo-600 hover:underline">
            {prefs.isPremium ? 'PRO MEMBER' : 'UPGRADE'}
          </button>
        </header>
      )}

      <main className="flex-1 overflow-hidden">
        {appState === AppState.ONBOARDING && (
          <Onboarding onComplete={handleOnboardingComplete} />
        )}

        {appState === AppState.MATCHING && (
          <Matcher prefs={prefs} onMatch={handleMatchFound} />
        )}

        {appState === AppState.CHAT && partner && (
          <div className="h-full py-4 px-4">
            <ChatWindow 
                prefs={prefs} 
                partner={partner} 
                onEnd={() => setAppState(AppState.ONBOARDING)} 
                onUpgradeRequest={() => setIsPaywallOpen(true)}
                updatePrefs={updatePrefs}
            />
          </div>
        )}
      </main>

      <SubscriptionModal 
        isOpen={isPaywallOpen} 
        onClose={() => setIsPaywallOpen(false)} 
        onUpgrade={handleUpgrade}
      />
    </div>
  );
};

export default App;
