import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import { Navigation } from "@/components/ui/navigation";
import Providers from "@/components/ui/providers";
import PageFade from "@/components/ui/page-fade";
import { Suspense } from "react";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Video Library App",
  description: "A modern video library management system",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <Providers>
          <Suspense fallback={null}>
            <Navigation />
          </Suspense>
          <Suspense fallback={null}>
            <PageFade>{children}</PageFade>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
