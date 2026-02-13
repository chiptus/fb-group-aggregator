import { beforeEach, describe, expect, it } from "vitest";
import type { LogLevel, LogSource } from "../types";
import { clearLogs, createLog, listLogs, listLogsByJob } from "./logs";

describe("Storage - Logs", () => {
	beforeEach(async () => {
		await chrome.storage.local.clear();
	});

	it("should create a log entry", async () => {
		const logData = {
			level: "info" as LogLevel,
			message: "Test log message",
			source: "background" as LogSource,
			context: { key: "value" },
		};

		await createLog(logData);

		const logs = await listLogs();
		expect(logs).toHaveLength(1);
		expect(logs[0]).toMatchObject({
			...logData,
			id: expect.any(String),
			timestamp: expect.any(Number),
		});
	});

	it("should list all logs", async () => {
		const logData1 = {
			level: "info" as LogLevel,
			message: "First log",
			source: "background" as LogSource,
		};

		const logData2 = {
			level: "error" as LogLevel,
			message: "Second log",
			source: "content" as LogSource,
		};

		await createLog(logData1);
		await createLog(logData2);

		const logs = await listLogs();

		expect(logs).toHaveLength(2);
		expect(logs[0]).toMatchObject(logData1);
		expect(logs[1]).toMatchObject(logData2);
	});

	it("should list logs by job ID", async () => {
		const jobId = "test-job-123";

		const logData1 = {
			level: "info" as LogLevel,
			message: "Job log",
			source: "background" as LogSource,
			jobId,
		};

		const logData2 = {
			level: "info" as LogLevel,
			message: "Other log",
			source: "background" as LogSource,
		};

		await createLog(logData1);
		await createLog(logData2);

		const jobLogs = await listLogsByJob(jobId);

		expect(jobLogs).toHaveLength(1);
		expect(jobLogs[0]).toMatchObject(logData1);
	});

	it("should clear all logs", async () => {
		await createLog({
			level: "info" as LogLevel,
			message: "Test log",
			source: "background" as LogSource,
		});

		await createLog({
			level: "error" as LogLevel,
			message: "Error log",
			source: "content" as LogSource,
		});

		let logs = await listLogs();
		expect(logs).toHaveLength(2);

		await clearLogs();

		logs = await listLogs();
		expect(logs).toHaveLength(0);
	});

	it("should handle empty logs list", async () => {
		const logs = await listLogs();
		expect(logs).toEqual([]);
	});

	it("should handle empty logs by job ID", async () => {
		const jobLogs = await listLogsByJob("nonexistent-job");
		expect(jobLogs).toEqual([]);
	});
});
