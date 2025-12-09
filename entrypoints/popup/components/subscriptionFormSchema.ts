import { z } from "zod";

export const subscriptionSchema = z.object({
	name: z
		.string()
		.min(1, "Subscription name is required")
		.min(2, "Name must be at least 2 characters")
		.transform((val) => val.trim()),
});

export type SubscriptionFormData = z.infer<typeof subscriptionSchema>;
