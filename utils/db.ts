import fs from 'fs';
import path from 'path';

export interface FileMetadata {
  fileName: string;
  mimeType: string;
  size: number;
  filePath: string;
  uploadedAt: string;
}

interface Database {
  codes: Record<string, FileMetadata>;
}

const DB_FILE = path.join(process.cwd(), 'db.json');
export const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Ensure db.json exists
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ codes: {} }));
}

function readDB(): Database {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { codes: {} };
  }
}

function writeDB(db: Database) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

export function saveFileMetadata(code: string, metadata: FileMetadata) {
  const db = readDB();
  db.codes[code] = metadata;
  writeDB(db);
}

export function getFileMetadata(code: string): FileMetadata | null {
  const db = readDB();
  return db.codes[code] || null;
}

export function generateUniqueCode(): string {
  const db = readDB();
  let code = '';
  do {
    // Generate a random 6-digit string
    code = Math.floor(100000 + Math.random() * 900000).toString();
  } while (db.codes[code]);
  return code;
}
