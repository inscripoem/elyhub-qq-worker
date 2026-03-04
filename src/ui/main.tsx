import { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider, Layout, App, Input, Button, Alert, Breadcrumb } from 'antd'
import { useAppStore } from './services/store'
import { api } from './services/api'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { Config } from './pages/Config'
import { Logs } from './pages/Logs'
import { antdTheme } from './theme'

const { Content } = Layout

const PAGES: Record<string, React.ComponentType> = {
  dashboard: Dashboard,
  config: Config,
  logs: Logs,
}

const PAGE_NAMES: Record<string, string> = { dashboard: '概览', config: '配置', logs: '日志' }

const AuthScreen = () => {
  const { setNeedsAuth } = useAppStore()
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token.trim()) return
    setLoading(true)
    setError('')
    api.setToken(token.trim())
    try {
      await api.getStatus()
      setNeedsAuth(false)
    } catch {
      setError('令牌无效，请重试')
      api.setToken('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #E5E7EB',
        padding: 32,
        width: '100%',
        maxWidth: 360,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, background: '#002FA7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0,
          }}>E</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>ElyHub QQ Worker</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>管理面板</div>
          </div>
        </div>
        <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 20, lineHeight: 1.6 }}>请输入管理员令牌以继续访问。</p>
        {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}
        <form onSubmit={handleSubmit}>
          <Input.Password
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="管理员令牌"
            autoComplete="current-password"
            size="large"
            style={{ marginBottom: 12 }}
          />
          <Button type="primary" htmlType="submit" loading={loading} block size="large">
            {loading ? '验证中...' : '登录'}
          </Button>
        </form>
      </div>
    </div>
  )
}

const AppLayout = () => {
  const { currentPage, needsAuth, setWorkerStatus } = useAppStore()
  const Page = PAGES[currentPage] ?? Dashboard

  useEffect(() => {
    const stored = localStorage.getItem('adminToken')
    if (stored) api.setToken(stored)
  }, [])

  useEffect(() => {
    return api.subscribeStatus((status) => setWorkerStatus(status))
  }, [setWorkerStatus])

  if (needsAuth) return <AuthScreen />

  return (
    <Layout style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <Sidebar />
      <Layout style={{ marginLeft: 200, background: '#F9FAFB' }}>
        <Content style={{ padding: 32 }}>
          <Breadcrumb
            style={{ marginBottom: 20 }}
            items={[
              { title: <span style={{ color: '#9CA3AF' }}>ElyHub Worker</span> },
              { title: <span style={{ color: '#374151', fontWeight: 500 }}>{PAGE_NAMES[currentPage] ?? currentPage}</span> },
            ]}
          />
          <Page />
        </Content>
      </Layout>
    </Layout>
  )
}

createRoot(document.getElementById('root')!).render(
  <ConfigProvider theme={antdTheme}>
    <App>
      <AppLayout />
    </App>
  </ConfigProvider>
)
