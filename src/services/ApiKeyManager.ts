
'use server';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import type { RowDataPacket } from 'mysql2';
import { ai, gemini15Flash, type GenerationCommonConfig } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';

interface ApiKeyRecord {
  id: number;
  key: string;
  service: 'gemini';
  status: 'active' | 'inactive';
  failure_count: number;
  last_used_at: string | null;
}

const MAX_FAILURE_COUNT = 5;

// In-memory cache to avoid reading the database on every single request.
let activeKeysCache: ApiKeyRecord[] = [];
let lastFetchedTime: number = 0;
const CACHE_DURATION_MS = 5000; // 5 seconds cache
let currentKeyIndex = -1;

/**
 * Fetches active API keys from the database, with in-memory caching.
 */
async function fetchKeys(): Promise<ApiKeyRecord[]> {
  const now = Date.now();
  if (activeKeysCache.length > 0 && now - lastFetchedTime < CACHE_DURATION_MS) {
    return activeKeysCache;
  }

  let connection;
  try {
    connection = await db.getConnection();
    const [rows] = await connection.execute<RowDataPacket[]>(
      "SELECT id, service, api_key, status, failure_count, last_used_at FROM ai_api_keys WHERE status = 'active' AND failure_count < ? ORDER BY last_used_at ASC",
      [MAX_FAILURE_COUNT]
    );

    activeKeysCache = rows.map(row => ({
      id: row.id,
      service: row.service,
      key: decrypt(row.api_key),
      status: row.status,
      failure_count: row.failure_count,
      last_used_at: row.last_used_at,
    }));
    
    lastFetchedTime = now;
    currentKeyIndex = -1;
    
    if(activeKeysCache.length > 0) {
        console.log(`Fetched ${activeKeysCache.length} active API keys from database.`);
    }

    return activeKeysCache;
  } catch (error) {
    console.error('Failed to fetch active API keys from DB:', error);
    activeKeysCache = []; // Clear cache on error
    return [];
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Updates the last_used_at timestamp for a given key.
 */
async function updateLastUsed(keyId: number): Promise<void> {
  if (keyId <= 0) return;
  let connection;
  try {
    connection = await db.getConnection();
    await connection.execute(
      'UPDATE ai_api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?',
      [keyId]
    );
  } catch (error) {
    console.error(`Failed to update last_used_at for key ${keyId}:`, error);
  } finally {
    if (connection) connection.release();
  }
}

// --- EXPORTED ASYNC FUNCTIONS (Server Actions) ---

/**
 * Executes an AI generation request with automatic API key rotation and retry mechanism.
 * @param generateParams The parameters for the ai.generate() call.
 * @returns The generation response.
 * @throws An error if all available API keys fail.
 */
export async function executeAIGeneration(generateParams: Parameters<typeof ai.generate>[0]): Promise<ReturnType<typeof ai.generate>> {
  const availableKeys = await fetchKeys();
  if (availableKeys.length === 0) {
    throw new Error("Layanan AI tidak tersedia saat ini. Tidak ada kunci API yang aktif.");
  }

  let lastError: Error | null = null;

  for (let i = 0; i < availableKeys.length; i++) {
    currentKeyIndex = (currentKeyIndex + 1) % availableKeys.length;
    const keyRecord = availableKeys[currentKeyIndex];

    try {
      console.log(`Attempting AI generation with key ID: ${keyRecord.id}`);
      
      const result = await ai.generate({
        ...generateParams,
        plugins: [googleAI({ apiKey: keyRecord.key })],
      });
      
      // Success, update last used timestamp and return
      await updateLastUsed(keyRecord.id);
      return result;

    } catch (error) {
      console.error(`AI generation failed with key ID: ${keyRecord.id}`, error);
      lastError = error as Error;
      
      // Mark key as failed
      await handleKeyFailure(keyRecord.id);
      
      // Invalidate cache to ensure the failed key is not picked up again immediately
      lastFetchedTime = 0; 
    }
  }

  // If all keys have been tried and failed
  console.error("All available API keys failed.", { lastError });
  throw new Error("Semua kunci API gagal atau mencapai batas penggunaan. Silakan coba lagi nanti atau hubungi administrator.");
}


/**
 * Handles the failure of an API key by incrementing its failure count.
 */
export async function handleKeyFailure(keyId: number): Promise<void> {
  if (keyId <= 0) return;
  let connection;
  try {
    connection = await db.getConnection();
    await connection.execute(
      'UPDATE ai_api_keys SET failure_count = failure_count + 1 WHERE id = ?',
      [keyId]
    );
    // Invalidate cache to refetch updated data
    lastFetchedTime = 0; 
  } catch(error) {
    console.error(`Failed to increment failure count for key ${keyId}`, error);
  } finally {
    if(connection) connection.release();
  }
}

/**
 * Resets the failure count and re-activates a key.
 */
export async function resetKeyFailureCount(keyId: number): Promise<void> {
   if (keyId <= 0) throw new Error("Invalid key ID");
   let connection;
   try {
     connection = await db.getConnection();
     await connection.execute(
       "UPDATE ai_api_keys SET failure_count = 0, status = 'active' WHERE id = ?",
       [keyId]
     );
     lastFetchedTime = 0; // Invalidate cache
   } catch(e) {
     console.error(`Failed to reset key ${keyId}`, e);
     throw new Error("Gagal mereset kunci API di database.");
   } finally {
     if(connection) connection.release();
   }
}

/**
 * LEGACY - Retrieves the next available API key using a round-robin strategy.
 * @deprecated Use executeAIGeneration instead for robustness.
 */
export async function getApiKey(): Promise<{ id: number, key: string }> {
  const keys = await fetchKeys();
  
  if (keys.length > 0) {
      currentKeyIndex = (currentKeyIndex + 1) % keys.length;
      const selectedKey = keys[currentKeyIndex];
      await updateLastUsed(selectedKey.id);
      return { id: selectedKey.id, key: selectedKey.key };
  }
  
  console.error("CRITICAL: No active API keys found in the database.");
  throw new Error("Layanan AI tidak tersedia saat ini. Silakan coba lagi nanti.");
}
