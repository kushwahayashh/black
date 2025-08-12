"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import dynamic from 'next/dynamic';

const VideoPlayer = dynamic(() => import('@/components/ui/video-player'), { ssr: false });

export default function PlayerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const videoSrc = searchParams?.get("src");
  const fileName = searchParams?.get("file") || undefined;

  if (!videoSrc) {
    return (
      <div className="flex flex-col h-screen bg-background items-center justify-center p-6">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Playback Error</h2>
        <p className="text-muted-foreground text-center mb-6">
          No video source provided. Please go back and select a video.
        </p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="relative aspect-video overflow-hidden rounded-xl border bg-black">
            <div className="absolute inset-0">
              <VideoPlayer src={videoSrc} fileName={fileName} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

