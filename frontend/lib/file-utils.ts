import { access, constants } from "fs/promises";

/**
 * Check if a file exists and is readable
 */
export async function fileExists(fullPath: string): Promise<boolean> {
  try {
    await access(fullPath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate file name to prevent directory traversal attacks
 */
export function isValidFileName(name: string): boolean {
  return !name.includes("..") && !name.includes("/") && !name.includes("\\") && name.trim().length > 0;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

/**
 * Get base name without extension
 */
export function getBaseName(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, '');
}