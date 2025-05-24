"use client";

import React, { useState, useCallback } from 'react';
import Image from "next/image";
import { trpc } from "../utils/trpc";
import {
  Container,
  Box,
  Typography,
  Button as MuiButton,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
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
  TextField // For file input, though styled MuiButton is better
} from "@mui/material";
import { styled } from '@mui/material/styles';

import CodeIcon from '@mui/icons-material/Code';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import UploadFileIcon from '@mui/icons-material/UploadFile';

// Custom styled Paper for sections
const SectionPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(4),
  boxShadow: theme.shadows[2],
}));

// Styled input for file selection
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});


export default function Home() {
  const hello = trpc.hello.useQuery({ text: "Material UI & tRPC" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const pdfListQuery = trpc.pdf.listPdfs.useQuery();
  const uploadPdfMutation = trpc.pdf.uploadPdf.useMutation({
    onSuccess: () => {
      setSelectedFile(null);
      setUploadError(null);
      pdfListQuery.refetch(); // Refetch the list of PDFs after successful upload
    },
    onError: (error) => {
      setUploadError(`Upload failed: ${error.message}`);
    }
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
      const base64Data = (reader.result as string).split(',')[1];
      if (base64Data) {
        uploadPdfMutation.mutate({ filename: selectedFile.name, data: base64Data });
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
          <RocketLaunchIcon sx={{ mr: 2, fontSize: '2.5rem' }} />
          <Typography variant="h1" component="h1" sx={{ flexGrow: 1, fontSize: '1.75rem' }}>
            Web App with PDF Management
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
        <Grid container spacing={4}> {/* Increased spacing */}
          {/* PDF Management Section */}
          <Grid item xs={12}>
            <SectionPaper>
              <Typography variant="h2" component="h2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <PictureAsPdfIcon color="primary" sx={{ fontSize: '2.5rem', mr: 1 }} /> PDF Management
              </Typography>
              
              <Box sx={{ my: 2 }}>
                <MuiButton
                  component="label"
                  role={undefined}
                  variant="contained"
                  tabIndex={-1}
                  startIcon={<UploadFileIcon />}
                  disabled={uploadPdfMutation.isLoading}
                >
                  {selectedFile ? `Selected: ${selectedFile.name}` : "Select PDF File"}
                  <VisuallyHiddenInput type="file" accept="application/pdf" onChange={handleFileChange} />
                </MuiButton>
                {selectedFile && (
                  <MuiButton 
                    variant="contained" 
                    color="secondary" 
                    onClick={handleFileUpload} 
                    disabled={uploadPdfMutation.isLoading || !selectedFile}
                    sx={{ ml: 2 }}
                    startIcon={uploadPdfMutation.isLoading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                  >
                    {uploadPdfMutation.isLoading ? "Uploading..." : "Upload PDF"}
                  </MuiButton>
                )}
              </Box>

              {uploadError && <Alert severity="error" sx={{ my: 2 }}>{uploadError}</Alert>}
              {uploadPdfMutation.isSuccess && <Alert severity="success" sx={{ my: 2 }}>PDF uploaded successfully!</Alert>}
              
              <Typography variant="h3" component="h3" gutterBottom sx={{ mt: 3, fontSize: '1.75rem' }}>
                Uploaded PDFs
              </Typography>
              {pdfListQuery.isLoading && <CircularProgress />}
              {pdfListQuery.isError && <Alert severity="error">Error fetching PDF list: {pdfListQuery.error?.message}</Alert>}
              {pdfListQuery.data && (
                <TableContainer component={Paper} sx={{ mt: 2, boxShadow: theme => theme.shadows[1] }}>
                  <Table sx={{ minWidth: 650 }} aria-label="simple table of PDFs">
                    <TableHead sx={{ backgroundColor: theme => theme.palette.grey[100]}}>
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
                          <TableCell colSpan={8} align="center">No PDFs uploaded yet.</TableCell>
                        </TableRow>
                      )}
                      {pdfListQuery.data.map((pdf) => (
                        <TableRow
                          key={pdf.id}
                          sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: theme => theme.palette.action.hover } }}
                        >
                          <TableCell component="th" scope="row">{pdf.filename}</TableCell>
                          <TableCell>{pdf.title || '-'}</TableCell>
                          <TableCell>{pdf.author || '-'}</TableCell>
                          <TableCell>{pdf.creator || '-'}</TableCell>
                          <TableCell>{pdf.producer || '-'}</TableCell>
                          <TableCell>{pdf.creationDate ? new Date(pdf.creationDate).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>{pdf.modificationDate ? new Date(pdf.modificationDate).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>{pdf.uploadedAt ? new Date(pdf.uploadedAt).toLocaleString() : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </SectionPaper>
          </Grid>

          {/* Original Content Section (Example from previous step) */}
          <Grid item xs={12}>
            <SectionPaper>
               <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Image
                  src="/turborepo-light.svg"
                  alt="Turborepo Logo"
                  width={220}
                  height={48}
                  priority
                />
              </Box>
              <Typography variant="h2" component="h2" gutterBottom>
                Welcome to the Enhanced Monorepo! (tRPC Status)
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <CodeIcon color="primary" sx={{ fontSize: '2rem' }} />
                  </ListItemIcon>
                  <ListItemText primary={<Typography variant="body1">Get started by editing <code>apps/web/app/page.tsx</code></Typography>} />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleOutlineIcon color="secondary" sx={{ fontSize: '2rem' }} />
                  </ListItemIcon>
                  <ListItemText primary={<Typography variant="body1">Save and see your changes instantly.</Typography>} />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <RocketLaunchIcon color="primary" sx={{ fontSize: '2rem' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={<Typography variant="body1">tRPC greeting: {hello.data ? hello.data.greeting : "Loading tRPC data..."}</Typography>} 
                    secondary="This comes live from our tRPC backend!" 
                  />
                </ListItem>
              </List>
              <Box sx={{ mt: 3, display: 'flex', gap: 2}}>
                <MuiButton
                  variant="contained"
                  color="primary"
                  href="https://vercel.com/new/clone?demo-description=Learn+to+implement+a+monorepo+with+a+two+Next.js+sites+that+has+installed+three+local+packages.&demo-image=%2F%2Fimages.ctfassets.net%2Fe5382hct74si%2F4K8ZISWAzJ8X1504ca0zmC%2F0b21a1c6246add355e55816278ef54bc%2FBasic.png&demo-title=Monorepo+with+Turborepo&demo-url=https%3A%2F%2Fexamples-basic-web.vercel.sh%2F&from=templates&project-name=Monorepo+with+Turborepo&repository-name=monorepo-turborepo&repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fturborepo%2Ftree%2Fmain%2Fexamples%2Fbasic&root-directory=apps%2Fdocs&skippable-integrations=1&teamSlug=vercel&utm_source=create-turbo"
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={<CloudUploadIcon />}
                >
                  Deploy to Vercel
                </MuiButton>
                <MuiButton
                  variant="outlined"
                  color="secondary"
                  href="https://turborepo.com/docs?utm_source"
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={<DescriptionIcon />}
                >
                  Read Turborepo Docs
                </MuiButton>
              </Box>
            </SectionPaper>
          </Grid>
        </Grid>

        {/* Footer section */}
        <Box component="footer" sx={{ mt: 5, py: 3, textAlign: 'center' }}>
          <Grid container spacing={2} justifyContent="center">
            <Grid item>
              <Link
                href="https://vercel.com/templates?search=turborepo&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
                target="_blank"
                rel="noopener noreferrer"
                display="flex"
                alignItems="center"
              >
                <Image
                  src="/window.svg"
                  alt="Window icon"
                  width={24}
                  height={24}
                  style={{ marginRight: '8px' }}
                />
                View Examples
              </Link>
            </Grid>
            <Grid item>
              <Link
                href="https://turborepo.com?utm_source=create-turbo"
                target="_blank"
                rel="noopener noreferrer"
                display="flex"
                alignItems="center"
              >
                <Image
                  src="/globe.svg"
                  alt="Globe icon"
                  width={24}
                  height={24}
                  style={{ marginRight: '8px' }}
                />
                Go to turborepo.com
              </Link>
            </Grid>
          </Grid>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            © {new Date().getFullYear()} Advanced Web App. PDF Management with MUI & tRPC.
          </Typography>
        </Box>
      </Container>
    </>
  );
}
