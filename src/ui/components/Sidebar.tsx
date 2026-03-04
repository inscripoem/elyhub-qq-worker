import { Layout, Menu } from 'antd'
import { DashboardOutlined, SettingOutlined, FileTextOutlined } from '@ant-design/icons'
import { useAppStore } from '../services/store'

const { Sider } = Layout

const NAV_ITEMS = [
  { key: 'dashboard', icon: <DashboardOutlined />, label: '概览' },
  { key: 'config',    icon: <SettingOutlined />,   label: '配置' },
  { key: 'logs',      icon: <FileTextOutlined />,  label: '日志' },
]

export const Sidebar = () => {
  const { currentPage, setCurrentPage } = useAppStore()

  return (
    <Sider
      width={200}
      style={{
        position: 'fixed',
        left: 0, top: 0, bottom: 0,
        zIndex: 10,
        background: '#fff',
        borderRight: '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column',
      }}
      theme="light"
    >
      <div style={{ padding: '18px 16px 10px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, background: '#002FA7',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0,
        }}>E</div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
            ElyHub Worker
          </div>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>QQ Bot</div>
        </div>
      </div>

      <div style={{ height: 1, background: '#F3F4F6', margin: '0 12px 8px' }} />

      <Menu
        mode="inline"
        selectedKeys={[currentPage]}
        items={NAV_ITEMS}
        onClick={({ key }) => setCurrentPage(key)}
        style={{ borderRight: 0, flex: 1 }}
        theme="light"
      />

      <div style={{ borderTop: '1px solid #F3F4F6', padding: '10px 16px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: '#D1D5DB' }}>v{__APP_VERSION__}</span>
        <span style={{ fontSize: 11, color: '#D1D5DB' }}>ElyHub</span>
      </div>
    </Sider>
  )
}
