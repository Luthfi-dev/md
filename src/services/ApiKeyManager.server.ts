
'use server';

/**
 * @fileOverview Server-only actions for managing API keys.
 * This file is intended to be used by Server Components or other server-side code.
 * It directly interacts with the database.
 */

import { db } from '@/lib/db';
import { encrypt } from '@/lib/encryption';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * Retrieves all keys for the admin panel, including non-active ones.
 * This is a server action and can be called from client components marked with 'use client'.
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
 * @param apiKey The plaintext API key.
 * @returns The ID of the newly inserted key.
 */
export async function addApiKey(service: 'gemini', apiKey: string): Promise<number> {
    const encryptedKey = encrypt(apiKey);
    let connection;
    try {
        connection = await db.getConnection();
        const [result] = await connection.execute<ResultSetHeader>(
            'INSERT INTO ai_api_keys (service, api_key) VALUES (?, ?)',
            [service, encryptedKey]
        );
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
    } catch (error) {
        console.error("DELETE API KEY ERROR: ", error);
        throw new Error(`Gagal menghapus kunci API: ${(error as Error).message}`);
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
    } catch (error) {
        console.error(`Failed to reset failure count for key ${keyId}:`, error);
        throw new Error('Gagal mereset counter di database.');
    } finally {
        if (connection) connection.release();
    }
}
