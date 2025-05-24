"use client";

import React, { useState, useCallback, useEffect } from "react";
import { trpc } from "../utils/trpc";
import {
  Container,
  Box,
  Typography,
  Button as MuiButton,
  AppBar,
  Toolbar,
  Paper,
  Grid,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Alert,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

// New imports for IndexedDB integration
import BookList from "../components/BookList";
import BookForm from "../components/BookForm";
import { ebookRepository } from "../lib/indexedDB";
// Assuming Ebook type is in ../server/db as per previous steps
// This might need adjustment if Ebook type is moved to a shared location e.g. @repo/types
import { type Ebook } from "../server/db";

// Custom styled Paper for sections
const SectionPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(4),
  boxShadow: theme.shadows[2],
}));

// Styled input for file selection
const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  // State for IndexedDB UI
  const [isClientDbReady, setIsClientDbReady] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingBook, setEditingBook] = useState<Ebook | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // To trigger BookList refresh

  useEffect(() => {
    // Ensure IndexedDB related components are only rendered client-side
    setIsClientDbReady(true);
  }, []);

  const pdfListQuery = trpc.pdf.listPdfs.useQuery();
  const uploadPdfMutation = trpc.pdf.uploadPdf.useMutation({
    onSuccess: async (data) => {
      // Make onSuccess async
      setSelectedFile(null);
      setUploadError(null);
      pdfListQuery.refetch(); // Refetch the list of PDFs for the server list

      // Also save to IndexedDB
      if (data.success && data.ebook) {
        try {
          const ebookForIndexedDB: Ebook = {
            ...data.ebook,
            id: data.ebook.id.toString(), // Ensure ID is a string for Dexie
          };
          await ebookRepository.save(ebookForIndexedDB);
          setRefreshKey((prev) => prev + 1); // Trigger client BookList refresh
        } catch (err) {
          console.error("Error saving uploaded ebook to IndexedDB:", err);
          setClientError(
            err instanceof Error
              ? err.message
              : "Failed to save ebook to local DB."
          );
        }
      }
    },
    onError: (error) => {
      setUploadError(`Upload failed: ${error.message}`);
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type === "application/pdf") {
        setSelectedFile(file);
        setUploadError(null); // Clear previous errors
      } else {
        setSelectedFile(null);
        setUploadError("Please select a PDF file.");
      }
    }
  };

  const handleFileUpload = useCallback(async () => {
    if (!selectedFile) {
      setUploadError("No file selected.");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(selectedFile);
    reader.onload = () => {
      const base64Data = (reader.result as string).split(",")[1];
      if (base64Data) {
        uploadPdfMutation.mutate({
          filename: selectedFile.name,
          data: base64Data,
        });
      } else {
        setUploadError("Could not read file data.");
      }
    };
    reader.onerror = () => {
      setUploadError("Error reading file.");
    };
  }, [selectedFile, uploadPdfMutation]);

  return (
    <>
      <AppBar position="static" color="primary" sx={{ marginBottom: 4 }}>
        <Toolbar>
          <RocketLaunchIcon sx={{ mr: 2, fontSize: "2.5rem" }} />
          <Typography
            variant="h1"
            component="h1"
            sx={{ flexGrow: 1, fontSize: "1.75rem" }}
          >
            Baobab Reader
          </Typography>
          <MuiButton
            color="inherit"
            href="https://turborepo.com?utm_source=create-turbo"
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<OpenInNewIcon />}
          >
            Turborepo.com
          </MuiButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid size={12}>
            <SectionPaper>
              <Typography
                variant="h2"
                component="h2"
                gutterBottom
                sx={{ display: "flex", alignItems: "center" }}
              >
                <PictureAsPdfIcon
                  color="primary"
                  sx={{ fontSize: "2.5rem", mr: 1 }}
                />{" "}
                PDF Management
              </Typography>

              <Box sx={{ my: 2 }}>
                <MuiButton
                  component="label"
                  role={undefined}
                  variant="contained"
                  tabIndex={-1}
                  startIcon={<UploadFileIcon />}
                  disabled={uploadPdfMutation.isPending}
                >
                  {selectedFile
                    ? `Selected: ${selectedFile.name}`
                    : "Select PDF File"}
                  <VisuallyHiddenInput
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                  />
                </MuiButton>
                {selectedFile && (
                  <MuiButton
                    variant="contained"
                    color="secondary"
                    onClick={handleFileUpload}
                    disabled={uploadPdfMutation.isPending || !selectedFile}
                    sx={{ ml: 2 }}
                    startIcon={
                      uploadPdfMutation.isPending ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <CloudUploadIcon />
                      )
                    }
                  >
                    {uploadPdfMutation.isPending
                      ? "Uploading..."
                      : "Upload PDF"}
                  </MuiButton>
                )}
              </Box>

              {uploadError && (
                <Alert severity="error" sx={{ my: 2 }}>
                  {uploadError}
                </Alert>
              )}
              {uploadPdfMutation.isSuccess && (
                <Alert severity="success" sx={{ my: 2 }}>
                  PDF uploaded successfully!
                </Alert>
              )}

              <Typography
                variant="h3"
                component="h3"
                gutterBottom
                sx={{ mt: 3, fontSize: "1.75rem" }}
              >
                Uploaded PDFs
              </Typography>
              {pdfListQuery.isPending && <CircularProgress />}
              {pdfListQuery.isError && (
                <Alert severity="error">
                  Error fetching PDF list: {pdfListQuery.error?.message}
                </Alert>
              )}
              {pdfListQuery.data && (
                <TableContainer
                  component={Paper}
                  sx={{ mt: 2, boxShadow: (theme) => theme.shadows[1] }}
                >
                  <Table
                    sx={{ minWidth: 650 }}
                    aria-label="simple table of PDFs"
                  >
                    <TableHead
                      sx={{
                        backgroundColor: (theme) => theme.palette.grey[100],
                      }}
                    >
                      <TableRow>
                        <TableCell>Filename</TableCell>
                        <TableCell>Title</TableCell>
                        <TableCell>Author</TableCell>
                        <TableCell>Creator</TableCell>
                        <TableCell>Producer</TableCell>
                        <TableCell>Creation Date</TableCell>
                        <TableCell>Mod. Date</TableCell>
                        <TableCell>Uploaded At</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pdfListQuery.data.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} align="center">
                            No PDFs uploaded yet from server.
                          </TableCell>
                        </TableRow>
                      )}
                      {pdfListQuery.data.map((pdf) => (
                        <TableRow
                          key={pdf.id}
                          sx={{
                            "&:last-child td, &:last-child th": { border: 0 },
                            "&:hover": {
                              backgroundColor: (theme) =>
                                theme.palette.action.hover,
                            },
                          }}
                        >
                          <TableCell component="th" scope="row">
                            {pdf.filename}
                          </TableCell>
                          <TableCell>{pdf.title || "-"}</TableCell>
                          <TableCell>{pdf.author || "-"}</TableCell>
                          <TableCell>{pdf.metadata?.creator || "-"}</TableCell>
                          <TableCell>{pdf.metadata?.producer || "-"}</TableCell>
                          <TableCell>
                            {pdf.metadata?.creationDate
                              ? new Date(
                                  pdf.metadata.creationDate
                                ).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {pdf.metadata?.modificationDate
                              ? new Date(
                                  pdf.metadata.modificationDate
                                ).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {pdf.uploadedAt
                              ? new Date(pdf.uploadedAt).toLocaleString()
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </SectionPaper>
          </Grid>

          {/* IndexedDB Client-side Section */}
          {isClientDbReady && (
            <Grid size={12}>
              <SectionPaper>
                <Typography
                  variant="h2"
                  component="h2"
                  gutterBottom
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <RocketLaunchIcon
                    color="secondary"
                    sx={{ fontSize: "2.5rem", mr: 1 }}
                  />{" "}
                  My Books (Locally Stored)
                </Typography>

                {clientError && (
                  <Alert severity="error" sx={{ my: 2 }}>
                    Client DB Error: {clientError}
                  </Alert>
                )}

                {!isFormVisible && (
                  <MuiButton
                    variant="contained"
                    color="primary"
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={() => {
                      setEditingBook(null);
                      setIsFormVisible(true);
                      setClientError(null);
                    }}
                    sx={{ my: 2 }}
                  >
                    Add New Book Manually
                  </MuiButton>
                )}

                {isFormVisible && (
                  <BookForm
                    bookToEdit={editingBook}
                    onSave={async (ebookData) => {
                      setClientError(null);
                      try {
                        await ebookRepository.save(ebookData);
                        setIsFormVisible(false);
                        setEditingBook(null);
                        setRefreshKey((prev) => prev + 1);
                      } catch (err) {
                        console.error("Error saving book to IndexedDB:", err);
                        setClientError(
                          err instanceof Error
                            ? err.message
                            : "Failed to save book locally."
                        );
                      }
                    }}
                    onCancel={() => {
                      setIsFormVisible(false);
                      setEditingBook(null);
                      setClientError(null);
                    }}
                  />
                )}
                <BookList
                  onEditBook={(book) => {
                    setEditingBook(book);
                    setIsFormVisible(true);
                    setClientError(null);
                  }}
                  refreshKey={refreshKey}
                />
              </SectionPaper>
            </Grid>
          )}
        </Grid>

        {/* Footer section */}
        <Box component="footer" sx={{ mt: 5, py: 3, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            © {new Date().getFullYear()} Advanced Web App. PDF Management with
            MUI & tRPC. Client-side DB with Dexie.
          </Typography>
        </Box>
      </Container>
    </>
  );
}
