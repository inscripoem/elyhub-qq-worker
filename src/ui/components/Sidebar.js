import { html } from 'htm/preact';
import { currentPage } from '../services/store.js';

const NAV_ITEMS = [
    {
        id: 'dashboard',
        label: '概览',
        icon: html`<svg class="w-5 h-5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>`
    },
    {
        id: 'config',
        label: '配置',
        icon: html`<svg class="w-5 h-5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`
    },
    {
        id: 'logs',
        label: '日志',
        icon: html`<svg class="w-5 h-5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>`
    },
];

export const Sidebar = () => html`
    <aside class="w-60 h-screen bg-white border-r border-gray-100 flex flex-col p-4 fixed left-0 top-0 z-10">
        <div class="flex items-center gap-3 px-2 py-5 mb-4">
            <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
                <span class="text-white font-bold text-sm">E</span>
            </div>
            <span class="font-bold text-gray-800 truncate">ElyHub QQ Worker</span>
        </div>

        <nav class="flex-1 space-y-1">
            ${NAV_ITEMS.map(item => {
                const active = currentPage.value === item.id;
                return html`
                    <button
                        key=${item.id}
                        onClick=${() => currentPage.value = item.id}
                        class=${'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ' +
                               (active ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800')}
                    >
                        ${item.icon}
                        ${item.label}
                    </button>
                `;
            })}
        </nav>

        <div class="pt-4 border-t border-gray-100">
            <p class="text-xs text-gray-400 px-2">v0.1.0</p>
        </div>
    </aside>
`;
