import { ChannelItem, ProgramItem } from '../types';

export const DEMO_CHANNELS: ChannelItem[] = [
  {
    id: 115,
    channelNo: 115,
    name: 'Star Plus HD',
    group: 'Entertainment',
    isHd: true,
    logo: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=120&auto=format&fit=crop&q=80',
    url: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
    tvgId: 'star-plus-hd',
  },
  {
    id: 147,
    channelNo: 147,
    name: 'Colors HD',
    group: 'Entertainment',
    isHd: true,
    logo: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=120&auto=format&fit=crop&q=80',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    tvgId: 'colors-hd',
  },
  {
    id: 509,
    channelNo: 509,
    name: 'Aaj Tak',
    group: 'News',
    isHd: true,
    logo: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=120&auto=format&fit=crop&q=80',
    url: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
    tvgId: 'aaj-tak',
  },
  {
    id: 670,
    channelNo: 670,
    name: 'Pogo',
    group: 'Kids',
    isHd: false,
    logo: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=120&auto=format&fit=crop&q=80',
    url: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    tvgId: 'pogo',
  },
  {
    id: 302,
    channelNo: 302,
    name: 'Star Gold HD',
    group: 'Movies',
    isHd: true,
    logo: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=120&auto=format&fit=crop&q=80',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    tvgId: 'star-gold-hd',
  },
  {
    id: 401,
    channelNo: 401,
    name: 'Star Sports 1 HD',
    group: 'Sports',
    isHd: true,
    logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=120&auto=format&fit=crop&q=80',
    url: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
    tvgId: 'star-sports-1-hd',
  },
];

// Helper to generate realistic EPG timeline programs matching JioTV+ screenshot
export const getChannelSchedule = (channelNo: number, baseDate: Date = new Date()): ProgramItem[] => {
  const currentHour = baseDate.getHours();
  const makeTime = (hourOffset: number, minute: number) => {
    const d = new Date(baseDate);
    d.setHours(currentHour + hourOffset, minute, 0, 0);
    return d;
  };

  if (channelNo === 115) {
    // Star Plus HD
    return [
      {
        id: '115-1',
        title: 'Anupamaa',
        desc: 'Anupama faces unexpected family challenges and stays strong.',
        start: makeTime(0, 0),
        stop: makeTime(1, 0),
        poster: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=320&auto=format&fit=crop&q=80',
      },
      {
        id: '115-2',
        title: 'Jhanak',
        desc: 'A talented dancer fights against all odds to achieve her dreams.',
        start: makeTime(1, 0),
        stop: makeTime(2, 0),
      },
      {
        id: '115-3',
        title: 'Yeh Rishta Kya Kehlata Hai',
        desc: 'The journey of love, family traditions and relationship dynamics.',
        start: makeTime(2, 0),
        stop: makeTime(3, 0),
      },
      {
        id: '115-4',
        title: 'Saath Nibhaana Saathiya',
        desc: 'Classic family drama and memorable moments.',
        start: makeTime(3, 0),
        stop: makeTime(4, 0),
      },
    ];
  }

  if (channelNo === 147) {
    // Colors HD
    return [
      {
        id: '147-1',
        title: 'Mahadev & Sons',
        desc: 'A compelling family saga of modern relationships.',
        start: makeTime(0, 0),
        stop: makeTime(1, 0),
        poster: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=320&auto=format&fit=crop&q=80',
      },
      {
        id: '147-2',
        title: 'Laughter Chef',
        desc: 'Celebrity cooking challenge mixed with non-stop comedy.',
        start: makeTime(1, 0),
        stop: makeTime(1, 45),
      },
      {
        id: '147-3',
        title: 'Dr. Arambhi',
        desc: 'A dedicated doctor navigates medical mysteries.',
        start: makeTime(1, 45),
        stop: makeTime(3, 0),
      },
    ];
  }

  if (channelNo === 509) {
    // Aaj Tak
    return [
      {
        id: '509-1',
        title: 'Newsroom Live',
        desc: 'Breaking news and continuous reporting from across the country.',
        start: makeTime(0, 0),
        stop: makeTime(0, 30),
        poster: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=320&auto=format&fit=crop&q=80',
      },
      {
        id: '509-2',
        title: 'Ranbhoomi',
        desc: 'In-depth political analysis and ground zero debates.',
        start: makeTime(0, 30),
        stop: makeTime(1, 30),
      },
      {
        id: '509-3',
        title: 'Khabardar',
        desc: 'Investigative journalism exploring key national topics.',
        start: makeTime(1, 30),
        stop: makeTime(2, 30),
      },
      {
        id: '509-4',
        title: 'Halla Bol',
        desc: 'High decibel debate with top political spokespersons.',
        start: makeTime(2, 30),
        stop: makeTime(3, 30),
      },
    ];
  }

  if (channelNo === 670) {
    // Pogo
    return [
      {
        id: '670-1',
        title: 'Chhota Bheem',
        desc: 'Bheem and his friends protect Dholakpur from threats.',
        start: makeTime(0, 0),
        stop: makeTime(1, 0),
        poster: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=320&auto=format&fit=crop&q=80',
      },
      {
        id: '670-2',
        title: 'Smaashhing Simmba',
        desc: 'Young police officer Simmba fights mischievous criminals.',
        start: makeTime(1, 0),
        stop: makeTime(2, 0),
      },
      {
        id: '670-3',
        title: 'Omi No. 1',
        desc: 'Hilarious animated misadventures with Omi.',
        start: makeTime(2, 0),
        stop: makeTime(3, 0),
      },
    ];
  }

  // Default generic schedule
  return [
    {
      id: `${channelNo}-1`,
      title: 'Prime Time Live Broadcast',
      desc: 'Live high-definition entertainment stream.',
      start: makeTime(0, 0),
      stop: makeTime(1, 0),
    },
    {
      id: `${channelNo}-2`,
      title: 'Next Scheduled Feature',
      desc: 'Upcoming prime show and highlights.',
      start: makeTime(1, 0),
      stop: makeTime(2, 0),
    },
  ];
};
