'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ImageKitProvider } from "imagekitio-next";
import { HeroUIProvider } from '@heroui/system';
import { UploadProgressProvider } from '@/contexts/UploadProgressContext';
import { Toaster } from 'sonner';

const authenticator = async () => {
  try {
    const response = await fetch('/api/imagekit-auth');
    if (!response.ok) throw new Error("Authentication failed");
    return await response.json();
  } catch (error) {
    console.error("ImageKit authenticator error:", error);
    return { signature: null, token: null, expire: 0 };
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ImageKitProvider
        publicKey={process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || ''}
        urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || ''}
        authenticator={authenticator}
      >
        <HeroUIProvider>
          <UploadProgressProvider>
            {children}
            <Toaster position="top-right" richColors />
          </UploadProgressProvider>
        </HeroUIProvider>
      </ImageKitProvider>
    </NextThemesProvider>
  );
}