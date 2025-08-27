'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const VERSION_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'version.json');

async function readVersionFile(): Promise<{ versionId: string }> {
    try {
        const fileContent = await fs.readFile(VERSION_FILE_PATH, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        // If file doesn't exist, create it with a new version
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            console.log("version.json not found, creating a new one.");
            const newVersionId = uuidv4();
            await writeVersionFile({ versionId: newVersionId });
            return { versionId: newVersionId };
        }
        console.error("Failed to read version file:", error);
        throw new Error("Gagal membaca file versi aplikasi.");
    }
}

async function writeVersionFile(data: { versionId: string }): Promise<void> {
    try {
        const jsonString = JSON.stringify(data, null, 2);
        await fs.writeFile(VERSION_FILE_PATH, jsonString, 'utf-8');
    } catch (error) {
        console.error("Failed to write version file:", error);
        throw new Error("Gagal menyimpan file versi aplikasi.");
    }
}

export async function getCurrentVersion(): Promise<string> {
    const data = await readVersionFile();
    return data.versionId;
}

export async function generateNewVersion(): Promise<string> {
    const newVersionId = uuidv4();
    await writeVersionFile({ versionId: newVersionId });
    return newVersionId;
}
