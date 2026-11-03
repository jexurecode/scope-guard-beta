import { useCallback, useEffect, useMemo, useState } from 'react'
import { addRead, loadReadIds, saveReadIds } from '../lib/notifications'
import type { SavedAnalysis } from '../types/workspace'

/**
 * Single source of truth for which activity items have been read. It lives in App so the
 * mobile and desktop header instances always show the same unread count.
 */
export function useNotificationReads(analyses: readonly SavedAnalysis[]) {
  const [ids, setIds] = useState<string[]>(loadReadIds)
  const read = useMemo(() => new Set(ids), [ids])
  const markRead = useCallback((toMark: readonly string[]) => setIds(current => addRead(current, toMark, analyses)), [analyses])
  useEffect(() => saveReadIds(ids), [ids])
  return { read, markRead }
}

export type NotificationReads = ReturnType<typeof useNotificationReads>
