import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { PDFDocument } from "pdf-lib";
import {
  insertPdfMetadata,
  getAllPdfMetadata,
  type PdfMetadata,
} from "../../db"; // Correct path to db

// Helper function to parse PDF metadata
async function parsePdfMetadata(
  base64Pdf: string,
  filename: string
): Promise<Omit<PdfMetadata, "id" | "uploadedAt">> {
  const pdfBytes = Buffer.from(base64Pdf, "base64");
  const pdfDoc = await PDFDocument.load(pdfBytes, {
    // Conservatively update metadata if the document is encrypted
    updateMetadata: false,
  });

  // Helper to safely get metadata string or null
  const getMetaString = (metaFunc: () => string | undefined): string | null => {
    try {
      const value = metaFunc();
      return value !== undefined && value.trim() !== "" ? value.trim() : null;
    } catch (error) {
      // Some PDFs might have issues with metadata calls if malformed or encrypted without permissions
      console.warn(
        `Warning: Could not extract metadata for ${filename}: ${error instanceof Error ? error.message : String(error)}`
      );
      return null;
    }
  };

  // Helper to safely get metadata date or null
  const getMetaDate = (metaDateFunc: () => Date | undefined): string | null => {
    try {
      const date = metaDateFunc();
      return date ? date.toISOString() : null;
    } catch (error) {
      console.warn(
        `Warning: Could not extract date metadata for ${filename}: ${error instanceof Error ? error.message : String(error)}`
      );
      return null;
    }
  };

  return {
    filename,
    title: getMetaString(() => pdfDoc.getTitle()),
    author: getMetaString(() => pdfDoc.getAuthor()),
    creator: getMetaString(() => pdfDoc.getCreator()),
    producer: getMetaString(() => pdfDoc.getProducer()),
    creationDate: getMetaDate(() => pdfDoc.getCreationDate()),
    modificationDate: getMetaDate(() => pdfDoc.getModificationDate()),
  };
}

export const pdfRouter = router({
  uploadPdf: publicProcedure
    .input(
      z.object({
        filename: z.string(),
        data: z.string() /* base64 encoded PDF */,
      })
    )
    .mutation(async ({ input }) => {
      const metadata = await parsePdfMetadata(input.data, input.filename);
      const result = await insertPdfMetadata(metadata);
      return { success: true, id: result.id, filename: input.filename };
    }),

  listPdfs: publicProcedure.query(async () => {
    const pdfs = await getAllPdfMetadata();
    return pdfs;
  }),
});

export type PdfRouter = typeof pdfRouter;
