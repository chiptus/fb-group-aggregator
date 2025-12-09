import type { Tab } from "./TabNavigation";

interface TabNavigationItemProps {
	tab: Tab;
	label: string;
	activeTab: Tab;
	onTabChange: (tab: Tab) => void;
}

export function TabNavigationItem({
	tab,
	label,
	activeTab,
	onTabChange,
}: TabNavigationItemProps) {
	const isActive = activeTab === tab;

	return (
		<button
			type="button"
			role="tab"
			id={`${tab}-tab`}
			aria-selected={isActive}
			aria-controls={`${tab}-panel`}
			onClick={() => onTabChange(tab)}
			className={`flex-1 px-4 py-2 text-sm font-medium ${
				isActive
					? "border-b-2 border-blue-600 text-blue-600"
					: "text-gray-600 hover:text-gray-900"
			}`}
		>
			{label}
		</button>
	);
}
