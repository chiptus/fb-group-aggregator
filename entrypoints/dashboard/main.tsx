import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { createQueryClient } from "@/lib/queryClient";
import App from "./App.tsx";
import "./style.css";
import "@/assets/tailwind.css";

const queryClient = createQueryClient();

const rootElement = document.getElementById("root");
if (rootElement) {
	ReactDOM.createRoot(rootElement).render(
		<React.StrictMode>
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>
		</React.StrictMode>,
	);
}
