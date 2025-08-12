export interface FFProbeStream {
  codec_type?: string;
  duration?: number | string;
  [key: string]: unknown;
}

export interface FFProbeMetadata {
  format?: {
    duration?: number | string;
    [key: string]: unknown;
  };
  streams?: FFProbeStream[];
  [key: string]: unknown;
}

// Core application types
export interface VideoMetadata {
  id: string;
  title: string;
  fileName: string;
  size: number;
  duration?: number;
  thumbnailUrl?: string;
  videoUrl?: string;
  createdAt: Date;
  mimeType?: string;
}