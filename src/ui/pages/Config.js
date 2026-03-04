import { html } from 'htm/preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../services/api.js';
import { Card } from '../components/Card.js';
import { CronInput } from '../components/CronInput.js';

const Field = ({ label, description, children }) => html`
    <div class="mb-5">
        <label class="block text-sm font-semibold text-gray-700 mb-1">${label}</label>
        ${children}
        ${description && html`<p class="mt-1 text-xs text-gray-400">${description}</p>`}
    </div>
`;

const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary';

export const Config = () => {
    const [form, setForm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await api.getConfig();
            setForm({ ...data });
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSaved(false);
        try {
            await api.saveConfig(form);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return html`<div class="py-12 text-center text-gray-400">加载中...</div>`;

    return html`
        <div class="max-w-3xl space-y-6">
            <div class="flex items-center justify-between">
                <h1 class="text-2xl font-bold text-gray-800">配置</h1>
                <p class="text-xs text-gray-400">敏感字段在读取时已脱敏</p>
            </div>

            ${error && html`
                <div class="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">${error}</div>
            `}
            ${saved && html`
                <div class="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">配置已保存。</div>
            `}

            <form onSubmit=${handleSave} class="space-y-6">
                <${Card} title="ElyHub 连接">
                    <${Field} label="ElyHub 地址" description="ElyHub 实例的基础 URL，例如 https://elyhub.example.com">
                        <input
                            type="url"
                            class=${inputCls}
                            value=${form?.elyhubBaseUrl ?? ''}
                            onInput=${e => set('elyhubBaseUrl', e.target.value)}
                            placeholder="https://elyhub.example.com"
                        />
                    <//>
                    <${Field} label="Worker 密钥" description="ElyHub Worker API 的 Bearer Token（QQ_WORKER_SECRET）">
                        <input
                            type="password"
                            class=${inputCls}
                            value=${form?.secret ?? ''}
                            onInput=${e => set('secret', e.target.value)}
                            placeholder="输入以更新"
                            autocomplete="new-password"
                        />
                    <//>
                <//>

                <${Card} title="NapCat WebSocket">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-5">
                        <${Field} label="主机" description="NapCat WebSocket 主机名">
                            <input
                                type="text"
                                class=${inputCls}
                                value=${form?.napcatHost ?? ''}
                                onInput=${e => set('napcatHost', e.target.value)}
                                placeholder="127.0.0.1"
                            />
                        <//>
                        <${Field} label="端口" description="NapCat WebSocket 端口">
                            <input
                                type="number"
                                class=${inputCls}
                                value=${form?.napcatPort ?? ''}
                                onInput=${e => set('napcatPort', Number(e.target.value))}
                                min="1"
                                max="65535"
                                placeholder="13001"
                            />
                        <//>
                    </div>
                    <${Field} label="访问令牌" description="若 NapCat 未配置访问令牌可留空">
                        <input
                            type="password"
                            class=${inputCls}
                            value=${form?.napcatToken ?? ''}
                            onInput=${e => set('napcatToken', e.target.value)}
                            placeholder="（可选）"
                            autocomplete="new-password"
                        />
                    <//>
                <//>

                <${Card} title="NapCat 重连">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-5">
                        <${Field} label="重连次数" description="连接断开后的最大重试次数，0 表示不重连">
                            <input
                                type="number"
                                class=${inputCls}
                                value=${form?.napcatReconnectAttempts ?? ''}
                                onInput=${e => set('napcatReconnectAttempts', Number(e.target.value))}
                                min="0"
                                placeholder="5"
                            />
                        <//>
                        <${Field} label="重连间隔（毫秒）" description="每次重连之间的等待时间">
                            <input
                                type="number"
                                class=${inputCls}
                                value=${form?.napcatReconnectDelay ?? ''}
                                onInput=${e => set('napcatReconnectDelay', Number(e.target.value))}
                                min="0"
                                placeholder="3000"
                            />
                        <//>
                    </div>
                <//>

                <${Card} title="NapCat 查询限速">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-5">
                        <${Field} label="群间延迟（毫秒）" description="处理不同群之间的等待时间，避免请求过快">
                            <input
                                type="number"
                                class=${inputCls}
                                value=${form?.napcatGroupDelay ?? ''}
                                onInput=${e => set('napcatGroupDelay', Number(e.target.value))}
                                min="0"
                                placeholder="500"
                            />
                        <//>
                        <${Field} label="群内接口间隔（毫秒）" description="同一群的两次 API 调用之间的等待时间">
                            <input
                                type="number"
                                class=${inputCls}
                                value=${form?.napcatIntraGroupDelay ?? ''}
                                onInput=${e => set('napcatIntraGroupDelay', Number(e.target.value))}
                                min="0"
                                placeholder="300"
                            />
                        <//>
                    </div>
                <//>

                <${Card} title="同步周期">
                    <${Field} label="心跳间隔（秒）" description="向 ElyHub 发送心跳的频率">
                        <input
                            type="number"
                            class=${inputCls}
                            value=${form?.heartbeatInterval ?? ''}
                            onInput=${e => set('heartbeatInterval', Number(e.target.value))}
                            min="10"
                            placeholder="60"
                        />
                    <//>
                    <${Field} label="群组同步计划">
                        <${CronInput}
                            value=${form?.syncCron ?? ''}
                            onInput=${v => set('syncCron', v)}
                        />
                    <//>
                <//>

                <div class="flex justify-end gap-3">
                    <button type="button" onClick=${load} class="px-5 py-2 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">
                        重置
                    </button>
                    <button type="submit" disabled=${saving} class="px-6 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition">
                        ${saving ? '保存中...' : '保存配置'}
                    </button>
                </div>
            </form>
        </div>
    `;
};
