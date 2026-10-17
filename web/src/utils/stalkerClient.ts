import { ChannelItem, StalkerCredentials } from '../types';

export const formatMacAddress = (input: string): string => {
  const clean = input.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
  const chunks: string[] = [];
  for (let i = 0; i < clean.length && i < 12; i += 2) {
    chunks.push(clean.slice(i, i + 2));
  }
  return chunks.join(':');
};

export const isValidMacAddress = (mac: string): boolean => {
  return /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(mac);
};

export const fetchStalkerChannels = async (creds: StalkerCredentials): Promise<ChannelItem[]> => {
  let base = creds.portalUrl.trim().replace(/\/+$/, '');
  if (!base.startsWith('http://') && !base.startsWith('https://')) {
    base = 'http://' + base;
  }

  const formattedMac = formatMacAddress(creds.macAddress);
  if (!isValidMacAddress(formattedMac)) {
    throw new Error('Invalid MAC address format (Expected format: 00:1A:79:XX:XX:XX)');
  }

  const endpoint = `${base}/server/load.php?type=itv&action=get_all_channels`;
  const headers = {
    'User-Agent': 'Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG250 stbapp ver: 2 rev: 250 Safari/533.3',
    'Cookie': `mac=${encodeURIComponent(formattedMac)}; stb_lang=en; timezone=GMT`,
  };

  let data: any = null;
  try {
    const res = await fetch(endpoint, { headers });
    data = await res.json();
  } catch {
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(endpoint)}`;
    const pRes = await fetch(proxyUrl, { headers });
    if (!pRes.ok) throw new Error('Stalker Portal authentication failed. Check portal URL and MAC address.');
    data = await pRes.json();
  }

  const rawList = data?.js?.data || data?.data || [];
  if (!Array.isArray(rawList) || rawList.length === 0) {
    throw new Error('No channels returned by Stalker Portal.');
  }

  return rawList.map((ch: any, idx: number) => ({
    id: ch.id || idx + 1,
    channelNo: parseInt(ch.number || ch.ch_id || idx + 1, 10),
    name: ch.name || `Channel ${idx + 1}`,
    url: ch.cmd || ch.url || '',
    logo: ch.logo ? (ch.logo.startsWith('http') ? ch.logo : `${base}/${ch.logo}`) : undefined,
    group: ch.tv_genre_id || 'General',
    isHd: /hd|fhd|4k/i.test(ch.name || ''),
  }));
};
