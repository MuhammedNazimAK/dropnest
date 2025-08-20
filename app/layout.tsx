import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "./providers";
import { ThemeWrapper } from "./ThemeWrapper";
import { Toaster } from "sonner";
import { NotificationProvider } from "@/contexts/NotificationContext";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

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
              <ThemeWrapper> {/* theme changes inside here */}
                {children}
                <Toaster position="bottom-right" richColors/>
              </ThemeWrapper>
            </Providers>
          </body>
        </html>
      </NotificationProvider>
    </ClerkProvider>
  );
}