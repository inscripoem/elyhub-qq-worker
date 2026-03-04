export const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'Never'
  return new Date(dateStr).toLocaleString()
}

export const formatTime = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '--:--:--'
  return new Date(dateStr).toLocaleTimeString()
}

export const getLevelTagColor = (level: string | undefined): string => {
  switch (level?.toLowerCase()) {
    case 'debug': return 'default'
    case 'info':  return 'blue'
    case 'warn':  return 'orange'
    case 'error': return 'red'
    default:      return 'default'
  }
}

export const getStateTagColor = (state: string | undefined): string => {
  switch (state) {
    case 'running': return 'success'
    case 'stopped': return 'warning'
    case 'error':   return 'error'
    default:        return 'default'
  }
}

export const getGroupStatusColor = (status: string | undefined): string => {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':  return 'success'
    case 'INVALID': return 'error'
    default:        return 'default'
  }
}
