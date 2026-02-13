import { createLogger } from "@/lib/logger";
import { messageListener } from "./background-handler";
import { resumeInterruptedJobs } from "./job-manager";

const logger = createLogger("background");

export default defineBackground(() => {
	logger.info("Background script initialized", {
		extensionId: browser.runtime.id,
	});

	// Listen for messages from content scripts
	chrome.runtime.onMessage.addListener(messageListener);

	// Resume any interrupted jobs on startup
	resumeInterruptedJobs().catch((err) => {
		logger.error("Failed to resume interrupted jobs", {
			error: err instanceof Error ? err.message : String(err),
		});
	});
});
