
'use server';
/**
 * @fileOverview Manages the lifecycle of AI API keys from the database.
 * Provides functionality for fetching, rotating, and handling failures of API keys.
 */

import { db } from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import type { RowDataPacket } from 'mysql2';

interface ApiKeyRecord {
  id: number;
  key: string;
  service: 'gemini';
  status: 'active' | 'inactive' | 'failed';
  failure_count: number;
  last_used_at: string | null;
}

// In-memory cache for API keys
let activeApiKeys: ApiKeyRecord[] = [];
let lastFetchedTime: number = 0;
const CACHE_DURATION_MS = 60000; // Cache for 1 minute to reduce DB load
let currentIndex = 0;

/**
 * Fetches active API keys from the database, using a cache to prevent excessive queries.
 */
async function fetchKeys(): Promise<void> {
    const now = Date.now();
    if (activeApiKeys.length > 0 && now - lastFetchedTime < CACHE_DURATION_MS) {
        return;
    }

    console.log("Fetching fresh API keys from database...");
    let connection;
    try {
        connection = await db.getConnection();
        const [rows] = await connection.execute<RowDataPacket[]>(
          "SELECT id, api_key, service, status, failure_count, last_used_at FROM ai_api_keys WHERE status = 'active' ORDER BY last_used_at ASC, id ASC"
        );
        
        activeApiKeys = rows.map(row => ({
            id: row.id,
            key: decrypt(row.api_key),
            service: row.service,
            status: row.status,
            failure_count: row.failure_count,
            last_used_at: row.last_used_at,
        }));
        
        lastFetchedTime = now;
        currentIndex = 0; // Reset index after fetching new keys
        console.log(`Successfully fetched ${activeApiKeys.length} active API keys.`);
    } catch (error) {
        console.error('FATAL: Failed to fetch API keys from database:', error);
        activeApiKeys = []; // Clear cache on error
    } finally {
        if (connection) connection.release();
    }
}

/**
 * Retrieves the next available API key in a round-robin fashion.
 * @returns The API key record or null if no keys are available.
 */
async function getNextKey(): Promise<ApiKeyRecord | null> {
    await fetchKeys(); 
    if (activeApiKeys.length === 0) {
        return null;
    }
    const key = activeApiKeys[currentIndex];
    currentIndex = (currentIndex + 1) % activeApiKeys.length;
    return key;
}

/**
 * Updates the last used timestamp for a given key ID.
 * @param keyId The ID of the key that was used.
 */
async function updateLastUsed(keyId: number): Promise<void> {
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
 * Reports a failure for a given key ID, incrementing its failure count.
 * @param keyId The ID of the key that failed.
 */
async function reportFailure(keyId: number): Promise<void> {
    console.warn(`Reporting failure for API Key ID: ${keyId}`);
    let connection;
    try {
        connection = await db.getConnection();
        await connection.execute("UPDATE ai_api_keys SET failure_count = failure_count + 1 WHERE id = ?", [keyId]);
        
        // Remove the failed key from the in-memory cache immediately
        activeApiKeys = activeApiKeys.filter(key => key.id !== keyId);
        if (currentIndex >= activeApiKeys.length) {
            currentIndex = 0;
        }

    } catch (error) {
        console.error(`Failed to report failure for key ${keyId}:`, error);
    } finally {
        if (connection) connection.release();
    }
}

/**
 * Resets the failure count for a key, typically used by an admin.
 * @param keyId The ID of the key to reset.
 */
async function resetKeyFailureCount(keyId: number): Promise<void> {
    let connection;
    try {
        connection = await db.getConnection();
        await connection.execute("UPDATE ai_api_keys SET failure_count = 0, status = 'active' WHERE id = ?", [keyId]);
        // Force a refresh of the key cache on next request
        lastFetchedTime = 0;
    } catch (error) {
        console.error(`Failed to reset failure count for key ${keyId}:`, error);
        throw new Error('Gagal mereset counter di database.');
    } finally {
        if (connection) connection.release();
    }
}


export const ApiKeyManager = {
    getNextKey,
    updateLastUsed,
    reportFailure,
    resetKeyFailureCount,
    fetchKeys, // Expose for admin route to refresh cache after changes
};
