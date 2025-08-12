import { readdir, stat, mkdir, rm } from "fs/promises";
import { join, basename, dirname } from "path";
import { config } from "@/config";
import { MIME_TYPES } from "@/lib/mime-types";
import { VideoMetadata } from "@/lib/types";
import ffmpeg from "fluent-ffmpeg";
import { FFProbeStream } from "./types";
import { fileExists, getFileExtension, getBaseName } from "@/lib/file-utils";

export class VideoService {
  private static readonly VIDEOS_DIR = join(config.storageDir, 'videos');
  private static readonly THUMBNAILS_DIR = join(config.storageDir, 'thumbnails');
  private static readonly PROCESSED_DIR = join(config.storageDir, 'processed');

  /** Ensure base directories exist */
  private static async ensureBaseDirs(): Promise<void> {
    try { await mkdir(this.VIDEOS_DIR, { recursive: true }); } catch {}
    try { await mkdir(this.THUMBNAILS_DIR, { recursive: true }); } catch {}
    try { await mkdir(this.PROCESSED_DIR, { recursive: true }); } catch {}
  }
  /**
   * Ensure thumbnails directory exists
   */
  private static async ensureThumbnailsDir(): Promise<void> {
    try {
      await stat(this.THUMBNAILS_DIR);
    } catch {
      await mkdir(this.THUMBNAILS_DIR, { recursive: true });
    }
  }

  /**
   * Pick a random thumbnail timestamp within a safe window.
   * - Lower bound: up to 10s (or ~20% of the duration for short videos)
   * - Upper bound: 5s before the end
   */
  private static calculateThumbnailTime(duration: number): string {
    if (!Number.isFinite(duration) || duration <= 6) {
      return '00:00:01';
    }

    const lowerBound = Math.min(10, Math.floor(duration * 0.2));
    const upperBound = Math.max(lowerBound, Math.floor(duration - 5));
    const pick = lowerBound + Math.random() * (upperBound - lowerBound);
    const timestamp = Math.floor(pick);

    const hours = Math.floor(timestamp / 3600);
    const minutes = Math.floor((timestamp % 3600) / 60);
    const seconds = Math.floor(timestamp % 60);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Generate thumbnail for a video file
   */
  private static async generateThumbnail(videoPath: string, thumbnailPath: string, timeOffset: string = '00:00:10'): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`🎬 Generating HD thumbnail for: ${basename(videoPath)}`);
      
      ffmpeg(videoPath)
        .screenshots({
          timestamps: [timeOffset],
          filename: basename(thumbnailPath),
          folder: dirname(thumbnailPath),
          size: `1280x720`
        })
        .on('end', () => {
          console.log(`✓ HD thumbnail generated: ${basename(thumbnailPath)}`);
          resolve();
        })
        .on('error', (err) => {
          console.error(`✗ Failed to generate thumbnail for ${basename(videoPath)}:`, err.message);
          reject(err);
        });
    });
  }

  /**
   * Check if thumbnail exists and generate if missing
   */
  private static async ensureThumbnail(file: string, duration?: number, force: boolean = false): Promise<string | undefined> {
    const baseName = getBaseName(file);
    const thumbnailName = `${baseName}.jpg`;
    const thumbVariantName = `${baseName}_thumb.jpg`;
    const thumbnailPath = join(this.THUMBNAILS_DIR, thumbnailName);
    const thumbVariantPath = join(this.THUMBNAILS_DIR, thumbVariantName);
    
    // Optionally force regeneration by removing existing files
    if (force) {
      try { await rm(thumbnailPath, { force: true }); } catch {}
      try { await rm(thumbVariantPath, { force: true }); } catch {}
    } else {
      // Check if thumbnail already exists
      if (await fileExists(thumbnailPath)) {
        const s = await stat(thumbnailPath);
        return `/thumbnails/${thumbnailName}?v=${Math.floor(s.mtimeMs)}`;
      }
      if (await fileExists(thumbVariantPath)) {
        const s = await stat(thumbVariantPath);
        return `/thumbnails/${thumbVariantName}?v=${Math.floor(s.mtimeMs)}`;
      }
    }

    // Generate thumbnail if we have duration
    if (duration && duration > 0) {
      try {
        await this.ensureThumbnailsDir();
        const videoPath = join(this.VIDEOS_DIR, file);
        const timeOffset = this.calculateThumbnailTime(duration);
        
        await this.generateThumbnail(videoPath, thumbnailPath, timeOffset);
        const s = await stat(thumbnailPath);
        return `/thumbnails/${thumbnailName}?v=${Math.floor(s.mtimeMs)}`;
      } catch (error) {
        console.error(`Failed to generate thumbnail for ${file}:`, error);
        // Continue without thumbnail
      }
    }

    return undefined;
  }

  /**
   * Regenerate thumbnail for a single video file and return the new URL
   */
  static async regenerateThumbnail(file: string): Promise<string | undefined> {
    const filePath = join(this.VIDEOS_DIR, file);

    // Determine duration using primary and fallback methods
    let duration: number | undefined;
    try {
      duration = await this.getVideoDuration(filePath);
    } catch {
      try {
        duration = await this.getDurationFromStreams(filePath);
      } catch {
        // Continue without duration; ensureThumbnail will return undefined
      }
    }

    // Force regeneration
    return await this.ensureThumbnail(file, duration, true);
  }

  /**
   * Get video duration using ffprobe
   */
  static async getVideoDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }
        
        const duration = metadata.format?.duration;
        if (duration === undefined || duration === null) {
          reject(new Error('No duration found in metadata'));
          return;
        }
        
        const durationNum = typeof duration === 'string' ? parseFloat(duration) : duration;
        if (!isNaN(durationNum) && durationNum > 0) {
          resolve(Math.floor(durationNum));
        } else {
          reject(new Error('No valid duration found in metadata'));
        }
      });
    });
  }

  /**
   * Fallback function to get duration from video streams
   */
  static async getDurationFromStreams(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Try to get duration from video streams
        const videoStreams = metadata.streams?.filter((stream: FFProbeStream) => stream.codec_type === 'video');
        if (videoStreams && videoStreams.length > 0) {
          const duration = videoStreams[0].duration;
          if (duration === undefined || duration === null) {
            reject(new Error('No duration found in video streams'));
            return;
          }
          
          const durationNum = typeof duration === 'string' ? parseFloat(duration) : duration;
          if (!isNaN(durationNum) && durationNum > 0) {
            resolve(Math.floor(durationNum));
            return;
          }
        }
        
        reject(new Error('No duration found in video streams'));
      });
    });
  }

  /**
   * Get video metadata for a single file
   */
  static async getVideoMetadata(file: string): Promise<VideoMetadata> {
    const filePath = join(this.VIDEOS_DIR, file);
    const fileStat = await stat(filePath);
    
    // Get actual video duration
    let duration: number | undefined;
    try {
      duration = await this.getVideoDuration(filePath);
    } catch {
      // Fallback: try to get duration from video streams
      try {
        duration = await this.getDurationFromStreams(filePath);
      } catch {
        // Fallback failed, continue without duration
      }
    }
    
    // Ensure thumbnail exists (generate if missing)
    const extension = getFileExtension(file);
    const thumbnailUrl = await this.ensureThumbnail(file, duration);
    
    return {
      id: file,
      title: getBaseName(file).replace(/[_-]/g, ' '),
      fileName: file,
      size: fileStat.size,
      duration: duration,
      createdAt: fileStat.birthtime,
      thumbnailUrl: thumbnailUrl,
      videoUrl: `/videos/${file}`,
      mimeType: MIME_TYPES[extension] || 'video/mp4',
    };
  }

  /**
   * Get all videos metadata
   */
  static async getAllVideos(): Promise<VideoMetadata[]> {
    await this.ensureBaseDirs();
    const files = await readdir(this.VIDEOS_DIR);
    const videos: VideoMetadata[] = [];
    
    // Process files in parallel for better performance
    const videoPromises = files.map(async (file) => {
      const extension = getFileExtension(file);
      
      const supported = Object.prototype.hasOwnProperty.call(MIME_TYPES, extension);
      if (extension && supported) {
        try {
          return await this.getVideoMetadata(file);
        } catch {
          // Skip files that can't be processed
          return null;
        }
      }
      return null;
    });
    
    const results = await Promise.allSettled(videoPromises);
    
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        videos.push(result.value);
      }
    }
    
    return videos;
  }

  /**
   * Regenerate metadata for all videos with retry logic
   */
  static async regenerateMetadata(force: boolean = false): Promise<{
    videos: VideoMetadata[];
    videosWithoutDuration: number;
  }> {
    const files = await readdir(this.VIDEOS_DIR);
    const videos: VideoMetadata[] = [];
    
    for (const file of files) {
      const extension = getFileExtension(file);
      
      const supported = Object.prototype.hasOwnProperty.call(MIME_TYPES, extension);
      if (extension && supported) {
        const filePath = join(this.VIDEOS_DIR, file);
        const fileStat = await stat(filePath);
        
        // Get duration with multiple attempts
        let duration: number | undefined;
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts && !duration) {
          try {
            duration = await this.getVideoDuration(filePath);
          } catch {
            attempts++;
            
            if (attempts < maxAttempts) {
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
        
        // Ensure thumbnail exists (generate if missing)
        const thumbnailUrl = await this.ensureThumbnail(file, duration, force);
        
        videos.push({
          id: file,
          title: getBaseName(file).replace(/[_-]/g, ' '),
          fileName: file,
          size: fileStat.size,
          duration: duration,
          createdAt: fileStat.birthtime,
          thumbnailUrl: thumbnailUrl,
          videoUrl: `/videos/${file}`,
          mimeType: MIME_TYPES[extension] || 'video/mp4',
        });
      }
    }
    
    return {
      videos,
      videosWithoutDuration: videos.filter(v => !v.duration).length,
    };
  }
}