
import { GoogleGenAI, Type, ChatSession } from "@google/genai";
import { UserPreferences, Partner, PracticeMode } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export class GeminiService {
  private chat: any = null;

  async startChatSession(prefs: UserPreferences, partner: Partner) {
    const systemInstruction = `
      You are an anonymous language exchange partner for ALE app.
      Your profile: Native in ${partner.nativeLanguage}, practicing ${partner.practiceLanguage}.
      Current Practice Mode: ${prefs.mode}.
      User Info: Native in ${prefs.nativeLanguage}, practicing ${prefs.practiceLanguage}.
      
      RULES:
      1. Keep it anonymous. No names, no locations.
      2. Be encouraging. "Mistakes welcome" is our motto.
      3. If mode is CORRECTION: Occasionally (not every message) provide polite corrections if the user makes a mistake.
      4. If mode is BEGINNER: Use very simple vocabulary and slow sentence structures.
      5. Don't mention you are an AI. Act like a person looking for a partner.
      6. Respond in ${partner.nativeLanguage} mainly, but use ${prefs.nativeLanguage} if needed for explanation.
    `;

    this.chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction,
        temperature: 0.8,
      },
    });

    return this.chat;
  }

  async sendMessage(message: string) {
    if (!this.chat) throw new Error("Chat not initialized");
    const response = await this.chat.sendMessage({ message });
    return response.text;
  }

  async translateText(text: string, targetLanguage: string) {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Translate the following text to ${targetLanguage}: "${text}". Only return the translation.`,
    });
    return response.text;
  }

  async checkGrammar(text: string, language: string) {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Check the grammar of this ${language} sentence: "${text}". 
      If there are errors, provide a polite correction. If it's perfect, say "Looks perfect!". 
      Return the corrected sentence only or "Looks perfect!".`,
    });
    return response.text;
  }

  async moderateContent(text: string): Promise<boolean> {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Is this message harmful, sexually explicit, or hate speech? Message: "${text}". Answer only with "SAFE" or "UNSAFE".`,
    });
    return response.text?.trim().toUpperCase() === 'SAFE';
  }
}

export const gemini = new GeminiService();
