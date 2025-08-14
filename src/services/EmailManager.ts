
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
        console.error("Email sending failed: No active SMTP configuration available in the database.");
        throw new Error("No active SMTP configuration available.");
    }

    let lastError: Error | null = null;

    for (const config of configs) {
        const isGmail = config.host.toLowerCase().includes('gmail');
        
        const transportOptions: any = {
            host: config.host,
            port: config.port,
            secure: config.port === 465, // `secure:true` is required for port 465, `false` for others.
            auth: {
                user: config.user,
                pass: config.pass,
            },
        };
        
        // Let nodemailer use its optimized settings for Gmail
        if (isGmail) {
            transportOptions.service = 'gmail';
        }

        const transporter = nodemailer.createTransport(transportOptions);

        try {
            console.log(`Attempting to send email via ${config.host} (Config ID: ${config.id})...`);
            const info = await transporter.sendMail({
                from: `"${process.env.APP_NAME || 'All-in-One Toolkit'}" <${config.user}>`,
                ...options,
            });
            console.log("Message sent successfully using config %s: %s", config.id, info.messageId);
            await EmailManager.updateLastUsed(config.id);
            return info; // Success, exit the loop
        } catch (error) {
            console.error(`Failed to send email with config ${config.id}. Error:`, error);
            lastError = error as Error;
            await EmailManager.handleConfigFailure(config.id);
            // Continue to the next config
        }
    }
    
    // If the loop completes without returning, it means all configs failed.
    console.error("All available SMTP configurations failed.", { lastError });
    throw lastError || new Error("All SMTP configurations failed to send the email.");
}
