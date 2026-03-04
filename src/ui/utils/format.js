export const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString();
};

export const formatTime = (dateStr) => {
    if (!dateStr) return '--:--:--';
    return new Date(dateStr).toLocaleTimeString();
};

export const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
        case 'debug': return 'bg-gray-100 text-gray-600';
        case 'info':  return 'bg-blue-100 text-blue-700';
        case 'warn':  return 'bg-yellow-100 text-yellow-700';
        case 'error': return 'bg-red-100 text-red-700';
        default:      return 'bg-gray-100 text-gray-600';
    }
};

export const getStateBadgeColor = (state) => {
    switch (state) {
        case 'running': return 'bg-green-100 text-green-700 border border-green-200';
        case 'stopped': return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
        case 'error':   return 'bg-red-100 text-red-700 border border-red-200';
        default:        return 'bg-gray-100 text-gray-600 border border-gray-200';
    }
};

export const getGroupStatusColor = (status) => {
    switch (status?.toUpperCase()) {
        case 'ACTIVE':  return 'bg-green-50 text-green-700';
        case 'INVALID': return 'bg-red-50 text-red-600';
        default:        return 'bg-gray-50 text-gray-500';
    }
};
