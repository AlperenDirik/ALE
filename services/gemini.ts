
import { GoogleGenAI, Type, Modality } from "@google/genai";
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
      1. Keep it anonymous. No names.
      2. Be encouraging. "Mistakes welcome" is our motto.
      3. If mode is CORRECTION: provide polite corrections if the user makes a mistake.
      4. If mode is BEGINNER: Use simple vocabulary.
      5. Act like a person. 
      6. Respond in ${partner.nativeLanguage} primarily.
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

  async sendMessage(message: string, audioData?: string) {
    if (!this.chat) throw new Error("Chat not initialized");
    
    let parts: any[] = [{ text: message || "Listen to my voice message." }];
    
    if (audioData) {
      parts.push({
        inlineData: {
          mimeType: 'audio/webm;codecs=opus',
          data: audioData,
        },
      });
    }

    const response = await this.chat.sendMessage({ message: { parts } });
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
      contents: `Check the grammar of this ${language} sentence: "${text}". If there are errors, provide a polite correction. If perfect, say "Looks perfect!". Return the corrected sentence only or "Looks perfect!".`,
    });
    return response.text;
  }

  async moderateContent(text: string): Promise<boolean> {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Is this message harmful or unsafe? Message: "${text}". Answer only with "SAFE" or "UNSAFE".`,
    });
    return response.text?.trim().toUpperCase() === 'SAFE';
  }

  async generateTTS(text: string): Promise<string | undefined> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say this naturally: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (e) {
      console.error("TTS failed", e);
      return undefined;
    }
  }

  async generateVocabCard(word: string, meaning: string): Promise<string | undefined> {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `Create a minimal, aesthetic vocabulary flashcard for the word "${word}" which means "${meaning}". Include a small minimalist illustration related to the word. Clean, modern typography on a soft pastel background.` },
        ],
      },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      },
    });
    
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return undefined;
  }
}

export const gemini = new GeminiService();
