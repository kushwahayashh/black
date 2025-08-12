import { isAbsolute, resolve } from "path";

export interface AppConfig {
  /** Parent folder containing subfolders: `videos`, `thumbnails`, `processed` */
  storageDir: string;
}

// Minimal configuration: storage directory only
const rawStorage = process.env.MEDIA_STORAGE_DIR || "../filen";
const absoluteStorage = isAbsolute(rawStorage) ? rawStorage : resolve(process.cwd(), rawStorage);

export const config: Readonly<AppConfig> = {
  storageDir: absoluteStorage,
} as const;