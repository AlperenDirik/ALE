
export enum AppState {
  ONBOARDING = 'ONBOARDING',
  MATCHING = 'MATCHING',
  CHAT = 'CHAT'
}

export enum PracticeMode {
  CASUAL = 'CASUAL',
  CORRECTION = 'CORRECTION',
  BEGINNER = 'BEGINNER'
}

export interface UserPreferences {
  nativeLanguage: string;
  practiceLanguage: string;
  mode: PracticeMode;
}

export interface Message {
  id: string;
  sender: 'me' | 'partner' | 'system';
  text: string;
  timestamp: number;
  translation?: string;
  correction?: string;
  isModerated?: boolean;
}

export interface Partner {
  id: string;
  name: string;
  nativeLanguage: string;
  practiceLanguage: string;
  mode: PracticeMode;
}
