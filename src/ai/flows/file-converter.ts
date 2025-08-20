
'use server';
/**
 * @fileOverview A file conversion flow.
 *
 * - convertHtmlToWord: Converts an HTML string to a Word document.
 */

import { genkit } from 'genkit';
import htmlToDocx from 'html-to-docx';
import {
    HtmlToWordInputSchema,
    HtmlToWordOutputSchema,
    type HtmlToWordInput,
    type HtmlToWordOutput,
} from '../schemas';

const convertHtmlToWordFlow = genkit.defineFlow(
  {
    name: 'convertHtmlToWordFlow',
    inputSchema: HtmlToWordInputSchema,
    outputSchema: HtmlToWordOutputSchema,
  },
  async (input) => {
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
        console.error("Error in convertHtmlToWordFlow:", e);
        return { error: e.message || 'An unknown error occurred during conversion.' };
    }
  }
);

export async function convertHtmlToWord(input: HtmlToWordInput): Promise<HtmlToWordOutput> {
  return await convertHtmlToWordFlow(input);
}
