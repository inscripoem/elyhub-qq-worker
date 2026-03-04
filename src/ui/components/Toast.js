import { html } from 'htm/preact';
import { toasts } from '../services/store.js';

const STYLES = {
    info:    'bg-gray-800 text-white',
    success: 'bg-green-600 text-white',
    error:   'bg-red-600 text-white',
    loading: 'bg-gray-700 text-white',
};

export const ToastContainer = () => {
    const items = toasts.value;
    if (items.length === 0) return null;
    return html`
        <div class="fixed bottom-5 right-5 space-y-2 z-50 pointer-events-none">
            ${items.map(t => html`
                <div key=${t.id} class=${'flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm ' + (STYLES[t.type] ?? STYLES.info)}>
                    ${t.type === 'loading' && html`
                        <svg class="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                        </svg>
                    `}
                    ${t.message}
                </div>
            `)}
        </div>
    `;
};
