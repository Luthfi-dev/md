
'use server';

/**
 * @fileOverview Server-only actions for managing SMTP configurations.
 */

import { db } from '@/lib/db';
import { encrypt } from '@/lib/encryption';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

interface SmtpPayload {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

/**
 * Retrieves all SMTP configs for the admin panel.
 */
export async function getAllSmtpConfigs(): Promise<RowDataPacket[]> {
    let connection;
    try {
        connection = await db.getConnection();
        const [rows] = await connection.execute<RowDataPacket[]>(
            `SELECT id, host, port, secure, user, status, last_used_at FROM smtp_configurations ORDER BY last_used_at DESC`
        );
        return rows;
    } catch (error) {
        console.error("GET SMTP CONFIGS ERROR: ", error);
        throw new Error('Kesalahan server saat mengambil konfigurasi SMTP.');
    } finally {
        if (connection) connection.release();
    }
}

/**
 * Adds a new SMTP configuration.
 */
export async function addSmtpConfig(payload: SmtpPayload): Promise<number> {
    const encryptedPass = encrypt(payload.pass);
    let connection;
    try {
        connection = await db.getConnection();
        const [result] = await connection.execute<ResultSetHeader>(
            'INSERT INTO smtp_configurations (host, port, secure, user, pass) VALUES (?, ?, ?, ?, ?)',
            [payload.host, payload.port, payload.secure, payload.user, encryptedPass]
        );
        return result.insertId;
    } catch (error) {
        console.error("CREATE SMTP CONFIG ERROR: ", error);
        throw new Error(`Kesalahan server: ${(error as Error).message}`);
    } finally {
        if (connection) connection.release();
    }
}

/**
 * Deletes an SMTP configuration.
 */
export async function deleteSmtpConfig(id: number): Promise<void> {
    let connection;
    try {
        connection = await db.getConnection();
        const [result] = await connection.execute<ResultSetHeader>(
            'DELETE FROM smtp_configurations WHERE id = ?',
            [id]
        );
        if (result.affectedRows === 0) {
            throw new Error('Konfigurasi SMTP tidak ditemukan.');
        }
    } catch (error) {
        console.error("DELETE SMTP CONFIG ERROR: ", error);
        throw new Error(`Kesalahan server: ${(error as Error).message}`);
    } finally {
        if (connection) connection.release();
    }
}
