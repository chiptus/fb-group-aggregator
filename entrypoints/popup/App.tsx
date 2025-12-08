import { useMemo, useState } from "react";
import {
	useCreateSubscription,
	useDeleteGroup,
	useDeleteSubscription,
	useGroups,
	usePosts,
	useSubscriptions,
	useUpdateGroup,
	useUpdateSubscription,
} from "@/lib/hooks/useStorageData";
import type { Subscription } from "@/lib/types";

type Tab = "overview" | "subscriptions" | "groups";

function App() {
	const [activeTab, setActiveTab] = useState<Tab>("overview");

	// Data queries
	const subscriptionsQuery = useSubscriptions();
	const groupsQuery = useGroups();
	const postsQuery = usePosts();

	// Mutations
	const createSubscriptionMutation = useCreateSubscription();
	const updateSubscriptionMutation = useUpdateSubscription();
	const deleteSubscriptionMutation = useDeleteSubscription();
	const updateGroupMutation = useUpdateGroup();
	const deleteGroupMutation = useDeleteGroup();

	// Form state for subscriptions
	const [showSubForm, setShowSubForm] = useState(false);
	const [editingSubId, setEditingSubId] = useState<string | null>(null);
	const [subFormValue, setSubFormValue] = useState("");
	const [deletingSubId, setDeletingSubId] = useState<string | null>(null);

	// Derived data
	const subscriptions = subscriptionsQuery.data ?? [];
	const groups = groupsQuery.data ?? [];
	const posts = postsQuery.data ?? [];

	const isLoading =
		subscriptionsQuery.isLoading ||
		groupsQuery.isLoading ||
		postsQuery.isLoading;

	const error =
		subscriptionsQuery.error || groupsQuery.error || postsQuery.error;

	// Calculate unseen posts count
	const unseenCount = useMemo(() => {
		return posts.filter((post) => !post.seen).length;
	}, [posts]);

	// Open dashboard
	function handleOpenDashboard() {
		chrome.tabs.create({ url: "/dashboard.html" });
	}

	// Subscription handlers
	async function handleCreateSubscription() {
		if (!subFormValue.trim()) return;

		try {
			await createSubscriptionMutation.mutateAsync(subFormValue.trim());
			setSubFormValue("");
			setShowSubForm(false);
		} catch (err) {
			console.error("Failed to create subscription:", err);
		}
	}

	function handleStartEditSubscription(sub: Subscription) {
		setEditingSubId(sub.id);
		setSubFormValue(sub.name);
	}

	async function handleSaveSubscription() {
		if (!editingSubId || !subFormValue.trim()) return;

		try {
			await updateSubscriptionMutation.mutateAsync({
				id: editingSubId,
				updates: { name: subFormValue.trim() },
			});
			setEditingSubId(null);
			setSubFormValue("");
		} catch (err) {
			console.error("Failed to update subscription:", err);
		}
	}

	function handleCancelEdit() {
		setEditingSubId(null);
		setSubFormValue("");
	}

	async function handleConfirmDeleteSubscription() {
		if (!deletingSubId) return;

		try {
			await deleteSubscriptionMutation.mutateAsync(deletingSubId);
			setDeletingSubId(null);
		} catch (err) {
			console.error("Failed to delete subscription:", err);
		}
	}

	// Group handlers
	async function handleToggleGroup(groupId: string, enabled: boolean) {
		try {
			await updateGroupMutation.mutateAsync({
				id: groupId,
				updates: { enabled },
			});
		} catch (err) {
			console.error("Failed to toggle group:", err);
		}
	}

	async function handleAssignGroupToSubscription(
		groupId: string,
		subscriptionId: string,
	) {
		try {
			const subscriptionIds = subscriptionId ? [subscriptionId] : [];
			await updateGroupMutation.mutateAsync({
				id: groupId,
				updates: { subscriptionIds },
			});
		} catch (err) {
			console.error("Failed to assign group:", err);
		}
	}

	async function handleDeleteGroup(groupId: string) {
		try {
			await deleteGroupMutation.mutateAsync(groupId);
		} catch (err) {
			console.error("Failed to delete group:", err);
		}
	}

	if (isLoading) {
		return (
			<div className="p-4">
				<p>Loading...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-4">
				<p className="text-red-600">
					Error loading data:{" "}
					{error instanceof Error ? error.message : "Unknown error"}
				</p>
			</div>
		);
	}

	return (
		<div className="w-96 h-[600px] flex flex-col bg-white">
			{/* Header */}
			<div className="bg-blue-600 text-white p-4">
				<h1 className="text-xl font-bold">FB Group Aggregator</h1>
				<div className="mt-2 flex items-center gap-2">
					<span className="text-sm">Unseen posts:</span>
					<span className="bg-white text-blue-600 px-2 py-1 rounded-full text-sm font-bold">
						{unseenCount}
					</span>
				</div>
			</div>

			{/* Tab Navigation */}
			<div className="flex border-b" role="tablist">
				<button
					type="button"
					role="tab"
					aria-selected={activeTab === "overview"}
					onClick={() => setActiveTab("overview")}
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
					onClick={() => setActiveTab("subscriptions")}
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
					onClick={() => setActiveTab("groups")}
					className={`flex-1 px-4 py-2 text-sm font-medium ${
						activeTab === "groups"
							? "border-b-2 border-blue-600 text-blue-600"
							: "text-gray-600 hover:text-gray-900"
					}`}
				>
					Groups
				</button>
			</div>

			{/* Tab Content */}
			<div className="flex-1 overflow-y-auto">
				{/* Overview Tab */}
				{activeTab === "overview" && (
					<div className="p-4 space-y-4">
						<button
							type="button"
							onClick={handleOpenDashboard}
							className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 font-medium"
						>
							Open Dashboard
						</button>

						<div className="grid grid-cols-3 gap-2">
							<div className="bg-gray-100 p-3 rounded text-center">
								<div className="text-2xl font-bold text-blue-600">
									{subscriptions.length}
								</div>
								<div className="text-xs text-gray-600 mt-1">Subscriptions</div>
							</div>
							<div className="bg-gray-100 p-3 rounded text-center">
								<div className="text-2xl font-bold text-blue-600">
									{groups.length}
								</div>
								<div className="text-xs text-gray-600 mt-1">Groups</div>
							</div>
							<div className="bg-gray-100 p-3 rounded text-center">
								<div className="text-2xl font-bold text-blue-600">
									{posts.length}
								</div>
								<div className="text-xs text-gray-600 mt-1">Total Posts</div>
							</div>
						</div>
					</div>
				)}

				{/* Subscriptions Tab */}
				{activeTab === "subscriptions" && (
					<div className="p-4">
						<h2 className="text-lg font-semibold mb-4">Manage Subscriptions</h2>

						{subscriptions.length === 0 && !showSubForm && (
							<p className="text-gray-500 text-sm mb-4">
								No subscriptions yet. Create one to get started!
							</p>
						)}

						<div className="space-y-2">
							{subscriptions.map((sub) => (
								<div
									key={sub.id}
									className="border rounded-lg p-3 flex items-center justify-between"
								>
									{editingSubId === sub.id ? (
										<div className="flex-1 flex items-center gap-2">
											<input
												type="text"
												value={subFormValue}
												onChange={(e) => setSubFormValue(e.target.value)}
												className="flex-1 border rounded px-2 py-1 text-sm"
												placeholder="Subscription name"
											/>
											<button
												type="button"
												onClick={handleSaveSubscription}
												className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
											>
												Save
											</button>
											<button
												type="button"
												onClick={handleCancelEdit}
												className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
											>
												Cancel
											</button>
										</div>
									) : (
										<>
											<span className="font-medium text-sm">{sub.name}</span>
											<div className="flex gap-2">
												<button
													type="button"
													onClick={() => handleStartEditSubscription(sub)}
													className="text-blue-600 hover:text-blue-800 text-sm"
													aria-label={`Edit ${sub.name}`}
												>
													Edit
												</button>
												<button
													type="button"
													onClick={() => setDeletingSubId(sub.id)}
													className="text-red-600 hover:text-red-800 text-sm"
													aria-label={`Delete ${sub.name}`}
												>
													Delete
												</button>
											</div>
										</>
									)}
								</div>
							))}
						</div>

						{showSubForm && (
							<div className="mt-4 border rounded-lg p-3">
								<input
									type="text"
									value={subFormValue}
									onChange={(e) => setSubFormValue(e.target.value)}
									placeholder="Subscription name"
									className="w-full border rounded px-3 py-2 text-sm mb-2"
								/>
								<div className="flex gap-2">
									<button
										type="button"
										onClick={handleCreateSubscription}
										className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
									>
										Create
									</button>
									<button
										type="button"
										onClick={() => {
											setShowSubForm(false);
											setSubFormValue("");
										}}
										className="flex-1 bg-gray-300 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-400"
									>
										Cancel
									</button>
								</div>
							</div>
						)}

						{!showSubForm && (
							<button
								type="button"
								onClick={() => setShowSubForm(true)}
								className="w-full mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium"
							>
								Add Subscription
							</button>
						)}

						{/* Delete confirmation */}
						{deletingSubId && (
							<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
								<div className="bg-white p-6 rounded-lg max-w-sm">
									<p className="mb-4">
										Are you sure you want to delete this subscription?
									</p>
									<div className="flex gap-2">
										<button
											type="button"
											onClick={handleConfirmDeleteSubscription}
											className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
										>
											Confirm
										</button>
										<button
											type="button"
											onClick={() => setDeletingSubId(null)}
											className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
										>
											Cancel
										</button>
									</div>
								</div>
							</div>
						)}
					</div>
				)}

				{/* Groups Tab */}
				{activeTab === "groups" && (
					<div className="p-4">
						<h2 className="text-lg font-semibold mb-4">Manage Groups</h2>

						{groups.length === 0 && (
							<p className="text-gray-500 text-sm mb-4">
								No groups yet. Visit Facebook groups to start scraping!
							</p>
						)}

						<div className="space-y-3">
							{groups.map((group) => (
								<div key={group.id} className="border rounded-lg p-3 space-y-2">
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<h3 className="font-medium text-sm">{group.name}</h3>
											<p className="text-xs text-gray-500 truncate">
												{group.url}
											</p>
										</div>
										<button
											type="button"
											onClick={() => handleDeleteGroup(group.id)}
											className="text-red-600 hover:text-red-800 text-xs ml-2"
											aria-label={`Delete ${group.name}`}
										>
											Delete
										</button>
									</div>

									<div className="flex items-center justify-between">
										<label className="flex items-center gap-2 text-sm">
											<input
												type="checkbox"
												role="switch"
												checked={group.enabled}
												aria-checked={group.enabled}
												onChange={(e) =>
													handleToggleGroup(group.id, e.target.checked)
												}
												className="rounded"
												aria-label={`Enable ${group.name}`}
											/>
											<span className="text-xs text-gray-600">
												{group.enabled ? "Enabled" : "Disabled"}
											</span>
										</label>

										<select
											value={group.subscriptionIds[0] || ""}
											onChange={(e) =>
												handleAssignGroupToSubscription(
													group.id,
													e.target.value,
												)
											}
											className="border rounded px-2 py-1 text-xs"
											aria-label={`Subscription for ${group.name}`}
										>
											<option value="">No subscription</option>
											{subscriptions.map((sub) => (
												<option key={sub.id} value={sub.id}>
													{sub.name}
												</option>
											))}
										</select>
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default App;
