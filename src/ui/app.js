import { html } from 'htm/preact';
import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { currentPage, workerStatus, needsAuth } from './services/store.js';
import { api } from './services/api.js';
import { Sidebar } from './components/Sidebar.js';
import { ToastContainer } from './components/Toast.js';
import { Dashboard } from './pages/Dashboard.js';
import { Config } from './pages/Config.js';
import { Logs } from './pages/Logs.js';

const PAGES = { dashboard: Dashboard, config: Config, logs: Logs };

const PAGE_NAMES = { dashboard: '概览', config: '配置', logs: '日志' };

const AuthScreen = () => {
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!token.trim()) return;
        setLoading(true);
        setError('');
        api.setToken(token.trim());
        try {
            await api.getStatus();
            needsAuth.value = false;
        } catch {
            setError('令牌无效，请重试');
            api.setToken('');
        } finally {
            setLoading(false);
        }
    };

    return html`
        <div class="min-h-screen bg-gray-50 flex items-center justify-center">
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
                <div class="flex items-center gap-3 mb-6">
                    <div class="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
                        <span class="text-white font-bold">E</span>
                    </div>
                    <div>
                        <div class="font-bold text-gray-800">ElyHub QQ Worker</div>
                        <div class="text-xs text-gray-400">管理面板</div>
                    </div>
                </div>

                <p class="text-sm text-gray-600 mb-5">请输入管理员令牌以继续访问。</p>

                ${error && html`
                    <div class="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">${error}</div>
                `}

                <form onSubmit=${handleSubmit}>
                    <input
                        type="password"
                        value=${token}
                        onInput=${e => setToken(e.target.value)}
                        placeholder="管理员令牌"
                        autocomplete="current-password"
                        class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary mb-4"
                    />
                    <button
                        type="submit"
                        disabled=${loading}
                        class="w-full py-2 text-sm font-medium bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition"
                    >${loading ? '验证中...' : '登录'}</button>
                </form>
            </div>
        </div>
    `;
};

const App = () => {
    const page = currentPage.value;
    const Page = PAGES[page] ?? Dashboard;
    const auth = needsAuth.value;

    useEffect(() => {
        // Pre-load token from localStorage
        const stored = localStorage.getItem('adminToken');
        if (stored) api.setToken(stored);
    }, []);

    useEffect(() => {
        return api.subscribeStatus((status) => {
            workerStatus.value = status;
        });
    }, []);

    if (auth) return html`<${AuthScreen} />`;

    return html`
        <div class="flex min-h-screen">
        <${ToastContainer} />
            <${Sidebar} />
            <main class="flex-1 ml-60 p-8">
                <nav class="text-xs text-gray-400 mb-6">
                    ElyHub Worker
                    <span class="mx-1.5">/</span>
                    <span class="text-gray-700 font-medium">${PAGE_NAMES[page] ?? page}</span>
                </nav>
                <${Page} />
            </main>
        </div>
    `;
};

render(html`<${App} />`, document.getElementById('app'));
