import { ChannelItem, XtreamCredentials } from '../types';
import { parseM3u } from './m3uParser';

export const fetchXtreamChannels = async (creds: XtreamCredentials): Promise<ChannelItem[]> => {
  let base = creds.serverUrl.trim().replace(/\/+$/, '');
  if (!base.startsWith('http://') && !base.startsWith('https://')) {
    base = 'http://' + base;
  }

  const u = encodeURIComponent(creds.username.trim());
  const p = encodeURIComponent(creds.password.trim());
  const m3uUrl = `${base}/get.php?username=${u}&password=${p}&type=m3u_plus&output=m3u8`;

  // Fetch with fallback proxy
  let resText = '';
  try {
    const res = await fetch(m3uUrl);
    if (res.ok) {
      resText = await res.text();
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch {
    // Retry via backend CORS proxy
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(m3uUrl)}`;
    const pRes = await fetch(proxyUrl);
    if (!pRes.ok) throw new Error('Xtream server connection failed. Check server URL or credentials.');
    resText = await pRes.text();
  }

  const parsed = parseM3u(resText);
  if (parsed.length === 0) {
    throw new Error('No channels returned by Xtream server.');
  }

  return parsed;
};
