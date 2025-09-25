
'use server';
/**
 * @fileOverview Core AI flow definitions and exported server actions.
 */
import {
  chat,
  generateArticleOutline,
  generateArticleFromOutline,
  lengthenArticle,
  shortenArticle,
  generateHeadlines,
  generateSeoMeta,
  generateCreativeContent,
  translateContent,
  generateVideoScript,
  getAiRecommendation,
  estimateProjectFeature,
  textToSpeech
} from './flows/chat-flow';

import { convertHtmlToWord as convertHtmlToWordFlow } from './flows/file-converter';
import type { HtmlToWordInput, HtmlToWordOutput } from './schemas';

// Re-export all the flows so they can be used as server actions from the client.
export {
  chat,
  generateArticleOutline,
  generateArticleFromOutline,
  lengthenArticle,
  shortenArticle,
  generateHeadlines,
  generateSeoMeta,
  generateCreativeContent,
  translateContent,
  generateVideoScript,
  getAiRecommendation,
  estimateProjectFeature,
  textToSpeech
};

// This function does not use AI and can remain as is.
export async function convertHtmlToWord(input: HtmlToWordInput): Promise<HtmlToWordOutput> {
  return await convertHtmlToWordFlow(input);
}
