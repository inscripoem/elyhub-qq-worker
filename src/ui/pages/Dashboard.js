import { html } from 'htm/preact';
import { useState, useEffect } from 'preact/hooks';
import { workerStatus, showToast, dismissToast } from '../services/store.js';
import { api } from '../services/api.js';
import { formatDate, getStateBadgeColor, getGroupStatusColor } from '../utils/format.js';
import { Card } from '../components/Card.js';
import { StatusIcon } from '../components/StatusIcon.js';

const STATE_LABELS = { idle: '空闲', running: '运行中', stopped: '已停止', error: '异常' };
const ACTION_LABELS = { start: '启动', stop: '停止', restart: '重启' };

export const Dashboard = () => {
    const [countdown, setCountdown] = useState(0);
    const [syncing, setSyncing] = useState(false);
    const status = workerStatus.value;

    useEffect(() => {
        const tick = () => {
            const nextRun = status.sync.nextRunAt;
            if (!nextRun) { setCountdown(0); return; }
            setCountdown(Math.max(0, Math.floor((new Date(nextRun).getTime() - Date.now()) / 1000)));
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [status.sync.nextRunAt]);

    const handleControl = async (action) => {
        const label = ACTION_LABELS[action];
        const loadingId = showToast(`${label}中...`, 'loading', 30000);
        try {
            await api.control(action);
            dismissToast(loadingId);
            showToast(`${label}成功`, 'success');
        } catch (e) {
            dismissToast(loadingId);
            showToast(`${label}失败：${e.message}`, 'error');
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        const loadingId = showToast('同步中...', 'loading', 60000);
        try {
            const res = await api.syncNow();
            dismissToast(loadingId);
            showToast(`同步完成，更新 ${res.updatedCount} 条记录`, 'success');
        } catch (e) {
            dismissToast(loadingId);
            showToast(`同步失败：${e.message}`, 'error');
        } finally {
            setSyncing(false);
        }
    };

    const fmt = (s) => {
        if (s >= 3600) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
        if (s >= 60) return `${Math.floor(s / 60)}m ${s % 60}s`;
        return `${s}s`;
    };

    const isRunning = status.state === 'running';
    const hbFailures = status.heartbeat.consecutiveFailures;
    const hbOk = isRunning && hbFailures === 0 && !!status.heartbeat.lastOkAt;
    const hbError = isRunning && hbFailures > 0;
    const hbColor = hbOk ? 'green' : hbError ? 'red' : 'gray';
    const hbLabel = !isRunning ? '未连接' : hbOk ? '正常' : '异常';

    return html`
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <h1 class="text-2xl font-bold text-gray-800">概览</h1>
                <div class="flex gap-2">
                    <button
                        onClick=${handleSync}
                        disabled=${!isRunning || syncing}
                        class="px-4 py-2 text-sm font-medium border border-primary text-primary rounded-lg hover:bg-primary/5 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >立即同步</button>
                    <button
                        onClick=${() => handleControl('start')}
                        disabled=${isRunning}
                        class="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >启动</button>
                    <button
                        onClick=${() => handleControl('stop')}
                        disabled=${!isRunning}
                        class="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >停止</button>
                    <button
                        onClick=${() => handleControl('restart')}
                        class="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:opacity-90 transition"
                    >重启</button>
                </div>
            </div>

            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <${Card}>
                    <div class="text-xs text-gray-400 uppercase tracking-wide mb-2">Worker 状态</div>
                    <span class=${'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase ' + getStateBadgeColor(status.state)}>
                        ${STATE_LABELS[status.state] ?? status.state}
                    </span>
                <//>

                <${Card}>
                    <div class="text-xs text-gray-400 uppercase tracking-wide mb-2">NapCat 连接</div>
                    <div class="flex items-center gap-2">
                        <${StatusIcon} active=${status.napcat.connected} color=${status.napcat.connected ? 'green' : 'gray'} />
                        <span class="text-sm font-semibold">${status.napcat.connected ? '已连接' : '未连接'}</span>
                    </div>
                    <div class="text-xs text-gray-400 mt-1">${status.napcat.host}:${status.napcat.port}</div>
                    ${status.napcat.error && html`
                        <div class="mt-2 text-xs text-red-500 bg-red-50 rounded px-2 py-1 break-all">${status.napcat.error}</div>
                    `}
                <//>

                <${Card}>
                    <div class="text-xs text-gray-400 uppercase tracking-wide mb-2">ElyHub 后端</div>
                    <div class="flex items-center gap-2">
                        <${StatusIcon} active=${hbOk} color=${hbColor} />
                        <span class="text-sm font-semibold">${hbLabel}</span>
                    </div>
                    <div class="text-xs text-gray-400 mt-1">
                        间隔 ${status.heartbeat.expectedIntervalSeconds}s · 上次 ${formatDate(status.heartbeat.lastOkAt)}
                    </div>
                    ${hbError && html`
                        <div class="mt-1 text-xs text-red-500">连续失败 ${hbFailures} 次</div>
                    `}
                <//>

                <${Card}>
                    <div class="text-xs text-gray-400 uppercase tracking-wide mb-2">下次同步</div>
                    <div class="text-2xl font-bold text-primary">${status.sync.nextRunAt ? fmt(countdown) : '—'}</div>
                    <div class="text-xs text-gray-400 mt-1 font-mono truncate" title=${status.sync.cron}>${status.sync.cron || '—'}</div>
                <//>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2">
                    <${Card} title="近期群组更新">
                        <div class="overflow-x-auto">
                            <table class="w-full text-sm">
                                <thead>
                                    <tr class="text-xs text-gray-400 uppercase border-b border-gray-100">
                                        <th class="pb-3 text-left font-medium">群组名称</th>
                                        <th class="pb-3 text-left font-medium">QQ 号</th>
                                        <th class="pb-3 text-left font-medium">状态</th>
                                        <th class="pb-3 text-left font-medium">更新时间</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-50">
                                    ${status.sync.recentGroups.length === 0
                                        ? html`<tr><td colspan="4" class="py-8 text-center text-gray-400 italic text-sm">暂无数据</td></tr>`
                                        : status.sync.recentGroups.map(g => html`
                                            <tr key=${g.id}>
                                                <td class="py-2.5 font-medium text-gray-800">${g.name ?? '（未命名）'}</td>
                                                <td class="py-2.5 text-gray-500">${g.qqNumber ?? '—'}</td>
                                                <td class="py-2.5">
                                                    <span class=${'px-2 py-0.5 rounded text-xs font-semibold uppercase ' + getGroupStatusColor(g.status)}>
                                                        ${g.status}
                                                    </span>
                                                </td>
                                                <td class="py-2.5 text-xs text-gray-400">${formatDate(g.updatedAt)}</td>
                                            </tr>
                                        `)
                                    }
                                </tbody>
                            </table>
                        </div>
                    <//>
                </div>

                <div class="space-y-4">
                    <${Card} title="同步统计">
                        <div class="space-y-3 text-sm">
                            <div>
                                <div class="text-xs text-gray-400 mb-0.5">上次运行</div>
                                <div class="font-medium">${formatDate(status.sync.lastRunAt)}</div>
                            </div>
                            <div>
                                <div class="text-xs text-gray-400 mb-0.5">上次成功</div>
                                <div class="font-medium text-green-600">${formatDate(status.sync.lastSuccessAt)}</div>
                            </div>
                            <div>
                                <div class="text-xs text-gray-400 mb-0.5">本次更新数</div>
                                <div class="text-2xl font-bold text-primary">${status.sync.lastUpdatedCount}</div>
                            </div>
                        </div>
                    <//>
                </div>
            </div>
        </div>
    `;
};
