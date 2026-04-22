import { create } from 'zustand'
import type { RecentGroup } from '../../types/status'

export interface WorkerStatus {
  state: 'idle' | 'running' | 'stopped' | 'error'
  napcat: { connected: boolean; host: string; port: number; error: string | null }
  heartbeat: { lastSentAt: string | null; lastOkAt: string | null; expectedIntervalSeconds: number; consecutiveFailures: number }
  sync: { lastRunAt: string | null; lastSuccessAt: string | null; lastUpdatedCount: number; recentGroups: RecentGroup[]; cron: string; nextRunAt: string | null }
}

export interface SearchableGroup {
  id: string
  alias: string | null
  name: string | null
  qqNumber: string | null
  status: string
  joinLink: string | null
  avatarUrl: string | null
}

export interface LogEntry {
  id: string
  ts: string
  level: string
  module: string
  message: string
}

const DEFAULT_STATUS: WorkerStatus = {
  state: 'idle',
  napcat: { connected: false, host: '', port: 0, error: null },
  heartbeat: { lastSentAt: null, lastOkAt: null, expectedIntervalSeconds: 60, consecutiveFailures: 0 },
  sync: { lastRunAt: null, lastSuccessAt: null, lastUpdatedCount: 0, recentGroups: [], cron: '', nextRunAt: null },
}

interface AppState {
  workerStatus: WorkerStatus
  currentPage: string
  needsAuth: boolean
  logs: LogEntry[]
  searchResults: SearchableGroup[]
  searchLoading: boolean
  searchError: string | null
  setWorkerStatus: (s: WorkerStatus) => void
  setCurrentPage: (p: string) => void
  setNeedsAuth: (v: boolean) => void
  setLogs: (logs: LogEntry[]) => void
  prependLog: (log: LogEntry) => void
  clearLogs: () => void
  setSearchResults: (groups: SearchableGroup[]) => void
  setSearchLoading: (v: boolean) => void
  setSearchError: (e: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  workerStatus: DEFAULT_STATUS,
  currentPage: 'dashboard',
  needsAuth: false,
  logs: [],
  searchResults: [],
  searchLoading: false,
  searchError: null,
  setWorkerStatus: (s) => set({ workerStatus: s }),
  setCurrentPage: (p) => set({ currentPage: p }),
  setNeedsAuth: (v) => set({ needsAuth: v }),
  setLogs: (logs) => set({ logs }),
  prependLog: (log) => set((state) => ({ logs: [log, ...state.logs].slice(0, 500) })),
  clearLogs: () => set({ logs: [] }),
  setSearchResults: (groups) => set({ searchResults: groups }),
  setSearchLoading: (v) => set({ searchLoading: v }),
  setSearchError: (e) => set({ searchError: e }),
}))
