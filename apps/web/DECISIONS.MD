# Architectural and Library Decisions

This document outlines the key architectural and library choices made for the `apps/web` Next.js application.

## tRPC Setup

-   **Why tRPC?** tRPC was chosen for its end-to-end typesafety, allowing for seamless and error-resistant communication between the frontend and backend. It eliminates the need to write and maintain separate API contracts and provides excellent developer experience with autocompletion and refactoring capabilities.
-   **Structure:**
    -   **Server:** Initialized in `pages/api/trpc/[trpc].ts`, it adapts tRPC procedures to Next.js API routes.
    -   **Client:** Configured in `utils/trpc.ts`, it provides typed hooks and utilities for making API calls from React components.
    -   **Routers:** Defined under `server/trpc/routers/`, with a main `_app.ts` router that combines other specific routers (e.g., `pdf.ts`). Procedures within routers define the available API endpoints and their logic.

## Material Design Library

-   **Library:** Material UI (MUI) was chosen as the component library.
-   **Why MUI?**
    -   **Comprehensive Components:** MUI offers a vast range of pre-built, customizable components that cover most UI needs.
    -   **Good Documentation:** Extensive and clear documentation makes it easy to learn and use.
    -   **Theming Capabilities:** Powerful theming allows for consistent application styling and customization to fit specific design requirements.
-   **Theme Focus:** The custom theme (`styles/theme.ts`) was designed with an emphasis on:
    -   **Responsiveness:** Ensuring the application adapts well to various screen sizes.
    -   **Large Fonts:** Improving readability and visual hierarchy.
    -   **Prominent Icons:** Enhancing user interaction and visual cues.

## PDF Parsing Library

-   **Library:** `pdf-lib` was chosen for handling PDF operations.
-   **Why `pdf-lib`?**
    -   **Pure JavaScript:** Runs in Node.js and the browser without native dependencies, simplifying the build process.
    -   **Metadata Extraction:** Provides robust capabilities for reading and writing PDF metadata, which was a core requirement.
    -   **Active Maintenance:** The library is actively maintained, ensuring ongoing support and updates.

## Database

-   **Database:** SQLite was chosen as the database for this project.
-   **Why SQLite?**
    -   **File-based:** Simple to set up and manage as it uses a single file for the database, suitable for projects of this scale.
    -   **Good Node.js Support:** Excellent integration with Node.js through libraries like `sqlite` and `sqlite3`.
    -   **Sufficient for Project Needs:** Provides adequate features for storing and retrieving PDF metadata without the overhead of a larger database server.
-   **`pdf_metadata` Table Schema:**
    -   `id`: INTEGER PRIMARY KEY AUTOINCREMENT
    -   `filename`: TEXT NOT NULL
    -   `title`: TEXT
    -   `author`: TEXT
    -   `creator`: TEXT
    -   `producer`: TEXT
    -   `creationDate`: TEXT (ISO string)
    -   `modificationDate`: TEXT (ISO string)
    -   `uploadedAt`: DATETIME DEFAULT CURRENT_TIMESTAMP

## Project Structure within `apps/web`

Key parts of the integrations are located as follows:

-   **tRPC:**
    -   Server Initialization: `pages/api/trpc/[trpc].ts`
    -   Client Configuration: `utils/trpc.ts`
    -   Core tRPC Setup: `server/trpc/trpc.ts`
    -   Routers: `server/trpc/routers/` (e.g., `_app.ts`, `pdf.ts`)
-   **Material UI (MUI):**
    -   Custom Theme: `styles/theme.ts`
    -   Theme Registry & Emotion Cache: `components/ThemeRegistry.tsx`, `components/EmotionCache.tsx`
    -   MUI components are used directly in page files like `app/page.tsx` and `app/layout.tsx`.
-   **Database (SQLite & PDF Metadata Logic):**
    -   Database Connection & Schema: `server/db/index.ts`
    -   The actual SQLite database file: `apps/web/server/db/database.sqlite` (created at runtime)
-   **PDF Parsing Logic:**
    -   Primarily within the tRPC router: `server/trpc/routers/pdf.ts` (using `pdf-lib`).
