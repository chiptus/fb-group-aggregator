import { beforeEach, describe, expect, it } from "vitest";
import type { Subscription } from "../types";
import {
	createSubscription,
	deleteSubscription,
	listSubscriptions,
} from "./subscriptions";

describe("Storage - Subscriptions", () => {
	beforeEach(async () => {
		// Clear storage before each test using WXT's polyfilled API
		await chrome.storage.local.clear();
	});

	it("should create a new subscription", async () => {
		const subscription = await createSubscription("Test Subscription");

		expect(subscription).toMatchObject({
			name: "Test Subscription",
			id: expect.any(String),
			createdAt: expect.any(Number),
		});

		const stored = await listSubscriptions();
		expect(stored).toEqual([subscription]);
	});

	it("should list all subscriptions", async () => {
		const mockSubscriptions: Subscription[] = [
			{ id: "1", name: "Sub 1", createdAt: Date.now() },
			{ id: "2", name: "Sub 2", createdAt: Date.now() },
		];

		// Use WXT's polyfilled storage API
		await chrome.storage.local.set({ subscriptions: mockSubscriptions });

		const subscriptions = await listSubscriptions();

		expect(subscriptions).toEqual(mockSubscriptions);
	});

	it("should handle empty subscriptions list", async () => {
		const subscriptions = await listSubscriptions();

		expect(subscriptions).toEqual([]);
	});

	it("should delete a subscription", async () => {
		const mockSubscriptions: Subscription[] = [
			{ id: "1", name: "Sub 1", createdAt: Date.now() },
			{ id: "2", name: "Sub 2", createdAt: Date.now() },
		];

		await chrome.storage.local.set({ subscriptions: mockSubscriptions });

		await deleteSubscription("1");

		const result = await listSubscriptions();
		expect(result).toEqual([mockSubscriptions[1]]);
	});
});
