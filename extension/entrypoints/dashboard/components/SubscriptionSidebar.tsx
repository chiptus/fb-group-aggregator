import { usePostsView } from "../context/PostsViewContext";
import { TogglePill } from "./TogglePill";

export function SubscriptionSidebar() {
	const {
		subscriptions,
		selectedSubscriptionId,
		setSelectedSubscriptionId,
		subscriptionUnseenCounts,
	} = usePostsView();

	return (
		<nav
			aria-label="Subscription filters"
			className="flex flex-wrap gap-2 mb-3"
		>
			<TogglePill
				variant="nav"
				active={selectedSubscriptionId === null}
				onClick={() => setSelectedSubscriptionId(null)}
				label="All Posts"
				count={subscriptionUnseenCounts.get("__all__")}
			/>
			{subscriptions.map((sub) => (
				<TogglePill
					key={sub.id}
					variant="nav"
					active={selectedSubscriptionId === sub.id}
					onClick={() => setSelectedSubscriptionId(sub.id)}
					label={sub.name}
					count={subscriptionUnseenCounts.get(sub.id)}
				/>
			))}
		</nav>
	);
}
