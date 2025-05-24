import sqlite3 from "sqlite3";
import { open, type Database } from "sqlite";
import path from "path";

// Define the path to the database file
// __dirname might not be available in all module systems, adjust if needed
const DB_PATH = path.join(process.cwd(), "server", "db", "database.sqlite");

// Ensure the directory exists (important for environments where the dir isn't pre-created)
// This is a simplified check; in a real app, you might use fs.mkdirSync recursively
// However, for this environment, we assume the `server/db` path can be written to.

let dbInstance: Database | null = null;

export interface Ebook {
  id: string; // Changed to string for IndexedDB compatibility if not using auto-incrementing numbers
  title: string | null;
  author: string | null;
  tags?: string[]; // Optional as per original Ebook interface
  filePath?: string; // Optional
  metadata?: {
    // Nested metadata object
    subject?: string;
    keywords?: string[];
    pages?: number;
    creator?: string | null; // From existing PdfMetadata
    producer?: string | null; // From existing PdfMetadata
    creationDate?: string | null; // From existing PdfMetadata
    modificationDate?: string | null; // From existing PdfMetadata
  };
  filename: string; // From existing PdfMetadata
  uploadedAt?: string; // From existing PdfMetadata
  lastReadPage?: number; // Optional
}

export interface EbookRepository {
  getAll(): Promise<Ebook[]>;
  getById(id: string): Promise<Ebook | null>;
  save(ebook: Ebook): Promise<Ebook>; // Return the saved/updated ebook, possibly with new ID
  delete(id: string): Promise<void>;
  // Add a method to get by filename, as this is used in the current router
  getByFilename?(filename: string): Promise<Ebook | null>;
}

// Interface for the raw data structure in SQLite, closer to the original PdfMetadata
interface SqliteEbookRecord {
  id: number; // SQLite uses auto-incrementing integer IDs
  filename: string;
  title: string | null;
  author: string | null;
  creator: string | null;
  producer: string | null;
  creationDate: string | null;
  modificationDate: string | null;
  uploadedAt: string; // Handled by DB default
  // Sqlite specific fields that are not directly in Ebook, but can be mapped to Ebook.metadata
  subject?: string;
  keywords?: string; // Store keywords as a comma-separated string in SQLite
  pages?: number;
}

export async function getDb(): Promise<Database> {
  if (!dbInstance) {
    // Ensure the directory for the database exists
    const dir = path.dirname(DB_PATH);
    // This is a simple way to try to create the directory.
    // In a more robust app, you'd use fs.mkdirSync(dir, { recursive: true })
    // but here we'll rely on the environment or assume it's creatable.
    try {
      const fs = await import("fs/promises");
      await fs.mkdir(dir, { recursive: true });
    } catch (e) {
      console.warn(
        `Could not create directory ${dir}, assuming it exists or db is in-memory. Error: ${e}`
      );
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
        subject TEXT,
        keywords TEXT, -- Store keywords as a comma-separated string
        pages INTEGER,
        -- Optional metadata fields
        modificationDate TEXT,
        uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
  return dbInstance;
}

// Helper to map SQLite record to Ebook
function sqliteToEbook(record: SqliteEbookRecord): Ebook {
  return {
    id: record.id.toString(),
    filename: record.filename,
    title: record.title,
    author: record.author,
    metadata: {
      creator: record.creator,
      producer: record.producer,
      creationDate: record.creationDate,
      modificationDate: record.modificationDate,
      subject: record.subject,
      keywords: record.keywords ? record.keywords.split(",") : undefined,
      pages: record.pages,
    },
    uploadedAt: record.uploadedAt,
  };
}

// Helper to map Ebook to SQLite record for insertion/update (omits id for insertion)
function ebookToSqliteRecord(
  ebook: Ebook
): Omit<SqliteEbookRecord, "id" | "uploadedAt"> {
  return {
    filename: ebook.filename,
    title: ebook.title,
    author: ebook.author,
    creator: ebook.metadata?.creator || null,
    producer: ebook.metadata?.producer || null,
    creationDate: ebook.metadata?.creationDate || null,
    modificationDate: ebook.metadata?.modificationDate || null,
    subject: ebook.metadata?.subject,
    keywords: ebook.metadata?.keywords?.join(","),
    pages: ebook.metadata?.pages,
  };
}

class SqliteEbookRepository implements EbookRepository {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async getAll(): Promise<Ebook[]> {
    const records = await this.db.all<SqliteEbookRecord[]>(
      "SELECT * FROM pdf_metadata ORDER BY uploadedAt DESC"
    );
    return records.map(sqliteToEbook);
  }

  async getById(id: string): Promise<Ebook | null> {
    const record = await this.db.get<SqliteEbookRecord>(
      "SELECT * FROM pdf_metadata WHERE id = ?",
      id
    );
    return record ? sqliteToEbook(record) : null;
  }

  async getByFilename(filename: string): Promise<Ebook | null> {
    const record = await this.db.get<SqliteEbookRecord>(
      "SELECT * FROM pdf_metadata WHERE filename = ?",
      filename
    );
    return record ? sqliteToEbook(record) : null;
  }

  async save(ebook: Ebook): Promise<Ebook> {
    const recordData = ebookToSqliteRecord(ebook);
    if (ebook.id) {
      // Update existing record
      const existingRecord = await this.getById(ebook.id);
      if (!existingRecord) {
        throw new Error(`Ebook with id ${ebook.id} not found`);
      }
      await this.db.run(
        `UPDATE pdf_metadata SET 
          filename = ?, title = ?, author = ?, creator = ?, producer = ?, 
          creationDate = ?, modificationDate = ?, subject = ?, keywords = ?, pages = ?
        WHERE id = ?`,
        recordData.filename,
        recordData.title,
        recordData.author,
        recordData.creator,
        recordData.producer,
        recordData.creationDate,
        recordData.modificationDate,
        recordData.subject,
        recordData.keywords,
        recordData.pages,
        ebook.id
      );
      return { ...ebook }; // Return the updated ebook
    } else {
      // Insert new record
      const result = await this.db.run(
        `INSERT INTO pdf_metadata (
          filename, title, author, creator, producer, creationDate, modificationDate, subject, keywords, pages
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        recordData.filename,
        recordData.title,
        recordData.author,
        recordData.creator,
        recordData.producer,
        recordData.creationDate,
        recordData.modificationDate,
        recordData.subject,
        recordData.keywords,
        recordData.pages
      );
      if (result.lastID === undefined) {
        throw new Error("Failed to save ebook, no ID returned.");
      }
      // Fetch the newly inserted record to get all fields (like uploadedAt)
      const newRecord = await this.getById(result.lastID.toString());
      if (!newRecord) {
        // This should ideally not happen if the insert was successful
        throw new Error("Failed to retrieve new ebook after saving.");
      }
      return newRecord;
    }
  }

  async delete(id: string): Promise<void> {
    const result = await this.db.run(
      "DELETE FROM pdf_metadata WHERE id = ?",
      id
    );
    if (result.changes === 0) {
      throw new Error(`Ebook with id ${id} not found for deletion.`);
    }
  }
}

export async function getEbookRepository(): Promise<EbookRepository> {
  // For now, we only have a server-side (SQLite) implementation.
  // The tRPC router will use this. Client-side IndexedDB will be handled separately.
  if (typeof window !== "undefined") {
    // This function is called from server-side tRPC context.
    // If it were to be called from client-side code that expects IndexedDB,
    // this would be the place to differentiate.
    // However, for this subtask, tRPC implies server-side.
    console.warn(
      "getEbookRepository called in a context that might expect client-side DB, but only SQLite is provided for now via server."
    );
  }
  const db = await getDb();
  return new SqliteEbookRepository(db);
}

// The old functions insertPdfMetadata and getAllPdfMetadata are now superseded
// by SqliteEbookRepository.save() and SqliteEbookRepository.getAll() respectively.
// They can be removed or kept if other parts of the server still use them directly,
// but the goal is to transition to the repository pattern.
// For this task, we will assume they are no longer directly needed by the router.
