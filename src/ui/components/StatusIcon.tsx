interface StatusIconProps {
  active: boolean
  color?: 'green' | 'red' | 'gray'
}

export const StatusIcon = ({ active, color }: StatusIconProps) => {
  const c = color ?? (active ? 'green' : 'gray')
  const colorMap = { green: '#52c41a', red: '#ff4d4f', gray: '#d9d9d9' }
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: colorMap[c],
        flexShrink: 0,
      }}
    />
  )
}
