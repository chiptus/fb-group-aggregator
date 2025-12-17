import { storage } from "wxt/utils/storage";
import { z } from "zod";
import { type ScrapeJob, ScrapeJobSchema } from "../types";
import { JOBS_STORAGE_KEY } from "./keys";

const MAX_COMPLETED_JOBS = 3;

export async function createJob(
	groupsToScrape: Array<{ id: string; name: string }>,
): Promise<ScrapeJob> {
	const job: ScrapeJob = {
		id: crypto.randomUUID(),
		type: "scrape_all_groups",
		status: "pending",
		createdAt: Date.now(),
		startedAt: null,
		completedAt: null,
		totalGroups: groupsToScrape.length,
		currentGroupIndex: 0,
		groupResults: groupsToScrape.map((g) => ({
			groupId: g.id,
			groupName: g.name,
			status: "pending" as const,
		})),
		successCount: 0,
		failedCount: 0,
	};

	const jobs = await storage.getItem<ScrapeJob[]>(JOBS_STORAGE_KEY, {
		fallback: [],
	});
	jobs.push(job);
	await storage.setItem(JOBS_STORAGE_KEY, jobs);

	return job;
}

export async function listJobs(): Promise<ScrapeJob[]> {
	const data = await storage.getItem<ScrapeJob[]>(JOBS_STORAGE_KEY, {
		fallback: [],
	});
	return z.array(ScrapeJobSchema).parse(data);
}

export async function getJob(id: string): Promise<ScrapeJob | undefined> {
	const data = await storage.getItem<ScrapeJob[]>(JOBS_STORAGE_KEY, {
		fallback: [],
	});
	const jobs = z.array(ScrapeJobSchema).parse(data);
	return jobs.find((j) => j.id === id);
}

export async function updateJob(
	id: string,
	updates: Partial<Omit<ScrapeJob, "id" | "createdAt">>,
): Promise<ScrapeJob> {
	const data = await storage.getItem<ScrapeJob[]>(JOBS_STORAGE_KEY, {
		fallback: [],
	});
	const jobs = z.array(ScrapeJobSchema).parse(data);
	const index = jobs.findIndex((j) => j.id === id);

	if (index === -1) {
		throw new Error(`Job with id ${id} not found`);
	}

	const updated = { ...jobs[index], ...updates };
	jobs[index] = updated;
	await storage.setItem(JOBS_STORAGE_KEY, jobs);

	return updated;
}

export async function deleteJob(id: string): Promise<void> {
	const data = await storage.getItem<ScrapeJob[]>(JOBS_STORAGE_KEY, {
		fallback: [],
	});
	const jobs = z.array(ScrapeJobSchema).parse(data);
	const filtered = jobs.filter((j) => j.id !== id);
	await storage.setItem(JOBS_STORAGE_KEY, filtered);
}

export async function cleanupOldJobs(): Promise<void> {
	const data = await storage.getItem<ScrapeJob[]>(JOBS_STORAGE_KEY, {
		fallback: [],
	});
	const jobs = z.array(ScrapeJobSchema).parse(data);

	const completedJobs = jobs
		.filter((j) => j.status === "completed")
		.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
		.slice(0, MAX_COMPLETED_JOBS);

	const nonCompletedJobs = jobs.filter((j) => j.status !== "completed");
	const kept = [...nonCompletedJobs, ...completedJobs];

	await storage.setItem(JOBS_STORAGE_KEY, kept);
}

export async function getActiveJob(): Promise<ScrapeJob | undefined> {
	const data = await storage.getItem<ScrapeJob[]>(JOBS_STORAGE_KEY, {
		fallback: [],
	});
	const jobs = z.array(ScrapeJobSchema).parse(data);
	return jobs.find((j) => j.status === "running" || j.status === "paused");
}
