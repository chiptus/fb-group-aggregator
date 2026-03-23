import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely extract error message from unknown error value
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function formatDatePart(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

export function formatDateTime(value: string | number | Date): string {
  const d = new Date(value);
  const time = d.toLocaleTimeString(navigator.language, {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${formatDatePart(d)}, ${time}`;
}

export function formatDate(value: string | number | Date): string {
  return formatDatePart(new Date(value));
}
