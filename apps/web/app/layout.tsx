import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import TrpcProvider from "../components/TrpcProvider"; // Adjust path if necessary
import ThemeRegistry from "../components/ThemeRegistry"; // Import the ThemeRegistry

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Baobab Reader",
  description: "PDF ebook manager and reader",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeRegistry>
          {" "}
          {/* Wrap TrpcProvider (and thus children) with ThemeRegistry */}
          <TrpcProvider>{children}</TrpcProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
