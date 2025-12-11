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
		},
	},
	manifest: {
		permissions: ["storage"],
	},
});
