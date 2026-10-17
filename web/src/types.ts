export interface ProgramItem {
  id: string;
  title: string;
  desc?: string;
  start: Date;
  stop: Date;
  category?: string;
  poster?: string;
}

export interface ChannelItem {
  id: string | number;
  channelNo: number;
  name: string;
  url: string;
  logo?: string;
  group?: string;
  tvgId?: string;
  isHd?: boolean;
}

export type IptvSourceType = 'demo' | 'm3u' | 'xtream' | 'stalker';

export interface XtreamCredentials {
  serverUrl: string;
  username: string;
  password: string;
}

export interface StalkerCredentials {
  portalUrl: string;
  macAddress: string;
}
