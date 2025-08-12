'use server'

import { VideoService } from '@/lib/video-service'
import { VideoMetadata } from '@/lib/types'

export async function getAllVideos(): Promise<VideoMetadata[]> {
  try {
    return await VideoService.getAllVideos()
  } catch (error) {
    console.error('Error fetching videos:', error)
    return []
  }
}

export async function getVideoMetadata(fileName: string): Promise<VideoMetadata | null> {
  try {
    return await VideoService.getVideoMetadata(fileName)
  } catch (error) {
    console.error('Error fetching video metadata:', error)
    return null
  }
}

export async function regenerateMetadata(force: boolean = false): Promise<{
  videos: VideoMetadata[]
  videosWithoutDuration: number
}> {
  try {
    return await VideoService.regenerateMetadata(force)
  } catch (error) {
    console.error('Error regenerating metadata:', error)
    return { videos: [], videosWithoutDuration: 0 }
  }
}