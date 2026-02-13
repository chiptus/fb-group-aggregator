import { useState } from "react";
import { OverviewTab } from "./components/OverviewTab";
import { PopupHeader } from "./components/PopupHeader";
import { SubscriptionsTab } from "./components/SubscriptionsTab";
import { type Tab, TabNavigation } from "./components/TabNavigation";

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
			</div>
		</div>
	);
}

export default App;
