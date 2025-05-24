import Dexie, { type Table } from 'dexie';
// Adjust path if Ebook/EbookRepository are moved to a shared location
import { type Ebook, type EbookRepository } from '../server/db'; 
import { v4 as uuidv4 } from 'uuid';

// Define the Dexie database
class EbookDB extends Dexie {
  ebooks!: Table<Ebook, string>; // Primary key is string (UUID)

  constructor() {
    super('EbookDB');
    this.version(1).stores({
      // 'id' is the primary key.
      // Indexing 'filename', 'title', 'author'.
      // For 'tags', use a multiEntry index by prefixing with '*'
      ebooks: 'id, filename, title, author, *tags', 
    });
  }
}

const db = new EbookDB();

// Implementation of the EbookRepository using Dexie
class DexieEbookRepository implements EbookRepository {
  async getAll(): Promise<Ebook[]> {
    return db.ebooks.toArray();
  }

  async getById(id: string): Promise<Ebook | null> {
    const ebook = await db.ebooks.get(id);
    return ebook || null; // Return null if undefined
  }

  async save(ebook: Ebook): Promise<Ebook> {
    // Generate UUID if id is not provided or if it's an empty string
    // This ensures new ebooks always get a valid UUID.
    if (!ebook.id) {
      ebook.id = uuidv4();
    }
    
    // Dexie's put method handles both insert (if ID doesn't exist) and update (if ID exists).
    // It returns the key of the saved object, which is ebook.id in this case.
    await db.ebooks.put(ebook);
    
    // Return the ebook object, now with an ID if it was newly generated.
    // If the ebook object passed in was already complete, it's returned as is.
    return ebook; 
  }

  async delete(id: string): Promise<void> {
    await db.ebooks.delete(id);
  }

  async getByFilename(filename: string): Promise<Ebook | null> {
    // Dexie's .get() method on a WhereClause returns the first match or undefined.
    const ebook = await db.ebooks.where('filename').equals(filename).first();
    return ebook || null; // Return null if undefined
  }
}

// Export a singleton instance of the repository for client-side use
export const ebookRepository = new DexieEbookRepository();
