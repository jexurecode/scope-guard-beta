import type { Analysis } from '../types/analysis'

export const STATUS_LABEL: Record<Analysis['status'], string> = {
  'potential-change': 'Potential scope change',
  'needs-review': 'Manual review',
}

export function timeAgo(iso: string, now: number = Date.now()): string {
  const then = Date.parse(iso)
  if (!Number.isFinite(then)) return ''
  const seconds = Math.max(0, Math.round((now - then) / 1000))
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`
  return new Date(then).toLocaleDateString()
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  return Number.isFinite(date.getTime()) ? date.toLocaleString() : ''
}

export function isWithinDays(iso: string, days: number, now: number = Date.now()): boolean {
  const then = Date.parse(iso)
  return Number.isFinite(then) && now - then <= days * 86_400_000
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
