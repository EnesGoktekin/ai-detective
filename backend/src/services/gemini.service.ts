/**
 * Gemini AI Service
 * 
 * Bu servis Google Gemini AI ile etkileşimi yönetir.
 * Dedektif oyunu için AI-powered yanıtlar üretir.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// API key kontrolü
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}

// Gemini AI client'ı başlat
const genAI = new GoogleGenerativeAI(apiKey);

// Model seçimi - Gemini 2.5 Flash modeli (proje standart modeli)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

/**
 * Gemini AI'a prompt gönder ve yanıt al
 * 
 * @param prompt - AI'a gönderilecek metin
 * @returns AI'dan gelen yanıt metni
 */
export async function generateResponse(prompt: string): Promise<string> {
  try {
    // Prompt'u AI'a gönder
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Gemini AI Error:', error);
    throw new Error('Failed to generate AI response');
  }
}

/**
 * Gemini AI bağlantısını test et
 * 
 * @returns Bağlantı başarılı ise true
 */
export async function testGeminiConnection(): Promise<boolean> {
  try {
    // Basit bir test prompt'u gönder
    const testPrompt = 'Say "Hello" if you can hear me.';
    const response = await generateResponse(testPrompt);

    // Yanıt varsa bağlantı başarılı
    return response.length > 0;
  } catch (error) {
    console.error('Gemini connection test failed:', error);
    return false;
  }
}

/**
 * Dedektif oyunu için özel prompt template'i
 * 
 * @param context - Oyun bağlamı (vaka, ipuçları, vs.)
 * @param userMessage - Kullanıcının mesajı
 * @returns Formatlanmış prompt
 */
export function createDetectivePrompt(
  context: string,
  userMessage: string
): string {
  return `
You are a detective game AI. You help players investigate cases by providing clues and responding to their questions.

Context: ${context}

Player's message: ${userMessage}

Respond as a helpful detective assistant. Be mysterious but informative.
`.trim();
}
