import { useMemo, useState } from "react";
import { useClearLogs, useLogs } from "@/lib/hooks/storage/useLogs";
import type { LogEntry, LogLevel, LogSource } from "@/lib/types";
import { LoadingSpinner } from "./LoadingSpinner";

const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
	debug: "bg-gray-100 text-gray-700 border-gray-300",
	info: "bg-blue-100 text-blue-700 border-blue-300",
	warn: "bg-yellow-100 text-yellow-700 border-yellow-300",
	error: "bg-red-100 text-red-700 border-red-300",
};

const LOG_LEVEL_BADGES: Record<LogLevel, string> = {
	debug: "bg-gray-500",
	info: "bg-blue-500",
	warn: "bg-yellow-500",
	error: "bg-red-500",
};

export function LogViewer() {
	const logsQuery = useLogs();
	const clearLogsMutation = useClearLogs();

	const [levelFilter, setLevelFilter] = useState<LogLevel | "all">("all");
	const [sourceFilter, setSourceFilter] = useState<LogSource | "all">("all");
	const [autoScroll, setAutoScroll] = useState(true);

	const logs = logsQuery.data ?? [];

	// Filter logs
	const filteredLogs = useMemo(() => {
		return logs.filter((log) => {
			if (levelFilter !== "all" && log.level !== levelFilter) return false;
			if (sourceFilter !== "all" && log.source !== sourceFilter) return false;
			return true;
		});
	}, [logs, levelFilter, sourceFilter]);

	// Format timestamp
	function formatTime(timestamp: number): string {
		const date = new Date(timestamp);
		return date.toLocaleTimeString("en-US", {
			hour12: false,
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			fractionalSecondDigits: 3,
		});
	}

	// Format context object
	function formatContext(context?: Record<string, unknown>): string {
		if (!context || Object.keys(context).length === 0) return "";
		return JSON.stringify(context, null, 2);
	}

	function handleClearLogs() {
		if (confirm("Are you sure you want to clear all logs?")) {
			clearLogsMutation.mutate();
		}
	}

	if (logsQuery.isLoading) {
		return <LoadingSpinner />;
	}

	if (logsQuery.error) {
		return (
			<div className="p-4 bg-red-50 border border-red-200 rounded">
				<p className="text-red-700">Failed to load logs</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full">
			{/* Filters and Controls */}
			<div className="bg-white border-b border-gray-200 p-4 space-y-4">
				<div className="flex flex-wrap gap-4 items-center justify-between">
					<div className="flex gap-4 items-center">
						{/* Level Filter */}
						<div className="flex items-center gap-2">
							<label htmlFor="level-filter" className="text-sm font-medium">
								Level:
							</label>
							<select
								id="level-filter"
								value={levelFilter}
								onChange={(e) =>
									setLevelFilter(e.target.value as LogLevel | "all")
								}
								className="px-3 py-1 border border-gray-300 rounded text-sm"
							>
								<option value="all">All</option>
								<option value="debug">Debug</option>
								<option value="info">Info</option>
								<option value="warn">Warn</option>
								<option value="error">Error</option>
							</select>
						</div>

						{/* Source Filter */}
						<div className="flex items-center gap-2">
							<label htmlFor="source-filter" className="text-sm font-medium">
								Source:
							</label>
							<select
								id="source-filter"
								value={sourceFilter}
								onChange={(e) =>
									setSourceFilter(e.target.value as LogSource | "all")
								}
								className="px-3 py-1 border border-gray-300 rounded text-sm"
							>
								<option value="all">All</option>
								<option value="background">Background</option>
								<option value="content">Content</option>
								<option value="popup">Popup</option>
								<option value="dashboard">Dashboard</option>
							</select>
						</div>

						{/* Auto-scroll Toggle */}
						<label className="flex items-center gap-2 text-sm">
							<input
								type="checkbox"
								checked={autoScroll}
								onChange={(e) => setAutoScroll(e.target.checked)}
								className="rounded"
							/>
							Auto-scroll
						</label>
					</div>

					<div className="flex gap-2">
						<button
							type="button"
							onClick={handleClearLogs}
							disabled={clearLogsMutation.isPending || logs.length === 0}
							className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
						>
							Clear Logs
						</button>
					</div>
				</div>

				{/* Stats */}
				<div className="flex gap-4 text-sm text-gray-600">
					<span>
						Total: <strong>{logs.length}</strong>
					</span>
					<span>
						Filtered: <strong>{filteredLogs.length}</strong>
					</span>
				</div>
			</div>

			{/* Log Entries */}
			<div className="flex-1 overflow-auto bg-gray-50 p-4">
				{filteredLogs.length === 0 ? (
					<div className="text-center py-8 text-gray-500">
						No logs to display
					</div>
				) : (
					<div className="space-y-2 font-mono text-sm">
						{filteredLogs.map((log) => (
							<LogEntryRow key={log.id} log={log} />
						))}
						{autoScroll && <div id="log-bottom" />}
					</div>
				)}
			</div>
		</div>
	);

	function LogEntryRow({ log }: { log: LogEntry }) {
		const [expanded, setExpanded] = useState(false);

		return (
			<button
				type="button"
				className={`w-full text-left border rounded p-3 ${LOG_LEVEL_COLORS[log.level]} hover:opacity-90 transition-opacity`}
				onClick={() => setExpanded(!expanded)}
			>
				<div className="flex items-start gap-3">
					{/* Timestamp */}
					<span className="text-gray-500 whitespace-nowrap">
						{formatTime(log.timestamp)}
					</span>

					{/* Level Badge */}
					<span
						className={`px-2 py-0.5 rounded text-xs font-semibold text-white uppercase ${LOG_LEVEL_BADGES[log.level]}`}
					>
						{log.level}
					</span>

					{/* Source Badge */}
					<span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-700 text-white uppercase">
						{log.source}
					</span>

					{/* Message */}
					<span className="flex-1">{log.message}</span>

					{/* Expand indicator */}
					{log.context && Object.keys(log.context).length > 0 && (
						<span className="text-gray-400 text-xs">
							{expanded ? "▼" : "▶"}
						</span>
					)}
				</div>

				{/* Expanded Context */}
				{expanded && log.context && Object.keys(log.context).length > 0 && (
					<pre className="mt-2 p-2 bg-black bg-opacity-10 rounded text-xs overflow-x-auto">
						{formatContext(log.context)}
					</pre>
				)}
			</button>
		);
	}
}
