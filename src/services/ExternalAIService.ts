'use server';

import type { ChatMessage } from '@/ai/schemas';
import assistantData from '@/data/assistant.json';

const API_URL = 'https://api.maudigi.com/ai/index.php';
const HISTORY_LIMIT = 20; // Keep the last 20 messages for context

/**
 * Handles the chat functionality by calling the specified external AI service.
 * It now includes a limited chat history for contextual responses to optimize memory.
 * @param history The entire chat history.
 * @returns A ChatMessage object with the AI's response.
 */
export async function chat(history: ChatMessage[]): Promise<ChatMessage> {
  // If history is empty, it's a welcome message request.
  if (history.length === 0) {
    // Send only the system prompt to get a greeting.
    const body = { text: assistantData.systemPrompt };
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!response.ok) throw new Error(`External API error: ${response.status}`);
        const data = await response.json();
        if (typeof data.response !== 'string') throw new Error('Invalid response format');
        return { role: 'model', content: data.response };
    } catch (error) {
        console.error('Error fetching welcome message from external API:', error);
        // Provide a fallback static welcome message on error
        return { role: 'model', content: "Hai! Aku Maudi. Ada yang bisa kubantu hari ini?" };
    }
  }

  // Take only the last N messages for context to optimize payload size
  const recentHistory = history.slice(-HISTORY_LIMIT);

  // Format the recent history into a single string for the API
  const formattedHistory = recentHistory.map(message => {
    if (message.role === 'user') {
      return `User: ${message.content}`;
    }
    // We assume 'model' role for the assistant's parts
    return `Assistant: ${message.content}`;
  }).join('\n');

  // Combine the system prompt with the formatted chat history
  const fullPrompt = `${assistantData.systemPrompt}\n\n${formattedHistory}\nAssistant:`;

  const body = {
    text: fullPrompt,
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `External API responded with error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();
    const aiContent = data.response;

    if (typeof aiContent !== 'string') {
        throw new Error('Invalid response format from external API.');
    }

    return {
      role: 'model',
      content: aiContent,
    };
  } catch (error) {
    console.error('Error calling external AI API:', error);
    // Re-throw the error so the client-side catch block can display it
    throw error;
  }
}
