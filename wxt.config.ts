import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
	modules: ["@wxt-dev/module-react"],
	browser: "chromium",
	vite: () => ({
		plugins: [tailwindcss()],
	}),
	webExt: {
		binaries: {
			chromium: "/Applications/Chromium.app/Contents/MacOS/Chromium",
			vivaldi: "/Applications/Vivaldi.app/Contents/MacOS/Vivaldi",
		},
		chromiumArgs: ["--user-data-dir=./.wxt/chrome-data"],
	},
	manifest: {
		permissions: ["storage"],
	},
});
