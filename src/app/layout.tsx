import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import ProgressProvider from "@/components/ProgressProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",   // ✅ custom variable
  display: "swap",
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
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <ProgressProvider />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
