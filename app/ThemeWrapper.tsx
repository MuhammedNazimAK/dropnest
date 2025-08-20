"use client";
import { useEffect, useState } from "react";

export function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
    document.documentElement.style.colorScheme = "dark";
    setMounted(true);
  }, []);

  // Optional fallback to prevent mismatch flashes
  if (!mounted) return null;

  return <>{children}</>;
}
