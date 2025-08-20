
'use server';
import path from 'path';
import fs from 'fs/promises';
import { encrypt, decrypt } from '@/lib/encryption';

interface ApiKeyRecord {
  id: number;
  key: string;
  service: 'gemini';
  status: 'active' | 'inactive';
  failure_count: number;
  last_used_at: string | null;
}

const MAX_FAILURE_COUNT = 3;
const API_KEYS_PATH = path.join(process.cwd(), 'src', 'data', 'apikeys.json');

// In-memory cache to avoid reading the file on every single request.
let activeKeysCache: ApiKeyRecord[] = [];
let lastFetchedTime: number = 0;
const CACHE_DURATION_MS = 5000; // 5 seconds cache
let currentKeyIndex = -1;

const FALLBACK_KEY = 'NO_VALID_KEY_CONFIGURED';

/**
 * Reads all keys from the apikeys.json file.
 * This is a private helper function and is not exported.
 */
async function readKeysFromFile(): Promise<ApiKeyRecord[]> {
  try {
    const fileContent = await fs.readFile(API_KEYS_PATH, 'utf-8');
    const keys = JSON.parse(fileContent) as Omit<ApiKeyRecord, 'key'> & { key: string; encryptedKey?: string }[];
    
    // Decrypt keys for runtime use
    return keys.map(k => ({
        ...k,
        key: decrypt(k.key)
    }));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.warn("apikeys.json not found, creating a new one.");
      await fs.writeFile(API_KEYS_PATH, '[]', 'utf-8');
      return [];
    }
    console.error('Failed to read API keys from file:', error);
    return [];
  }
}

/**
 * Writes the full list of keys back to the apikeys.json file.
 * This is a private helper function and is not exported.
 */
async function writeKeysToFile(keys: ApiKeyRecord[]): Promise<void> {
  try {
    // Encrypt keys before writing
     const keysToStore = keys.map(k => ({
      ...k,
      key: encrypt(k.key)
    }));
    await fs.writeFile(API_KEYS_PATH, JSON.stringify(keysToStore, null, 2), 'utf-8');
    lastFetchedTime = 0; // Invalidate cache after writing
  } catch (error) {
    console.error('Failed to write API keys to file:', error);
  }
}

/**
 * Fetches active API keys, with in-memory caching.
 * This is a private helper function and is not exported.
 */
async function fetchActiveKeys(): Promise<ApiKeyRecord[]> {
  const now = Date.now();
  if (activeKeysCache.length > 0 && now - lastFetchedTime < CACHE_DURATION_MS) {
    return activeKeysCache;
  }

  const allKeys = await readKeysFromFile();
  activeKeysCache = allKeys.filter(k => k.status === 'active' && k.failure_count < MAX_FAILURE_COUNT);
  
  // Sort by last used time to ensure we use the least recently used key first
  activeKeysCache.sort((a, b) => {
      const timeA = a.last_used_at ? new Date(a.last_used_at).getTime() : 0;
      const timeB = b.last_used_at ? new Date(b.last_used_at).getTime() : 0;
      return timeA - timeB;
  });

  lastFetchedTime = now;
  currentKeyIndex = -1; // Reset index on new fetch to start rotation over
  
  if (activeKeysCache.length > 0) {
    console.log(`Fetched ${activeKeysCache.length} active API keys from JSON file.`);
  }
  return activeKeysCache;
}

/**
 * Updates the last_used_at timestamp for a given key.
 * This is a private helper function and is not exported.
 */
async function updateLastUsed(keyId: number): Promise<void> {
  if (keyId <= 0) return;
  const allKeys = await readKeysFromFile();
  const keyIndex = allKeys.findIndex(k => k.id === keyId);
  if (keyIndex !== -1) {
      allKeys[keyIndex].last_used_at = new Date().toISOString();
      await writeKeysToFile(allKeys);
  }
}


// --- EXPORTED ASYNC FUNCTIONS (Server Actions) ---

/**
 * Retrieves the next available API key using a round-robin strategy.
 */
export async function getApiKey(peek = false): Promise<ApiKeyRecord> {
  const keys = await fetchActiveKeys();
  
  if (keys.length > 0) {
      if (!peek) {
         currentKeyIndex = (currentKeyIndex + 1) % keys.length;
      } else if (currentKeyIndex === -1) {
         currentKeyIndex = 0; // Initialize index if peeking for the first time
      }
      const selectedKey = keys[currentKeyIndex];
      if (!peek) {
         await updateLastUsed(selectedKey.id);
      }
      return selectedKey;
  }
  
  console.error("CRITICAL: No active API keys found in apikeys.json.");
  return { id: -1, key: FALLBACK_KEY, service: 'gemini', status: 'inactive', failure_count: 0, last_used_at: null };
}

/**
 * Handles the failure of an API key by incrementing its failure count.
 */
export async function handleKeyFailure(keyId: number): Promise<void> {
  if (keyId <= 0) return;
  const allKeys = await readKeysFromFile();
  const keyIndex = allKeys.findIndex(k => k.id === keyId);
  if (keyIndex !== -1) {
      allKeys[keyIndex].failure_count++;
      if (allKeys[keyIndex].failure_count >= MAX_FAILURE_COUNT) {
          allKeys[keyIndex].status = 'inactive';
          console.warn(`API key ${keyId} has been deactivated due to repeated failures.`);
      }
      await writeKeysToFile(allKeys);
  }
}

/**
 * Resets the failure count and re-activates a key.
 */
export async function resetKey(keyId: number): Promise<void> {
   if (keyId <= 0) return;
   const allKeys = await readKeysFromFile();
   const keyIndex = allKeys.findIndex(k => k.id === keyId);
   if (keyIndex !== -1) {
       allKeys[keyIndex].failure_count = 0;
       allKeys[keyIndex].status = 'active';
       await writeKeysToFile(allKeys);
   }
}

/**
 * Fetches all keys with their preview for the admin panel.
 */
export async function getKeysForAdmin(): Promise<ApiKeyRecord[]> {
  return readKeysFromFile();
}

/**
 * Adds a new API key to the system.
 */
export async function addApiKey(service: 'gemini', key: string): Promise<ApiKeyRecord> {
  const allKeys = await readKeysFromFile();
  const newKey: ApiKeyRecord = {
      id: allKeys.length > 0 ? Math.max(...allKeys.map(k => k.id)) + 1 : 1,
      key,
      service,
      status: 'active',
      failure_count: 0,
      last_used_at: null,
  };
  
  await writeKeysToFile([...allKeys, newKey]);
  return newKey;
}

/**
 * Deletes an API key from the system.
 */
export async function deleteApiKey(keyId: number): Promise<void> {
  const allKeys = await readKeysFromFile();
  const keysAfterDeletion = allKeys.filter(k => k.id !== keyId);

  if (allKeys.length === keysAfterDeletion.length) {
      throw new Error('Kunci API tidak ditemukan.');
  }
  
  await writeKeysToFile(keysAfterDeletion);
}
