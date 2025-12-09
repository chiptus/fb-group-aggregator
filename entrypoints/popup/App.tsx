import { useState } from "react";
import { GroupsTab } from "./components/GroupsTab";
import { OverviewTab } from "./components/OverviewTab";
import { PopupHeader } from "./components/PopupHeader";
import { SubscriptionsTab } from "./components/SubscriptionsTab";
import { TabNavigation } from "./components/TabNavigation";

type Tab = "overview" | "subscriptions" | "groups";

function App() {
	const [activeTab, setActiveTab] = useState<Tab>("overview");

	return (
		<div className="w-96 h-[600px] flex flex-col bg-white">
			<PopupHeader />

			<TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

			<div className="flex-1 overflow-y-auto">
				{activeTab === "overview" && <OverviewTab />}
				{activeTab === "subscriptions" && <SubscriptionsTab />}
				{activeTab === "groups" && <GroupsTab />}
			</div>
		</div>
	);
}

export default App;
