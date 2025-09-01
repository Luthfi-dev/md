'use server';

import type { ChatMessage } from '@/ai/schemas';

const API_URL = 'https://api.maudigi.com/ai/index.php';

/**
 * Handles the chat functionality by calling the specified external AI service.
 * @param history The entire chat history. The last message is used as the prompt.
 * @returns A ChatMessage object with the AI's response.
 */
export async function chat(history: ChatMessage[]): Promise<ChatMessage> {
  // Extract the last user message as the prompt
  const lastMessage = history[history.length - 1];
  if (!lastMessage || lastMessage.role !== 'user') {
    throw new Error('No valid user prompt found in history.');
  }
  const promptText = lastMessage.content;

  const body = {
    text: promptText,
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
