import React, { useState, useEffect } from 'react';
// Adjust this path if Ebook type is moved to a shared location
import { type Ebook } from '../server/db';

interface BookFormProps {
  bookToEdit?: Ebook | null; // Ebook object to edit, or null/undefined for new book
  onSave: (ebook: Ebook) => void;
  onCancel: () => void;
}

const BookForm: React.FC<BookFormProps> = ({ bookToEdit, onSave, onCancel }) => {
  // Initialize form state. If bookToEdit is provided, use its values.
  const [title, setTitle] = useState(bookToEdit?.title || '');
  const [author, setAuthor] = useState(bookToEdit?.author || '');
  // Filename is typically set at upload and might be read-only here,
  // but allow editing for manual entries or if bookToEdit doesn't have one.
  const [filename, setFilename] = useState(bookToEdit?.filename || '');
  // Tags are stored as an array in Ebook, but edited as a comma-separated string.
  const [tags, setTags] = useState(bookToEdit?.tags?.join(', ') || '');

  useEffect(() => {
    // If bookToEdit changes, update the form fields
    setTitle(bookToEdit?.title || '');
    setAuthor(bookToEdit?.author || '');
    setFilename(bookToEdit?.filename || '');
    setTags(bookToEdit?.tags?.join(', ') || '');
  }, [bookToEdit]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    // Construct the Ebook object from form state
    const ebookData: Partial<Ebook> = {
      // id is handled by the save logic (either existing or new UUID)
      title: title || null, // Ensure null if empty, matching Ebook interface
      author: author || null, // Ensure null if empty
      filename: filename, // Filename is required
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag), // Convert string to array, remove empty tags
      // Preserve other metadata if editing, or set defaults if needed
      metadata: bookToEdit?.metadata || { creationDate: new Date().toISOString() }, // Example: preserve or set creationDate
    };

    // If editing, pass the existing id and uploadedAt
    if (bookToEdit?.id) {
      (ebookData as Ebook).id = bookToEdit.id;
      ebookData.uploadedAt = bookToEdit.uploadedAt; // Preserve original uploadedAt
    }
    
    // The onSave function in the parent will handle generating ID for new books
    // and calling the appropriate repository method.
    onSave(ebookData as Ebook); 
  };

  return (
    <form onSubmit={handleSubmit} style={{ margin: '20px', padding: '20px', border: '1px solid #eee' }}>
      <h3>{bookToEdit ? 'Edit Book' : 'Add New Book'}</h3>
      <div>
        <label htmlFor="title">Title:</label><br />
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: '100%', marginBottom: '10px' }}
        />
      </div>
      <div>
        <label htmlFor="author">Author:</label><br />
        <input
          id="author"
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          style={{ width: '100%', marginBottom: '10px' }}
        />
      </div>
      <div>
        <label htmlFor="filename">Filename:</label><br />
        <input
          id="filename"
          type="text"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          // Make filename read-only if we are editing an existing book from a file upload context
          // For this generic form, we'll allow editing, but a real app might restrict this.
          readOnly={!!bookToEdit?.filePath || !!bookToEdit?.id} // Example: read-only if it has a filePath or is an existing entry
          style={{ width: '100%', marginBottom: '10px' }}
        />
      </div>
      <div>
        <label htmlFor="tags">Tags (comma-separated):</label><br />
        <input
          id="tags"
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          style={{ width: '100%', marginBottom: '10px' }}
        />
      </div>
      <button type="submit" style={{ marginRight: '10px' }}>Save Book</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  );
};

export default BookForm;
