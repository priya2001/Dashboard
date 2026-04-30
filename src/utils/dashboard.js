export const PAGE_SIZE = 20;

export const PALETTE = [
  '#00d4ff', '#ff6b35', '#00ff88', '#f7c948', '#c084fc',
  '#38bdf8', '#fb923c', '#34d399', '#facc15', '#a78bfa',
  '#0ea5e9', '#f97316', '#10b981', '#eab308', '#8b5cf6',
  '#06b6d4', '#ef4444', '#22c55e', '#f59e0b', '#6366f1',
];

export const STATUS_COLORS = {
  active: '#00ff88',
  inactive: '#ff6b35',
  permit: '#f7c948',
  plugged: '#ff4444',
  pa: '#ff4444',
  'approved permit': '#f7c948',
};

export function statusColor(status) {
  if (!status) return '#7a9cc5';
  const lower = status.toLowerCase();
  for (const [key, value] of Object.entries(STATUS_COLORS)) {
    if (lower.includes(key)) return value;
  }
  return '#c084fc';
}

export function distinctColor(index) {
  const hue = (index * 137.508) % 360;
  return `hsl(${hue} 88% 58%)`;
}

export function stackedStatusColor(index) {
  const hue = (index * 29) % 360;
  return `hsl(${hue} 92% 62%)`;
}

export function statusClass(status) {
  if (!status) return 'status-other';
  const lower = status.toLowerCase();
  if (lower.includes('active') && !lower.includes('in')) return 'status-active';
  if (lower.includes('inactive')) return 'status-inactive';
  if (lower.includes('permit')) return 'status-permit';
  if (lower.includes('plug') || lower.includes('pa')) return 'status-plugged';
  return 'status-other';
}

export function normalizeWellData(rows) {
  if (!rows?.length) return [];

  const aliases = {
    Operator: ['operator', 'operatorname', 'company', 'companyname', 'leaseoperator', 'owner', 'producer', 'vendor'],
    'Well Type': ['welltype', 'type', 'classification', 'category', 'wellclass', 'wellclassification'],
    'Well Status': ['wellstatus', 'status', 'activity', 'state', 'condition', 'operationalstatus'],
    County: ['county', 'parish', 'district', 'region', 'area', 'location'],
    Api: ['api', 'apino', 'apinumber', 'wellid', 'id', 'recordid', 'wellnumber'],
  };

  const normalizeKey = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const headerMap = {};
  const keys = Object.keys(rows[0]);
  const usedKeys = new Set();

  Object.entries(aliases).forEach(([field, patterns]) => {
    const matchedKey = keys.find((key) => {
      const normalized = normalizeKey(key);
      return patterns.some((pattern) => normalized.includes(pattern));
    });

    if (matchedKey) {
      headerMap[field] = matchedKey;
      usedKeys.add(matchedKey);
    }
  });

  const fallbackOrder = keys.filter((key) => !usedKeys.has(key));
  ['Operator', 'Well Type', 'Well Status', 'County', 'Api'].forEach((field, index) => {
    if (!headerMap[field] && fallbackOrder[index]) {
      headerMap[field] = fallbackOrder[index];
      usedKeys.add(fallbackOrder[index]);
    }
  });

  return rows.map((row) => ({
    Operator: String(row[headerMap.Operator] || '').trim() || 'Unknown',
    'Well Type': String(row[headerMap['Well Type']] || '').trim() || 'Unknown',
    'Well Status': String(row[headerMap['Well Status']] || '').trim() || 'Unknown',
    County: String(row[headerMap.County] || '').trim() || 'Unknown',
    Api: String(row[headerMap.Api] || '').trim(),
  }));
}

export function frequency(data, key) {
  const counts = {};
  data.forEach((row) => {
    const value = row[key] || 'Unknown';
    counts[value] = (counts[value] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

export function isActiveStatus(status) {
  const lower = String(status || '').toLowerCase();
  return lower.includes('active') && !lower.includes('inactive');
}

export function isInactiveStatus(status) {
  const lower = String(status || '').toLowerCase();
  return lower.includes('inactive') || lower.includes('plug') || lower.includes(' pa') || lower === 'pa';
}
