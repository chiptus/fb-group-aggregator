type Tab = "overview" | "subscriptions" | "groups";

interface TabNavigationProps {
	activeTab: Tab;
	onTabChange: (tab: Tab) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
	return (
		<div className="flex border-b" role="tablist">
			<button
				type="button"
				role="tab"
				aria-selected={activeTab === "overview"}
				onClick={() => onTabChange("overview")}
				className={`flex-1 px-4 py-2 text-sm font-medium ${
					activeTab === "overview"
						? "border-b-2 border-blue-600 text-blue-600"
						: "text-gray-600 hover:text-gray-900"
				}`}
			>
				Overview
			</button>
			<button
				type="button"
				role="tab"
				aria-selected={activeTab === "subscriptions"}
				onClick={() => onTabChange("subscriptions")}
				className={`flex-1 px-4 py-2 text-sm font-medium ${
					activeTab === "subscriptions"
						? "border-b-2 border-blue-600 text-blue-600"
						: "text-gray-600 hover:text-gray-900"
				}`}
			>
				Subscriptions
			</button>
			<button
				type="button"
				role="tab"
				aria-selected={activeTab === "groups"}
				onClick={() => onTabChange("groups")}
				className={`flex-1 px-4 py-2 text-sm font-medium ${
					activeTab === "groups"
						? "border-b-2 border-blue-600 text-blue-600"
						: "text-gray-600 hover:text-gray-900"
				}`}
			>
				Groups
			</button>
		</div>
	);
}
