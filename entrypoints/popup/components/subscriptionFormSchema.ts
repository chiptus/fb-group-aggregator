import { z } from "zod";

export const subscriptionSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Subscription name is required")
		.min(2, "Name must be at least 2 characters"),
});

export type SubscriptionFormData = z.infer<typeof subscriptionSchema>;
