import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import ProgressProvider from "@/components/ProgressProvider";

const cairo = Cairo({
  subsets: ["latin"],
  variable: "--font-cairo",   // ✅ define variable
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
      <body className={`${cairo.variable} font-sans antialiased`}>
        <AuthProvider>
          <ProgressProvider />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
