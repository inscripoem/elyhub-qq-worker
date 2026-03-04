import { signal, computed } from '@preact/signals';

export const workerStatus = signal({
    state: 'idle',
    napcat: { connected: false, host: '', port: 0, error: null },
    heartbeat: { lastSentAt: null, lastOkAt: null, expectedIntervalSeconds: 60, consecutiveFailures: 0 },
    sync: { lastRunAt: null, lastSuccessAt: null, lastUpdatedCount: 0, recentGroups: [], cron: '', nextRunAt: null }
});

export const config = signal(null);
export const logs = signal([]);
export const currentPage = signal('dashboard');
export const needsAuth = signal(false);

export const isOnline = computed(() =>
    workerStatus.value.state === 'running' && workerStatus.value.napcat.connected
);

export const toasts = signal([]);
let _toastId = 0;
export const showToast = (message, type = 'info', duration = 3000) => {
    const id = ++_toastId;
    toasts.value = [...toasts.value, { id, message, type }];
    setTimeout(() => {
        toasts.value = toasts.value.filter(t => t.id !== id);
    }, duration);
    return id;
};
export const dismissToast = (id) => {
    toasts.value = toasts.value.filter(t => t.id !== id);
};
