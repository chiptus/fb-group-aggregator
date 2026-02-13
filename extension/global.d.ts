// Global type definitions for browser extension environment

// Browser API global - provided by WXT runtime and @webext-core/fake-browser in tests
declare const browser: {
	storage: {
		local: {
			get(
				keys?: string | string[] | Record<string, unknown>,
			): Promise<Record<string, unknown>>;
			set(items: Record<string, unknown>): Promise<void>;
			remove(keys: string | string[]): Promise<void>;
		};
	};
	runtime: {
		id: string;
		onMessage: {
			addListener(
				listener: (
					message: unknown,
					sender: unknown,
					sendResponse: (response: unknown) => void,
				) => boolean | void | Promise<unknown>,
			): void;
		};
		sendMessage(message: unknown): Promise<unknown>;
	};
};

// Vite environment variables
interface ImportMetaEnv {
	readonly VITE_API_URL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
