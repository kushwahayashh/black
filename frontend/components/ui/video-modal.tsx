"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { Dialog } from './dialog';
import { Button } from './button';
import { Maximize, Minimize } from 'lucide-react';
import { VideoMetadata } from '@/lib/types';
import dynamic from 'next/dynamic';

const VideoPlayer = dynamic(() => import('./video-player'), { ssr: false });

interface VideoModalProps {
  video: VideoMetadata | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VideoModal({ video, open, onOpenChange }: VideoModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = useCallback(async () => {
    if (!modalRef.current) return;

    try {
      if (!isFullscreen) {
        // Enter fullscreen
        if (modalRef.current.requestFullscreen) {
          await modalRef.current.requestFullscreen();
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
    }
  }, [isFullscreen]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleClose = useCallback(() => {
    // Exit fullscreen if active
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.error);
    }
    setIsFullscreen(false);
    onOpenChange(false);
  }, [onOpenChange]);

  if (!video || !video.videoUrl) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
      className={`${
        isFullscreen 
          ? 'fixed inset-0 max-w-none w-screen h-screen rounded-none p-0 m-0 bg-black' 
          : 'max-w-6xl w-[95vw] max-h-[95vh]'
      } transition-all duration-300`}
    >
      <div ref={modalRef} className={`flex flex-col ${isFullscreen ? 'h-screen' : ''}`}>
        {/* Header with controls */}
        <div className={`flex items-center justify-end ${isFullscreen ? 'absolute top-4 right-4 z-10' : 'mb-4'}`}>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className={isFullscreen ? 'text-white hover:bg-white/20' : ''}
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Video player container */}
        <div className={`flex justify-center items-center ${isFullscreen ? 'flex-1 p-0' : 'p-8'}`}>
          <div className={`aspect-video w-full ${isFullscreen ? 'h-full' : 'max-w-4xl'} relative overflow-hidden rounded-lg bg-black`}>
            <VideoPlayer 
              src={video.videoUrl} 
              fileName={video.fileName}
            />
          </div>
        </div>
      </div>
    </Dialog>
  );
}