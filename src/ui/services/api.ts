import { useAppStore, WorkerStatus, LogEntry, SearchableGroup } from './store'

const BASE = '/api'

const getToken = () => localStorage.getItem('adminToken') ?? ''

const apiFetch = async (url: string, opts: RequestInit = {}): Promise<Response> => {
  const token = getToken()
  const headers: Record<string, string> = { ...(opts.headers as Record<string, string>) }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(url, { ...opts, headers })
  if (res.status === 401) {
    useAppStore.getState().setNeedsAuth(true)
    throw new Error('未授权，请输入管理员令牌')
  }
  return res
}

export const api = {
  setToken(t: string) {
    if (t) localStorage.setItem('adminToken', t)
    else localStorage.removeItem('adminToken')
  },

  async getStatus(): Promise<WorkerStatus> {
    const res = await apiFetch(`${BASE}/status`)
    if (!res.ok) throw new Error(`status ${res.status}`)
    return res.json()
  },

  async getConfig(): Promise<Record<string, unknown>> {
    const res = await apiFetch(`${BASE}/config`)
    if (!res.ok) throw new Error(`status ${res.status}`)
    return res.json()
  },

  async saveConfig(data: Record<string, unknown>): Promise<void> {
    const res = await apiFetch(`${BASE}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string }
      throw new Error(err.message ?? `status ${res.status}`)
    }
  },

  async control(action: string): Promise<void> {
    const res = await apiFetch(`${BASE}/control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    if (!res.ok) throw new Error(`status ${res.status}`)
  },

  async fetchLogHistory(): Promise<void> {
    const res = await apiFetch(`${BASE}/logs`)
    const history = await res.json()
    useAppStore.getState().setLogs(Array.isArray(history) ? history : [])
  },

  async syncNow(): Promise<{ updatedCount: number }> {
    const res = await apiFetch(`${BASE}/sync`, { method: 'POST' })
    if (!res.ok) throw new Error(`status ${res.status}`)
    return res.json()
  },

  async searchGroups(keyword: string): Promise<{ data: SearchableGroup[] }> {
    const res = await apiFetch(`${BASE}/groups/search?q=${encodeURIComponent(keyword)}`)
    if (!res.ok) throw new Error(`status ${res.status}`)
    return res.json()
  },

  subscribeStatus(onStatus: (s: WorkerStatus) => void): () => void {
    let active = true
    let es: EventSource | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    const connect = () => {
      if (!active) return
      const token = getToken()
      const url = token
        ? `${BASE}/status?stream=1&token=${encodeURIComponent(token)}`
        : `${BASE}/status?stream=1`
      es = new EventSource(url)
      es.addEventListener('status', (event) => {
        try { onStatus(JSON.parse((event as MessageEvent).data)) } catch { /* ignore */ }
      })
      es.onerror = () => {
        if (es) { es.close(); es = null }
        if (!active) return
        reconnectTimer = setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      active = false
      if (reconnectTimer !== null) { clearTimeout(reconnectTimer); reconnectTimer = null }
      if (es) { es.close(); es = null }
    }
  },

  subscribeLogs(): () => void {
    let active = true
    let es: EventSource | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    const connect = () => {
      if (!active) return
      const token = getToken()
      const url = token
        ? `${BASE}/logs?stream=1&token=${encodeURIComponent(token)}`
        : `${BASE}/logs?stream=1`
      es = new EventSource(url)
      es.addEventListener('log', (event) => {
        try {
          const entry: LogEntry = JSON.parse((event as MessageEvent).data)
          useAppStore.getState().prependLog(entry)
        } catch { /* ignore */ }
      })
      es.onerror = () => {
        if (es) { es.close(); es = null }
        if (!active) return
        reconnectTimer = setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      active = false
      if (reconnectTimer !== null) { clearTimeout(reconnectTimer); reconnectTimer = null }
      if (es) { es.close(); es = null }
    }
  },
}
