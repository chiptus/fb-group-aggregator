import { storage } from "wxt/utils/storage";
import { z } from "zod";
import { type Subscription, SubscriptionSchema } from "../types";
import { SUBSCRIPTIONS_STORAGE_KEY } from "./keys";

export async function createSubscription(name: string): Promise<Subscription> {
	const subscription: Subscription = {
		id: crypto.randomUUID(),
		name,
		createdAt: Date.now(),
	};

	const subscriptions = await storage.getItem<Subscription[]>(
		SUBSCRIPTIONS_STORAGE_KEY,
		{
			fallback: [],
		},
	);
	subscriptions.push(subscription);
	await storage.setItem(SUBSCRIPTIONS_STORAGE_KEY, subscriptions);

	return subscription;
}

export async function listSubscriptions(): Promise<Subscription[]> {
	const data = await storage.getItem<Subscription[]>(
		SUBSCRIPTIONS_STORAGE_KEY,
		{
			fallback: [],
		},
	);
	return z.array(SubscriptionSchema).parse(data);
}

export async function updateSubscription(
	id: string,
	updates: Partial<Omit<Subscription, "id" | "createdAt">>,
): Promise<Subscription> {
	const data = await storage.getItem<Subscription[]>(
		SUBSCRIPTIONS_STORAGE_KEY,
		{
			fallback: [],
		},
	);
	const subscriptions = z.array(SubscriptionSchema).parse(data);
	const index = subscriptions.findIndex((s: Subscription) => s.id === id);

	if (index === -1) {
		throw new Error(`Subscription with id ${id} not found`);
	}

	const updated = { ...subscriptions[index], ...updates };
	subscriptions[index] = updated;
	await storage.setItem(SUBSCRIPTIONS_STORAGE_KEY, subscriptions);

	return updated;
}

export async function deleteSubscription(id: string): Promise<void> {
	const data = await storage.getItem<Subscription[]>(
		SUBSCRIPTIONS_STORAGE_KEY,
		{
			fallback: [],
		},
	);
	const subscriptions = z.array(SubscriptionSchema).parse(data);
	const filtered = subscriptions.filter((s: Subscription) => s.id !== id);
	await storage.setItem(SUBSCRIPTIONS_STORAGE_KEY, filtered);
}
