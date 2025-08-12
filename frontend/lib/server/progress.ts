export type SpriteProgressEntry = { current: number; total: number; done: boolean };

/**
 * Returns a process-global progress map for sprite generation keyed by file name.
 * Uses a well-known Symbol to ensure a single shared instance across route modules.
 */
export function getSpriteProgressMap(): Map<string, SpriteProgressEntry> {
  const symbolKey = Symbol.for("sprite-progress-map");
  type GlobalWithMap = { [k: symbol]: Map<string, SpriteProgressEntry> | unknown };
  const g = globalThis as unknown as GlobalWithMap;
  if (!g[symbolKey]) g[symbolKey] = new Map<string, SpriteProgressEntry>();
  return g[symbolKey] as Map<string, SpriteProgressEntry>;
}


