export function parseXMLTV(xmlString) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");
  
  const programmes = xmlDoc.getElementsByTagName("programme");
  const epgData = {}; // Map of channel id to array of programs

  for (let i = 0; i < programmes.length; i++) {
    const prog = programmes[i];
    const channelId = prog.getAttribute("channel");
    
    // Parse timestamps (format: YYYYMMDDHHMMSS +ZZZZ)
    const startRaw = prog.getAttribute("start");
    const stopRaw = prog.getAttribute("stop");
    
    if (!channelId || !startRaw || !stopRaw) continue;

    const titleNode = prog.getElementsByTagName("title")[0];
    const descNode = prog.getElementsByTagName("desc")[0];
    const iconNode = prog.getElementsByTagName("icon")[0];

    const title = titleNode ? titleNode.textContent : "Unknown Program";
    const desc = descNode ? descNode.textContent : "";
    const poster = iconNode ? iconNode.getAttribute("src") : null;

    if (!epgData[channelId]) {
      epgData[channelId] = [];
    }
    
    epgData[channelId].push({
      start: parseXmltvDate(startRaw),
      stop: parseXmltvDate(stopRaw),
      title: title,
      desc: desc,
      poster: poster
    });
  }

  // Sort programs for each channel by start time
  for (const channelId in epgData) {
    epgData[channelId].sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  return epgData;
}

function parseXmltvDate(dateStr) {
  // e.g. "20231015090000 +0000" or "20231015090000"
  if (!dateStr || dateStr.length < 14) return new Date();
  
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1; // 0-indexed
  const day = parseInt(dateStr.substring(6, 8));
  const hour = parseInt(dateStr.substring(8, 10));
  const minute = parseInt(dateStr.substring(10, 12));
  const second = parseInt(dateStr.substring(12, 14));
  
  // Quick hack: Ignore timezone offset for now and just parse as local time
  // Better implementation would apply the +0000 offset properly
  return new Date(year, month, day, hour, minute, second);
}
