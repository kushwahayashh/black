"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useRef, useState } from 'react';

interface VideoPlayerProps {
  src: string;
  fileName?: string; // video file name to locate sprite/vtt
}

export default function VideoPlayer({ src, fileName }: VideoPlayerProps) {
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<any | null>(null);
  const [isReady, setIsReady] = useState(false);

  const vttUrl = useMemo(() => {
    if (!fileName) return undefined;
    const base = fileName.replace(/\.[^/.]+$/, '');
    return `/processed/${base}_sprite.vtt`;
  }, [fileName]);

  // Infer MIME type from the src extension to help Plyr set the source reliably in dev
  const inferredType = useMemo(() => {
    try {
      const url = new URL(src, typeof window !== 'undefined' ? window.location.href : 'http://localhost');
      const pathname = url.pathname.toLowerCase();
      if (pathname.endsWith('.mp4')) return 'video/mp4';
      if (pathname.endsWith('.webm')) return 'video/webm';
      if (pathname.endsWith('.ogg') || pathname.endsWith('.ogv')) return 'video/ogg';
      // Leave undefined for other cases (e.g., HLS, DASH) which require separate libs
      return undefined;
    } catch {
      return undefined;
    }
  }, [src]);

  useEffect(() => {
    let isCancelled = false;

    async function ensurePlayerInitialized() {
      const element = videoElRef.current;
      if (!element || isCancelled) return;

      // Lazy-import Plyr only on the client to avoid dev-time bundler quirks
      const { default: Plyr } = await import('plyr');

      // If a previous instance exists (e.g. due to HMR/StrictMode), destroy before re-creating
      try {
        playerRef.current?.destroy?.();
      } catch {}

      const options: any = {
        autoplay: true,
        ratio: '16:9',
        controls: [
          'play-large',
          'play',
          'progress',
          'current-time',
          'mute',
          'volume',
          'settings',
          'fullscreen',
        ],
      };
      if (vttUrl) {
        options.previewThumbnails = { enabled: true, src: vttUrl };
      }

      const instance: any = new Plyr(element as any, options);
      playerRef.current = instance;

      // Reveal only when Plyr is fully ready to avoid native control flicker
      instance.once?.('ready', () => {
        if (!isCancelled) setIsReady(true);
      });

      // Set the source explicitly; include type if we can infer one
      const videoSource: any = {
        src,
      };
      if (inferredType) videoSource.type = inferredType;

      instance.source = {
        type: 'video',
        sources: [videoSource],
      } as any;
    }

    // Schedule on next tick to avoid dev double-invoke races
    setIsReady(false);
    const timer = setTimeout(() => {
      void ensurePlayerInitialized();
    }, 0);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      try {
        playerRef.current?.destroy?.();
      } catch {}
      playerRef.current = null;
    };
  }, [src, vttUrl, inferredType]);

  return (
    <div className="relative h-full w-full">
      <video
        ref={videoElRef}
        className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-150 ${
          isReady ? 'opacity-100' : 'opacity-0'
        }`}
        playsInline
        preload="metadata"
        muted
      />
    </div>
  );
}

