import { useState } from 'react';
import type { LogEntry, LogLevel } from '@/lib/types';
import { formatLogTime } from '@/lib/utils';

const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  debug: 'bg-gray-100 text-gray-700 border-gray-300',
  info: 'bg-blue-100 text-blue-700 border-blue-300',
  warn: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  error: 'bg-red-100 text-red-700 border-red-300',
};

const LOG_LEVEL_BADGES: Record<LogLevel, string> = {
  debug: 'bg-gray-500',
  info: 'bg-blue-500',
  warn: 'bg-yellow-500',
  error: 'bg-red-500',
};

function formatContext(context?: Record<string, unknown>): string {
  if (!context || Object.keys(context).length === 0) return '';
  return JSON.stringify(context, null, 2);
}

export function LogEntryRow({ log }: { log: LogEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      type="button"
      className={`w-full text-left border rounded p-3 ${LOG_LEVEL_COLORS[log.level]} hover:opacity-90 transition-opacity`}
      aria-expanded={expanded}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3">
        <span className="text-gray-500 whitespace-nowrap">
          {formatLogTime(log.timestamp)}
        </span>
        <span
          className={`px-2 py-0.5 rounded text-xs font-semibold text-white uppercase ${LOG_LEVEL_BADGES[log.level]}`}
        >
          {log.level}
        </span>
        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-700 text-white uppercase">
          {log.source}
        </span>
        <span className="flex-1">{log.message}</span>
        {log.context && Object.keys(log.context).length > 0 && (
          <span className="text-gray-400 text-xs">{expanded ? '▼' : '▶'}</span>
        )}
      </div>
      {expanded && log.context && Object.keys(log.context).length > 0 && (
        <pre className="mt-2 p-2 bg-black bg-opacity-10 rounded text-xs overflow-x-auto">
          {formatContext(log.context)}
        </pre>
      )}
    </button>
  );
}
