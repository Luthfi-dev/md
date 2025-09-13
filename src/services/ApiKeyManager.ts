
/**
 * @fileOverview Manages the lifecycle of AI API keys from the database and .env.
 * Provides functionality for fetching, rotating, and handling failures of API keys.
 * This module is designed to be used server-side.
 */

import { db } from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface ApiKeyRecord {
  id: number | string; // number for DB, string for .env keys
  key: string;
  service: 'gemini';
  isEnv: boolean; // Flag to distinguish DB keys from .env keys
}

// In-memory cache for API keys
let activeDbApiKeysCache: ApiKeyRecord[] = [];
let lastCacheUpdateTime: number = 0;
const CACHE_DURATION_MS = 60000; // Cache for 1 minute

/**
 * Force-clears the in-memory cache.
 */
export function clearCache() {
    console.log("API key cache cleared.");
    lastCacheUpdateTime = 0;
    activeDbApiKeysCache = [];
}

/**
 * Fetches active API keys from the database, utilizing an in-memory cache.
 */
async function fetchKeysFromDb(): Promise<ApiKeyRecord[]> {
    const now = Date.now();
    if (activeDbApiKeysCache.length > 0 && now - lastCacheUpdateTime < CACHE_DURATION_MS) {
        return activeDbApiKeysCache;
    }

    console.log("Re-fetching fresh API keys from database...");
    let connection;
    try {
        connection = await db.getConnection();
        const [rows] = await connection.execute<RowDataPacket[]>(
          "SELECT id, api_key, service FROM ai_api_keys WHERE status = 'active' AND failure_count < 5 ORDER BY last_used_at ASC, id ASC"
        );
        
        activeDbApiKeysCache = rows.map(row => ({
            id: row.id,
            key: row.api_key, // Read plain text key
            service: row.service,
            isEnv: false,
        }));
        
        lastCacheUpdateTime = now;
        console.log(`Successfully fetched ${activeDbApiKeysCache.length} active API keys from DB.`);
        return activeDbApiKeysCache;
    } catch (error) {
        console.error('FATAL: Failed to fetch API keys from database:', error);
        activeDbApiKeysCache = []; // Clear cache on error
        return [];
    } finally {
        if (connection) connection.release();
    }
}

/**
 * Parses API keys from the GEMINI_API_KEY environment variable.
 * @returns An array of API key records from the .env file.
 */
export function getEnvKeys(): ApiKeyRecord[] {
    const envKeysString = process.env.GEMINI_API_KEY || '';
    if (!envKeysString) {
        return [];
    }
    return envKeysString.split(',').map((key, index) => ({
        id: `env-${index}`,
        key: key.trim(),
        service: 'gemini',
        isEnv: true,
    }));
}


/**
 * Retrieves the next available API keys. By default, it returns only the least recently used one.
 * If `all` is true, it returns all active keys.
 * @param all - If true, returns all active keys sorted by last used.
 * @returns An array of API key records or null.
 */
export async function getNextKey(all: boolean = false): Promise<ApiKeyRecord[] | null> {
    const keys = await fetchKeysFromDb();
    if (keys.length === 0) {
        return null;
    }
    return all ? keys : [keys[0]];
}

/**
 * Updates the last used timestamp for a given database key ID.
 * @param keyId The ID of the key that was used.
 */
export async function updateLastUsed(keyId: number): Promise<void> {
    let connection;
    try {
        connection = await db.getConnection();
        await connection.execute('UPDATE ai_api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?', [keyId]);
    } catch (error) {
        console.error(`Failed to update last_used_at for key ${keyId}:`, error);
    } finally {
        if (connection) connection.release();
    }
}

/**
 * Reports a failure for a given database key ID, incrementing its failure count.
 * @param keyId The ID of the key that failed.
 */
export async function reportFailure(keyId: number): Promise<void> {
    console.warn(`Reporting failure for DB API Key ID: ${keyId}`);
    let connection;
    try {
        connection = await db.getConnection();
        await connection.execute("UPDATE ai_api_keys SET failure_count = failure_count + 1 WHERE id = ?", [keyId]);
        
        // Remove the failed key from the in-memory cache immediately
        activeDbApiKeysCache = activeDbApiKeysCache.filter(key => key.id !== keyId);
        lastCacheUpdateTime = 0; // Force refresh on next call
    } catch (error) {
        console.error(`Failed to report failure for key ${keyId}:`, error);
    } finally {
        if (connection) connection.release();
    }
}
