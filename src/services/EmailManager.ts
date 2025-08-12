
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
let currentConfigIndex = -1;

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
        pass: decrypt(row.pass), // Decrypt password
      }));

      lastFetchedTime = now;
      currentConfigIndex = -1; // Reset index on new fetch
      return activeSmtpConfigs;
    } catch (error) {
      console.error('Failed to fetch SMTP configurations:', error);
      return [];
    } finally {
      if (connection) connection.release();
    }
  },

  async getConfig(): Promise<SmtpRecord | null> {
    const configs = await this.fetchConfigs();
    if (configs.length === 0) {
      return null;
    }
    currentConfigIndex = (currentConfigIndex + 1) % configs.length;
    return configs[currentConfigIndex];
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
          // Add logic to deactivate if failure_count exceeds a threshold
      } catch (error) {
          console.error(`Failed to handle failure for SMTP config ${configId}:`, error);
      } finally {
          if (connection) connection.release();
      }
  }
};

export async function sendEmail(options: { to: string, subject: string, text?: string, html: string }) {
    const config = await EmailManager.getConfig();

    if (!config) {
        throw new Error("No active SMTP configuration available.");
    }

    const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
            user: config.user,
            pass: config.pass,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: `"${process.env.APP_NAME || 'Your App'}" <${config.user}>`,
            ...options,
        });
        console.log("Message sent: %s", info.messageId);
        await EmailManager.updateLastUsed(config.id);
        return info;
    } catch (error) {
        console.error("Failed to send email with config:", config.id, error);
        await EmailManager.handleConfigFailure(config.id);
        // Optionally, retry with the next config
        throw error;
    }
}
