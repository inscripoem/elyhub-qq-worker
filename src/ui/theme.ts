import type { ThemeConfig } from 'antd'

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#002FA7',
    colorError: '#EF4444',
    colorSuccess: '#16A34A',
    colorWarning: '#F59E0B',
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    colorBgContainer: '#ffffff',
    colorBgLayout: '#F9FAFB',
    colorBgElevated: '#ffffff',
    colorBorder: '#E5E7EB',
    colorBorderSecondary: '#F3F4F6',
    colorText: '#111827',
    colorTextSecondary: '#6B7280',
    colorTextTertiary: '#9CA3AF',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    lineHeight: 1.5,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    boxShadowSecondary: 'none',
  },
  components: {
    Layout: {
      siderBg: '#ffffff',
      bodyBg: '#F9FAFB',
      triggerBg: '#ffffff',
    },
    Card: {
      borderRadiusLG: 12,
      paddingLG: 20,
      headerBg: 'transparent',
      headerFontSize: 13,
      headerHeight: 44,
    },
    Button: {
      borderRadius: 8,
      fontWeight: 500,
      primaryShadow: 'none',
      defaultShadow: 'none',
      dangerShadow: 'none',
    },
    Tag: {
      borderRadiusSM: 6,
      fontSizeSM: 10,
    },
    Menu: {
      itemBorderRadius: 8,
      itemMarginInline: 8,
      activeBarBorderWidth: 0,
      itemSelectedBg: '#EEF2FF',
      itemSelectedColor: '#002FA7',
    },
    Input: {
      borderRadius: 8,
    },
    InputNumber: {
      borderRadius: 8,
    },
    Select: {
      borderRadius: 8,
    },
    Form: {
      labelColor: '#374151',
      labelFontSize: 13,
    },
    Alert: {
      borderRadiusLG: 8,
    },
    Switch: {
      colorPrimary: '#002FA7',
    },
    Breadcrumb: {
      fontSize: 13,
      separatorColor: '#D1D5DB',
    },
  },
}
