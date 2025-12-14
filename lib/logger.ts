import { createLog } from "./storage";
import type { LogLevel, LogSource } from "./types";

/**
 * Logger utility that writes logs to storage for display in the dashboard
 */
class Logger {
	constructor(private source: LogSource) {}

	debug(message: string, context?: Record<string, unknown>) {
		this.log("debug", message, context);
		console.debug(`[${this.source}]`, message, context || "");
	}

	info(message: string, context?: Record<string, unknown>) {
		this.log("info", message, context);
		console.log(`[${this.source}]`, message, context || "");
	}

	warn(message: string, context?: Record<string, unknown>) {
		this.log("warn", message, context);
		console.warn(`[${this.source}]`, message, context || "");
	}

	error(message: string, context?: Record<string, unknown>) {
		this.log("error", message, context);
		console.error(`[${this.source}]`, message, context || "");
	}

	private log(
		level: LogLevel,
		message: string,
		context?: Record<string, unknown>,
	) {
		// Write to storage asynchronously (fire and forget)
		createLog({
			level,
			source: this.source,
			message,
			context,
		}).catch((err) => {
			console.error("Failed to write log to storage:", err);
		});
	}
}

/**
 * Create a logger instance for a specific source
 */
export function createLogger(source: LogSource): Logger {
	return new Logger(source);
}
