import { NextRequest, NextResponse } from "next/server";
import { createReadStream } from "fs";
import { join } from "path";
import { config } from "@/config";
import { MIME_TYPES } from "@/lib/mime-types";
import { stat } from "fs/promises";
import { fileExists, getFileExtension } from "@/lib/file-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Handler for serving files (videos, thumbnails, and processed files)
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);

  // Remove 'api' from the path parts
  if (pathParts[0] === 'api') {
    pathParts.shift();
  }

  if (pathParts.length < 2) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const [resourceType, ...fileNameParts] = pathParts;

  // Validate resource type
  if (!['videos', 'thumbnails', 'processed'].includes(resourceType)) {
    return NextResponse.json({ error: "Invalid resource type" }, { status: 400 });
  }

  const baseDir = resourceType === 'videos'
    ? join(config.storageDir, 'videos')
    : resourceType === 'thumbnails'
      ? join(config.storageDir, 'thumbnails')
      : join(config.storageDir, 'processed');

  const decodedName = decodeURIComponent(fileNameParts.join('/'));
  const fileName = decodedName; // Preserve spaces; do not mutate file names

  // Security: Prevent directory traversal
  if (fileName.includes('..') || fileName.startsWith('/')) {
    return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
  }

  const filePath = join(baseDir, fileName);

  try {
    // Check if file exists and is readable
    const exists = await fileExists(filePath);
    if (!exists) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const fileStats = await stat(filePath);
    const fileSize = fileStats.size;
    const ext = getFileExtension(fileName);
    const contentType =
      MIME_TYPES[ext] ||
      (resourceType === 'videos'
        ? 'video/mp4'
        : ext === 'vtt'
        ? 'text/vtt'
        : ext === 'webp'
        ? 'image/webp'
        : ext === 'png'
        ? 'image/png'
        : ext === 'jpg' || ext === 'jpeg'
        ? 'image/jpeg'
        : 'application/octet-stream');

    // Handle range requests for video streaming
    const range = request.headers.get('range');
    if (range && resourceType === 'videos') {
      const matches = range.match(/bytes=(\d+)-(\d*)/);
      if (matches) {
        const start = parseInt(matches[1], 10);
        const end = matches[2] ? parseInt(matches[2], 10) : fileSize - 1;
        const chunkSize = end - start + 1;

        const stream = createReadStream(filePath, { start, end });

        return new NextResponse(stream as unknown as ReadableStream, {
          status: 206, // Partial Content
          headers: {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': String(chunkSize),
            'Content-Type': contentType,
          },
        });
      }
    }

    // Serve the full file
    const stream = createReadStream(filePath);
    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        'Content-Length': String(fileSize),
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        // Encourage browser caching for static generated assets
        'Cache-Control': resourceType === 'videos' ? 'no-store, max-age=0' : 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


