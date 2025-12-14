import { createLogger } from "@/lib/logger";
import { messageListener } from "./background-handler";

const logger = createLogger("background");

export default defineBackground(() => {
	logger.info("Background script initialized", {
		extensionId: browser.runtime.id,
	});

	// Listen for messages from content scripts
	chrome.runtime.onMessage.addListener(messageListener);
});
