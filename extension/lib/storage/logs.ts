import { storage } from 'wxt/utils/storage';
import { z } from 'zod';
import { type LogEntry, LogEntrySchema } from '../types';
import { LOGS_STORAGE_KEY } from './keys';

const MAX_LOGS = 100; // Reduced to prevent storage quota issues
const MAX_CONTEXT_STRING_LENGTH = 500; // Truncate large context values

/**
 * Truncate large strings in context to prevent storage bloat
 */
function truncateContext(
  context?: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (!context) return undefined;

  const truncated: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    if (typeof value === 'string' && value.length > MAX_CONTEXT_STRING_LENGTH) {
      truncated[key] =
        value.slice(0, MAX_CONTEXT_STRING_LENGTH) + '...[truncated]';
    } else {
      truncated[key] = value;
    }
  }
  return truncated;
}

export async function createLog(
  logData: Omit<LogEntry, 'id' | 'timestamp'>
): Promise<void> {
  const data = await storage.getItem<LogEntry[]>(LOGS_STORAGE_KEY, {
    fallback: [],
  });
  const logs = z.array(LogEntrySchema).parse(data);

  const logEntry: LogEntry = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    ...logData,
    context: truncateContext(logData.context),
  };

  const updatedLogs = [...logs, logEntry].slice(-MAX_LOGS);
  await storage.setItem(LOGS_STORAGE_KEY, updatedLogs);
}

export async function listLogs(): Promise<LogEntry[]> {
  const data = await storage.getItem<LogEntry[]>(LOGS_STORAGE_KEY, {
    fallback: [],
  });
  return z.array(LogEntrySchema).parse(data);
}

export async function listLogsByJob(jobId: string): Promise<LogEntry[]> {
  const data = await storage.getItem<LogEntry[]>(LOGS_STORAGE_KEY, {
    fallback: [],
  });
  const logs = z.array(LogEntrySchema).parse(data);
  return logs.filter((log) => log.jobId === jobId);
}

export async function clearLogs(): Promise<void> {
  await storage.setItem(LOGS_STORAGE_KEY, []);
}
