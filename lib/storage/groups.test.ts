import { beforeEach, describe, expect, it } from "vitest";
import type { Group } from "../types";
import {
	createGroup,
	deleteGroup,
	findGroupByUrl,
	getAllEnabledGroups,
	listGroups,
	updateGroup,
} from "./groups";

describe("Storage - Groups", () => {
	beforeEach(async () => {
		await chrome.storage.local.clear();
	});

	it("should create a new group", async () => {
		const groupData = {
			id: "group-123",
			url: "https://www.facebook.com/groups/test",
			name: "Test Group",
			subscriptionIds: ["sub-1"],
			enabled: true,
		};

		const group = await createGroup(groupData);

		expect(group).toMatchObject({
			...groupData,
			addedAt: expect.any(Number),
			lastScrapedAt: null,
		});

		const stored = await listGroups();
		expect(stored).toEqual([group]);
	});

	it("should list all groups", async () => {
		const mockGroups: Group[] = [
			{
				id: "1",
				url: "https://facebook.com/groups/1",
				name: "Group 1",
				subscriptionIds: ["sub-1"],
				addedAt: Date.now(),
				lastScrapedAt: null,
				enabled: true,
			},
		];

		await chrome.storage.local.set({ groups: mockGroups });

		const groups = await listGroups();

		expect(groups).toEqual(mockGroups);
	});

	it("should update a group", async () => {
		const mockGroup: Group = {
			id: "1",
			url: "https://facebook.com/groups/1",
			name: "Group 1",
			subscriptionIds: ["sub-1"],
			addedAt: Date.now(),
			lastScrapedAt: null,
			enabled: true,
		};

		await chrome.storage.local.set({ groups: [mockGroup] });

		await updateGroup("1", { enabled: false, lastScrapedAt: 123456 });

		const groups = await listGroups();
		expect(groups).toEqual([
			{
				...mockGroup,
				enabled: false,
				lastScrapedAt: 123456,
			},
		]);
	});

	it("should delete a group", async () => {
		const mockGroups: Group[] = [
			{
				id: "1",
				url: "https://facebook.com/groups/1",
				name: "Group 1",
				subscriptionIds: ["sub-1"],
				addedAt: Date.now(),
				lastScrapedAt: null,
				enabled: true,
			},
			{
				id: "2",
				url: "https://facebook.com/groups/2",
				name: "Group 2",
				subscriptionIds: ["sub-1"],
				addedAt: Date.now(),
				lastScrapedAt: null,
				enabled: true,
			},
		];

		await chrome.storage.local.set({ groups: mockGroups });

		await deleteGroup("1");

		const groups = await listGroups();
		expect(groups).toEqual([mockGroups[1]]);
	});

	it("should find group by URL", async () => {
		const mockGroup: Group = {
			id: "1",
			url: "https://www.facebook.com/groups/test",
			name: "Group 1",
			subscriptionIds: ["sub-1"],
			addedAt: Date.now(),
			lastScrapedAt: null,
			enabled: true,
		};

		await chrome.storage.local.set({ groups: [mockGroup] });

		const found = await findGroupByUrl("https://www.facebook.com/groups/test");

		expect(found).toEqual(mockGroup);
	});

	it("should return undefined when group not found by URL", async () => {
		const found = await findGroupByUrl(
			"https://www.facebook.com/groups/nonexistent",
		);

		expect(found).toBeUndefined();
	});

	it("should get all enabled groups and deduplicate by ID", async () => {
		const mockGroups: Group[] = [
			{
				id: "group-1",
				url: "https://facebook.com/groups/1",
				name: "Group 1",
				subscriptionIds: ["sub-1"],
				addedAt: Date.now(),
				lastScrapedAt: null,
				enabled: true,
			},
			{
				id: "group-2",
				url: "https://facebook.com/groups/2",
				name: "Group 2",
				subscriptionIds: ["sub-1"],
				addedAt: Date.now(),
				lastScrapedAt: null,
				enabled: false, // disabled
			},
			{
				id: "group-1", // duplicate ID (should be deduplicated)
				url: "https://facebook.com/groups/1-alt",
				name: "Group 1 Alt",
				subscriptionIds: ["sub-2"],
				addedAt: Date.now(),
				lastScrapedAt: null,
				enabled: true,
			},
			{
				id: "group-3",
				url: "https://facebook.com/groups/3",
				name: "Group 3",
				subscriptionIds: ["sub-2"],
				addedAt: Date.now(),
				lastScrapedAt: null,
				enabled: true,
			},
		];

		await chrome.storage.local.set({ groups: mockGroups });

		const enabledGroups = await getAllEnabledGroups();

		// Should return only enabled groups, deduplicated by ID
		expect(enabledGroups).toHaveLength(2); // group-1 and group-3
		expect(enabledGroups).toEqual(
			expect.arrayContaining([
				{ id: "group-1", name: "Group 1 Alt" },
				{ id: "group-3", name: "Group 3" },
			]),
		);
	});
});
