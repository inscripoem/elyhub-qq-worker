import { useState, useEffect } from 'react'
import { Form, Input, InputNumber, Card, Button, Alert, Space } from 'antd'
import { api } from '../services/api'
import { CronInput } from '../components/CronInput'

const CARD_BODY: React.CSSProperties = { padding: '20px 24px' }
const CARD_STYLE: React.CSSProperties = { marginBottom: 20 }

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
    {children}
  </span>
)

export const Config = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getConfig()
      form.setFieldsValue(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      await api.saveConfig(form.getFieldsValue())
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '64px 0', color: '#9CA3AF', fontSize: 14 }}>加载中...</div>

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>配置</h1>
      </div>

      {error && (
        <Alert type="error" message={error} showIcon closable onClose={() => setError('')} style={{ marginBottom: 16 }} />
      )}
      {saved && (
        <Alert type="success" message="配置已保存。" showIcon style={{ marginBottom: 16 }} />
      )}

      <Form form={form} layout="vertical" requiredMark={false}>
        <Card title={<SectionTitle>ElyHub 连接</SectionTitle>} style={CARD_STYLE} styles={{ body: CARD_BODY }}>
          <Form.Item name="elyhubBaseUrl" label="ElyHub 地址" extra="ElyHub 实例的基础 URL，例如 https://elyhub.example.com">
            <Input placeholder="https://elyhub.example.com" />
          </Form.Item>
          <Form.Item name="secret" label="Worker 密钥" extra="ElyHub Worker API 的 Bearer Token（QQ_WORKER_SECRET）" style={{ marginBottom: 0 }}>
            <Input.Password placeholder="未设置" autoComplete="new-password" />
          </Form.Item>
        </Card>

        <Card title={<SectionTitle>NapCat WebSocket</SectionTitle>} style={CARD_STYLE} styles={{ body: CARD_BODY }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <Form.Item name="napcatHost" label="主机" extra="NapCat WebSocket 主机名">
              <Input placeholder="127.0.0.1" />
            </Form.Item>
            <Form.Item name="napcatPort" label="端口" extra="NapCat WebSocket 端口">
              <InputNumber style={{ width: '100%' }} min={1} max={65535} placeholder="13001" />
            </Form.Item>
          </div>
          <Form.Item name="napcatToken" label="访问令牌" extra="若 NapCat 未配置访问令牌可留空" style={{ marginBottom: 0 }}>
            <Input.Password placeholder="（可选）" autoComplete="new-password" />
          </Form.Item>
        </Card>

        <Card title={<SectionTitle>NapCat 重连</SectionTitle>} style={CARD_STYLE} styles={{ body: CARD_BODY }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <Form.Item name="napcatReconnectAttempts" label="重连次数" extra="连接断开后的最大重试次数，0 表示不重连">
              <InputNumber style={{ width: '100%' }} min={0} placeholder="5" />
            </Form.Item>
            <Form.Item name="napcatReconnectDelay" label="重连间隔（毫秒）" extra="每次重连之间的等待时间" style={{ marginBottom: 0 }}>
              <InputNumber style={{ width: '100%' }} min={0} placeholder="3000" />
            </Form.Item>
          </div>
        </Card>

        <Card title={<SectionTitle>NapCat 查询限速</SectionTitle>} style={CARD_STYLE} styles={{ body: CARD_BODY }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <Form.Item name="napcatGroupDelay" label="群间延迟（毫秒）" extra="处理不同群之间的等待时间">
              <InputNumber style={{ width: '100%' }} min={0} placeholder="500" />
            </Form.Item>
            <Form.Item name="napcatIntraGroupDelay" label="群内接口间隔（毫秒）" extra="同一群的两次 API 调用之间的等待时间" style={{ marginBottom: 0 }}>
              <InputNumber style={{ width: '100%' }} min={0} placeholder="300" />
            </Form.Item>
          </div>
        </Card>

        <Card title={<SectionTitle>同步周期</SectionTitle>} style={{ marginBottom: 28 }} styles={{ body: CARD_BODY }}>
          <Form.Item name="heartbeatInterval" label="心跳间隔（秒）" extra="向 ElyHub 发送心跳的频率">
            <InputNumber style={{ width: '100%' }} min={10} placeholder="60" />
          </Form.Item>
          <Form.Item name="syncCron" label="群组同步计划" style={{ marginBottom: 0 }}>
            <CronInput />
          </Form.Item>
        </Card>

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid #F3F4F6' }}>
          <Space size={8}>
            <Button onClick={load} style={{ color: '#6B7280' }}>重置</Button>
            <Button type="primary" loading={saving} onClick={handleSave}>保存配置</Button>
          </Space>
        </div>
      </Form>
    </div>
  )
}
