
'use server';
/**
 * @fileOverview Service for communicating with the external AI API gateway.
 */

const API_ENDPOINT = 'https://api.maudigi.com/ai/index.php';

interface ExternalAIRequest {
    task?: string;
    text?: string;
    data?: any;
    [key: string]: any;
}

/**
 * Calls the external AI API and returns the response.
 * @param payload The data to send to the AI API.
 * @returns The JSON response from the API.
 * @throws An error if the API call fails or returns an error.
 */
export async function callExternalAI(payload: ExternalAIRequest): Promise<any> {
    try {
        console.log("Calling External AI with payload:", JSON.stringify(payload, null, 2));

        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            let errorBody;
            try {
                errorBody = await response.json();
            } catch (e) {
                errorBody = await response.text();
            }
            console.error("External AI API Error:", { status: response.status, body: errorBody });
            throw new Error(`Permintaan ke AI gagal dengan status ${response.status}.`);
        }

        const result = await response.json();
        
        // The external API might have its own success/error structure
        if (result.success === false) {
             throw new Error(result.message || 'API mengembalikan error yang tidak diketahui.');
        }

        // Return the whole result object
        return result;

    } catch (error) {
        console.error("Error in callExternalAI:", error);
        // Re-throw the error so it can be caught by the calling component
        throw error;
    }
}
