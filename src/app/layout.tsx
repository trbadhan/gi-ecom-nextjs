import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";   // <-- import
import ProgressProvider from "@/components/ProgressProvider"; // <-- progress bar wrapper

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gari Admin",
  description: "Admin panel for managing Gari Import",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>     {/* ✅ now context is available everywhere */}
          <ProgressProvider />  {/* ✅ global navigation progress bar */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
