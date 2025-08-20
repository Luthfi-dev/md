
import { db } from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import type { RowDataPacket } from 'mysql2';

interface ApiKeyRecord {
  id: number;
  key: string;
}

const MAX_FAILURE_COUNT = 3;
let activeKeys: ApiKeyRecord[] = [];
let lastFetchedTime: number = 0;
const CACHE_DURATION_MS = 60000; // 1 minute
let currentKeyIndex = -1;

const FALLBACK_KEY = 'NO_VALID_KEY_CONFIGURED';

/**
 * Manages the lifecycle of AI API keys stored in the database.
 * Handles fetching, caching, rotating, and disabling keys upon failure.
 */
export const ApiKeyManager = {
  /**
   * Fetches active API keys from the database, with in-memory caching.
   * @returns An array of active API key records.
   */
  async fetchKeys(): Promise<ApiKeyRecord[]> {
    const now = Date.now();
    if (activeKeys.length > 0 && now - lastFetchedTime < CACHE_DURATION_MS) {
      return activeKeys;
    }

    let connection;
    try {
      connection = await db.getConnection();
      const [rows] = await connection.execute<RowDataPacket[]>(
        "SELECT id, api_key FROM ai_api_keys WHERE service = 'gemini' AND status = 'active' AND failure_count < ? ORDER BY last_used_at ASC",
        [MAX_FAILURE_COUNT]
      );
      
      activeKeys = rows.map(row => ({
        id: row.id,
        key: decrypt(row.api_key),
      }));

      lastFetchedTime = now;
      currentKeyIndex = -1; // Reset index on new fetch to start rotation over
      if (activeKeys.length > 0) {
        console.log(`Fetched ${activeKeys.length} active API keys from DB.`);
      }
      return activeKeys;
    } catch (error) {
      console.error('Failed to fetch API keys from database:', error);
      return [];
    } finally {
      if (connection) connection.release();
    }
  },

  /**
   * Retrieves the next available API key using a round-robin strategy.
   * If no keys are in the DB, it falls back to the environment variable.
   * @param peek - If true, returns the current key without advancing.
   * @returns The API key record or a fallback if none are available.
   */
  async getApiKey(peek = false): Promise<ApiKeyRecord> {
    const keys = await this.fetchKeys();
    
    if (keys.length > 0) {
        if (!peek) {
           currentKeyIndex = (currentKeyIndex + 1) % keys.length;
        } else if (currentKeyIndex === -1) {
           currentKeyIndex = 0; // Initialize index if peeking for the first time
        }
        const selectedKey = keys[currentKeyIndex];
        if (!peek) {
           this.updateLastUsed(selectedKey.id).catch(err => console.error("Failed to update last_used_at:", err));
        }
        return selectedKey;
    }
    
    const envKey = process.env.GEMINI_API_KEY;
    if (envKey) {
      console.warn("No active keys in DB, falling back to GEMINI_API_KEY from .env");
      return { id: 0, key: envKey };
    }
    
    console.error("CRITICAL: No API keys found in DB or .env file.");
    return { id: -1, key: FALLBACK_KEY };
  },
  
  /**
   * Handles the failure of an API key by incrementing its failure count
   * and deactivating it if the threshold is reached.
   * @param keyId The ID of the failed key.
   */
  async handleKeyFailure(keyId: number): Promise<void> {
    if (keyId <= 0) return;

    let connection;
    try {
      connection = await db.getConnection();
      await connection.beginTransaction();

      await connection.execute(
        'UPDATE ai_api_keys SET failure_count = failure_count + 1 WHERE id = ?',
        [keyId]
      );

      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT failure_count FROM ai_api_keys WHERE id = ?',
        [keyId]
      );

      if (rows.length > 0 && rows[0].failure_count >= MAX_FAILURE_COUNT) {
        await connection.execute(
          "UPDATE ai_api_keys SET status = 'inactive' WHERE id = ?",
          [keyId]
        );
        console.warn(`API key ${keyId} has been deactivated due to repeated failures.`);
        lastFetchedTime = 0; // Force cache refresh on next call to remove the failed key
      }
      await connection.commit();
    } catch (error) {
      if(connection) await connection.rollback();
      console.error(`Failed to handle failure for API key ${keyId}:`, error);
    } finally {
      if (connection) connection.release();
    }
  },
  
  /**
   * Updates the last_used_at timestamp for a given key.
   * @param keyId The ID of the key to update.
   */
   async updateLastUsed(keyId: number): Promise<void> {
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
        if(connection) connection.release();
    }
  },

  /**
   * Resets the failure count for a key.
   * @param keyId The ID of the key to reset.
   */
  async resetKeyFailureCount(keyId: number): Promise<void> {
     if (keyId <= 0) return;
     let connection;
    try {
      connection = await db.getConnection();
      await connection.execute(
        'UPDATE ai_api_keys SET failure_count = 0 WHERE id = ?',
        [keyId]
      );
    } catch (error) {
      console.error(`Failed to reset failure count for key ${keyId}:`, error);
    } finally {
      if (connection) connection.release();
    }
  }
};
