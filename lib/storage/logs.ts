import { storage } from "wxt/utils/storage";
import { z } from "zod";
import { type LogEntry, LogEntrySchema } from "../types";

const STORAGE_KEY = "local:logs" as const;
const MAX_LOGS = 500;

export async function createLog(
	logData: Omit<LogEntry, "id" | "timestamp">,
): Promise<void> {
	const data = await storage.getItem<LogEntry[]>(STORAGE_KEY, { fallback: [] });
	const logs = z.array(LogEntrySchema).parse(data);

	const logEntry: LogEntry = {
		id: crypto.randomUUID(),
		timestamp: Date.now(),
		...logData,
	};

	const updatedLogs = [...logs, logEntry].slice(-MAX_LOGS);
	await storage.setItem(STORAGE_KEY, updatedLogs);
}

export async function listLogs(): Promise<LogEntry[]> {
	const data = await storage.getItem<LogEntry[]>(STORAGE_KEY, { fallback: [] });
	return z.array(LogEntrySchema).parse(data);
}

export async function listLogsByJob(jobId: string): Promise<LogEntry[]> {
	const data = await storage.getItem<LogEntry[]>(STORAGE_KEY, { fallback: [] });
	const logs = z.array(LogEntrySchema).parse(data);
	return logs.filter((log) => log.jobId === jobId);
}

export async function clearLogs(): Promise<void> {
	await storage.setItem(STORAGE_KEY, []);
}
