import sqlite3 from 'sqlite3';
import { open, type Database } from 'sqlite';
import path from 'path';

// Define the path to the database file
// __dirname might not be available in all module systems, adjust if needed
const DB_PATH = path.join(process.cwd(), 'server', 'db', 'database.sqlite');

// Ensure the directory exists (important for environments where the dir isn't pre-created)
// This is a simplified check; in a real app, you might use fs.mkdirSync recursively
// However, for this environment, we assume the `server/db` path can be written to.

let dbInstance: Database | null = null;

export interface PdfMetadata {
  id?: number;
  filename: string;
  title: string | null;
  author: string | null;
  creator: string | null;
  producer: string | null;
  creationDate: string | null;
  modificationDate: string | null;
  uploadedAt?: string; // Handled by DB default
}

export async function getDb(): Promise<Database> {
  if (!dbInstance) {
    // Ensure the directory for the database exists
    const dir = path.dirname(DB_PATH);
    // This is a simple way to try to create the directory.
    // In a more robust app, you'd use fs.mkdirSync(dir, { recursive: true })
    // but here we'll rely on the environment or assume it's creatable.
    try {
      const fs = await import('fs/promises');
      await fs.mkdir(dir, { recursive: true });
    } catch (e) {
      console.warn(`Could not create directory ${dir}, assuming it exists or db is in-memory. Error: ${e}`);
    }

    dbInstance = await open({
      filename: DB_PATH,
      driver: sqlite3.Database,
    });

    // Initialize the database schema
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS pdf_metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        title TEXT,
        author TEXT,
        creator TEXT,
        producer TEXT,
        creationDate TEXT,
        modificationDate TEXT,
        uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
  return dbInstance;
}

// Function to insert PDF metadata
export async function insertPdfMetadata(metadata: PdfMetadata): Promise<{ id: number }> {
  const db = await getDb();
  const result = await db.run(
    'INSERT INTO pdf_metadata (filename, title, author, creator, producer, creationDate, modificationDate) VALUES (?, ?, ?, ?, ?, ?, ?)',
    metadata.filename,
    metadata.title,
    metadata.author,
    metadata.creator,
    metadata.producer,
    metadata.creationDate,
    metadata.modificationDate
  );
  if (result.lastID === undefined) {
    throw new Error("Failed to insert metadata, no ID returned.");
  }
  return { id: result.lastID };
}

// Function to retrieve all PDF metadata
export async function getAllPdfMetadata(): Promise<PdfMetadata[]> {
  const db = await getDb();
  // Explicitly cast the result to PdfMetadata[]
  return db.all<PdfMetadata[]>('SELECT id, filename, title, author, creator, producer, creationDate, modificationDate, uploadedAt FROM pdf_metadata ORDER BY uploadedAt DESC');
}
