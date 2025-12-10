import { describe, expect, it } from "vitest";
import { createQueryClient } from "./queryClient";

describe("createQueryClient", () => {
	it("returns a QueryClient instance", () => {
		const queryClient = createQueryClient();

		expect(queryClient).toBeDefined();
		expect(queryClient.getQueryCache).toBeDefined();
		expect(queryClient.getMutationCache).toBeDefined();
	});

	it("has correct staleTime (5 minutes)", () => {
		const queryClient = createQueryClient();
		const defaultOptions = queryClient.getDefaultOptions();

		expect(defaultOptions.queries?.staleTime).toBe(5 * 60 * 1000);
	});

	it("has refetchOnWindowFocus disabled", () => {
		const queryClient = createQueryClient();
		const defaultOptions = queryClient.getDefaultOptions();

		expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(false);
	});

	it("has retry set to 1", () => {
		const queryClient = createQueryClient();
		const defaultOptions = queryClient.getDefaultOptions();

		expect(defaultOptions.queries?.retry).toBe(1);
	});

	it("creates independent instances", () => {
		const queryClient1 = createQueryClient();
		const queryClient2 = createQueryClient();

		expect(queryClient1).not.toBe(queryClient2);
	});
});
