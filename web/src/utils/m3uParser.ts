import { ChannelItem } from '../types';

export const parseM3u = (content: string): ChannelItem[] => {
  const lines = content.split(/\r?\n/);
  const channels: ChannelItem[] = [];
  let currentChannel: Partial<ChannelItem> | null = null;
  let counter = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      currentChannel = {};
      
      // Extract tvg-chno or tvg-id
      const chnoMatch = line.match(/tvg-chno="([^"]+)"/i);
      const chNo = chnoMatch ? parseInt(chnoMatch[1], 10) : counter;
      currentChannel.channelNo = !isNaN(chNo) ? chNo : counter;

      // Extract logo
      const logoMatch = line.match(/tvg-logo="([^"]+)"/i);
      if (logoMatch) currentChannel.logo = logoMatch[1];

      // Extract group
      const groupMatch = line.match(/group-title="([^"]+)"/i);
      currentChannel.group = groupMatch ? groupMatch[1].trim() : 'General';

      // Extract tvg-id
      const idMatch = line.match(/tvg-id="([^"]+)"/i);
      if (idMatch) currentChannel.tvgId = idMatch[1];

      // Extract channel name (after last comma)
      const commaIdx = line.lastIndexOf(',');
      let rawName = commaIdx !== -1 ? line.substring(commaIdx + 1).trim() : `Channel ${counter}`;
      currentChannel.name = rawName;
      currentChannel.isHd = /hd|fhd|4k|1080p|720p/i.test(rawName);
      currentChannel.id = currentChannel.channelNo;
    } else if (!line.startsWith('#') && currentChannel) {
      currentChannel.url = line;
      if (currentChannel.name && currentChannel.url) {
        channels.push(currentChannel as ChannelItem);
        counter++;
      }
      currentChannel = null;
    }
  }

  return channels;
};
