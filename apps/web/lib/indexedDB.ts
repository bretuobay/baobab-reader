import Dexie, { type Table } from 'dexie';
// Adjust path if Ebook/EbookRepository are moved to a shared location
import { type Ebook, type EbookRepository } from '../server/db'; 
import { v4 as uuidv4 } from 'uuid';
import { trpc } from '../utils/trpc'; 

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
    const isNewBook = !ebook.id;
    if (isNewBook) {
      ebook.id = uuidv4();
      ebook.sqliteId = null; // Ensure sqliteId is null for new books
    }

    // Set syncStatus to pending before saving
    ebook.syncStatus = 'pending';

    // Save to IndexedDB
    await db.ebooks.put(ebook);

    // Trigger the sync attempt (don't wait for it to complete here)
    if (ebook.id) { // Ensure ebook.id is defined before calling
       attemptSyncBook(ebook.id).catch(error => {
           console.error(`Error triggering sync for book ${ebook.id}:`, error);
           // Optionally, update the book's status to 'error' here if the trigger itself fails,
           // though the main error handling will be within attemptSyncBook
       });
    }
    
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

export async function attemptSyncBook(bookId: string): Promise<void> {
  console.log(`Attempting to sync book with id: ${bookId}`);

  const bookToSync = await db.ebooks.get(bookId);

  if (!bookToSync) {
    console.error(`Book with id ${bookId} not found in IndexedDB for syncing.`);
    return;
  }

  if (!navigator.onLine) {
    console.log(`Offline. Sync for book ${bookId} will be attempted later.`);
    // No status change here, it remains 'pending'
    return;
  }

  try {
    // Assume the tRPC mutation will be named 'syncBookToSqlite' 
    // and will be part of the 'pdf' router.
    // Adjust if the router/procedure names are different.
    const syncedBook = await trpc.pdf.syncBookToSqlite.mutate(bookToSync);

    // Update book in IndexedDB with 'synced' status and sqliteId
    await db.ebooks.update(bookId, { 
      syncStatus: 'synced', 
      sqliteId: syncedBook.sqliteId, // Assuming the mutation returns an object with sqliteId
      // Also update any other fields that the server might have changed/canonicalized
      title: syncedBook.title,
      author: syncedBook.author,
      metadata: syncedBook.metadata,
      // filename should ideally not change, but good to be thorough if server can modify it
      filename: syncedBook.filename, 
    });
    console.log(`Book ${bookId} synced successfully. SQLite ID: ${syncedBook.sqliteId}`);

  } catch (error) {
    console.error(`Error syncing book ${bookId}:`, error);
    // Update book in IndexedDB with 'error' status
    try {
      await db.ebooks.update(bookId, { syncStatus: 'error' });
    } catch (updateError) {
      console.error(`Failed to update syncStatus to 'error' for book ${bookId}:`, updateError);
    }
  }
}
