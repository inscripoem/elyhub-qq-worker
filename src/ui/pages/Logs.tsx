import { useState, useEffect, useRef } from 'react'
import { Select, Tag, Button, Space, Switch, Tooltip } from 'antd'
import { ReloadOutlined, DeleteOutlined } from '@ant-design/icons'
import { useAppStore } from '../services/store'
import { api } from '../services/api'
import { getLevelTagColor, formatTime } from '../utils/format'

const LEVELS = ['all', 'debug', 'info', 'warn', 'error']
const LEVEL_LABELS: Record<string, string> = { all: '全部', debug: 'Debug', info: 'Info', warn: 'Warn', error: 'Error' }

export const Logs = () => {
  const [filter, setFilter] = useState('all')
  const [autoScroll, setAutoScroll] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const { logs, clearLogs } = useAppStore()

  useEffect(() => {
    api.fetchLogHistory()
    return api.subscribeLogs()
  }, [])

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [logs.length, autoScroll])

  const filtered = logs
    .filter((log) => filter === 'all' || log.level === filter)
    .slice()
    .reverse()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>系统日志</h1>
        <Space size={8} align="center">
          <Space size={6} align="center">
            <Switch checked={autoScroll} onChange={setAutoScroll} size="small" />
            <span style={{ fontSize: 13, color: '#6B7280', userSelect: 'none' }}>自动滚动</span>
          </Space>
          <Select
            value={filter}
            onChange={setFilter}
            style={{ width: 88 }}
            options={LEVELS.map((l) => ({ value: l, label: LEVEL_LABELS[l] }))}
          />
          <Tooltip title="加载历史日志">
            <Button icon={<ReloadOutlined />} onClick={() => api.fetchLogHistory()} />
          </Tooltip>
          <Tooltip title="清空日志">
            <Button danger icon={<DeleteOutlined />} onClick={clearLogs} />
          </Tooltip>
        </Space>
      </div>

      <div style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #E5E7EB',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 200px)',
        minHeight: 300,
      }}>
        <div style={{
          background: '#F9FAFB',
          borderBottom: '1px solid #E5E7EB',
          padding: '9px 16px',
          display: 'grid',
          gridTemplateColumns: '7.5rem 5rem 6.5rem 1fr',
          fontSize: 11,
          fontWeight: 600,
          color: '#9CA3AF',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          flexShrink: 0,
        }}>
          <span>时间</span>
          <span>级别</span>
          <span>模块</span>
          <span>消息</span>
        </div>

        <div
          ref={containerRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
            fontSize: 12,
            scrollbarWidth: 'thin',
            scrollbarColor: '#E5E7EB transparent',
          }}
        >
          {filtered.length === 0
            ? <div style={{ padding: '48px 0', textAlign: 'center', color: '#9CA3AF', fontStyle: 'italic', fontSize: 13 }}>暂无日志</div>
            : filtered.map((log) => (
              <div
                key={log.id}
                style={{ display: 'grid', gridTemplateColumns: '7.5rem 5rem 6.5rem 1fr', alignItems: 'baseline', padding: '5px 16px', borderBottom: '1px solid #F3F4F6', transition: 'background 0.1s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#F9FAFB' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
              >
                <span style={{ color: '#9CA3AF', fontVariantNumeric: 'tabular-nums' }}>{formatTime(log.ts)}</span>
                <span>
                  <Tag color={getLevelTagColor(log.level)} style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', lineHeight: '16px', padding: '0 5px' }}>
                    {log.level}
                  </Tag>
                </span>
                <span style={{ color: '#002FA7', opacity: 0.65, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>{log.module}</span>
                <span style={{ color: '#374151', wordBreak: 'break-all', lineHeight: 1.5 }}>{log.message}</span>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}
