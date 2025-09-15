import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "./providers";
import { NotificationProvider } from "@/contexts/NotificationContext";

import localFont from "next/font/local";
const geistSans = localFont({
  src: [
    { path: "/fonts/Geist-Regular.woff2", weight: "400", style: "normal" },
    { path: "/fonts/Geist-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: [
    { path: "/fonts/GeistMono-Regular.woff2", weight: "400", style: "normal" },
    { path: "/fonts/GeistMono-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "DropNest",
  description: "Private file storage. Minimal. Fast. Secure.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <NotificationProvider>
        <html lang="en" suppressHydrationWarning>
          <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
            <Providers>
              {children}
            </Providers>
          </body>
        </html>
      </NotificationProvider>
    </ClerkProvider>
  );
}