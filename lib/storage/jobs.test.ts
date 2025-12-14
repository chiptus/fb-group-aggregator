import { beforeEach, describe, expect, it } from "vitest";
import {
	cleanupOldJobs,
	createJob,
	deleteJob,
	getActiveJob,
	getJob,
	listJobs,
	updateJob,
} from "./jobs";

describe("Job Storage", () => {
	beforeEach(async () => {
		// Clear jobs before each test
		const jobs = await listJobs();
		for (const job of jobs) {
			await deleteJob(job.id);
		}
	});

	it("should create a job with pending status", async () => {
		const groups = [
			{ id: "group1", name: "Group 1" },
			{ id: "group2", name: "Group 2" },
		];

		const job = await createJob(groups);

		expect(job.id).toBeDefined();
		expect(job.type).toBe("scrape_all_groups");
		expect(job.status).toBe("pending");
		expect(job.totalGroups).toBe(2);
		expect(job.currentGroupIndex).toBe(0);
		expect(job.groupResults).toHaveLength(2);
		expect(job.successCount).toBe(0);
		expect(job.failedCount).toBe(0);
	});

	it("should list all jobs", async () => {
		await createJob([{ id: "g1", name: "G1" }]);
		await createJob([{ id: "g2", name: "G2" }]);

		const jobs = await listJobs();

		expect(jobs).toHaveLength(2);
	});

	it("should get a specific job by id", async () => {
		const created = await createJob([{ id: "g1", name: "G1" }]);
		const fetched = await getJob(created.id);

		expect(fetched).toBeDefined();
		expect(fetched?.id).toBe(created.id);
	});

	it("should update a job", async () => {
		const job = await createJob([{ id: "g1", name: "G1" }]);
		const updated = await updateJob(job.id, {
			status: "running",
			startedAt: Date.now(),
			currentGroupIndex: 1,
		});

		expect(updated.status).toBe("running");
		expect(updated.startedAt).not.toBeNull();
		expect(updated.currentGroupIndex).toBe(1);
	});

	it("should delete a job", async () => {
		const job = await createJob([{ id: "g1", name: "G1" }]);
		await deleteJob(job.id);

		const fetched = await getJob(job.id);
		expect(fetched).toBeUndefined();
	});

	it("should get active job (running or paused)", async () => {
		await createJob([{ id: "g1", name: "G1" }]); // pending
		const runningJob = await createJob([{ id: "g2", name: "G2" }]);
		await updateJob(runningJob.id, { status: "running" });

		const active = await getActiveJob();

		expect(active).toBeDefined();
		expect(active?.id).toBe(runningJob.id);
		expect(active?.status).toBe("running");
	});

	it("should cleanup old completed jobs, keeping last 3", async () => {
		const now = Date.now();

		// Create 5 completed jobs
		for (let i = 0; i < 5; i++) {
			const job = await createJob([{ id: `g${i}`, name: `G${i}` }]);
			await updateJob(job.id, {
				status: "completed",
				completedAt: now - (5 - i) * 1000, // older to newer
			});
		}

		// Create 1 running job
		const runningJob = await createJob([{ id: "running", name: "Running" }]);
		await updateJob(runningJob.id, { status: "running" });

		await cleanupOldJobs();

		const jobs = await listJobs();

		// Should have 1 running + 3 most recent completed = 4 total
		expect(jobs).toHaveLength(4);
		expect(jobs.filter((j) => j.status === "completed")).toHaveLength(3);
		expect(jobs.filter((j) => j.status === "running")).toHaveLength(1);
	});
});
