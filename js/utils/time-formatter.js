// Relative time + mm:ss helper
function fmt(seconds) {
  if (isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60), s = Math.floor(seconds % 60);
  return m + ':' + (s < 10 ? '0' : '') + s;
}
function timeAgo(dateString) {
  if (!dateString) return t('time_just_now');
  const now = new Date();
  const past = new Date(dateString);
  const diffSec = Math.floor((now - past) / 1000);
  if (diffSec < 60) return t('time_just_now');
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return diffMin + t('time_m_ago');
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return diffHour + t('time_h_ago');
  const diffDay = Math.floor(diffHour / 24);
  return diffDay + t('time_d_ago');
}

