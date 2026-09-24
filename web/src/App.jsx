import React, { useState, useEffect, useRef } from 'react';
import VideoPlayer from './VideoPlayer';
import EpgGrid from './EpgGrid';
import { parseM3u } from './m3uParser';
import { parseXMLTV } from './epgParser';
import './index.css';

// Default mock channels if none loaded
const MOCK_CHANNELS = [
  { id: 147, name: 'Tears of Steel', logo: 'https://via.placeholder.com/60/FF0000/FFFFFF?text=TOS', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8', group: 'Movies' },
  { id: 148, name: 'Big Buck Bunny', logo: 'https://via.placeholder.com/60/FFA500/FFFFFF?text=BBB', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', group: 'Movies' },
];

function App() {
  const [channels, setChannels] = useState([]);
  const [categories, setCategories] = useState(['All', 'Favorites']);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('iptv_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [epgUrl, setEpgUrl] = useState('');
  const [epgData, setEpgData] = useState({});
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const [activeChannel, setActiveChannel] = useState(0);
  const [playingChannelData, setPlayingChannelData] = useState(null); // Actually playing on screen
  const [showDrawer, setShowDrawer] = useState(false);
  const [showEpg, setShowEpg] = useState(false);
  const [showMiniGuide, setShowMiniGuide] = useState(true);
  const [showPlayerSettings, setShowPlayerSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('cover');
  
  // Player Settings State
  const hlsRef = useRef(null);
  const videoRef = useRef(null);
  const [videoLevels, setVideoLevels] = useState([]);
  const [audioTracks, setAudioTracks] = useState([]);
  const [currentVideoLevel, setCurrentVideoLevel] = useState(-1); // -1 is auto
  const [currentAudioTrack, setCurrentAudioTrack] = useState(-1);
  
  // Premium Features State
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [playCounts, setPlayCounts] = useState(() => {
    const saved = localStorage.getItem('iptv_play_counts');
    return saved ? JSON.parse(saved) : {};
  });
  
  // Derived state: top 8 most played channels
  const recentChannels = Object.entries(playCounts)
    .sort((a, b) => b[1] - a[1])
    .map(entry => parseInt(entry[0]))
    .slice(0, 8);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeOsd, setShowVolumeOsd] = useState(false);
  const volumeTimeoutRef = useRef(null);

  // Clock effect
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  
  // DTH Zapping State
  const [typedChannelNumber, setTypedChannelNumber] = useState('');
  const typingTimeoutRef = useRef(null);
  const typedChannelNumberRef = useRef('');
  const activeCategoryRef = useRef(null);
  const activeCardRef = useRef(null);
  
  // Touch / Scroll state for gestures
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  
  const handleTouchStart = (e) => {
    touchStartY.current = e.changedTouches[0].screenY;
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e) => {
    const endY = e.changedTouches[0].screenY;
    const endX = e.changedTouches[0].screenX;
    const deltaY = endY - touchStartY.current;
    const deltaX = endX - touchStartX.current;
    
    // Swipe Vertical (Channel change)
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50) {
       if (deltaY > 0) {
         // Swipe Down -> Prev Channel
         const prevIndex = (activeChannel - 1 + displayChannels.length) % displayChannels.length;
         setActiveChannel(prevIndex);
         setPlayingChannelData(displayChannels[prevIndex]);
         setShowMiniGuide(true);
       } else {
         // Swipe Up -> Next Channel
         const nextIndex = (activeChannel + 1) % displayChannels.length;
         setActiveChannel(nextIndex);
         setPlayingChannelData(displayChannels[nextIndex]);
         setShowMiniGuide(true);
       }
    } 
    // Swipe Horizontal (UI Toggle)
    else if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
       if (deltaX > 0) {
         // Swipe Right -> Open EPG/Drawer
         setShowDrawer(true);
         setShowEpg(true);
       } else {
         // Swipe Left -> Close all UI
         setShowDrawer(false);
         setShowEpg(false);
         setShowMiniGuide(false);
         setShowSettings(false);
       }
    }
  };

  const handleWheel = (e) => {
    // Only handle scroll if no UI is open to prevent interfering with EPG scrolling
    if (showEpg || showDrawer || showSettings || showSearch) return;
    
    if (e.deltaY > 0) {
      // Scroll Down -> Next Channel
      const nextIndex = (activeChannel + 1) % displayChannels.length;
      setActiveChannel(nextIndex);
      setPlayingChannelData(displayChannels[nextIndex]);
      setShowMiniGuide(true);
    } else if (e.deltaY < 0) {
      // Scroll Up -> Prev Channel
      const prevIndex = (activeChannel - 1 + displayChannels.length) % displayChannels.length;
      setActiveChannel(prevIndex);
      setPlayingChannelData(displayChannels[prevIndex]);
      setShowMiniGuide(true);
    }
  };

  useEffect(() => {
    if (activeCategoryRef.current && showDrawer) {
      activeCategoryRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeCategory, showDrawer]);

  useEffect(() => {
    if (activeCardRef.current && showMiniGuide) {
      activeCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeChannel, showMiniGuide]);

  // Track channel play counts
  useEffect(() => {
    if (playingChannelData && playingChannelData.id) {
      setPlayCounts(prev => {
        const newCounts = { ...prev };
        newCounts[playingChannelData.id] = (newCounts[playingChannelData.id] || 0) + 1;
        localStorage.setItem('iptv_play_counts', JSON.stringify(newCounts));
        return newCounts;
      });
    }
  }, [playingChannelData]);

  const triggerVolumeOsd = () => {
    setShowVolumeOsd(true);
    if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
    volumeTimeoutRef.current = setTimeout(() => {
      setShowVolumeOsd(false);
    }, 3000);
  };

  const toggleFavorite = (channelId) => {
    setFavorites(prev => {
      const newFavs = prev.includes(channelId) 
        ? prev.filter(id => id !== channelId) 
        : [...prev, channelId];
      localStorage.setItem('iptv_favorites', JSON.stringify(newFavs));
      return newFavs;
    });
  };

  // Keep ref in sync for keydown listener
  useEffect(() => {
    typedChannelNumberRef.current = typedChannelNumber;
  }, [typedChannelNumber]);

  // Load from local storage on mount
  useEffect(() => {
    const savedChannels = localStorage.getItem('iptv_channels');
    const savedEpgUrl = localStorage.getItem('iptv_epg_url');
    
    if (savedEpgUrl) {
      setEpgUrl(savedEpgUrl);
      fetchEpgData(savedEpgUrl);
    }

    if (savedChannels) {
      try {
        const parsed = JSON.parse(savedChannels);
        if (parsed.length > 0) {
          loadChannelsIntoState(parsed);
        } else {
          loadChannelsIntoState(MOCK_CHANNELS);
        }
      } catch (e) {
        loadChannelsIntoState(MOCK_CHANNELS);
      }
    } else {
      loadChannelsIntoState(MOCK_CHANNELS);
    }
  }, []);

  const loadChannelsIntoState = (chanList) => {
    setChannels(chanList);
    // Extract unique categories
    const cats = ['Recently Viewed', 'All', 'Favorites'];
    chanList.forEach(c => {
      if (c.group && !cats.includes(c.group)) {
        cats.push(c.group);
      }
    });
    setCategories(cats);
    if (!playingChannelData && chanList.length > 0) {
      setPlayingChannelData(chanList[0]);
    }
    setShowSettings(false);
  };

  const fetchEpgData = async (url) => {
    try {
      // Use proxy if direct fails, or just direct for now
      const response = await fetch(url);
      const text = await response.text();
      const parsedEpg = parseXMLTV(text);
      setEpgData(parsedEpg);
    } catch (e) {
      console.log("Failed to fetch EPG", e);
    }
  };

  const handleSavePlaylist = async () => {
    if (!playlistUrl) return;
    setLoading(true);
    try {
      const response = await fetch(playlistUrl);
      const text = await response.text();
      const parsedChannels = parseM3u(text);
      if (parsedChannels.length > 0) {
        localStorage.setItem('iptv_channels', JSON.stringify(parsedChannels));
        if (epgUrl) {
           localStorage.setItem('iptv_epg_url', epgUrl);
           fetchEpgData(epgUrl);
        }
        loadChannelsIntoState(parsedChannels);
      } else {
        alert("No channels found in playlist.");
      }
    } catch (err) {
      alert("Error fetching playlist. Check CORS or URL.");
    }
    setLoading(false);
  };

  const handleClearPlaylist = () => {
    localStorage.removeItem('iptv_channels');
    localStorage.removeItem('iptv_epg_url');
    setChannels([]);
    setEpgData({});
    setShowSettings(true);
  };

  // Filtered channels based on active category
  let filteredChannels = categories[activeCategory] === 'All' 
    ? channels 
    : categories[activeCategory] === 'Favorites'
      ? channels.filter(c => favorites.includes(c.id))
      : categories[activeCategory] === 'Recently Viewed'
        ? channels.filter(c => recentChannels.includes(c.id)).sort((a, b) => recentChannels.indexOf(a.id) - recentChannels.indexOf(b.id))
        : channels.filter(c => c.group === categories[activeCategory]);

  if (showSearch && searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredChannels = channels.filter(c => 
      (c.name && c.name.toLowerCase().includes(query)) || 
      (c.group && c.group.toLowerCase().includes(query))
    );
  }

  const displayChannels = filteredChannels.length > 0 ? filteredChannels : MOCK_CHANNELS;

  // Auto-hide UI timeout (Only for Mini Guide)
  useEffect(() => {
    let timeout;
    if (!showSettings && !showPlayerSettings && showMiniGuide && !showEpg && !showDrawer) {
      timeout = setTimeout(() => {
        setShowMiniGuide(false);
      }, 8000); // Hide mini guide after 8s of inactivity
    }
    return () => clearTimeout(timeout);
  }, [showMiniGuide, showEpg, showDrawer, showSettings, showPlayerSettings]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(e => console.log(e));
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };



  const handleHlsReady = (hls) => {
    hlsRef.current = hls;
    if (hls.levels) {
      setVideoLevels(hls.levels);
      setCurrentVideoLevel(hls.currentLevel);
    }
    if (hls.audioTracks) {
      setAudioTracks(hls.audioTracks);
      setCurrentAudioTrack(hls.audioTrack);
    }
    // Update tracks when they change internally (like after manifest parse)
    hls.on('hlsLevelSwitched', (event, data) => {
      setCurrentVideoLevel(data.level);
    });
    hls.on('hlsAudioTrackSwitched', (event, data) => {
      setCurrentAudioTrack(data.id);
    });
  };

  const setQuality = (levelIndex) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
      setCurrentVideoLevel(levelIndex);
    }
  };

  const setAudio = (trackId) => {
    if (hlsRef.current) {
      hlsRef.current.audioTrack = trackId;
      setCurrentAudioTrack(trackId);
    }
  };

  const cycleAspectRatio = () => {
    const modes = ['cover', 'contain', 'stretch'];
    const nextMode = modes[(modes.indexOf(aspectRatio) + 1) % modes.length];
    setAspectRatio(nextMode);
  };

  // Keyboard navigation
  useEffect(() => {
    if (showSettings) return;

    const handleKeyDown = (e) => {
      // If we are searching, don't trigger anything else except Escape
      if (showSearch && e.key !== 'Escape') {
         return;
      }

      // Reset auto-hide timer only if a UI is already open, or if it's a number key
      // We will handle showing the UI explicitly in the switch cases.
      if (showMiniGuide || showEpg || showDrawer || (e.key >= '0' && e.key <= '9') || ['/', 'p', 'P', '+', '=', '-', 'm', 'M'].includes(e.key)) {
         setShowMiniGuide(prev => prev ? true : (showEpg ? false : showDrawer ? false : showSearch ? false : true));
      }

      switch(e.key) {
        case 'ArrowLeft':
          if (showEpg && !showDrawer) {
            setShowDrawer(true);
          } else if (!showDrawer) {
            setShowEpg(true);
            setShowMiniGuide(false);
          }
          break;
        case 'ArrowRight':
          if (showDrawer) {
            setShowDrawer(false);
          } else if (!showDrawer && !showEpg) {
             setShowEpg(true);
             setShowMiniGuide(false);
          } else if (showEpg) {
            setShowEpg(false);
            setShowMiniGuide(true);
          }
          break;
        case 'ArrowUp':
          if (showDrawer) {
            setActiveCategory(prev => (prev > 0 ? prev - 1 : categories.length - 1));
          } else if (showEpg) {
            setActiveChannel(prev => (prev > 0 ? prev - 1 : displayChannels.length - 1));
          } else {
             // Up = Next channel
             const nextIndex = activeChannel < displayChannels.length - 1 ? activeChannel + 1 : 0;
             setActiveChannel(nextIndex);
             setPlayingChannelData(displayChannels[nextIndex]);
             setShowMiniGuide(true);
          }
          break;
        case 'ArrowDown':
          if (showDrawer) {
            setActiveCategory(prev => (prev < categories.length - 1 ? prev + 1 : 0));
          } else if (showEpg) {
            setActiveChannel(prev => (prev < displayChannels.length - 1 ? prev + 1 : 0));
          } else {
             // Down = Past channel
             const prevIndex = activeChannel > 0 ? activeChannel - 1 : displayChannels.length - 1;
             setActiveChannel(prevIndex);
             setPlayingChannelData(displayChannels[prevIndex]);
             setShowMiniGuide(true);
          }
          break;
        case 'Enter':
          if (typedChannelNumberRef.current) {
             const newTyped = typedChannelNumberRef.current;
             const targetChannelIndex = displayChannels.findIndex(c => c.id && c.id.toString() === newTyped);
             const fallbackIndex = displayChannels.findIndex((_, idx) => (idx + 1).toString() === newTyped);
             const finalIdx = targetChannelIndex !== -1 ? targetChannelIndex : fallbackIndex;
             
             if (finalIdx !== -1) {
                setActiveChannel(finalIdx);
                setPlayingChannelData(displayChannels[finalIdx]);
             }
             setTypedChannelNumber('');
             if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          } else if (showDrawer) {
            setShowDrawer(false);
            setShowEpg(true);
          } else if (showEpg) {
             // Play selected channel from EPG
             setPlayingChannelData(displayChannels[activeChannel]);
             setShowEpg(false);
             setShowMiniGuide(true);
          } else if (!showMiniGuide) {
             // Wake up mini guide
             setShowMiniGuide(true);
          } else {
             // Mini guide is already open, maybe open EPG or do nothing
             setShowEpg(true);
             setShowMiniGuide(false);
          }
          break;
        case 'Escape':
        case 'Backspace':
          setShowMiniGuide(false);
          setShowEpg(false);
          setShowDrawer(false);
          break;
        case 'f': // Toggle favorite
        case 'F':
          if (displayChannels.length > 0 && activeChannel >= 0) {
            toggleFavorite(displayChannels[activeChannel].id);
          }
          break;
        case 's': // Press 's' to open settings manually
          setShowSettings(true);
          break;
        case 'o': // Player Settings
          setShowPlayerSettings(!showPlayerSettings);
          break;
        case 'f': // Fullscreen
          toggleFullscreen();
          break;
        case 'p': // PiP toggle
        case 'P':
          if (document.pictureInPictureElement) {
            document.exitPictureInPicture().catch(console.error);
          } else if (videoRef.current) {
            videoRef.current.requestPictureInPicture().catch(console.error);
          }
          break;
        case '/': // Quick Search
          e.preventDefault(); // Prevent default find
          setShowSearch(true);
          setShowEpg(false);
          setShowDrawer(false);
          setShowMiniGuide(false);
          setSearchQuery('');
          break;
        case '=': // Volume up
        case '+':
          setVolume(v => {
            const newVol = Math.min(1, v + 0.1);
            if (videoRef.current) videoRef.current.volume = newVol;
            return newVol;
          });
          if (videoRef.current) videoRef.current.muted = false;
          setIsMuted(false);
          triggerVolumeOsd();
          break;
        case '-': // Volume down
          setVolume(v => {
            const newVol = Math.max(0, v - 0.1);
            if (videoRef.current) videoRef.current.volume = newVol;
            return newVol;
          });
          if (videoRef.current) videoRef.current.muted = false;
          setIsMuted(false);
          triggerVolumeOsd();
          break;
        case 'm': // Mute toggle
        case 'M':
          setIsMuted(m => {
            const newMuted = !m;
            if (videoRef.current) videoRef.current.muted = newMuted;
            return newMuted;
          });
          triggerVolumeOsd();
          break;
        default:
          if (e.key >= '0' && e.key <= '9') {
            if (typedChannelNumberRef.current.length >= 4) return; // Limit to 4 digits
            
            const newTyped = typedChannelNumberRef.current + e.key;
            setTypedChannelNumber(newTyped);
            
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
              const targetChannelIndex = displayChannels.findIndex(c => c.id && c.id.toString() === newTyped);
              const fallbackIndex = displayChannels.findIndex((_, idx) => (idx + 1).toString() === newTyped);
              const finalIdx = targetChannelIndex !== -1 ? targetChannelIndex : fallbackIndex;
              
              if (finalIdx !== -1) {
                 setActiveChannel(finalIdx);
                 setPlayingChannelData(displayChannels[finalIdx]);
              }
              setTypedChannelNumber('');
            }, 2000);
          }
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDrawer, showEpg, showMiniGuide, showSettings, showPlayerSettings, displayChannels, categories, activeChannel, favorites]);

  if (showSettings) {
    return (
      <div className="h-screen w-full bg-dark flex items-center justify-center p-8 text-primary">
         <div className="glass-card p-8 w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-6 text-accent">Settings / Login</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-secondary">M3U Playlist URL</label>
              <input 
                type="text" 
                className="w-full p-3 bg-dark border border-glass rounded text-primary focus:border-accent-cyan outline-none"
                placeholder="https://example.com/playlist.m3u"
                value={playlistUrl}
                onChange={e => setPlaylistUrl(e.target.value)}
              />
            </div>
            <div className="mb-4 mt-4">
              <label className="block text-sm font-medium mb-2 text-secondary">EPG XMLTV URL (Optional)</label>
              <input 
                type="text" 
                className="w-full p-3 bg-dark border border-glass rounded text-primary focus:border-accent-cyan outline-none"
                placeholder="https://example.com/epg.xml"
                value={epgUrl}
                onChange={e => setEpgUrl(e.target.value)}
              />
            </div>
            <div className="flex gap-4 mt-8">
              <button 
                className="flex-1 bg-accent-cyan text-dark font-bold p-3 rounded"
                onClick={handleSavePlaylist}
              >
                {loading ? 'Loading...' : 'Load Playlist'}
              </button>
              {channels.length > 0 && (
                <button 
                  className="flex-1 bg-dark border border-glass text-primary font-bold p-3 rounded"
                  onClick={() => setShowSettings(false)}
                >
                  Cancel
                </button>
              )}
            </div>
            
            {channels.length > 0 && (
              <div className="mt-8 pt-4 border-t border-glass">
                <div className="text-sm text-secondary mb-4">Loaded {channels.length} channels.</div>
                <button 
                  className="w-full bg-dark border border-glass text-primary p-3 rounded hover:bg-glass-hover"
                  onClick={handleClearPlaylist}
                >
                  Clear Cached Playlist
                </button>
              </div>
            )}
         </div>
      </div>
    );
  }

  const currentChannelData = playingChannelData || displayChannels[0];
  const focusedChannelData = displayChannels[activeChannel] || displayChannels[0];

  const getQualityBadge = (name) => {
    if (!name) return null;
    const match = name.match(/\s*[\(\[]?(1080p|720p|576p|480p|4k|2160p|FHD|HD|SD|UHD)[\)\]]?/i);
    if (!match) return null;
    const tag = match[1].toLowerCase();
    if (tag === '1080p' || tag === 'fhd') return 'FULL HD';
    if (tag === '720p' || tag === 'hd') return 'HD';
    if (tag === '4k' || tag === '2160p' || tag === 'uhd') return '4K';
    if (tag === '576p' || tag === '480p' || tag === 'sd') return 'SD';
    return tag.toUpperCase();
  };

  return (
    <div className="h-screen w-full relative bg-transparent" onDoubleClick={toggleFullscreen}>
      {/* Background Video Player */}
      <div 
        className="absolute inset-0 z-0 bg-black cursor-pointer" 
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        onClick={() => {
          if (!showDrawer && !showEpg && !showMiniGuide) {
            setShowDrawer(true);
            setShowEpg(true);
          } else {
            setShowDrawer(false);
            setShowEpg(false);
            setShowMiniGuide(false);
            setShowSettings(false);
            setShowPlayerSettings(false);
          }
        }}
      >
         {currentChannelData && <VideoPlayer ref={videoRef} streamUrl={currentChannelData.url} aspectRatio={aspectRatio} onHlsReady={handleHlsReady} />}
      </div>

      {/* Main UI Overlay */}
      <div className="absolute inset-0 z-10 flex">

        {/* Volume OSD */}
        <div className={`absolute left-12 top-1/2 -translate-y-1/2 z-50 transition-all duration-300 ${showVolumeOsd ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12 pointer-events-none'}`}>
          <div className="glass-card py-8 px-5 flex flex-col items-center gap-6" style={{ borderRadius: '24px', backgroundColor: 'rgba(15, 20, 25, 0.75)', backdropFilter: 'blur(50px)', border: '1px solid rgba(0, 240, 255, 0.2)', boxShadow: '0 20px 60px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.1)' }}>
            <div className="text-white flex flex-col items-center justify-center gap-3">
              {isMuted ? (
                <div className="bg-red-500/20 p-3 rounded-full border border-red-500/50">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-red-400">
                    <path d="M3.28 2.22a.75.75 0 00-1.06 1.06l18.5 18.5a.75.75 0 101.06-1.06l-5.51-5.51A9.754 9.754 0 0021.75 12c0-4.007-2.42-7.452-5.885-8.94a.75.75 0 00-.594 1.378 8.254 8.254 0 014.979 7.562c0 1.23-.27 2.396-.757 3.44l-2.022-2.022A6.745 6.745 0 0018 12a6.75 6.75 0 00-4.321-6.29.75.75 0 00-.638 1.353 5.25 5.25 0 012.709 4.937l-2.25-2.25V4.5c0-1.35-1.576-2.083-2.613-1.215L8.03 5.75H3.28z" />
                    <path d="M12.75 16.44l-6.22-6.22H3.75a.75.75 0 00-.75.75v2.06c0 1.22.955 2.24 2.173 2.29l2.457.1 3.51 2.96c1.036.868 2.61.135 2.61-1.214v-2.726z" />
                  </svg>
                </div>
              ) : (
                <div className="bg-accent-cyan/20 p-3 rounded-full border border-accent-cyan/50">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-accent-cyan" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <span className={`font-black text-2xl tracking-widest ${isMuted ? 'text-red-400' : 'text-white'}`}>{isMuted ? 'MUTE' : Math.round(volume * 100)}</span>
            </div>
            <div className="relative w-3 h-56 bg-gray-800/80 rounded-full overflow-hidden" style={{ boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)' }}>
              <div className="absolute bottom-0 left-0 w-full transition-all duration-200" style={{ height: `${isMuted ? 0 : volume * 100}%`, background: 'linear-gradient(0deg, #0284c7 0%, #00f0ff 100%)', boxShadow: '0 0 15px rgba(0, 240, 255, 0.6)' }}></div>
            </div>
          </div>
        </div>

        {/* Quick Search Overlay */}
        {showSearch && (
          <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
            <div className="w-full max-w-2xl px-8">
              <div className="flex items-center border-b-2 border-accent-cyan mb-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent-cyan mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text" 
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search channels..." 
                  className="w-full bg-transparent text-white text-4xl py-4 outline-none placeholder:text-gray-500"
                />
              </div>
              <div className="flex flex-col gap-2 max-h-96 overflow-y-auto no-scrollbar">
                {displayChannels.map((c, idx) => (
                  <div key={c.id || idx} className={`px-6 py-4 rounded-xl cursor-pointer ${idx === activeChannel ? 'bg-white/10 border border-white/20' : 'hover:bg-white/5'}`} onClick={() => { setActiveChannel(idx); setPlayingChannelData(c); setShowSearch(false); }}>
                    <span className="text-white font-bold text-xl">{c.name}</span>
                    <span className="text-gray-400 ml-4 text-sm">{c.group}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* DTH Channel Zapping Overlay */}
        {typedChannelNumber && (
          <div className="absolute right-12 top-12 z-50 transition-all duration-300">
            <div className="glass-card px-6 py-4 flex items-center gap-6 border-t border-glass" style={{ borderRadius: '20px', backgroundColor: 'rgba(15, 20, 25, 0.85)', backdropFilter: 'blur(40px)', boxShadow: '0 12px 48px rgba(0,0,0,0.8)' }}>
              <div className="font-bold text-accent" style={{ fontSize: '48px', lineHeight: '1', textShadow: '0 4px 16px rgba(0,240,255,0.4)', minWidth: '60px', textAlign: 'center' }}>
                {typedChannelNumber}
              </div>
              
              <div style={{ width: '1px', height: '48px', backgroundColor: 'rgba(255,255,255,0.15)' }}></div>
              
              <div className="flex flex-col pr-4">
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Tuning to</span>
                <span className="font-bold text-white whitespace-nowrap" style={{ fontSize: '18px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                  {(() => {
                    const targetChannelIndex = displayChannels.findIndex(c => c.id && c.id.toString() === typedChannelNumber);
                    const fallbackIndex = displayChannels.findIndex((_, idx) => (idx + 1).toString() === typedChannelNumber);
                    const finalIdx = targetChannelIndex !== -1 ? targetChannelIndex : fallbackIndex;
                    return finalIdx !== -1 ? displayChannels[finalIdx].name : "Unknown Channel";
                  })()}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Category Drawer */}
        <div className={`transition-all duration-300 h-full flex flex-col ${showDrawer ? 'w-64' : 'w-0 opacity-0 overflow-hidden'}`} style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
           <div className="p-6 flex flex-col h-full">
            <div className="mb-6 flex-shrink-0 px-1">
              <img src="./logo.svg" alt="Video Player by ARRJS" style={{ width: '100%', height: 'auto', maxHeight: '52px', objectFit: 'contain' }} />
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto flex-1 no-scrollbar pb-12">
              {categories.map((category, idx) => (
                <div 
                  key={category} 
                  ref={activeCategory === idx ? activeCategoryRef : null}
                  className={`px-4 py-2 cursor-pointer transition-all flex-shrink-0 ${activeCategory === idx ? 'font-bold shadow-lg' : 'text-gray-300 hover:bg-white hover:bg-opacity-10'}`}
                  style={activeCategory === idx ? { backgroundColor: '#ffffff', color: '#000000', borderRadius: '9999px' } : { borderRadius: '9999px' }}
                  onClick={() => {
                    setActiveCategory(idx);
                    setActiveChannel(0);
                  }}
                >
                  <span className="text-sm">{category}</span>
                </div>
              ))}
            </div>
          </div>
        </div>



        {/* Top Tools Bar */}
        {(showEpg || showMiniGuide || showPlayerSettings) && (
          <div style={{ position: 'absolute', top: '24px', right: '32px', display: 'flex', gap: '12px', zIndex: 50, alignItems: 'center' }}>
            {/* Clock Widget */}
            <div className="mr-4 text-right">
               <div className="text-accent-cyan font-bold text-xl tracking-wider" style={{ textShadow: '0 2px 10px rgba(0,240,255,0.4)' }}>
                 {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
               </div>
               <div className="text-gray-300 text-sm tracking-wide font-medium">
                 {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
               </div>
            </div>
            <button 
              style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', outline: 'none', transition: 'all 0.2s' }}
              title="Sync EPG"
              onClick={fetchEpgData}
            >
              <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button 
              style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', outline: 'none', transition: 'all 0.2s' }}
              title="Player Settings (O)"
              onClick={() => setShowPlayerSettings(!showPlayerSettings)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button 
              style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', outline: 'none', transition: 'all 0.2s' }}
              title="Toggle Fullscreen"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m0 0h5m-5 0v5m11 11l5 5m0 0h-5m5 0v-5m0-11l-5 5m0 0h5m-5 0V4M9 15l-5 5m0 0h5m-5 0v-5" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
          </div>
        )}

        <div className={`flex-1 flex flex-col justify-end transition-all pb-8`} style={showEpg ? { backgroundColor: 'rgba(0, 0, 0, 0.4)' } : {}}>
           {showEpg && categories[activeCategory] !== 'Recently Viewed' && (
             <div className="w-full max-w-[1800px] mx-auto">
               <EpgGrid 
                 channels={displayChannels} 
                 epgData={epgData}
                 activeChannel={activeChannel} 
                 playingChannelId={currentChannelData ? currentChannelData.id : -1}
                 favorites={favorites}
                 categoryName={categories[activeCategory]}
                 onToggleFavorite={toggleFavorite}
                 onSelectChannel={(idx) => {
                   setActiveChannel(idx);
                   setPlayingChannelData(displayChannels[idx]);
                   setShowEpg(false);
                   setShowMiniGuide(true);
                 }} 
               />
             </div>
           )}

           {showEpg && categories[activeCategory] === 'Recently Viewed' && (
             <div className="w-full max-w-[1800px] mx-auto p-8 overflow-y-auto no-scrollbar" style={{ height: '70vh' }}>
                <h2 className="text-white font-bold text-4xl mb-8" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>Recently Viewed</h2>
                {displayChannels.length === 0 || displayChannels === MOCK_CHANNELS ? (
                  <div className="text-gray-400 text-xl">No recent channels found.</div>
                ) : (
                  <div className="grid grid-cols-4 gap-6 pb-20">
                    {displayChannels.map((c, idx) => (
                      <div 
                        key={c.id || idx}
                        className="relative rounded-2xl overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-105 group flex items-center justify-center border border-white/5 bg-[#121212]"
                        style={{ 
                          aspectRatio: '16/10', 
                          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                        }}
                        onClick={() => {
                          const globalIdx = channels.findIndex(ch => ch.id === c.id);
                          if (globalIdx !== -1) {
                            setActiveChannel(globalIdx);
                            setPlayingChannelData(channels[globalIdx]);
                            setShowDrawer(false);
                            setShowEpg(false);
                            setShowMiniGuide(true);
                          }
                        }}
                      >
                        {/* Channel Number Badge */}
                        <div className="absolute top-3 left-3 z-10 bg-black/60 px-2 py-0.5 rounded-md border border-white/10 shadow-lg">
                          <span className="text-gray-300 text-xs font-bold">{c.id}</span>
                        </div>

                        {/* Live Badge */}
                        <div className="absolute top-3 right-3 z-10 bg-black/60 px-2 py-1 rounded-md flex items-center gap-1.5 border border-white/10 shadow-lg">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                          <span className="text-gray-200 text-[10px] font-extrabold tracking-widest leading-none">LIVE</span>
                        </div>

                        {/* Logo Centered */}
                        <div className="absolute inset-0 flex items-center justify-center p-6 transition-transform duration-300 group-hover:scale-110">
                          {c.logo ? (
                            <img src={c.logo} alt={c.name} className="max-h-full max-w-full object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]" />
                          ) : (
                            <span className="text-white font-bold text-2xl text-center drop-shadow-lg">{c.name}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
           )}

           {/* Mini Guide / Quick Switcher (Compact Elegant DTH Glass Card) */}
           {showMiniGuide && !showDrawer && (
             <div 
               className="transition-all duration-300 z-50 flex flex-col justify-end"
               onClick={(e) => e.stopPropagation()}
               onDoubleClick={(e) => e.stopPropagation()}
               style={{
                 position: 'absolute',
                 bottom: '24px',
                 left: '0',
                 right: '0',
                 marginLeft: 'auto',
                 marginRight: 'auto',
                 width: '88%',
                 maxWidth: '920px',
                 backgroundColor: 'rgba(10, 14, 22, 0.82)',
                 backdropFilter: 'blur(28px)',
                 WebkitBackdropFilter: 'blur(28px)',
                 borderRadius: '22px',
                 border: '1px solid rgba(255, 255, 255, 0.15)',
                 boxShadow: '0 20px 60px rgba(0, 0, 0, 0.85)',
                 padding: '18px 28px',
                 zIndex: 999
               }}
             >
               <div className="w-full flex flex-col gap-2.5">
                 {/* Top Row: Channel Number, Logo, Name (Left) | Quality Badge, Favorite, Time (Right) */}
                 <div className="flex justify-between items-center">
                   <div className="flex items-center" style={{ gap: '24px' }}>
                     <span className="font-black text-white" style={{ fontSize: '2.2rem', lineHeight: '1' }}>
                       {focusedChannelData.id || activeChannel+1}
                     </span>
                     {focusedChannelData.logo && (
                       <img 
                         src={focusedChannelData.logo} 
                         alt="logo" 
                         className="object-contain rounded-lg" 
                         style={{ width: '48px', height: '48px', backgroundColor: 'rgba(255,255,255,0.08)', padding: '6px' }} 
                       />
                     )}
                     <span className="font-bold text-white tracking-wide" style={{ fontSize: '1.35rem', lineHeight: '1.2' }}>
                       {focusedChannelData.name?.replace(/\s*[\(\[]?(1080p|720p|576p|480p|4k|2160p|FHD|HD|SD|UHD)[\)\]]?/i, '') || ''}
                     </span>
                   </div>

                   <div className="flex items-center" style={{ gap: '18px' }}>
                     {/* Authentic Metallic Broadcast Emblem Badge (Inspired by Reference Image) */}
                     {(() => {
                       const q = getQualityBadge(focusedChannelData.name);
                       if (!q) return null;
                       const is4K = q === '4K';
                       const isFHD = q === 'FULL HD';
                       
                       const goldGrad = 'linear-gradient(180deg, #fff176 0%, #ffd54f 40%, #ffb300 70%, #ff8f00 100%)';
                       const cyanGrad = 'linear-gradient(180deg, #7dd3fc 0%, #38bdf8 40%, #0284c7 70%, #0369a1 100%)';
                       const roseGrad = 'linear-gradient(180deg, #fda4af 0%, #f43f5e 40%, #e11d48 70%, #9f1239 100%)';
                       
                       const currentGrad = is4K ? roseGrad : isFHD ? goldGrad : cyanGrad;
                       const textColor = is4K ? '#ffe4e6' : isFHD ? '#fff8e1' : '#e0f2fe';
                       const resText = is4K ? '2160p' : isFHD ? '1080p' : '720p';

                       return (
                         <div 
                           style={{
                             background: currentGrad,
                             padding: '2px',
                             borderRadius: '7px',
                             boxShadow: is4K 
                               ? '0 2px 10px rgba(244, 63, 94, 0.4)' 
                               : isFHD 
                                 ? '0 2px 10px rgba(255, 179, 0, 0.4)' 
                                 : '0 2px 10px rgba(56, 189, 248, 0.4)',
                             display: 'inline-block'
                           }}
                         >
                           <div 
                             style={{
                               backgroundColor: '#0d0e12',
                               borderRadius: '5px',
                               padding: '3px 9px',
                               display: 'flex',
                               flexDirection: 'column',
                               alignItems: 'center',
                               justifyContent: 'center',
                               lineHeight: '1.1'
                             }}
                           >
                             <span style={{ fontSize: '0.62rem', fontWeight: '900', color: textColor, letterSpacing: '0.06em' }}>
                               {resText}
                             </span>
                             <span style={{ fontSize: '0.52rem', fontWeight: '900', color: textColor, letterSpacing: '0.1em', marginTop: '1px' }}>
                               {q}
                             </span>
                           </div>
                         </div>
                       );
                     })()}

                     <button 
                       onClick={(e) => { e.stopPropagation(); toggleFavorite(focusedChannelData.id); }}
                       className="focus:outline-none flex items-center justify-center transition-transform active:scale-95"
                       title="Toggle Favorite"
                       style={{ background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer' }}
                     >
                       {favorites.includes(focusedChannelData.id) ? (
                         <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '24px', height: '24px', color: '#ec4899' }} viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                         </svg>
                       ) : (
                         <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '24px', height: '24px', color: 'rgba(255,255,255,0.7)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                         </svg>
                       )}
                     </button>

                     <div className="text-white font-bold" style={{ fontSize: '1.35rem', opacity: '0.95' }}>
                       {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                     </div>
                   </div>
                 </div>

                 {/* Divider Line */}
                 <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '6px 0' }}></div>


                 {/* Bottom Row: Program Info & Remote Hints */}
                 <div className="flex justify-between items-center">
                   <div className="flex flex-col flex-1 pr-8 overflow-hidden">
                     <div className="flex items-center gap-2">
                       <span className="text-accent font-extrabold uppercase tracking-widest" style={{ fontSize: '0.75rem' }}>LIVE NOW:</span>
                       <span className="text-white font-bold truncate" style={{ fontSize: '1.05rem' }}>
                         {epgData[focusedChannelData?.tvgId]?.[0]?.title || 'Unknown Program'}
                       </span>
                     </div>
                     <span className="text-gray-300 truncate mt-0.5" style={{ fontSize: '0.85rem' }}>
                       {epgData[focusedChannelData?.tvgId]?.[0]?.desc || 'Live TV Broadcast'}
                     </span>
                     {/* Live Program Progress Bar */}
                     <div style={{ width: '100%', height: '3px', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: '9999px', marginTop: '6px', overflow: 'hidden', maxWidth: '320px' }}>
                       <div style={{ width: '45%', height: '100%', background: 'linear-gradient(90deg, #00f0ff, #0072ff)', borderRadius: '9999px', boxShadow: '0 0 8px rgba(0, 240, 255, 0.6)' }}></div>
                     </div>
                   </div>

                   {/* Remote Hints Inline */}
                   <div className="text-gray-300 font-semibold" style={{ display: 'flex', alignItems: 'center', gap: '22px', fontSize: '0.75rem' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                       <span style={{ color: 'rgba(255,255,255,0.6)' }}>FAV</span> 
                       <span style={{ border: '1px solid rgba(255,255,255,0.3)', borderRadius: '5px', padding: '1px 6px', color: '#fff', backgroundColor: 'rgba(255,255,255,0.08)' }}>F</span>
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                       <span style={{ color: 'rgba(255,255,255,0.6)' }}>GUIDE</span> 
                       <span style={{ border: '1px solid rgba(255,255,255,0.3)', borderRadius: '5px', padding: '1px 6px', color: '#fff', backgroundColor: 'rgba(255,255,255,0.08)' }}>EPG</span>
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                       <span style={{ color: 'rgba(255,255,255,0.6)' }}>PLAY</span> 
                       <span style={{ border: '1px solid rgba(255,255,255,0.3)', borderRadius: '5px', padding: '1px 6px', color: '#fff', backgroundColor: 'rgba(255,255,255,0.08)' }}>OK</span>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           )}

           {/* DTH Channel Typing Overlay */}
           {typedChannelNumber && (
             <div className="absolute top-24 right-8 bg-black bg-opacity-80 rounded-2xl p-6 border border-white border-opacity-20 shadow-2xl z-50 flex items-center gap-6">
                <div className="text-5xl font-bold text-white tracking-widest">{typedChannelNumber}<span className="animate-pulse text-gray-500">_</span></div>
                <div className="flex flex-col border-l border-gray-700 pl-6 h-full justify-center min-w-[200px]">
                   {(() => {
                      const suggested = displayChannels.find(c => c.id && c.id.toString() === typedChannelNumber) || displayChannels.find((_, idx) => (idx + 1).toString() === typedChannelNumber);
                      if (suggested) {
                        return (
                          <>
                            <div className="text-accent text-sm mb-1 uppercase font-bold tracking-wider">Switching to</div>
                            <div className="text-white text-xl font-bold truncate max-w-[250px]">{suggested.name}</div>
                          </>
                        );
                      }
                      return <div className="text-red-400 font-bold uppercase tracking-wider text-sm">Channel not found</div>;
                   })()}
                </div>
             </div>
           )}

           {/* Player Settings Overlay */}
           {showPlayerSettings && (
             <div className="absolute right-8 top-8 w-80 p-6 z-20" style={{ borderRadius: '24px', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
               <h3 className="font-bold text-lg mb-4 text-accent border-b border-gray-700 pb-2">Player Settings</h3>
               <div className="flex flex-col gap-4 text-sm">
                 
                 <div>
                   <div className="text-secondary mb-1 text-xs uppercase font-bold tracking-wider">Video Quality</div>
                   <div className="flex flex-wrap gap-2">
                     <div 
                       className={`px-3 py-1 rounded cursor-pointer ${currentVideoLevel === -1 ? 'bg-accent-cyan text-dark font-bold' : 'border border-glass hover:bg-glass-hover text-primary'}`}
                       onClick={() => setQuality(-1)}
                     >Auto</div>
                     {videoLevels.map((lvl, idx) => (
                       <div 
                         key={idx}
                         className={`px-3 py-1 rounded cursor-pointer ${currentVideoLevel === idx ? 'bg-accent-cyan text-dark font-bold' : 'border border-glass hover:bg-glass-hover text-primary'}`}
                         onClick={() => setQuality(idx)}
                       >{lvl.height}p</div>
                     ))}
                   </div>
                 </div>

                 <div>
                   <div className="text-secondary mb-1 text-xs uppercase font-bold tracking-wider">Audio Track</div>
                   <div className="flex flex-col gap-1">
                     {audioTracks.length > 0 ? audioTracks.map((track) => (
                       <div 
                         key={track.id}
                         className={`px-3 py-2 rounded cursor-pointer flex justify-between ${currentAudioTrack === track.id ? 'bg-accent-cyan text-dark font-bold' : 'border border-glass hover:bg-glass-hover text-primary'}`}
                         onClick={() => setAudio(track.id)}
                       >
                         <span>{track.name || `Track ${track.id}`}</span>
                         <span className="text-xs opacity-70">{track.language}</span>
                       </div>
                     )) : <div className="text-secondary italic">No alternate tracks</div>}
                   </div>
                 </div>

                 <div className="pt-2 border-t border-glass">
                   <div className="flex justify-between items-center cursor-pointer hover:text-accent transition-colors py-2" onClick={cycleAspectRatio}>
                     <span className="font-bold">Aspect Ratio</span>
                     <span className="px-2 py-1 bg-dark rounded border border-glass uppercase text-xs">{aspectRatio}</span>
                   </div>
                 </div>

                 <div className="cursor-pointer text-center text-secondary hover:text-white transition-colors py-2 mt-2 bg-dark rounded border border-glass" onClick={() => setShowPlayerSettings(false)}>
                   Close Menu (O)
                 </div>
               </div>
             </div>
           )}
        </div>

      </div>
    </div>
  );
}

export default App;
