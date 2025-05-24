import React from 'react';
// Adjust this path if Ebook type is moved to a shared location
import { type Ebook } from '../server/db';

interface BookItemProps {
  book: Ebook;
  onEdit: (book: Ebook) => void;
  onDelete: (id: string) => void;
}

const BookItem: React.FC<BookItemProps> = ({ book, onEdit, onDelete }) => {
  return (
    <div style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
      <h3>{book.title || 'No Title'}</h3>
      <p><strong>Author:</strong> {book.author || 'N/A'}</p>
      <p><strong>Filename:</strong> {book.filename}</p>
      {book.tags && book.tags.length > 0 && (
        <p><strong>Tags:</strong> {book.tags.join(', ')}</p>
      )}
      {book.metadata?.subject && (
        <p><strong>Subject:</strong> {book.metadata.subject}</p>
      )}
      {book.metadata?.pages && (
        <p><strong>Pages:</strong> {book.metadata.pages}</p>
      )}
       {book.uploadedAt && (
        <p><strong>Uploaded:</strong> {new Date(book.uploadedAt).toLocaleString()}</p>
      )}

      <button onClick={() => onEdit(book)} style={{ marginRight: '5px' }}>Edit</button>
      <button onClick={() => onDelete(book.id)}>Delete</button>
    </div>
  );
};

export default BookItem;
