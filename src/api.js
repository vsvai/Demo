const FETCH_TIMEOUT_MS = 15000;

export const FIX_QUALITY = {
  0: { label: 'NO_FIX', color: '#dc2626', tw: 'bg-error text-white' },
  1: { label: 'GNSS', color: '#9ca3af', tw: 'bg-gray-400 text-white' },
  2: { label: 'DGPS', color: '#2563eb', tw: 'bg-wifi text-white' },
  4: { label: 'RTK_FIXED', color: '#16a34a', tw: 'bg-accent text-white' },
  5: { label: 'RTK_FLOAT', color: '#d97706', tw: 'bg-warning text-white' },
};

export const DOMAINS = [
  { value: 'https://server2.sudoyantra.com', label: 'Server 2 (Default)' },
  { value: 'hpcl', label: 'HPCL Robot (a4f00f72f340)' },
  { value: 'carbantis', label: 'Carbantis' },
];

export const HpclRobots = {
  a4f00f72f340: 'HPREG Robot 1',
  b0cbd8c5fdc4: 'HPREG Robot 2',
};

function getConfig(selection) {
  const extraMacs = ['68fe71f7e8d4']
  if (selection === 'hpcl') {
    return { filterMacs: ['a4f00f72f340', 'b0cbd8c5fdc4'], extraMacs, queryParams: '?HPREG=1', title: 'HPREG Setup', apiBase: 'https://server2.sudoyantra.com' };
  }
  if (selection === 'carbantis') {
    return { filterMacs: ['ECE334197698'], extraMacs, queryParams: '?CARBANTIS=1', title: 'Robot Dashboard', apiBase: 'https://server2.sudoyantra.com' };
  }
  return { filterMacs: [], extraMacs, queryParams: '', title: 'Robot Dashboard', apiBase: selection };
}

export function getDomainConfig(selection) {
  return getConfig(selection);
}

export function buildApiBase(apiBase) {
  return apiBase;
}

function fetchWithTimeout(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(t));
}

function parseMacsResponse(text) {
  const t = text.trim();
  if (!t) return [];
  if (t.startsWith('[') || t.startsWith('{')) {
    try {
      const data = JSON.parse(t);
      if (Array.isArray(data)) return data;
      if (data.mac_ids && Array.isArray(data.mac_ids)) return data.mac_ids;
      return data.macs || data.robots || [];
    } catch (_) {}
  }
  return t.split(/[\r\n]+/).map((s) => s.trim()).filter(Boolean);
}

function parseJsonOrText(text) {
  const t = text.trim();
  if (t.startsWith('[') || t.startsWith('{')) {
    try {
      const data = JSON.parse(t);
      if (Array.isArray(data)) return { logs: data };
      if (data && typeof data.logs === 'object') return data;
      if (typeof data === 'string') return { logs: data.split(/[\r\n]+/).map((s) => s.trim()).filter(Boolean) };
      return { logs: [].concat(data) };
    } catch (_) {}
  }
  return { logs: t.split(/[\r\n]+/).map((s) => s.trim()).filter(Boolean) };
}

export async function fetchRobotsList(apiBase) {
  const url = apiBase + '/macs';
  const res = await fetchWithTimeout(url);
  const text = await res.text();
  if (!res.ok) throw new Error('Robots ' + res.status);
  const list = parseMacsResponse(text);
  return list.map((r) => (typeof r === 'string' ? r : r.mac ?? r.id ?? r)).filter(Boolean);
}

export async function fetchWifiMacsList(apiBase) {
  const url = apiBase + '/wifi_view/macs';
  const res = await fetchWithTimeout(url);
  const text = await res.text();
  if (!res.ok) throw new Error('Wi‑Fi list ' + res.status);
  const list = parseMacsResponse(text);
  return list.map((r) => (typeof r === 'string' ? r : r.mac ?? r.id ?? r)).filter(Boolean);
}

function isLogNotFound(text) {
  return /error:\s*log file.*not found/i.test(text);
}

export async function fetchLogs(apiBase, mac) {
  const viewPath = '/view/' + encodeURIComponent(mac);
  const logPath = '/' + encodeURIComponent(mac) + '/log';
  let res = await fetchWithTimeout(apiBase + viewPath);
  let text = await res.text();
  if (!res.ok) {
    res = await fetchWithTimeout(apiBase + logPath);
    text = await res.text();
  }
  if (!res.ok) throw new Error('Logs: ' + res.status);
  if (isLogNotFound(text)) return { logs: [] };
  return parseJsonOrText(text);
}

export async function fetchWifiLogs(apiBase, mac) {
  const viewPath = '/wifi_view/view/' + encodeURIComponent(mac);
  let res = await fetchWithTimeout(apiBase + viewPath);
  let text = await res.text();
  if (!res.ok) {
    const alt = '/wifi_view/' + encodeURIComponent(mac) + '/log';
    res = await fetchWithTimeout(apiBase + alt);
    text = await res.text();
  }
  if (!res.ok) throw new Error('Wi‑Fi logs: ' + res.status);
  if (isLogNotFound(text)) return { logs: [] };
  return parseJsonOrText(text);
}

export async function fetchUdpStatus(apiBase, mac) {
  const url = apiBase + '/udp/status/' + encodeURIComponent(mac);
  const res = await fetchWithTimeout(url);
  const text = await res.text();
  if (!res.ok) throw new Error('UDP status ' + res.status);
  try {
    const data = JSON.parse(text);
    return { mac: data.mac, udpReady: !!data.udp_ready, otaPending: !!data.ota_pending };
  } catch {
    return { mac: mac.toLowerCase(), udpReady: false, otaPending: false };
  }
}

export async function sendRobotCommand(apiBase, mac, command) {
  const url = apiBase + '/udp/start/' + encodeURIComponent(mac) + '/set/' + command;
  const res = await fetchWithTimeout(url);
  const text = await res.text();
  if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
  return text.trim() || 'OK';
}

export async function sendRobotStop(apiBase, mac) {
  const url = apiBase + '/udp/start/' + encodeURIComponent(mac) + '/set/stop';
  const res = await fetchWithTimeout(url);
  const text = await res.text();
  if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
  return text.trim() || 'OK';
}

export async function triggerOta(apiBase, mac) {
  const url = apiBase + '/udp/ota/' + encodeURIComponent(mac) + '/set';
  const res = await fetchWithTimeout(url);
  const text = await res.text();
  if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
  return text.trim() || 'OK';
}

export async function fetchTelemetry(apiBase, mac) {
  const url = apiBase + '/telemetry/' + encodeURIComponent(mac);
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error('Telemetry ' + res.status);
  return JSON.parse(await res.text());
}

export async function fetchTelemetrySettings(apiBase) {
  const url = apiBase + '/telemetry/settings';
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error('Telemetry settings ' + res.status);
  return JSON.parse(await res.text());
}

export async function sendWifiAction(apiBase, mac, kind, seconds) {
  const macLower = String(mac).toLowerCase();
  const path =
    kind === 'camera'
      ? '/wifi_api/start/' + encodeURIComponent(macLower) + '/set/' + seconds
      : '/wifi_api/wifi/' + encodeURIComponent(macLower) + '/set/' + seconds;
  const url = apiBase + path;
  const res = await fetchWithTimeout(url);
  const text = await res.text();
  if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
  return text.trim() || 'OK';
}

export async function fetchRtkPosition(apiBase) {
  const url = (apiBase || '') + '/udp/rtk/position';
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error('RTK ' + res.status);
  return JSON.parse(await res.text());
}

export async function fetchRtkStatus(apiBase) {
  const url = (apiBase || '') + '/udp/rtk/status';
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error('RTK status ' + res.status);
  return JSON.parse(await res.text());
}

export function parseGpsFromLogs(logs) {
  const positions = [];
  let block = null;
  for (const line of logs) {
    const text = typeof line === 'string' ? line : String(line.message ?? line.text ?? JSON.stringify(line));
    if (text.includes('ROVER POSITION')) { block = {}; continue; }
    if (block && text.trim() === '='.repeat(40)) {
      if (block.lat != null && block.lon != null) {
        positions.push(block);
      }
      block = null;
      continue;
    }
    if (block) {
      const m = text.match(/^(\w[\w\s]*?)\s*:\s*(.+)$/);
      if (m) {
        const key = m[1].trim().toLowerCase();
        const val = m[2].trim();
        if (key === 'latitude') block.lat = parseFloat(val) || null;
        else if (key === 'longitude') block.lon = parseFloat(val) || null;
        else if (key === 'altitude') block.alt = parseFloat(val) || null;
        else if (key === 'satellites') block.sat = parseInt(val, 10) || null;
        else if (key === 'hdop') block.hdop = parseFloat(val) || null;
        else if (key === 'fix quality') block.fix = parseInt(val, 10) ?? 0;
        else if (key === 'rtk status') block.fixStr = val;
        else if (key === 'mac') block.mac = val;
      }
    }
  }
  return positions;
}

// --- Log parsing ---

function logBracketZoneSuffix() {
  return 'Z';
}

function parseBracketLogLine(line) {
  const m = String(line).match(/^\[(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?)\]\s*(.*)$/);
  if (!m) return null;
  const iso = m[1] + 'T' + m[2] + logBracketZoneSuffix();
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return { date, rest: m[3] };
}

export function parseLogTime(raw) {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const d = new Date(raw < 1e12 ? raw * 1000 : raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const s = String(raw).trim();
  if (!s) return null;
  const asNum = Number(s);
  if (/^-?\d+(\.\d+)?$/.test(s) && Number.isFinite(asNum)) {
    const d = new Date(asNum < 1e12 ? asNum * 1000 : asNum);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const naiveIso = s.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?)$/);
  if (naiveIso) {
    const d = new Date(naiveIso[1] + 'T' + naiveIso[2] + logBracketZoneSuffix());
    if (!Number.isNaN(d.getTime())) return d;
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatGmtIstTags(date) {
  const gmtFmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const istFmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return {
    gmt: gmtFmt.format(date) + ' GMT',
    ist: istFmt.format(date) + ' IST',
  };
}

export function parseLogLine(line) {
  if (typeof line === 'string') {
    const br = parseBracketLogLine(line);
    if (br) return { date: br.date, body: br.rest, raw: line };
    return { date: null, body: line, raw: line };
  }
  const rawTime = line.timestamp ?? line.time ?? line.ts ?? line.created_at ?? line.date ?? '';
  let body = String(line.message ?? line.text ?? JSON.stringify(line));
  let parsed = parseLogTime(rawTime);
  if (!parsed) {
    const br = parseBracketLogLine(body);
    if (br) {
      parsed = br.date;
      body = br.rest;
    }
  }
  return { date: parsed, body, raw: rawTime !== '' && rawTime != null ? String(rawTime) : '' };
}

export function extractStatsFromLogs(logLines) {
  let totalRuns = 0;
  let lastRunTime = 'None';
  let lastBat = '--';
  let lastVer = '--';

  for (const line of logLines) {
    const text = typeof line === 'string' ? line : String(line.message ?? line.text ?? JSON.stringify(line));
    if (text.toLowerCase().includes('running_')) {
      totalRuns++;
      const timeMatchIST = text.match(/(\d{2}:\d{2}:\d{2})\s+IST/i);
      const timeMatchAny = text.match(/(\d{2}:\d{2}:\d{2})/);
      if (timeMatchIST) lastRunTime = timeMatchIST[1];
      else if (timeMatchAny) lastRunTime = timeMatchAny[1];
    }
    const adsMatch = text.match(/ADS value:\s*([\d.]+)/i);
    if (adsMatch) lastBat = adsMatch[1] + 'V';
    const verMatch = text.match(/Ver:\s*(\d+)/i);
    if (verMatch) lastVer = 'v' + verMatch[1];
  }

  return { totalRuns, lastRunTime, lastBat, lastVer };
}
