import { getScannerConfig } from './scannerConfigService.js';
import { runScan } from './scannerService.js';
import logger from '../config/logger.js';

const RECCHECK_MS = 60 * 1000; // when auto-scan disabled, recheck config every minute
let timeoutId: ReturnType<typeof setTimeout> | null = null;

async function runCycle(): Promise<void> {
  try {
    const config = await getScannerConfig();
    if (!config.autoScanEnabled || config.autoScanIntervalMinutes <= 0) {
      timeoutId = setTimeout(runCycle, RECCHECK_MS);
      return;
    }

    const intervalMs = config.autoScanIntervalMinutes * 60 * 1000;
    logger.info('Auto-scan: starting scheduled scan');
    const result = await runScan();
    if (result) {
      logger.info(`Auto-scan: completed. Scan ${result.scanId}, ${result.totalRooms} rooms, ${result.uniqueUsers} users. Next scan in ${config.autoScanIntervalMinutes} min.`);
    }

    timeoutId = setTimeout(runCycle, intervalMs);
  } catch (err) {
    logger.error('Auto-scan: error', err instanceof Error ? err.message : err);
    const config = await getScannerConfig().catch(() => null);
    const intervalMs = config?.autoScanEnabled && (config?.autoScanIntervalMinutes ?? 0) > 0
      ? config.autoScanIntervalMinutes! * 60 * 1000
      : RECCHECK_MS;
    timeoutId = setTimeout(runCycle, intervalMs);
  }
}

/** Start the auto-scan scheduler. Next scan runs after the current one finishes, then after the configured interval. */
export function startAutoScanScheduler(): void {
  if (timeoutId) return;
  logger.info('Auto-scan scheduler started (run → wait for finish → wait interval → run again)');
  runCycle();
}

/** Stop the auto-scan scheduler. */
export function stopAutoScanScheduler(): void {
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
    logger.info('Auto-scan scheduler stopped');
  }
}
