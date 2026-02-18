import { getPrisma } from '../lib/db.js';

export interface RoomScannerConfig {
  maxPages: number;
  pageSize: number;
  delayMs: number;
  /** Filter: e.g. "german" for German rooms; empty = all rooms */
  keywords: string;
  /** room_type param for explore API: "all" | "public" | etc */
  roomType: string;
  /** Hashtags filter for explore API; empty = no filter */
  hashtags: string;
  /** Language filter for room list API: empty = all, "de" = German, "en" = English, etc. */
  language: string;
  /** Run scan automatically on an interval (24/7) */
  autoScanEnabled: boolean;
  /** How often to run auto-scan (minutes). Only used when autoScanEnabled is true. */
  autoScanIntervalMinutes: number;
}

const ROOM_SCANNER_KEY = 'room_scanner';

const DEFAULTS: RoomScannerConfig = {
  maxPages: parseInt(process.env.SCANNER_MAX_PAGES || '100', 10),
  pageSize: 25,
  delayMs: 300,
  keywords: '',
  roomType: 'all',
  hashtags: '',
  language: '',
  autoScanEnabled: false,
  autoScanIntervalMinutes: 60,
};

function clampMaxPages(n: number): number {
  return Math.max(1, Math.min(500, Math.floor(n)));
}
function clampPageSize(n: number): number {
  return Math.max(5, Math.min(100, Math.floor(n)));
}
function clampDelayMs(n: number): number {
  return Math.max(0, Math.min(5000, Math.floor(n)));
}
function str(s: unknown): string {
  return typeof s === 'string' ? s.trim().slice(0, 200) : '';
}
function clampAutoScanInterval(n: number): number {
  return Math.max(5, Math.min(10080, Math.floor(n))); // 5 min to 7 days
}

/** Get current room scanner config (from DB or env defaults). */
export async function getScannerConfig(): Promise<RoomScannerConfig> {
  const db = getPrisma();
  if (!db) return { ...DEFAULTS };
  const row = await db.setting.findUnique({ where: { key: ROOM_SCANNER_KEY } });
  if (!row?.value) return { ...DEFAULTS };
  try {
    const parsed = JSON.parse(row.value) as Partial<RoomScannerConfig>;
    return {
      maxPages: clampMaxPages(parsed.maxPages ?? DEFAULTS.maxPages),
      pageSize: clampPageSize(parsed.pageSize ?? DEFAULTS.pageSize),
      delayMs: clampDelayMs(parsed.delayMs ?? DEFAULTS.delayMs),
      keywords: str(parsed.keywords ?? DEFAULTS.keywords),
      roomType: str(parsed.roomType ?? DEFAULTS.roomType) || 'all',
      hashtags: str(parsed.hashtags ?? DEFAULTS.hashtags),
      language: str(parsed.language ?? DEFAULTS.language),
      autoScanEnabled: parsed.autoScanEnabled === true,
      autoScanIntervalMinutes: clampAutoScanInterval(parsed.autoScanIntervalMinutes ?? DEFAULTS.autoScanIntervalMinutes),
    };
  } catch {
    return { ...DEFAULTS };
  }
}

/** Update room scanner config (admin). Returns the new config. */
export async function updateScannerConfig(updates: Partial<RoomScannerConfig>): Promise<RoomScannerConfig> {
  const current = await getScannerConfig();
  const next: RoomScannerConfig = {
    maxPages: updates.maxPages !== undefined ? clampMaxPages(updates.maxPages) : current.maxPages,
    pageSize: updates.pageSize !== undefined ? clampPageSize(updates.pageSize) : current.pageSize,
    delayMs: updates.delayMs !== undefined ? clampDelayMs(updates.delayMs) : current.delayMs,
    keywords: updates.keywords !== undefined ? str(updates.keywords) : current.keywords,
    roomType: updates.roomType !== undefined ? (str(updates.roomType) || 'all') : current.roomType,
    hashtags: updates.hashtags !== undefined ? str(updates.hashtags) : current.hashtags,
    language: updates.language !== undefined ? str(updates.language) : current.language,
    autoScanEnabled: updates.autoScanEnabled !== undefined ? !!updates.autoScanEnabled : current.autoScanEnabled,
    autoScanIntervalMinutes: updates.autoScanIntervalMinutes !== undefined ? clampAutoScanInterval(updates.autoScanIntervalMinutes) : current.autoScanIntervalMinutes,
  };
  const db = getPrisma();
  if (!db) return next;
  await db.setting.upsert({
    where: { key: ROOM_SCANNER_KEY },
    create: { key: ROOM_SCANNER_KEY, value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });
  return next;
}
