
/**
 * @fileOverview Manages the lifecycle of AI API keys from the database.
 * Provides functionality for fetching, rotating, and handling failures of API keys.
 * This file is a server-side utility module and MUST NOT contain 'use server'.
 * 
 * REFACTOR: This module has been changed from a class-based or stateful module
 * to a collection of stateless async functions to comply with Next.js server module
 * constraints and ensure stability in production builds.
 */

import { db } from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

interface ApiKeyRecord {
  id: number;
  key: string;
  service: 'gemini';
  status: 'active' | 'inactive' | 'failed';
  failure_count: number;
  last_used_at: string | null;
}

// In-memory cache for API keys
let activeApiKeysCache: ApiKeyRecord[] = [];
let lastCacheUpdateTime: number = 0;
const CACHE_DURATION_MS = 60000; // Cache for 1 minute

/**
 * Fetches active API keys, utilizing an in-memory cache to reduce DB load.
 * This function is now private to the module to enforce structured access.
 */
async function getCachedKeys(): Promise<ApiKeyRecord[]> {
    const now = Date.now();
    if (activeApiKeysCache.length > 0 && now - lastCacheUpdateTime < CACHE_DURATION_MS) {
        return activeApiKeysCache;
    }

    console.log("Re-fetching fresh API keys from database...");
    let connection;
    try {
        connection = await db.getConnection();
        const [rows] = await connection.execute<RowDataPacket[]>(
          "SELECT id, api_key, service, status, failure_count, last_used_at FROM ai_api_keys WHERE status = 'active' AND failure_count < 5 ORDER BY last_used_at ASC, id ASC"
        );
        
        activeApiKeysCache = rows.map(row => ({
            id: row.id,
            key: decrypt(row.api_key),
            service: row.service,
            status: row.status,
            failure_count: row.failure_count,
            last_used_at: row.last_used_at,
        }));
        
        lastCacheUpdateTime = now;
        console.log(`Successfully fetched ${activeApiKeysCache.length} active API keys.`);
        return activeApiKeysCache;
    } catch (error) {
        console.error('FATAL: Failed to fetch API keys from database:', error);
        activeApiKeysCache = []; // Clear cache on error
        return [];
    } finally {
        if (connection) connection.release();
    }
}

/**
 * Retrieves the next available API key in a round-robin fashion from the cache.
 * @returns The API key record or null if no keys are available.
 */
export async function getNextKey(): Promise<ApiKeyRecord | null> {
    const keys = await getCachedKeys();
    if (keys.length === 0) {
        return null;
    }
    // Simple round-robin is not safe with serverless. Fetching the least recently used is more robust.
    return keys[0];
}

/**
 * Updates the last used timestamp for a given key ID.
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
 * Reports a failure for a given key ID, incrementing its failure count.
 * @param keyId The ID of the key that failed.
 */
export async function reportFailure(keyId: number): Promise<void> {
    console.warn(`Reporting failure for API Key ID: ${keyId}`);
    let connection;
    try {
        connection = await db.getConnection();
        await connection.execute("UPDATE ai_api_keys SET failure_count = failure_count + 1 WHERE id = ?", [keyId]);
        
        // Remove the failed key from the in-memory cache immediately
        activeApiKeysCache = activeApiKeysCache.filter(key => key.id !== keyId);
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
export async function resetKeyFailureCount(keyId: number): Promise<void> {
    let connection;
    try {
        connection = await db.getConnection();
        await connection.execute("UPDATE ai_api_keys SET failure_count = 0, status = 'active' WHERE id = ?", [keyId]);
        lastCacheUpdateTime = 0; // Force cache refresh
    } catch (error) {
        console.error(`Failed to reset failure count for key ${keyId}:`, error);
        throw new Error('Gagal mereset counter di database.');
    } finally {
        if (connection) connection.release();
    }
}

/**
 * Retrieves all keys for the admin panel, including non-active ones.
 */
export async function getAllKeysForAdmin(): Promise<RowDataPacket[]> {
    let connection;
    try {
        connection = await db.getConnection();
        const [rows] = await connection.execute<RowDataPacket[]>(
            `SELECT id, service, SUBSTRING(api_key, -4) as key_preview, status, failure_count, last_used_at 
             FROM ai_api_keys ORDER BY last_used_at DESC`
        );
        return rows;
    } catch (error) {
        console.error("GET API KEYS ERROR: ", error);
        throw new Error('Kesalahan server saat mengambil kunci API.');
    } finally {
        if (connection) connection.release();
    }
}

/**
 * Adds a new API key to the database.
 * @param service The service name (e.g., 'gemini').
 * @param encryptedKey The encrypted API key.
 * @returns The ID of the newly inserted key.
 */
export async function addApiKey(service: string, encryptedKey: string): Promise<number> {
    let connection;
    try {
        connection = await db.getConnection();
        const [result] = await connection.execute<ResultSetHeader>(
            'INSERT INTO ai_api_keys (service, api_key) VALUES (?, ?)',
            [service, encryptedKey]
        );
        lastCacheUpdateTime = 0; // Force cache refresh
        return result.insertId;
    } catch (error) {
        console.error("CREATE API KEY ERROR: ", error);
        throw new Error(`Gagal menyimpan kunci API: ${(error as Error).message}`);
    } finally {
        if (connection) connection.release();
    }
}

/**
 * Deletes an API key from the database.
 * @param id The ID of the key to delete.
 */
export async function deleteApiKey(id: number): Promise<void> {
    let connection;
    try {
        connection = await db.getConnection();
        const [result] = await connection.execute<ResultSetHeader>(
            'DELETE FROM ai_api_keys WHERE id = ?',
            [id]
        );
        if (result.affectedRows === 0) {
            throw new Error('Kunci API tidak ditemukan.');
        }
        lastCacheUpdateTime = 0; // Force cache refresh
    } catch (error) {
        console.error("DELETE API KEY ERROR: ", error);
        throw new Error(`Gagal menghapus kunci API: ${(error as Error).message}`);
    } finally {
        if (connection) connection.release();
    }
}
