import { useState, useEffect, useCallback } from 'react'
import { Card, Tag, Button, Space, App, Input, List, Empty } from 'antd'
import { useAppStore } from '../services/store'
import { api } from '../services/api'
import { formatDate, getStateTagColor, getGroupStatusColor } from '../utils/format'
import { StatusIcon } from '../components/StatusIcon'
import type { SearchableGroup } from '../services/store'

const STATE_LABELS: Record<string, string> = { idle: '空闲', running: '运行中', stopped: '已停止', error: '异常' }
const ACTION_LABELS: Record<string, string> = { start: '启动', stop: '停止', restart: '重启' }

const STAT_CARD_BODY: React.CSSProperties = { padding: '16px 20px' }

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#9CA3AF',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  fontWeight: 600,
  marginBottom: 10,
}

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
    {children}
  </span>
)

export const Dashboard = () => {
  const { message } = App.useApp()
  const [countdown, setCountdown] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchableGroup[]>([])
  const status = useAppStore((s) => s.workerStatus)

  useEffect(() => {
    const tick = () => {
      const nextRun = status.sync.nextRunAt
      if (!nextRun) { setCountdown(0); return }
      setCountdown(Math.max(0, Math.floor((new Date(nextRun).getTime() - Date.now()) / 1000)))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [status.sync.nextRunAt])

  const handleControl = async (action: string) => {
    const label = ACTION_LABELS[action]
    const hide = message.loading(`${label}中...`, 0)
    try {
      await api.control(action)
      hide()
      message.success(`${label}成功`)
    } catch (e) {
      hide()
      message.error(`${label}失败：${(e as Error).message}`)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    const hide = message.loading('同步中...', 0)
    try {
      const res = await api.syncNow()
      hide()
      message.success(`同步完成，更新 ${res.updatedCount} 条记录`)
    } catch (e) {
      hide()
      message.error(`同步失败：${(e as Error).message}`)
    } finally {
      setSyncing(false)
    }
  }

  const handleSearch = useCallback(async (keyword: string) => {
    if (!status.napcat.connected) {
      message.warning('Worker 未运行，无法搜索')
      return
    }
    setSearchLoading(true)
    try {
      const res = await api.searchGroups(keyword)
      const groups = res.data ?? []
      setSearchResults(groups)
      if (groups.length === 0) {
        message.info('未找到匹配的群组')
      }
    } catch (e) {
      message.error(`搜索失败：${(e as Error).message}`)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }, [status.napcat.connected, message])

  const fmt = (s: number) => {
    if (s >= 3600) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`
    if (s >= 60) return `${Math.floor(s / 60)}m ${s % 60}s`
    return `${s}s`
  }

  const isRunning = status.state === 'running'
  const hbFailures = status.heartbeat.consecutiveFailures
  const hbOk = isRunning && hbFailures === 0 && !!status.heartbeat.lastOkAt
  const hbError = isRunning && hbFailures > 0
  const hbColor = hbOk ? 'green' : hbError ? 'red' : 'gray'
  const hbLabel = !isRunning ? '未连接' : hbOk ? '正常' : '异常'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>概览</h1>
        <Space size={8}>
          <Button onClick={handleSync} disabled={!isRunning || syncing} loading={syncing}>立即同步</Button>
          <Button
            disabled={isRunning}
            onClick={() => handleControl('start')}
            style={isRunning ? {} : { borderColor: '#16a34a', color: '#16a34a' }}
          >
            启动
          </Button>
          <Button danger disabled={!isRunning} onClick={() => handleControl('stop')}>停止</Button>
          <Button type="primary" onClick={() => handleControl('restart')}>重启</Button>
        </Space>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <Card styles={{ body: STAT_CARD_BODY }}>
          <div style={labelStyle}>Worker 状态</div>
          <Tag color={getStateTagColor(status.state)} style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: 11 }}>
            {STATE_LABELS[status.state] ?? status.state}
          </Tag>
        </Card>

        <Card styles={{ body: STAT_CARD_BODY }}>
          <div style={labelStyle}>NapCat 连接</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <StatusIcon active={status.napcat.connected} color={status.napcat.connected ? 'green' : 'gray'} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{status.napcat.connected ? '已连接' : '未连接'}</span>
          </div>
          <div style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'monospace' }}>{status.napcat.host}:{status.napcat.port}</div>
          {status.napcat.error && <div style={{ marginTop: 8, fontSize: 12, color: '#EF4444', wordBreak: 'break-all' }}>{status.napcat.error}</div>}
        </Card>

        <Card styles={{ body: STAT_CARD_BODY }}>
          <div style={labelStyle}>ElyHub 后端</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <StatusIcon active={hbOk} color={hbColor} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{hbLabel}</span>
          </div>
          <div style={{ fontSize: 12, color: '#9CA3AF' }}>
            间隔 {status.heartbeat.expectedIntervalSeconds}s · 上次 {formatDate(status.heartbeat.lastOkAt)}
          </div>
          {hbError && <div style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>连续失败 {hbFailures} 次</div>}
        </Card>

        <Card styles={{ body: STAT_CARD_BODY }}>
          <div style={labelStyle}>下次同步</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#002FA7', lineHeight: 1.2, marginBottom: 6 }}>
            {status.sync.nextRunAt ? fmt(countdown) : '—'}
          </div>
          <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={status.sync.cron}>
            {status.sync.cron || '—'}
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, alignItems: 'start' }}>
        <Card
          title={<SectionTitle>近期群组更新</SectionTitle>}
          styles={{ body: { padding: '0 20px 16px' } }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                  {['别名', '名称', 'QQ 号', '状态', '更新时间'].map((h) => (
                    <th key={h} style={{ padding: '12px 8px 10px 0', textAlign: 'left', fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {status.sync.recentGroups.length === 0
                  ? <tr><td colSpan={5} style={{ padding: '36px 0', textAlign: 'center', color: '#9CA3AF', fontStyle: 'italic', fontSize: 13 }}>暂无数据</td></tr>
                  : status.sync.recentGroups.map((g) => (
                    <tr
                      key={g.id}
                      onMouseEnter={() => setHoveredRow(g.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{
                        borderBottom: '1px solid #F3F4F6',
                        background: hoveredRow === g.id ? '#F9FAFB' : 'transparent',
                        transition: 'background 0.15s',
                      }}
                    >
                      <td style={{ padding: '10px 8px 10px 0', fontWeight: 500, color: '#111827' }}>{g.alias ?? '—'}</td>
                      <td style={{ padding: '10px 8px 10px 0', color: '#6B7280', fontSize: 14 }}>{g.name ?? '—'}</td>
                      <td style={{ padding: '10px 8px 10px 0', color: '#6B7280', fontFamily: 'monospace', fontSize: 13 }}>{g.qqNumber ?? '—'}</td>
                      <td style={{ padding: '10px 8px 10px 0' }}>
                        <Tag color={getGroupStatusColor(g.status)} style={{ fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}>
                          {g.status}
                        </Tag>
                      </td>
                      <td style={{ padding: '10px 0', fontSize: 12, color: '#9CA3AF' }}>{formatDate(g.updatedAt)}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card title={<SectionTitle>同步统计</SectionTitle>} styles={{ body: { padding: '12px 20px 20px' } }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>上次运行</div>
                <div style={{ fontWeight: 500, color: '#374151' }}>{formatDate(status.sync.lastRunAt)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>上次成功</div>
                <div style={{ fontWeight: 500, color: '#16A34A' }}>{formatDate(status.sync.lastSuccessAt)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>本次更新数</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#002FA7', lineHeight: 1.1 }}>{status.sync.lastUpdatedCount}</div>
              </div>
            </div>
          </Card>

          <Card title={<SectionTitle>群搜索</SectionTitle>} styles={{ body: { padding: '12px 20px 20px' } }}>
            <Input.Search
              placeholder="输入关键词搜索 ElyHub 群组"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onSearch={handleSearch}
              loading={searchLoading}
              disabled={!isRunning}
              style={{ marginBottom: 16 }}
            />
            {searchResults.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={searchLoading ? '搜索中...' : isRunning ? '输入关键词开始搜索' : 'Worker 未运行'}
                style={{ marginTop: 8 }}
              />
            ) : (
              <List
                size="small"
                dataSource={searchResults}
                renderItem={(g: SearchableGroup) => (
                  <List.Item style={{ padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontWeight: 500, color: '#111827', fontSize: 14 }}>
                          {g.alias ?? g.name ?? '（未命名）'}
                        </span>
                        <Tag color={getGroupStatusColor(g.status)} style={{ fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}>
                          {g.status}
                        </Tag>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#6B7280' }}>
                        {g.alias && g.name && (
                          <span>{g.name}</span>
                        )}
                        <span style={{ fontFamily: 'monospace' }}>{g.qqNumber ?? '—'}</span>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
