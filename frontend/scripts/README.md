# Video App Scripts

This directory contains utility scripts for managing your video app.

## Automatic Thumbnail Generation

**Note**: Thumbnail generation is now automatic! When you run `npm run dev`, thumbnails are automatically generated for any videos that don't have them when the video metadata is requested.

## Manual Thumbnail Generation (Optional)

If you want to pre-generate all thumbnails at once, you can still use the manual script:

### Usage

```bash
# Using npm script (recommended)
npm run thumbnails

# Or directly with tsx
npx tsx scripts/generate-thumbnails.ts
```

### How Automatic Generation Works

- **On-demand**: Thumbnails are generated automatically when video metadata is requested
- **Smart timing**: Generates thumbnails at 10% into the video (minimum 10 seconds)
- **Skip existing**: Won't regenerate thumbnails that already exist
- **Multiple formats**: Supports all video formats configured in your app
- **Error handling**: Continues processing even if thumbnail generation fails

### Configuration

The system uses your existing video configuration from `config.ts`:

- **Videos directory**: Where your video files are stored
- **Thumbnails directory**: Where generated thumbnails will be saved
- **Supported formats**: Which video file types to process

### Thumbnail Settings

- **Size**: 320x180 pixels
- **Format**: JPEG
- **Timing**: 10% into video (minimum 10 seconds, maximum 5 seconds from end)

### Output

Thumbnails are saved as `{video-name}.jpg` in your thumbnails directory.

### Requirements

- FFmpeg must be installed on your system
- Node.js and npm/yarn