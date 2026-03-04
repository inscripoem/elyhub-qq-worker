import { logs, needsAuth } from './store.js';

const BASE = '/api';

const getToken = () => localStorage.getItem('adminToken') ?? '';

const apiFetch = async (url, opts = {}) => {
    const token = getToken();
    const headers = { ...opts.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { ...opts, headers });
    if (res.status === 401) {
        needsAuth.value = true;
        throw new Error('未授权，请输入管理员令牌');
    }
    return res;
};

export const api = {
    setToken(t) {
        if (t) localStorage.setItem('adminToken', t);
        else localStorage.removeItem('adminToken');
    },

    async getStatus() {
        const res = await apiFetch(`${BASE}/status`);
        if (!res.ok) throw new Error(`status ${res.status}`);
        return res.json();
    },

    async getConfig() {
        const res = await apiFetch(`${BASE}/config`);
        if (!res.ok) throw new Error(`status ${res.status}`);
        return res.json();
    },

    async saveConfig(data) {
        const res = await apiFetch(`${BASE}/config`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message ?? `status ${res.status}`);
        }
        return res.json();
    },

    async control(action) {
        const res = await apiFetch(`${BASE}/control`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action })
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        return res.json();
    },

    async fetchLogHistory() {
        const res = await apiFetch(`${BASE}/logs`);
        const history = await res.json();
        logs.value = Array.isArray(history) ? history : [];
    },

    async syncNow() {
        const res = await apiFetch(`${BASE}/sync`, { method: 'POST' });
        if (!res.ok) throw new Error(`status ${res.status}`);
        return res.json();
    },

    subscribeStatus(onStatus) {
        let active = true;
        let es = null;
        let reconnectTimer = null;

        const connect = () => {
            if (!active) return;
            const token = getToken();
            const url = token
                ? `${BASE}/status?stream=1&token=${encodeURIComponent(token)}`
                : `${BASE}/status?stream=1`;
            es = new EventSource(url);

            es.addEventListener('status', (event) => {
                try { onStatus(JSON.parse(event.data)); } catch { /* ignore malformed */ }
            });

            es.onerror = () => {
                if (es) { es.close(); es = null; }
                if (!active) return;
                reconnectTimer = setTimeout(connect, 3000);
            };
        };

        connect();

        return () => {
            active = false;
            if (reconnectTimer !== null) { clearTimeout(reconnectTimer); reconnectTimer = null; }
            if (es) { es.close(); es = null; }
        };
    },

    subscribeLogs() {
        let active = true;
        let es = null;
        let reconnectTimer = null;

        const connect = () => {
            if (!active) return;
            const token = getToken();
            const url = token
                ? `${BASE}/logs?stream=1&token=${encodeURIComponent(token)}`
                : `${BASE}/logs?stream=1`;
            es = new EventSource(url);

            es.addEventListener('log', (event) => {
                try {
                    const entry = JSON.parse(event.data);
                    logs.value = [entry, ...logs.value].slice(0, 500);
                } catch { /* ignore malformed */ }
            });

            es.onerror = () => {
                if (es) { es.close(); es = null; }
                if (!active) return;
                reconnectTimer = setTimeout(connect, 3000);
            };
        };

        connect();

        return () => {
            active = false;
            if (reconnectTimer !== null) { clearTimeout(reconnectTimer); reconnectTimer = null; }
            if (es) { es.close(); es = null; }
        };
    }
};
