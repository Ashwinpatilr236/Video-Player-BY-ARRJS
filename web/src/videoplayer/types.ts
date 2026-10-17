export interface ChannelItem {
  id: string | number;
  name: string;
  url: string;
  logo?: string;
  group?: string;
  tvgId?: string;
  tvgName?: string;
  tvgChno?: string;
}

export type AspectRatio = 'contain' | 'cover' | 'fill';

export type InputMode = 'direct' | 'playlist-url' | 'playlist-file';

export interface SampleStream {
  name: string;
  type: 'direct' | 'hls' | 'playlist';
  url: string;
  description: string;
  format: string;
}

export interface XtreamCredentials {
  serverUrl: string;
  username: string;
  password: string;
}

export interface StalkerCredentials {
  portalUrl: string;
  macAddress: string;
}

export type IptvSourceType = 'remote' | 'local' | 'xtream' | 'stalker' | 'mock' | 'direct';

/**
 * Strips technical resolution/quality tags, codec info, and brackets
 * e.g. "Tears of Steel (1080p FHD)" -> "Tears of Steel"
 * e.g. "Big Buck Bunny [720p HD] [Geo-blocked]" -> "Big Buck Bunny"
 */
export const cleanChannelName = (name?: string): string => {
  if (!name) return 'Live Channel';
  return name
    .replace(/\s*[\(\[][^\)\]]*(?:1080p|720p|576p|480p|4k|2160p|fhd|uhd|hd|sd|fps|hevc|h\.?264|h\.?265)[^\)\]]*[\)\]]/gi, '')
    .replace(/\s*[\(\[]?(?:1080p|720p|576p|480p|4k|2160p|fhd|uhd|hd|sd)[\)\]]?/gi, '')
    .replace(/\s*\[Geo-blocked\]/gi, '')
    .replace(/[\(\)\[\]]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim() || 'Live Channel';
};

/**
 * Extracts resolution badge: 4K, FULL HD, HD, or SD
 */
export const getChannelQualityBadge = (name?: string): { badge: string; resText: string; is4K: boolean; isFHD: boolean; color: string } => {
  if (!name) return { badge: 'HD', resText: '720p', is4K: false, isFHD: false, color: 'text-cyan-400/90' };
  const match = name.match(/[\(\[]?([0-9]{3,4}p|4k|2160p|fhd|uhd|hd|sd)[\)\]]?/i);
  const tag = match ? match[1].toLowerCase() : 'hd';
  const is4K = tag === '4k' || tag === '2160p' || tag === 'uhd';
  const isFHD = tag === '1080p' || tag === 'fhd';
  const badge = is4K ? '4K' : isFHD ? 'FULL HD' : (tag === '576p' || tag === '480p' || tag === 'sd') ? 'SD' : 'HD';
  const resText = is4K ? '2160p' : isFHD ? '1080p' : '720p';
  const color = is4K ? 'text-amber-400' : isFHD ? 'text-emerald-400' : 'text-cyan-400/90';
  return { badge, resText, is4K, isFHD, color };
};

