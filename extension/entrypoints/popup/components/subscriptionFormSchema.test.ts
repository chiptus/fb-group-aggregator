import { describe, expect, it } from "vitest";
import { subscriptionSchema } from "./subscriptionFormSchema";

describe("subscriptionFormSchema", () => {
	describe("name validation", () => {
		it("validates minimum length of 1 character", () => {
			const result = subscriptionSchema.safeParse({ name: "" });

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe(
					"Subscription name is required",
				);
			}
		});

		it("validates minimum length of 2 characters", () => {
			const result = subscriptionSchema.safeParse({ name: "a" });

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe(
					"Name must be at least 2 characters",
				);
			}
		});

		it("accepts valid name with 2 characters", () => {
			const result = subscriptionSchema.safeParse({ name: "ab" });

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.name).toBe("ab");
			}
		});

		it("accepts valid name with multiple characters", () => {
			const result = subscriptionSchema.safeParse({
				name: "My Subscription",
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.name).toBe("My Subscription");
			}
		});

		it("trims whitespace from name", () => {
			const result = subscriptionSchema.safeParse({ name: "  test  " });

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.name).toBe("test");
			}
		});

		it("trims whitespace before validation", () => {
			// 2 spaces should fail after trim (becomes empty string)
			const result = subscriptionSchema.safeParse({ name: "  " });

			expect(result.success).toBe(false);
		});

		it("validates after trimming whitespace", () => {
			// Should pass - " a " trims to "a" which is 1 char, then fails min(2)
			const result = subscriptionSchema.safeParse({ name: " a " });

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe(
					"Name must be at least 2 characters",
				);
			}
		});
	});
});
