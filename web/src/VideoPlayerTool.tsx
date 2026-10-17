import React, { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import VideoPlayer from './videoplayer/VideoPlayer';
import { JioTvLiveBanner } from './videoplayer/JioTvLiveBanner';
import { JioTvChannelGuide } from './videoplayer/JioTvChannelGuide';
import { IptvSettingsModal } from './videoplayer/IptvSettingsModal';
import { IptvDthZappingOverlay } from './videoplayer/IptvDthZappingOverlay';
import { IptvVolumeOsd } from './videoplayer/IptvVolumeOsd';
import { IptvPlayerSettingsOverlay } from './videoplayer/IptvPlayerSettingsOverlay';
import { saveStoredChannels, loadStoredChannels, clearStoredChannels } from './videoplayer/channelStorage';
import { parseM3u } from './videoplayer/m3uParser';
import { parseXMLTV, EpgDataMap } from './videoplayer/epgParser';
import {
  ChannelItem,
  AspectRatio,
  SampleStream,
  XtreamCredentials,
  StalkerCredentials,
  IptvSourceType,
  cleanChannelName,
  getChannelQualityBadge,
} from './videoplayer/types';
import { fetchXtreamChannels } from './videoplayer/xtreamClient';
import { fetchStalkerChannels } from './videoplayer/stalkerClient';
import { isTvBackKey } from './videoplayer/useSpatialNavigation';
import './videoplayer/iptvStyles.css';

// Default authentic public test channels
const DEFAULT_MOCK_CHANNELS: ChannelItem[] = [
  {
    id: 1,
    name: 'Akamai Master Live (1080p FHD)',
    logo: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=120&auto=format&fit=crop&q=80',
    url: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
    group: 'Live Broadcast',
    tvgId: 'akamai-live',
  },
  {
    id: 2,
    name: 'Big Buck Bunny (1080p FHD)',
    logo: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=120&auto=format&fit=crop&q=80',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    group: 'Animation & Cinema',
    tvgId: 'big-buck-bunny',
  },
  {
    id: 3,
    name: 'Sintel 4K Cinema Broadcast',
    logo: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=120&auto=format&fit=crop&q=80',
    url: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    group: 'Cinema & 4K',
    tvgId: 'sintel-4k',
  },
  {
    id: 4,
    name: 'Blender Open Studio (1080p FHD)',
    logo: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=120&auto=format&fit=crop&q=80',
    url: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
    group: 'Animation & Cinema',
    tvgId: 'blender-studio',
  },
];

const SAMPLE_IPTV_STREAMS: SampleStream[] = [
  {
    name: 'Akamai Master Live (1080p FHD)',
    type: 'hls',
    url: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
    description: 'High definition pristine broadcast live stream in 1080p',
    format: 'HLS .m3u8',
  },
  {
    name: 'Big Buck Bunny (Multi-Bitrate HLS)',
    type: 'hls',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    description: 'Mux adaptive bitrate multi-resolution test stream',
    format: 'HLS .m3u8',
  },
  {
    name: 'Sintel Open Movie (Akamai HLS)',
    type: 'hls',
    url: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    description: 'Blender Foundation animated feature stream with alternate audio',
    format: 'HLS .m3u8',
  },
  {
    name: 'Akamai Multi-Bitrate Benchmark Stream',
    type: 'hls',
    url: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
    description: 'Akamai live HLS test stream across multiple resolution profiles',
    format: 'HLS .m3u8',
  },
];

// Helper to compute dynamic program schedule
const getChannelEpgSchedule = (
  channel: ChannelItem,
  clockTime: Date,
  epgData: EpgDataMap
) => {
  if (channel.tvgId && epgData[channel.tvgId] && epgData[channel.tvgId].length > 0) {
    const list = epgData[channel.tvgId];
    const nowMs = clockTime.getTime();
    const currentIdx = list.findIndex((p) => nowMs >= p.start.getTime() && nowMs < p.stop.getTime());

    if (currentIdx !== -1) {
      const curr = list[currentIdx];
      const startMs = curr.start.getTime();
      const stopMs = curr.stop.getTime();
      const totalDuration = Math.max(1, stopMs - startMs);
      const elapsed = Math.max(0, nowMs - startMs);
      const progressPercent = Math.min(100, Math.max(5, Math.round((elapsed / totalDuration) * 100)));
      const remainingMins = Math.max(1, Math.round((stopMs - nowMs) / 60000));
      const nextProg = list[currentIdx + 1];
      const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

      return {
        currentTitle: curr.title,
        currentDesc: curr.desc || `${cleanChannelName(channel.name)} broadcast`,
        timeSlotText: `${formatTime(curr.start)} - ${formatTime(curr.stop)}`,
        timeLeftText: `${remainingMins}m left`,
        progressPercent,
        nextTitle: nextProg ? nextProg.title : 'Upcoming Scheduled Feature',
        nextTimeText: nextProg ? formatTime(nextProg.start) : formatTime(curr.stop),
      };
    }
  }

  const cleanChanName = cleanChannelName(channel.name);
  const now = clockTime;
  const minutes = now.getMinutes();
  const isSecondHalf = minutes >= 30;

  const slotStart = new Date(now);
  slotStart.setMinutes(isSecondHalf ? 30 : 0, 0, 0);

  const slotEnd = new Date(slotStart);
  slotEnd.setMinutes(slotStart.getMinutes() + (channel.group?.toLowerCase().includes('movie') ? 60 : 30));

  const totalMs = Math.max(1, slotEnd.getTime() - slotStart.getTime());
  const elapsedMs = Math.max(0, now.getTime() - slotStart.getTime());
  const progressPercent = Math.min(100, Math.max(5, Math.round((elapsedMs / totalMs) * 100)));
  const remainingMins = Math.max(1, Math.round((slotEnd.getTime() - now.getTime()) / 60000));
  const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

  const grp = (channel.group || '').toLowerCase();
  let currentTitle = `${cleanChanName} Prime Broadcast`;
  let nextTitle = `${cleanChanName} Highlights & Analysis`;

  if (grp.includes('news')) {
    currentTitle = isSecondHalf ? 'Headlines @ The Hour' : 'Prime Debate & World News';
    nextTitle = isSecondHalf ? 'The Nation Tonight' : 'Special Ground Report';
  } else if (grp.includes('sport')) {
    currentTitle = isSecondHalf ? 'Matchday Live: Pre-Match Special' : 'Championship Live Match';
    nextTitle = 'Post-Match Analysis & Highlights';
  } else if (grp.includes('movie')) {
    currentTitle = 'Mega Blockbuster: World Television Premiere';
    nextTitle = 'Late Night Cinema Special';
  } else if (grp.includes('music')) {
    currentTitle = isSecondHalf ? 'Top 20 Countdown' : 'Non-Stop Hit Beats';
    nextTitle = 'Late Night Acoustic Sessions';
  } else if (grp.includes('kids')) {
    currentTitle = 'Adventures in Animation';
    nextTitle = 'Super Toon Fiesta';
  }

  return {
    currentTitle,
    currentDesc: `Streaming live broadcast on ${cleanChanName}. Video Player by ARRJS.`,
    timeSlotText: `${formatTime(slotStart)} - ${formatTime(slotEnd)}`,
    timeLeftText: `${remainingMins}m left`,
    progressPercent,
    nextTitle,
    nextTimeText: formatTime(slotEnd),
  };
};

interface VideoPlayerToolProps {
  onExitToHome?: () => void;
}

export const VideoPlayerTool: React.FC<VideoPlayerToolProps> = ({ onExitToHome }) => {
  // Main channels state
  const [channels, setChannels] = useState<ChannelItem[]>(DEFAULT_MOCK_CHANNELS);
  const [activeChannel, setActiveChannel] = useState<number>(0);
  const [playingChannelData, setPlayingChannelData] = useState<ChannelItem | null>(DEFAULT_MOCK_CHANNELS[0]);

  // Load cached channels from IndexedDB on initial mount
  useEffect(() => {
    loadStoredChannels().then((cached) => {
      if (cached && cached.length > 0) {
        setChannels(cached);
        setPlayingChannelData(cached[0]);
      }
    });
  }, []);

  // Favorites
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('arrjs_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // EPG & IPTV Source Configuration
  const [playlistUrl, setPlaylistUrl] = useState<string>(() => {
    return localStorage.getItem('iptv_playlist_url') || '';
  });
  const [epgUrl, setEpgUrl] = useState<string>(() => {
    return localStorage.getItem('iptv_epg_url') || '';
  });
  const [sourceName, setSourceName] = useState<string>(() => {
    return localStorage.getItem('iptv_source_name') || '';
  });
  const [sourceType, setSourceType] = useState<IptvSourceType>(() => {
    return (localStorage.getItem('iptv_source_type') as IptvSourceType) || 'mock';
  });
  const [xtreamCredentials, setXtreamCredentials] = useState<XtreamCredentials | null>(() => {
    const s = localStorage.getItem('iptv_xtream_server');
    const u = localStorage.getItem('iptv_xtream_user');
    const p = localStorage.getItem('iptv_xtream_pass');
    return s && u && p ? { serverUrl: s, username: u, password: p } : null;
  });
  const [stalkerCredentials, setStalkerCredentials] = useState<StalkerCredentials | null>(() => {
    const url = localStorage.getItem('iptv_stalker_url');
    const mac = localStorage.getItem('iptv_stalker_mac');
    return url && mac ? { portalUrl: url, macAddress: mac } : null;
  });

  const [epgData, setEpgData] = useState<EpgDataMap>({});
  const [loading, setLoading] = useState<boolean>(false);

  // UI Overlays state
  const [showBanner, setShowBanner] = useState<boolean>(true);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showPlayerSettings, setShowPlayerSettings] = useState<boolean>(false);
  const [showExitToast, setShowExitToast] = useState<boolean>(false);

  // Playback & Sound State
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('cover');
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showVolumeOsd, setShowVolumeOsd] = useState<boolean>(false);

  // Clock
  const [clockTime, setClockTime] = useState<Date>(new Date());
  useEffect(() => {
    const interval = setInterval(() => setClockTime(new Date()), 10000);
    return () => clearInterval(interval);
  }, []);

  // Player & HLS Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [videoLevels, setVideoLevels] = useState<{ height: number; bitrate?: number }[]>([]);
  const [audioTracks, setAudioTracks] = useState<{ id: number; name?: string; language?: string }[]>([]);
  const [currentVideoLevel, setCurrentVideoLevel] = useState<number>(-1);
  const [currentAudioTrack, setCurrentAudioTrack] = useState<number>(-1);

  // Timers
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const volumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const zappingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Direct Channel Zapping Digits
  const [typedChannelNumber, setTypedChannelNumber] = useState<string>('');

  // Auto-hide Banner Trigger (Slide down after 3.5s of inactivity)
  const triggerBanner = useCallback((durationMs = 3500) => {
    setShowBanner(true);
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = setTimeout(() => {
      setShowBanner(false);
    }, durationMs);
  }, []);

  // Show banner on initial mount
  useEffect(() => {
    triggerBanner(4500);
    return () => {
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
      if (volumeTimerRef.current) clearTimeout(volumeTimerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      if (zappingTimerRef.current) clearTimeout(zappingTimerRef.current);
    };
  }, [triggerBanner]);

  // Channel Change handler
  const handleSelectChannel = useCallback(
    (index: number) => {
      if (index < 0 || index >= channels.length) return;
      setActiveChannel(index);
      setPlayingChannelData(channels[index]);
      triggerBanner(3500);
    },
    [channels, triggerBanner]
  );

  // Next / Previous Channel
  const handleNextChannel = useCallback(() => {
    if (channels.length === 0) return;
    const nextIdx = (activeChannel + 1) % channels.length;
    handleSelectChannel(nextIdx);
  }, [activeChannel, channels.length, handleSelectChannel]);

  const handlePrevChannel = useCallback(() => {
    if (channels.length === 0) return;
    const prevIdx = (activeChannel - 1 + channels.length) % channels.length;
    handleSelectChannel(prevIdx);
  }, [activeChannel, channels.length, handleSelectChannel]);

  // Favorite toggle
  const handleToggleFavorite = useCallback(
    (channelName: string) => {
      setFavorites((prev) => {
        const next = prev.includes(channelName)
          ? prev.filter((name) => name !== channelName)
          : [...prev, channelName];
        try {
          localStorage.setItem('arrjs_favorites', JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    []
  );

  // Volume adjustments
  const handleVolumeChange = useCallback((delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    const newVol = Math.min(1, Math.max(0, Math.round((video.volume + delta) * 100) / 100));
    video.volume = newVol;
    setVolume(newVol);
    setIsMuted(newVol === 0);
    setShowVolumeOsd(true);
    if (volumeTimerRef.current) clearTimeout(volumeTimerRef.current);
    volumeTimerRef.current = setTimeout(() => setShowVolumeOsd(false), 2000);
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      const el = containerRef.current || document.documentElement;
      el.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  }, []);

  // Play / Pause toggle
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
    triggerBanner(3500);
  }, [triggerBanner]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Keyboard navigation & remote controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input field
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      // 1. Back button handling
      if (isTvBackKey(e) || e.key === 'Escape') {
        e.preventDefault();
        if (showSettings) {
          setShowSettings(false);
          return;
        }
        if (showPlayerSettings) {
          setShowPlayerSettings(false);
          return;
        }
        if (showGuide) {
          setShowGuide(false);
          return;
        }

        // Accidental exit prevention
        if (showExitToast) {
          setShowExitToast(false);
          if (onExitToHome) {
            onExitToHome();
          } else {
            window.location.href = '/';
          }
        } else {
          setShowExitToast(true);
          if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
          exitTimerRef.current = setTimeout(() => setShowExitToast(false), 3500);
        }
        return;
      }

      // 2. Direct Numeric Channel Zapping (0-9)
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        const nextDigits = typedChannelNumber + e.key;
        setTypedChannelNumber(nextDigits);
        if (zappingTimerRef.current) clearTimeout(zappingTimerRef.current);
        zappingTimerRef.current = setTimeout(() => {
          const chNo = parseInt(nextDigits, 10);
          if (!isNaN(chNo)) {
            // Find channel with matching number or index
            const targetIdx = channels.findIndex((_, idx) => idx + 1 === chNo);
            if (targetIdx !== -1) {
              handleSelectChannel(targetIdx);
            }
          }
          setTypedChannelNumber('');
        }, 1200);
        return;
      }

      // 3. Guide shortcut (G or Left Arrow)
      if (e.key === 'g' || e.key === 'G' || (e.key === 'ArrowLeft' && !showGuide)) {
        e.preventDefault();
        setShowGuide((prev) => !prev);
        return;
      }

      // 4. Channel Up / Down
      if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrevChannel();
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        handleNextChannel();
        return;
      }

      // 5. Volume controls (+ / -)
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleVolumeChange(0.05);
        return;
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleVolumeChange(-0.05);
        return;
      }

      // 6. Play / Pause & Banner on Space / Enter
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (e.key === ' ') {
          togglePlay();
        } else {
          triggerBanner(3500);
        }
        return;
      }

      // 7. Fullscreen (F)
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
        return;
      }

      // 8. Settings (S)
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setShowSettings(true);
        return;
      }

      // 9. Player Settings (O)
      if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        setShowPlayerSettings((prev) => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    channels,
    activeChannel,
    showGuide,
    showSettings,
    showPlayerSettings,
    showExitToast,
    typedChannelNumber,
    handleSelectChannel,
    handleNextChannel,
    handlePrevChannel,
    handleVolumeChange,
    togglePlay,
    toggleFullscreen,
    triggerBanner,
    onExitToHome,
  ]);

  // Playlist Loading Functions
  const handleSavePlaylistUrl = async (url: string) => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(url);
      const text = await res.text();
      const parsed = parseM3u(text);
      if (parsed.length > 0) {
        setChannels(parsed);
        saveStoredChannels(parsed);
        setPlaylistUrl(url);
        localStorage.setItem('iptv_playlist_url', url);
        setSourceType('remote');
        localStorage.setItem('iptv_source_type', 'remote');
        setSourceName(url.split('/').pop() || 'Remote M3U');
        localStorage.setItem('iptv_source_name', url.split('/').pop() || 'Remote M3U');
        handleSelectChannel(0);
        setShowSettings(false);
      }
    } catch (err) {
      console.error('Failed to load M3U URL:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadLocalFile = (content: string, fileName: string) => {
    const parsed = parseM3u(content);
    if (parsed.length > 0) {
      setChannels(parsed);
      saveStoredChannels(parsed);
      setSourceType('local');
      localStorage.setItem('iptv_source_type', 'local');
      setSourceName(fileName);
      localStorage.setItem('iptv_source_name', fileName);
      handleSelectChannel(0);
      setShowSettings(false);
    }
  };

  const handleClearPlaylist = () => {
    clearStoredChannels();
    setChannels(DEFAULT_MOCK_CHANNELS);
    setPlaylistUrl('');
    localStorage.removeItem('iptv_playlist_url');
    localStorage.removeItem('iptv_source_type');
    localStorage.removeItem('iptv_source_name');
    setSourceType('mock');
    handleSelectChannel(0);
  };

  const handleLoginXtream = async (server: string, user: string, pass: string) => {
    setLoading(true);
    try {
      const res = await fetchXtreamChannels(server, user, pass);
      if (res.success && res.channels.length > 0) {
        setChannels(res.channels);
        saveStoredChannels(res.channels);
        setXtreamCredentials({ serverUrl: server, username: user, password: pass });
        localStorage.setItem('iptv_xtream_server', server);
        localStorage.setItem('iptv_xtream_user', user);
        localStorage.setItem('iptv_xtream_pass', pass);
        setSourceType('xtream');
        localStorage.setItem('iptv_source_type', 'xtream');
        setSourceName(`Xtream: ${user}`);
        localStorage.setItem('iptv_source_name', `Xtream: ${user}`);
        handleSelectChannel(0);
        setShowSettings(false);
      }
    } catch (e) {
      console.error('Xtream login error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginStalker = async (portalUrl: string, macAddress: string) => {
    setLoading(true);
    try {
      const res = await fetchStalkerChannels(portalUrl, macAddress);
      if (res.success && res.channels.length > 0) {
        setChannels(res.channels);
        saveStoredChannels(res.channels);
        setStalkerCredentials({ portalUrl, macAddress });
        localStorage.setItem('iptv_stalker_url', portalUrl);
        localStorage.setItem('iptv_stalker_mac', macAddress);
        setSourceType('stalker');
        localStorage.setItem('iptv_source_type', 'stalker');
        setSourceName(`Stalker: ${macAddress}`);
        localStorage.setItem('iptv_source_name', `Stalker: ${macAddress}`);
        handleSelectChannel(0);
        setShowSettings(false);
      }
    } catch (e) {
      console.error('Stalker portal error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSampleStream = (sample: SampleStream) => {
    const singleChannel: ChannelItem = {
      id: 1,
      name: sample.name,
      url: sample.url,
      group: 'Test Stream',
    };
    setChannels([singleChannel]);
    handleSelectChannel(0);
    setShowSettings(false);
  };

  const handlePlayDirectUrl = (url: string, name: string) => {
    const directChannel: ChannelItem = {
      id: 1,
      name: name || 'Direct Stream',
      url,
      group: 'Direct',
    };
    setChannels([directChannel]);
    handleSelectChannel(0);
    setShowSettings(false);
  };

  const handleSaveEpgUrl = (url: string) => {
    setEpgUrl(url);
    localStorage.setItem('iptv_epg_url', url);
  };

  // EPG data for active channel
  const currentChannel = playingChannelData || channels[activeChannel] || null;
  const isCurrentFavorite = currentChannel ? favorites.includes(currentChannel.name) : false;
  const epgSchedule = currentChannel
    ? getChannelEpgSchedule(currentChannel, clockTime, epgData)
    : undefined;

  return (
    <div
      ref={containerRef}
      onMouseMove={() => triggerBanner(3500)}
      onClick={() => triggerBanner(3500)}
      className="relative w-screen h-screen bg-black overflow-hidden select-none cursor-default font-sans"
    >
      {/* 1. Pure Fullscreen Live Video Player Canvas */}
      {currentChannel && (
        <VideoPlayer
          ref={videoRef}
          streamUrl={currentChannel.url}
          aspectRatio={aspectRatio}
          onPlayStateChange={setIsPlaying}
          onHlsReady={(hls) => {
            hlsRef.current = hls;
            if (hls.levels) {
              setVideoLevels(hls.levels.map((lvl) => ({ height: lvl.height || 720, bitrate: lvl.bitrate })));
              setCurrentVideoLevel(hls.currentLevel);
            }
            if (hls.audioTracks) {
              setAudioTracks(hls.audioTracks);
              setCurrentAudioTrack(hls.audioTrack);
            }
          }}
        />
      )}

      {/* 2. JioTV+ Bottom OSD Info Banner (Auto-hides after 3.5s) */}
      <JioTvLiveBanner
        channel={currentChannel}
        channelIndex={activeChannel}
        isFavorite={isCurrentFavorite}
        onToggleFavorite={() => currentChannel && handleToggleFavorite(currentChannel.name)}
        onOpenGuide={() => setShowGuide(true)}
        onOpenSettings={() => setShowSettings(true)}
        onToggleFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        currentProgramTitle={epgSchedule?.currentTitle}
        currentProgramDesc={epgSchedule?.currentDesc}
        progressPercent={epgSchedule?.progressPercent}
        timeSlotText={epgSchedule?.timeSlotText}
        timeLeftText={epgSchedule?.timeLeftText}
        nextProgramTitle={epgSchedule?.nextTitle}
        nextProgramTime={epgSchedule?.nextTimeText}
        isVisible={showBanner && !showGuide && !showSettings && !showPlayerSettings}
      />

      {/* 3. JioTV+ Left Slide-over Channel Guide (On-Demand) */}
      <JioTvChannelGuide
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        channels={channels}
        activeChannelIndex={activeChannel}
        onSelectChannel={handleSelectChannel}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* 4. Numeric DTH Zapping Overlay (When typing 0-9) */}
      <IptvDthZappingOverlay
        typedChannelNumber={typedChannelNumber}
        channels={channels}
      />

      {/* 5. Volume OSD HUD (When adjusting volume) */}
      <IptvVolumeOsd
        volume={volume}
        isMuted={isMuted}
        isVisible={showVolumeOsd}
      />

      {/* 6. Player Quality / Audio Settings Modal */}
      <IptvPlayerSettingsOverlay
        isOpen={showPlayerSettings}
        onClose={() => setShowPlayerSettings(false)}
        videoLevels={videoLevels}
        currentVideoLevel={currentVideoLevel}
        onSelectVideoLevel={(lvl) => {
          if (hlsRef.current) {
            hlsRef.current.currentLevel = lvl;
            setCurrentVideoLevel(lvl);
          }
        }}
        audioTracks={audioTracks}
        currentAudioTrack={currentAudioTrack}
        onSelectAudioTrack={(trk) => {
          if (hlsRef.current) {
            hlsRef.current.audioTrack = trk;
            setCurrentAudioTrack(trk);
          }
        }}
        aspectRatio={aspectRatio}
        onChangeAspectRatio={setAspectRatio}
      />

      {/* 7. Settings & Playlist Source Modal */}
      <IptvSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        playlistUrl={playlistUrl}
        onSavePlaylistUrl={handleSavePlaylistUrl}
        epgUrl={epgUrl}
        onSaveEpgUrl={handleSaveEpgUrl}
        onLoadLocalFile={handleLoadLocalFile}
        onClearPlaylist={handleClearPlaylist}
        channelCount={channels.length}
        loading={loading}
        sourceName={sourceName}
        sourceType={sourceType}
        sampleStreams={SAMPLE_IPTV_STREAMS}
        onSelectSampleStream={handleSelectSampleStream}
        onPlayDirectUrl={handlePlayDirectUrl}
        xtreamCredentials={xtreamCredentials}
        onLoginXtream={handleLoginXtream}
        stalkerCredentials={stalkerCredentials}
        onLoginStalker={handleLoginStalker}
      />

      {/* 8. Smart TV Back Exit Prompt Toast */}
      {showExitToast && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-black/90 border border-cyan-400 text-white text-sm font-semibold shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4 flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span>Press Back or Esc again to exit player</span>
        </div>
      )}
    </div>
  );
};
export default VideoPlayerTool;
