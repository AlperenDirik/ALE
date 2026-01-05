
export const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Chinese', 
  'Japanese', 'Korean', 'Italian', 'Portuguese', 'Russian',
  'Arabic', 'Hindi', 'Turkish', 'Dutch', 'Swedish'
];

export const PRACTICE_MODES = [
  {
    id: 'CASUAL',
    label: 'Casual Chat',
    description: 'Just talk naturally, no pressure.'
  },
  {
    id: 'CORRECTION',
    label: 'Correction-Friendly',
    description: 'Active help with grammar and phrasing.'
  },
  {
    id: 'BEGINNER',
    label: 'Beginner / Slow',
    description: 'Simple sentences, slower pace.'
  }
];

export const API_KEY = process.env.API_KEY;
export const DEFAULT_MODEL = 'gemini-3-flash-preview';
