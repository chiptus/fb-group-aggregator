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
				{activeTab === "overview" && (
					<div
						role="tabpanel"
						id="overview-panel"
						aria-labelledby="overview-tab"
					>
						<OverviewTab />
					</div>
				)}
				{activeTab === "subscriptions" && (
					<div
						role="tabpanel"
						id="subscriptions-panel"
						aria-labelledby="subscriptions-tab"
					>
						<SubscriptionsTab />
					</div>
				)}
				{activeTab === "groups" && (
					<div role="tabpanel" id="groups-panel" aria-labelledby="groups-tab">
						<GroupsTab />
					</div>
				)}
			</div>
		</div>
	);
}

export default App;
