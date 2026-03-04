import { html } from 'htm/preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { logs } from '../services/store.js';
import { api } from '../services/api.js';
import { getLevelColor, formatTime } from '../utils/format.js';

const LEVELS = ['all', 'debug', 'info', 'warn', 'error'];
const LEVEL_LABELS = { all: '全部', debug: 'Debug', info: 'Info', warn: 'Warn', error: 'Error' };

export const Logs = () => {
    const [filter, setFilter] = useState('all');
    const [autoScroll, setAutoScroll] = useState(true);
    const containerRef = useRef(null);

    useEffect(() => {
        api.fetchLogHistory();
        const cleanup = api.subscribeLogs();
        return cleanup;
    }, []);

    useEffect(() => {
        if (autoScroll && containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [logs.value.length, autoScroll]);

    const filtered = logs.value.filter(
        log => filter === 'all' || log.level === filter
    ).slice().reverse();

    return html`
        <div class="flex flex-col" style="height: calc(100vh - 7rem)">
            <div class="flex items-center justify-between mb-4">
                <h1 class="text-2xl font-bold text-gray-800">系统日志</h1>
                <div class="flex items-center gap-3">
                    <label class="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked=${autoScroll}
                            onChange=${e => setAutoScroll(e.target.checked)}
                            class="rounded text-primary"
                        />
                        自动滚动
                    </label>

                    <select
                        value=${filter}
                        onChange=${e => setFilter(e.target.value)}
                        class="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                        ${LEVELS.map(l => html`<option key=${l} value=${l}>${LEVEL_LABELS[l]}</option>`)}
                    </select>

                    <button
                        onClick=${() => api.fetchLogHistory()}
                        title="加载历史日志"
                        class="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                    >
                        <svg class="w-5 h-5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>

                    <button
                        onClick=${() => { logs.value = []; }}
                        title="清空日志"
                        class="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition"
                    >
                        <svg class="w-5 h-5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            </div>

            <div class="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div class="bg-gray-50 border-b border-gray-100 px-4 py-2 grid grid-cols-[7rem_4.5rem_6rem_1fr] text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    <span>时间</span>
                    <span>级别</span>
                    <span>模块</span>
                    <span>消息</span>
                </div>
                <div
                    ref=${containerRef}
                    class="flex-1 overflow-y-auto font-mono text-xs"
                >
                    ${filtered.length === 0
                        ? html`<div class="py-12 text-center text-gray-400 italic">暂无日志</div>`
                        : filtered.map(log => html`
                            <div key=${log.id} class="grid grid-cols-[7rem_4.5rem_6rem_1fr] items-baseline px-4 py-1.5 border-b border-gray-50 hover:bg-gray-50/50">
                                <span class="text-gray-400">${formatTime(log.ts)}</span>
                                <span>
                                    <span class=${'px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ' + getLevelColor(log.level)}>
                                        ${log.level}
                                    </span>
                                </span>
                                <span class="text-primary/60 font-semibold truncate pr-2">${log.module}</span>
                                <span class="text-gray-700 break-all">${log.message}</span>
                            </div>
                        `)
                    }
                </div>
            </div>
        </div>
    `;
};
