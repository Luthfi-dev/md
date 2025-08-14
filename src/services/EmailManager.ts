
import nodemailer from 'nodemailer';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import type { RowDataPacket } from 'mysql2';

interface SmtpRecord {
  id: number;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

let activeSmtpConfigs: SmtpRecord[] = [];
let lastFetchedTime: number = 0;
const CACHE_DURATION_MS = 300000; // 5 minutes

const EmailManager = {
  async fetchConfigs(): Promise<SmtpRecord[]> {
    const now = Date.now();
    if (activeSmtpConfigs.length > 0 && now - lastFetchedTime < CACHE_DURATION_MS) {
      return activeSmtpConfigs;
    }

    let connection;
    try {
      connection = await db.getConnection();
      const [rows] = await connection.execute<RowDataPacket[]>(
        "SELECT id, host, port, secure, user, pass FROM smtp_configurations WHERE status = 'active' ORDER BY last_used_at ASC"
      );
      
      activeSmtpConfigs = rows.map(row => ({
        id: row.id,
        host: row.host,
        port: row.port,
        secure: !!row.secure,
        user: row.user,
        pass: decrypt(row.pass),
      }));

      lastFetchedTime = now;
      return activeSmtpConfigs;
    } catch (error) {
      console.error('Failed to fetch SMTP configurations:', error);
      activeSmtpConfigs = []; // Clear cache on error
      return [];
    } finally {
      if (connection) connection.release();
    }
  },

  async updateLastUsed(configId: number): Promise<void> {
    let connection;
    try {
        connection = await db.getConnection();
        await connection.execute('UPDATE smtp_configurations SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?', [configId]);
    } catch (error) {
        console.error(`Failed to update last_used_at for SMTP config ${configId}:`, error);
    } finally {
        if (connection) connection.release();
    }
  },
  
  async handleConfigFailure(configId: number): Promise<void> {
      let connection;
      try {
          connection = await db.getConnection();
          await connection.execute("UPDATE smtp_configurations SET failure_count = failure_count + 1 WHERE id = ?", [configId]);
          // Optional: Add logic to deactivate if failure_count exceeds a threshold
      } catch (error) {
          console.error(`Failed to handle failure for SMTP config ${configId}:`, error);
      } finally {
          if (connection) connection.release();
      }
  }
};

export async function sendEmail(options: { to: string, subject: string, text?: string, html: string }) {
    const configs = await EmailManager.fetchConfigs();

    if (configs.length === 0) {
        throw new Error("No active SMTP configuration available.");
    }

    let lastError: Error | null = null;

    for (const config of configs) {
        const transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: {
                user: config.user,
                pass: config.pass,
            },
            tls: {
                rejectUnauthorized: false // Often needed for local or self-signed certs
            }
        });

        try {
            const info = await transporter.sendMail({
                from: config.user, // Using the authenticated user as sender for better deliverability
                ...options,
            });
            console.log("Message sent successfully using config %s: %s", config.id, info.messageId);
            await EmailManager.updateLastUsed(config.id);
            return info; // Success, exit the loop
        } catch (error) {
            console.error(`Failed to send email with config ${config.id}:`, error);
            lastError = error as Error;
            await EmailManager.handleConfigFailure(config.id);
            // Continue to the next config
        }
    }
    
    // If the loop completes without returning, it means all configs failed.
    throw lastError || new Error("All SMTP configurations failed to send the email.");
}
