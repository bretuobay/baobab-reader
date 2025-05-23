## Product Requirements Document: PDF eBook Manager (v1.0)
### 1. Product Overview
A cross-platform open-source application for managing PDF eBooks. It extracts metadata, allows basic tagging and categorization, provides a simple visual library interface, and includes a built-in reader.

### 2. Target Platforms
* Web App (PWA-compatible)
* Desktop App (via Electron)
* Mobile App (via React Native or Flutter)

### 3. Core Goals
* Simplify the organization of PDF-based eBooks.
* Automatically extract and edit PDF metadata.
* Offer a consistent, clean UI across all platforms.
* Focus on usability, openness, and lightweight footprint.

### 4. User Roles
* General User: Import, read, and manage their PDF library.
* Power User (future): Advanced tagging, cloud sync, plugins (not in v1.0).

### 5. Key Features (v1.0)
5.1 Core Features
Feature	Description
PDF Import	Drag-and-drop or file picker to import PDFs.
Metadata Extraction	Extract title, author, subject, keywords from PDF.
Manual Metadata Editing	UI for editing and saving PDF metadata.
Visual Library	Grid or list view showing PDF cover/title/author.
Simple Tagging	Add/remove custom tags for PDFs.
In-App Reader	Basic PDF viewer (next/prev, scroll, zoom).
Local Storage	PDFs and metadata stored locally.
Responsive Design	Adaptive layout across devices.

### 6. Non-Functional Requirements
* Offline-first architecture.
* Cross-platform codebase with shared logic and UI components.
* Performance-optimized for fast loading and browsing.
* Open-source under a permissive license (e.g., MIT or Apache 2.0).

### 7. Technology Stack (Recommended)
Layer	Tech Stack
Frontend	React ( Material Design Latest Version)
Mobile	React Native / Expo
Desktop	Electron + React
PDF Handling	pdf-lib, pdfjs-dist, or pdf.js
State Management	Zustand / Redux Toolkit
Storage	IndexedDB (Web), SQLite (Mobile/Desktop)
Build Tools	Vite / Metro bundler (mobile)
CI/CD	GitHub Actions + Expo/Electron build pipelines

### 8. Agile Feature Increments
Milestone 0: Project Setup
* ✅ Monorepo structure (e.g., Turborepo)
* ✅ Shared core logic between web, desktop, and mobile
* ✅ Initial UI scaffolding
Milestone 1: PDF Import and Display
* File picker/drag-and-drop for adding PDFs
* Show file names in a grid
* Implement PDF rendering in reader view (using pdf.js)
Milestone 2: Metadata Extraction
* Extract metadata (title, author, subject)
* Display and edit metadata in a modal or side panel
* Save metadata changes locally
Milestone 3: Visual Library & Tagging
* Display thumbnails/covers
* Add/remove tags from files
* Filter PDFs by tags or metadata
Milestone 4: In-App Reader
* PDF viewer (next/prev, zoom, scroll)
* Persistent position tracking (e.g., last page read)
Milestone 5: Polishing & Platform Targets
* Optimize mobile layout (React Native)
* Package Electron app
* Add installable PWA support

### 9. Future Considerations (Post v1.0)
* Cloud sync via WebDAV or Dropbox
* Auto cover generation via PDF cover extraction or AI
* EPUB and MOBI support
* OPDS catalog browsing
* Plugin system (Calibre-style)

### 10. Success Metrics
* Smooth import and metadata management of PDFs
* Seamless experience across web, desktop, and mobile
* Positive feedback from early adopters on GitHub
* Downloads/installs from multiple platforms


### Storage & Persistence Strategy
Web
Use IndexedDB via libraries like:

idb (modern IndexedDB wrapper)

dexie.js (easier schema-based DB abstraction)

Mobile/Desktop
Use SQLite via:

expo-sqlite (for React Native)

better-sqlite3 (for Electron)

Cross-platform abstraction

### Cross-platform abstraction
```
interface Ebook {
  id: string;
  title: string;
  author: string;
  tags: string[];
  filePath?: string;
  metadata: {
    subject?: string;
    keywords?: string[];
    pages?: number;
  };
  lastReadPage?: number;
}

interface EbookRepository {
  getAll(): Promise<Ebook[]>;
  getById(id: string): Promise<Ebook | null>;
  save(ebook: Ebook): Promise<void>;
  delete(id: string): Promise<void>;
}
```
