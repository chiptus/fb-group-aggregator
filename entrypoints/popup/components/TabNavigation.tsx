import { TabNavigationItem } from "./TabNavigationItem";

export type Tab = "overview" | "subscriptions" | "groups";

interface TabNavigationProps {
	activeTab: Tab;
	onTabChange: (tab: Tab) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
	return (
		<div className="flex border-b" role="tablist">
			<TabNavigationItem
				tab="overview"
				label="Overview"
				activeTab={activeTab}
				onTabChange={onTabChange}
			/>
			<TabNavigationItem
				tab="subscriptions"
				label="Subscriptions"
				activeTab={activeTab}
				onTabChange={onTabChange}
			/>
			<TabNavigationItem
				tab="groups"
				label="Groups"
				activeTab={activeTab}
				onTabChange={onTabChange}
			/>
		</div>
	);
}
