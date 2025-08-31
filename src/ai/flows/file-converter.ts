
'use server';
/**
 * @fileOverview A file conversion flow.
 *
 * - convertHtmlToWord: Converts an HTML string to a Word document.
 * This flow does not use Genkit and operates locally.
 */

import htmlToDocx from 'html-to-docx';
import {
    HtmlToWordInputSchema,
    HtmlToWordOutputSchema,
    type HtmlToWordInput,
    type HtmlToWordOutput,
} from '../schemas';

// This function doesn't need to be a Genkit flow as it's a direct utility.
export async function convertHtmlToWord(input: HtmlToWordInput): Promise<HtmlToWordOutput> {
  const validation = HtmlToWordInputSchema.safeParse(input);
  if (!validation.success) {
      const error = validation.error.errors.map(e => e.message).join(', ');
      return { error };
  }

  try {
      const docxBuffer = await htmlToDocx(input.htmlContent, undefined, {
          table: { row: { cantSplit: true } },
          footer: true,
          pageNumber: true,
           pageSize: {
              width: 11906,
              height: 16838,
          },
      });

      const docxDataUri = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${(docxBuffer as Buffer).toString('base64')}`;

      return { docxDataUri };

  } catch (e: any) {
      console.error("Error in convertHtmlToWord:", e);
      return { error: e.message || 'An unknown error occurred during conversion.' };
  }
}
