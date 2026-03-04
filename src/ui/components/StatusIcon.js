import { html } from 'htm/preact';

export const StatusIcon = ({ active, color = 'green' }) => {
    const base = { green: 'bg-green-500', red: 'bg-red-500', yellow: 'bg-yellow-500', gray: 'bg-gray-400' };
    const dim  = { green: 'bg-green-300', red: 'bg-red-300',  yellow: 'bg-yellow-300', gray: 'bg-gray-300' };
    const cls = active ? base[color] : dim[color];

    return html`
        <div class="relative flex h-3 w-3 shrink-0">
            ${active && html`<span class=${'animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ' + base[color]}></span>`}
            <span class=${'relative inline-flex rounded-full h-3 w-3 ' + cls}></span>
        </div>
    `;
};
