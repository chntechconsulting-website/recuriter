export const parseSafeDate = (dateVal) => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return dateVal;
  let str = String(dateVal).trim();
  // If naive ISO string without timezone indicator (e.g. '2026-09-16 05:47:09' or '2026-09-16T05:47:09')
  if (!str.endsWith('Z') && !/[+-]\d{2}(:\d{2})?$/.test(str)) {
    str = str.replace(' ', 'T') + 'Z';
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date(dateVal) : d;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = parseSafeDate(dateStr);
    if (!d || isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = parseSafeDate(dateStr);
    if (!d || isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return dateStr;
  }
};

export const formatExactTime = (dateVal) => {
  const d = parseSafeDate(dateVal);
  if (!d || isNaN(d.getTime())) return '-';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
};

export const formatExactDate = (dateVal) => {
  const d = parseSafeDate(dateVal);
  if (!d || isNaN(d.getTime())) return '-';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = parseSafeDate(dateStr);
    if (!d || isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const diffSec = Math.floor((now - d) / 1000);

    if (diffSec < 60) return 'just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mins ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hrs ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} days ago`;
    return formatDate(dateStr);
  } catch {
    return dateStr;
  }
};
