/**
 * Gemini AI Service
 * 
 * Bu servis Google Gemini AI ile etkileşimi yönetir.
 * Chat AI ve Summarizing AI fonksiyonlarını içerir.
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

// ============================================================================
// CHAT AI SERVICE (Phase 4, Step 4.1)
// ============================================================================

interface CaseContext {
  case_title: string;
  case_description: string;
  initial_prompt_data: any;
  suspects: Array<{
    name: string;
    backstory: string;
    is_guilty: boolean;
  }>;
  scene_objects: Array<{
    name: string;
    main_location: string;
    initial_description: string;
  }>;
  evidence_lookup: Array<{
    name: string;
    description: string;
    location: string;
  }>;
}

interface ChatMessage {
  sender: 'user' | 'ai';
  content: string;
}

/**
 * Build system instruction for Chat AI
 * Creates comprehensive context for the AI based on case data
 */
export function buildSystemInstruction(caseContext: CaseContext): string {
  const { case_title, case_description, initial_prompt_data, suspects, scene_objects, evidence_lookup } = caseContext;

  // Extract system instruction from JSONB if available
  const systemInstruction = initial_prompt_data?.system_instruction || '';
  const initialScene = initial_prompt_data?.initial_scene || '';
  const caseContextData = initial_prompt_data?.case_context || '';

  // Build suspects info (with truth data - MVP has full access)
  const suspectsInfo = suspects.map(s => 
    `- ${s.name}: ${s.backstory}${s.is_guilty ? ' [GUILTY - This is the killer]' : ''}`
  ).join('\n');

  // Build scene objects info
  const sceneInfo = scene_objects.map(obj =>
    `- ${obj.name} (at ${obj.main_location}): ${obj.initial_description}`
  ).join('\n');

  // Build evidence info (what exists in the crime scene)
  const evidenceInfo = evidence_lookup.map(ev =>
    `- ${ev.name}: ${ev.description} (found at: ${ev.location})`
  ).join('\n');

  return `
# DETECTIVE COLLEAGUE AI - SYSTEM INSTRUCTION

You are an AI detective colleague at the crime scene, communicating via text with your partner (the player) who is remote.

## Your Role:
- You are AT THE CRIME SCENE physically
- The player is YOUR PARTNER working remotely
- You describe what you see and find
- You respond to their questions and requests
- You maintain a professional but conversational tone
- You can communicate in ANY LANGUAGE the player uses

## Case Information:
**Case Title:** ${case_title}
**Description:** ${case_description}

${systemInstruction ? `**Special Instructions:**\n${systemInstruction}\n` : ''}

${initialScene ? `**Initial Scene:**\n${initialScene}\n` : ''}

${caseContextData ? `**Case Context:**\n${caseContextData}\n` : ''}

## Suspects:
${suspectsInfo}

## Crime Scene Layout:
${sceneInfo}

## Available Evidence (What physically exists at the scene):
${evidenceInfo}

## Important Rules:
1. **Stay in character** as detective colleague at scene
2. **Describe evidence naturally** when player asks about locations or objects
3. **Don't directly reveal the killer** - let player deduce
4. **Use evidence keywords naturally** in your descriptions (this triggers evidence unlocking)
5. **Be helpful but mysterious** - guide without spoiling
6. **Respond in the SAME LANGUAGE** the player uses
7. **Keep responses concise** (2-4 sentences typically)

Remember: You have full access to all information (including who is guilty) for MVP. Use this knowledge to guide the player subtly through natural conversation.
`.trim();
}

/**
 * Format chat history for AI context
 * Takes last N messages and formats them for the AI
 */
export function formatChatHistory(messages: ChatMessage[]): string {
  if (messages.length === 0) {
    return 'No previous conversation.';
  }

  return messages.map(msg => {
    const role = msg.sender === 'user' ? 'Player' : 'You (Detective)';
    return `${role}: ${msg.content}`;
  }).join('\n');
}

/**
 * CHAT AI - Main conversational AI
 * Generates detective responses based on case context and conversation history
 * 
 * @param caseContext - Complete case data
 * @param currentSummary - Current conversation summary (or null if no summary yet)
 * @param recentMessages - Last 5 user + AI messages
 * @param userMessage - Latest user message
 * @returns AI response
 */
export async function generateChatResponse(
  caseContext: CaseContext,
  currentSummary: string | null,
  recentMessages: ChatMessage[],
  userMessage: string
): Promise<string> {
  try {
    // Build system instruction
    const systemInstruction = buildSystemInstruction(caseContext);

    // Format conversation history
    const conversationHistory = formatChatHistory(recentMessages);

    // Build full prompt
    const fullPrompt = `
${systemInstruction}

---

## Conversation Summary:
${currentSummary || 'This is the beginning of the conversation.'}

## Recent Messages:
${conversationHistory}

---

**Player's latest message:** ${userMessage}

**Your response (as detective colleague at the crime scene):**
`.trim();

    // Generate response
    const response = await generateResponse(fullPrompt);

    return response;
  } catch (error) {
    console.error('Chat AI Error:', error);
    throw new Error('Failed to generate chat response');
  }
}

// ============================================================================
// SUMMARIZING AI SERVICE (Phase 4, Step 4.2)
// ============================================================================

/**
 * SUMMARIZING AI - Conversation summarizer
 * Generates concise summary of conversation for context management
 * Triggered every 5 user messages (per project spec)
 * 
 * @param previousSummary - The previous summary (or null if first summary)
 * @param recentMessages - Last 5-10 user + AI messages to summarize
 * @returns New summary text
 */
export async function generateConversationSummary(
  previousSummary: string | null,
  recentMessages: ChatMessage[]
): Promise<string> {
  try {
    // Format messages for summarization
    const messagesToSummarize = formatChatHistory(recentMessages);

    // Build summarization prompt
    const summaryPrompt = `
# CONVERSATION SUMMARIZER

You are a summarization AI for a detective game. Your job is to create a concise summary of the conversation between the player and their detective colleague.

## Instructions:
1. Create a brief summary (3-5 sentences) of what has been discussed
2. Focus on: key questions asked, locations examined, suspects discussed, evidence mentioned
3. Keep it factual and objective
4. If there's a previous summary, build upon it (don't repeat everything)

${previousSummary ? `## Previous Summary:\n${previousSummary}\n` : '## This is the first summary (no previous summary exists)'}

## Recent Conversation to Summarize:
${messagesToSummarize}

---

**Your summary (concise, 3-5 sentences):**
`.trim();

    // Generate summary
    const summary = await generateResponse(summaryPrompt);

    return summary.trim();
  } catch (error) {
    console.error('Summarization AI Error:', error);
    throw new Error('Failed to generate conversation summary');
  }
}
