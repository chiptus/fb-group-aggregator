import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	useGroups,
	useScrapeSubscription,
} from "@/lib/hooks/storage/useGroups";
import { useMarkPostSeen, usePosts } from "@/lib/hooks/storage/usePosts";
import { useSubscriptions } from "@/lib/hooks/storage/useSubscriptions";
import { GroupsPage } from "./components/GroupsPage";
import { JobViewer } from "./components/JobViewer";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { LogViewer } from "./components/LogViewer";
import { PostCard } from "./components/PostCard";
import { SearchBar } from "./components/SearchBar";
import { SubscriptionSidebar } from "./components/SubscriptionSidebar";
import { PostsTab } from "./tabs/PostsTab";

type DashboardTab = "posts" | "groups" | "jobs" | "logs";

function App() {
	const [activeTab, setActiveTab] = useState<DashboardTab>("posts");

	return (
		<div className="min-h-screen bg-gray-50">
			<header className="bg-white shadow-sm">
				<div className="max-w-7xl mx-auto px-4 py-4">
					<h1 className="text-2xl font-bold mb-2">FB Group Aggregator</h1>

					{/* Tab Navigation */}
					<div className="flex gap-4 mt-4 border-b border-gray-200">
						<Button
							onClick={() => setActiveTab("posts")}
							variant="ghost"
							size="sm"
							className={`rounded-none border-b-2 transition-colors ${
								activeTab === "posts"
									? "border-blue-500 text-blue-600"
									: "border-transparent text-gray-600 hover:text-gray-800 hover:bg-transparent"
							}`}
							aria-current={activeTab === "posts" ? "page" : undefined}
						>
							Posts
						</Button>
						<Button
							onClick={() => setActiveTab("groups")}
							variant="ghost"
							size="sm"
							className={`rounded-none border-b-2 transition-colors ${
								activeTab === "groups"
									? "border-blue-500 text-blue-600"
									: "border-transparent text-gray-600 hover:text-gray-800 hover:bg-transparent"
							}`}
							aria-current={activeTab === "groups" ? "page" : undefined}
						>
							Groups
						</Button>
						<Button
							onClick={() => setActiveTab("jobs")}
							variant="ghost"
							size="sm"
							className={`rounded-none border-b-2 transition-colors ${
								activeTab === "jobs"
									? "border-blue-500 text-blue-600"
									: "border-transparent text-gray-600 hover:text-gray-800 hover:bg-transparent"
							}`}
							aria-current={activeTab === "jobs" ? "page" : undefined}
						>
							Jobs
						</Button>
						<Button
							onClick={() => setActiveTab("logs")}
							variant="ghost"
							size="sm"
							className={`rounded-none border-b-2 transition-colors ${
								activeTab === "logs"
									? "border-blue-500 text-blue-600"
									: "border-transparent text-gray-600 hover:text-gray-800 hover:bg-transparent"
							}`}
							aria-current={activeTab === "logs" ? "page" : undefined}
						>
							Logs
						</Button>
					</div>
				</div>
			</header>

			{activeTab === "posts" && <PostsTab />}

			{activeTab === "groups" && (
				<div className="max-w-7xl mx-auto px-4 py-6">
					<GroupsPage />
				</div>
			)}

			{activeTab === "jobs" && (
				<div className="max-w-7xl mx-auto px-4 py-6">
					<JobViewer />
				</div>
			)}

			{activeTab === "logs" && (
				<div
					className="max-w-7xl mx-auto px-4 py-6"
					style={{ height: "calc(100vh - 200px)" }}
				>
					<LogViewer />
				</div>
			)}
		</div>
	);
}

export default App;
