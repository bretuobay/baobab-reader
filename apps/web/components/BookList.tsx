import React, { useEffect, useState, useCallback } from "react";
import { ebookRepository, attemptSyncBook } from "../lib/indexedDB";
// Adjust this path if Ebook type is moved to a shared location
import { type Ebook } from "../server/db";
import BookItem from "./BookItem";

interface BookListProps {
  // Function to call when edit is requested, passing the book to edit
  onEditBook: (book: Ebook) => void;
  // A "refresh key" prop to trigger re-fetching when a book is saved elsewhere
  refreshKey?: number;
}

const BookList: React.FC<BookListProps> = ({ onEditBook, refreshKey }) => {
  const [books, setBooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allBooks = await ebookRepository.getAll();
      setBooks(allBooks);

      // After setting books, iterate and attempt sync for appropriate ones
      if (allBooks && allBooks.length > 0) {
        console.log("Checking for books to sync on load...");
        for (const book of allBooks) {
          if (
            !book.syncStatus ||
            book.syncStatus === "pending" ||
            book.syncStatus === "error"
          ) {
            // Don't await here to avoid blocking UI updates if many books need syncing.
            // Errors are handled within attemptSyncBook.
            if (book.id) {
              // Ensure book.id is present
              attemptSyncBook(book.id).catch((err) => {
                console.error(
                  `Error triggering initial sync for book ${book.id}:`,
                  err
                );
              });
            }
          }
        }
      }
    } catch (err) {
      console.error("Error fetching books:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch books.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks, refreshKey]); // Re-fetch when refreshKey changes

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this ebook?")) {
      try {
        await ebookRepository.delete(id);
        fetchBooks(); // Refresh list after deletion
      } catch (err) {
        console.error("Error deleting book:", err);
        setError(err instanceof Error ? err.message : "Failed to delete book.");
      }
    }
  };

  if (loading) {
    return <p>Loading books...</p>;
  }

  if (error) {
    return <p style={{ color: "red" }}>Error: {error}</p>;
  }

  if (books.length === 0) {
    return <p>No books found. Add one to get started!</p>;
  }

  return (
    <div>
      <h2>My Books (IndexedDB)</h2>
      {books.map((book) => (
        <BookItem
          key={book.id}
          book={book}
          onDelete={() => handleDelete(book.id)}
          onEdit={() => onEditBook(book)} // Pass the book object to the handler
        />
      ))}
    </div>
  );
};

export default BookList;
