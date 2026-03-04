import { html } from 'htm/preact';

export const Card = ({ title, children, class: className = '' }) => html`
    <div class=${'bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ' + className}>
        ${title && html`
            <div class="px-5 py-3 border-b border-gray-100 bg-gray-50/40">
                <h3 class="text-sm font-semibold text-gray-600 uppercase tracking-wide">${title}</h3>
            </div>
        `}
        <div class="px-5 py-4">${children}</div>
    </div>
`;
