export function parseM3u(content) {
  const lines = content.split('\n');
  const channels = [];
  let currentChannel = null;

  lines.forEach((line) => {
    line = line.trim();
    if (line.startsWith('#EXTINF:')) {
      currentChannel = {
        id: channels.length + 1,
        name: 'Unknown Channel',
        logo: 'https://via.placeholder.com/60/333333/FFFFFF?text=TV',
        group: 'All',
        url: '',
        tvgId: ''
      };

      // Extract tvg-id
      const idMatch = line.match(/tvg-id="([^"]+)"/);
      if (idMatch && idMatch[1]) {
        currentChannel.tvgId = idMatch[1];
      }

      // Extract logo
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      if (logoMatch && logoMatch[1]) {
        currentChannel.logo = logoMatch[1];
      }

      // Extract group
      const groupMatch = line.match(/group-title="([^"]+)"/);
      if (groupMatch && groupMatch[1]) {
        currentChannel.group = groupMatch[1];
      }

      // Extract name (usually after the last comma)
      const commaIndex = line.lastIndexOf(',');
      if (commaIndex !== -1) {
        currentChannel.name = line.substring(commaIndex + 1).trim();
      }

    } else if (line.startsWith('http') && currentChannel) {
      currentChannel.url = line;
      channels.push(currentChannel);
      currentChannel = null;
    }
  });

  return channels;
}
