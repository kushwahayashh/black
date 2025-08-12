# Video App

A clean video library built with Next.js 15, TypeScript and Tailwind CSS. It scans the `videos` folder, generates thumbnails, and plays videos in a modern UI.

## Features

- Browse videos with thumbnails and sizes
- Stream videos with Range support
- Generate thumbnails on-demand or via script
- Simple, single `config.ts`

## Quick start

1) Install
```bash
npm install
```

2) Put video files in `videos/` (create the folder at repo root if missing).

3) Dev
```bash
npm run dev
```

Open `http://localhost:3000`.

## Configuration (`config.ts`)

```ts
export const config = {
  paths: {
    videos: join(process.cwd(), 'videos'),
    thumbnails: join(process.cwd(), 'thumbnails'),
    processed: join(process.cwd(), 'processed'),
  },
  thumbnails: {
    width: 1280,
    height: 720,
    quality: 95,
    timeOffset: '00:00:10',
  },
  supportedFormats: ['mp4', 'webm', 'mov', 'avi', 'mkv'],
  maxFileSize: 5 * 1024 * 1024 * 1024,
} as const;
```

## Scripts

- `npm run thumbnails` — generate thumbnails for all files in `videos/` using ffmpeg
  - requires `ffmpeg` to be installed and on PATH

## Project structure

```
video-app/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── player/page.tsx
│   └── videos/{page.tsx,client-page.tsx}
├── components/ui/
├── lib/
├── scripts/
├── videos/        # your input files
├── thumbnails/    # generated assets
└── processed/     # sprite files
```

## Notes

- CSS for player: `import 'plyr-react/plyr.css'` (already included in the player component)
- If thumbnails don't appear, run `npm run thumbnails` to generate them
- Large files: streaming route supports Range requests

## License

MIT