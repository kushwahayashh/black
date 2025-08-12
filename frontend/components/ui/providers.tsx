"use client";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { ThumbnailProvider } from "@/contexts/thumbnail-context";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <ThumbnailProvider>
        {children}
      </ThumbnailProvider>
    </ThemeProvider>
  );
}