
'use server';

import type { ChatMessage } from '@/ai/schemas';
import assistantData from '@/data/assistant.json';

const API_URL = 'https://api.maudigi.com/ai/index.php';

/**
 * Handles the chat functionality by calling the specified external AI service.
 * It now includes the full chat history for contextual responses.
 * @param history The entire chat history.
 * @returns A ChatMessage object with the AI's response.
 */
export async function chat(history: ChatMessage[]): Promise<ChatMessage> {

  // Format the entire history into a single string for the API
  const formattedHistory = history.map(message => {
    if (message.role === 'user') {
      return `User: ${message.content}`;
    }
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
