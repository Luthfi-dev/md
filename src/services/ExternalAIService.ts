'use server';

import type { ChatMessage } from '@/ai/schemas';
import assistantData from '@/data/assistant.json';

const API_URL = 'https://api.openai.com/v1/chat/completions'; // Ganti dengan URL API eksternal yang sebenarnya
const API_KEY = process.env.GEMINI_API_KEY; // Gunakan variabel lingkungan yang sesuai

/**
 * Handles the chat functionality by calling an external AI service.
 * This function is a Server Action and should only be called from client components.
 * @param history The entire chat history.
 * @returns A ChatMessage object with the AI's response.
 */
export async function chat(history: ChatMessage[]): Promise<ChatMessage> {
  if (!API_KEY) {
    throw new Error('Kunci API untuk layanan AI eksternal tidak dikonfigurasi.');
  }

  // Ubah format riwayat agar sesuai dengan API eksternal
  const messagesForApi = history.map(msg => ({
      role: msg.role === 'model' ? 'assistant' : 'user', // Sesuaikan 'model' menjadi 'assistant' jika diperlukan
      content: msg.content
  }));

  const body = {
    model: 'gpt-3.5-turbo', // Ganti dengan model yang sesuai
    messages: [
      { role: 'system', content: assistantData.systemPrompt },
      ...messagesForApi
    ]
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(`API eksternal merespons dengan error: ${response.status} ${response.statusText} - ${errorBody.error?.message || ''}`);
    }

    const data = await response.json();
    const aiContent = data.choices[0]?.message?.content || '';

    return {
      role: 'model',
      content: aiContent,
    };

  } catch (error) {
    console.error('Error saat memanggil API AI eksternal:', error);
    throw error;
  }
}
