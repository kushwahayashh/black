"use client";

import { VideoMetadata } from "@/lib/types";
import { VideoCard } from "@/components/ui/video-card";
import { Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface VideoLibraryProps {
  videos?: VideoMetadata[];
  loading?: boolean;
}

export function VideoLibrary({ videos = [], loading = false }: VideoLibraryProps) {

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="relative overflow-hidden rounded-xl border bg-card shadow-sm">
              <div className="aspect-video relative overflow-hidden bg-muted">
                <Skeleton className="w-full h-full absolute top-0 left-0" />
              </div>
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Videos Grid */}
      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-xl border-2 border-dashed border-border text-center px-6">
          <Zap className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-1">No videos found</h3>
          <p className="text-muted-foreground max-w-md">
            Get started by adding videos to your library.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
            />
          ))}
        </div>
      )}
    </div>
  );
}