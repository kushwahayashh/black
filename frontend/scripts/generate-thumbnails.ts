#!/usr/bin/env tsx

import { readdir, mkdir } from 'fs/promises';
import { join, extname, basename, dirname } from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { config } from '../config';
import { MIME_TYPES } from '../lib/mime-types';
import { fileExists, getFileExtension, getBaseName } from '../lib/file-utils';

interface ThumbnailOptions {
  width: number;
  height: number;
  quality: number;
  timeOffset: string;
}

interface ProcessResult {
  success: boolean;
  skipped: boolean;
  error?: string;
}

interface GenerationResults {
  total: number;
  generated: number;
  skipped: number;
  failed: number;
  errors: Array<{ file: string; error: string }>;
}

const THUMBNAIL_OPTIONS: ThumbnailOptions = {
  width: 1280,
  height: 720,
  quality: 95,
  timeOffset: '00:00:10'
};

const VIDEOS_DIR = join(config.storageDir, 'videos');
const THUMBNAILS_DIR = join(config.storageDir, 'thumbnails');
const SUPPORTED_FORMATS = Object.keys(MIME_TYPES);

/**
 * Ensure thumbnails directory exists
 */
async function ensureThumbnailsDir(): Promise<void> {
  if (!(await fileExists(THUMBNAILS_DIR))) {
    console.log('Creating thumbnails directory...');
    await mkdir(THUMBNAILS_DIR, { recursive: true });
  }
}

/**
 * Get video duration to calculate better thumbnail timestamp
 */
function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      
      const duration = metadata.format?.duration;
      if (duration && duration > 0) {
        resolve(duration);
      } else {
        reject(new Error('No duration found'));
      }
    });
  });
}

/**
 * Generate thumbnail for a video file
 */
function generateThumbnail(videoPath: string, thumbnailPath: string, timeOffset: string = '00:00:10'): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`Generating thumbnail for: ${basename(videoPath)}`);
    
    ffmpeg(videoPath)
      .screenshots({
        timestamps: [timeOffset],
        filename: basename(thumbnailPath),
        folder: dirname(thumbnailPath),
        size: `${THUMBNAIL_OPTIONS.width}x${THUMBNAIL_OPTIONS.height}`
      })
      .on('end', () => {
        console.log(`✓ Thumbnail generated: ${basename(thumbnailPath)}`);
        resolve();
      })
      .on('error', (err) => {
        console.error(`✗ Failed to generate thumbnail for ${basename(videoPath)}:`, err.message);
        reject(err);
      });
  });
}

/**
 * Calculate optimal thumbnail timestamp (10% into the video, but at least 10 seconds)
 */
function calculateThumbnailTime(duration: number): string {
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
 * Check if thumbnail already exists for a video
 */
async function thumbnailExists(videoFile: string): Promise<{ exists: boolean; path: string }> {
  const baseName = getBaseName(videoFile);
  const thumbnailPath = join(THUMBNAILS_DIR, `${baseName}.jpg`);
  const thumbVariantPath = join(THUMBNAILS_DIR, `${baseName}_thumb.jpg`);
  
  if (await fileExists(thumbnailPath)) {
    return { exists: true, path: thumbnailPath };
  }
  if (await fileExists(thumbVariantPath)) {
    return { exists: true, path: thumbVariantPath };
  }
  return { exists: false, path: thumbnailPath };
}

/**
 * Process a single video file
 */
async function processVideo(videoFile: string): Promise<ProcessResult> {
  const videoPath = join(VIDEOS_DIR, videoFile);
  const { exists, path: thumbnailPath } = await thumbnailExists(videoFile);
  
  if (exists) {
    console.log(`⏭️  Thumbnail already exists for: ${videoFile}`);
    return { success: true, skipped: true };
  }
  
  try {
    // Get video duration for better thumbnail timing
    let timeOffset = THUMBNAIL_OPTIONS.timeOffset;
    try {
      const duration = await getVideoDuration(videoPath);
      timeOffset = calculateThumbnailTime(duration);
      console.log(`📹 Video duration: ${Math.floor(duration)}s, using timestamp: ${timeOffset}`);
    } catch {
      console.log(`⚠️  Could not get duration for ${videoFile}, using default timestamp: ${timeOffset}`);
    }
    
    await generateThumbnail(videoPath, thumbnailPath, timeOffset);
    return { success: true, skipped: false };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage, skipped: false };
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log('🎬 Video Thumbnail Generator');
  console.log('============================');
  
  try {
    // Ensure directories exist
    await ensureThumbnailsDir();
    
    // Get all video files
    const files = await readdir(VIDEOS_DIR);
    const videoFiles = files.filter(file => {
      const ext = getFileExtension(file);
      return SUPPORTED_FORMATS.includes(ext);
    });
    
    if (videoFiles.length === 0) {
      console.log('No video files found in the videos directory.');
      return;
    }
    
    console.log(`Found ${videoFiles.length} video file(s)`);
    console.log('');
    
    // Process videos
    const results: GenerationResults = {
      total: videoFiles.length,
      generated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    };
    
    for (const videoFile of videoFiles) {
      const result = await processVideo(videoFile);
      
      if (result.success) {
        if (result.skipped) {
          results.skipped++;
        } else {
          results.generated++;
        }
      } else {
        results.failed++;
        results.errors.push({ file: videoFile, error: result.error || 'Unknown error' });
      }
    }
    
    // Summary
    console.log('');
    console.log('📊 Summary:');
    console.log(`Total videos: ${results.total}`);
    console.log(`Thumbnails generated: ${results.generated}`);
    console.log(`Already existed: ${results.skipped}`);
    console.log(`Failed: ${results.failed}`);
    
    if (results.errors.length > 0) {
      console.log('');
      console.log('❌ Errors:');
      results.errors.forEach(({ file, error }) => {
        console.log(`  - ${file}: ${error}`);
      });
    }
    
    if (results.generated > 0) {
      console.log('');
      console.log('✅ Thumbnail generation completed!');
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Fatal error:', errorMessage);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export { main, processVideo, generateThumbnail };