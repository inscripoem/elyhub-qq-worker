import { html } from 'htm/preact';
import { useRef, useEffect } from 'preact/hooks';

export const CronInput = ({ value, onInput }) => {
    const elRef = useRef(null);
    const cbRef = useRef(onInput);
    cbRef.current = onInput;

    useEffect(() => {
        const el = elRef.current;
        if (!el) return;
        const handler = (e) => cbRef.current(e.detail.value);
        el.addEventListener('input', handler);
        return () => el.removeEventListener('input', handler);
    }, []);

    useEffect(() => {
        const el = elRef.current;
        if (el && el.value !== value) el.setAttribute('value', value);
    }, [value]);

    return html`<cron-input-ui ref=${elRef} value=${value} class="w-full"></cron-input-ui>`;
};
