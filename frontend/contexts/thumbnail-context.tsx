"use client";

import React, { createContext, useContext, useCallback, useState } from 'react';

interface ThumbnailContextType {
  refreshedThumbnails: Set<string>;
  notifyThumbnailRefresh: (fileName: string, newUrl: string) => void;
  getThumbnailUrl: (fileName: string, originalUrl?: string) => string | undefined;
}

const ThumbnailContext = createContext<ThumbnailContextType | undefined>(undefined);

export function ThumbnailProvider({ children }: { children: React.ReactNode }) {
  const [refreshedThumbnails, setRefreshedThumbnails] = useState<Set<string>>(new Set());
  const [thumbnailUrls, setThumbnailUrls] = useState<Map<string, string>>(new Map());

  const notifyThumbnailRefresh = useCallback((fileName: string, newUrl: string) => {
    // Add cache-busting timestamp to ensure fresh image load
    const bustedUrl = newUrl.includes('?') ? `${newUrl}&t=${Date.now()}` : `${newUrl}?t=${Date.now()}`;
    
    setThumbnailUrls(prev => new Map(prev).set(fileName, bustedUrl));
    setRefreshedThumbnails(prev => new Set(prev).add(fileName));
    
    // Force refresh of all images with this filename in the DOM
    const escapedFileName = fileName.replace(/[-/\\.^$*+?()|[\]{}]/g, "\\$&");
    const imgs = document.querySelectorAll(`img[src*="${escapedFileName}"]`);
    imgs.forEach((img) => {
      (img as HTMLImageElement).src = bustedUrl;
    });
  }, []);

  const getThumbnailUrl = useCallback((fileName: string, originalUrl?: string) => {
    const refreshedUrl = thumbnailUrls.get(fileName);
    return refreshedUrl || originalUrl;
  }, [thumbnailUrls]);

  return (
    <ThumbnailContext.Provider value={{
      refreshedThumbnails,
      notifyThumbnailRefresh,
      getThumbnailUrl,
    }}>
      {children}
    </ThumbnailContext.Provider>
  );
}

export function useThumbnailContext() {
  const context = useContext(ThumbnailContext);
  if (context === undefined) {
    throw new Error('useThumbnailContext must be used within a ThumbnailProvider');
  }
  return context;
}