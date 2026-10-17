import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LivePlayer, LivePlayerHandle } from './components/LivePlayer';
import { JioTvInfoBanner } from './components/JioTvInfoBanner';
import { JioTvGuideDrawer } from './components/JioTvGuideDrawer';
import { JioTvEpgGrid } from './components/JioTvEpgGrid';
import { WelcomeSetupModal } from './components/WelcomeSetupModal';
import { DirectZappingOverlay } from './components/DirectZappingOverlay';
import { DEMO_CHANNELS, getChannelSchedule } from './utils/demoChannels';
import { ChannelItem, IptvSourceType } from './types';

export default function App() {
  const [channels, setChannels] = useState<ChannelItem[]>(DEMO_CHANNELS);
  const [activeChannelIndex, setActiveChannelIndex] = useState<number>(0);
  
  // UI Overlays - Start directly in Live TV Player!
  const [showSetupModal, setShowSetupModal] = useState<boolean>(false);
  const [showBanner, setShowBanner] = useState<boolean>(true);
  const [showEpg, setShowEpg] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [favorites, setFavorites] = useState<(string | number)[]>(() => {
    try {
      const saved = localStorage.getItem('arrjs_tv_favs');
      return saved ? JSON.parse(saved) : [147];
    } catch {
      return [147];
    }
  });

  // Numeric zapping
  const [typedDigits, setTypedDigits] = useState<string>('');
  const zapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Time & Clock
  const [clockTime, setClockTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setClockTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const playerRef = useRef<LivePlayerHandle>(null);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Show banner with auto-hide timeout
  const triggerBanner = useCallback((durationMs = 4500) => {
    setShowBanner(true);
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = setTimeout(() => {
      setShowBanner(false);
    }, durationMs);
  }, []);

  // Show banner on initial mount for 5 seconds
  useEffect(() => {
    triggerBanner(5000);
  }, [triggerBanner]);

  // Filter channels based on active category
  const filteredChannels = channels.filter((ch) => {
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Favourites') return favorites.includes(ch.id);
    if (activeCategory === 'HD Channels') return Boolean(ch.isHd);
    if (ch.group) return ch.group.toLowerCase().includes(activeCategory.toLowerCase());
    return true;
  });

  const currentChannel = filteredChannels[activeChannelIndex] || channels[0] || null;
  const currentSchedule = currentChannel ? getChannelSchedule(currentChannel.channelNo, clockTime) : [];
  const currentProgram = currentSchedule[0];
  const nextProgram = currentSchedule[1];

  // Channel changing
  const handleSelectChannel = useCallback((index: number) => {
    if (index >= 0 && index < filteredChannels.length) {
      setActiveChannelIndex(index);
      triggerBanner(4500);
    }
  }, [filteredChannels.length, triggerBanner]);

  const handleNextChannel = useCallback(() => {
    if (filteredChannels.length === 0) return;
    const nextIdx = (activeChannelIndex + 1) % filteredChannels.length;
    handleSelectChannel(nextIdx);
  }, [activeChannelIndex, filteredChannels.length, handleSelectChannel]);

  const handlePrevChannel = useCallback(() => {
    if (filteredChannels.length === 0) return;
    const prevIdx = (activeChannelIndex - 1 + filteredChannels.length) % filteredChannels.length;
    handleSelectChannel(prevIdx);
  }, [activeChannelIndex, filteredChannels.length, handleSelectChannel]);

  // Favorite toggle
  const handleToggleFavorite = (id: string | number) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem('arrjs_tv_favs', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Keyboard & TV Remote control navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      // 1. Back / Escape button
      if (e.key === 'Escape' || e.key === 'GoBack' || e.key === 'BrowserBack') {
        e.preventDefault();
        if (showSetupModal) {
          setShowSetupModal(false);
          return;
        }
        if (showEpg) {
          setShowEpg(false);
          return;
        }
        if (showGuide) {
          setShowGuide(false);
          return;
        }
        triggerBanner(4500);
        return;
      }

      // 2. Direct channel numeric keys (0-9)
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        const next = typedDigits + e.key;
        setTypedDigits(next);
        if (zapTimerRef.current) clearTimeout(zapTimerRef.current);
        zapTimerRef.current = setTimeout(() => {
          const chNo = parseInt(next, 10);
          const foundIdx = filteredChannels.findIndex((c) => c.channelNo === chNo);
          if (foundIdx !== -1) {
            handleSelectChannel(foundIdx);
          }
          setTypedDigits('');
        }, 1100);
        return;
      }

      // 3. Arrow Up / Down: Channel zapping
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

      // 4. Arrow Left: Open Guide Drawer (Screenshot 2)
      if (e.key === 'ArrowLeft' && !showGuide && !showEpg) {
        e.preventDefault();
        setShowGuide(true);
        return;
      }

      // 5. Arrow Right or G: Open EPG Grid Timeline (Screenshot 1)
      if ((e.key === 'ArrowRight' || e.key === 'g' || e.key === 'G') && !showEpg) {
        e.preventDefault();
        setShowEpg(true);
        setShowGuide(false);
        return;
      }

      // 6. Enter / Space: Toggle play/pause & show banner
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (e.key === ' ') {
          if (playerRef.current) playerRef.current.togglePlay();
        }
        triggerBanner(4500);
        return;
      }

      // 7. Fullscreen (F)
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
        return;
      }

      // 8. Settings shortcut (S or M)
      if (e.key === 's' || e.key === 'S' || e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setShowSetupModal((prev) => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    showSetupModal,
    showEpg,
    showGuide,
    typedDigits,
    filteredChannels,
    handleSelectChannel,
    handleNextChannel,
    handlePrevChannel,
    triggerBanner,
  ]);

  const currentTimeStr = clockTime.toLocaleDateString([], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }) + ', ' + clockTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <div
      onMouseMove={() => triggerBanner(4500)}
      className="relative w-screen h-screen bg-black overflow-hidden select-none cursor-default font-sans"
    >
      {/* 1. Live Video Stream Canvas (Edge to Edge Fullscreen) */}
      {currentChannel && (
        <LivePlayer
          ref={playerRef}
          streamUrl={currentChannel.url}
          onClick={() => triggerBanner(4500)}
          onDoubleClick={toggleFullscreen}
        />
      )}

      {/* 2. JioTV+ Bottom Info Banner (Screenshot 3) */}
      <JioTvInfoBanner
        isVisible={showBanner && !showEpg && !showGuide && !showSetupModal}
        channel={currentChannel}
        currentProgram={currentProgram}
        nextProgram={nextProgram}
        currentTimeStr={currentTimeStr}
        remainingText="45 min remaining"
        progressPercent={40}
        onPrevChannel={handlePrevChannel}
        onNextChannel={handleNextChannel}
        onReload={() => playerRef.current?.reloadStream()}
        onOpenGuide={() => setShowGuide(true)}
      />

      {/* 3. JioTV+ EPG Grid Timeline (Screenshot 1) */}
      <JioTvEpgGrid
        isOpen={showEpg}
        onClose={() => setShowEpg(false)}
        channels={filteredChannels}
        activeChannelIndex={activeChannelIndex}
        onSelectChannel={handleSelectChannel}
        categoryName={activeCategory}
        onOpenCategoryDrawer={() => {
          setShowEpg(false);
          setShowGuide(true);
        }}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
        currentTimeStr={currentTimeStr}
      />

      {/* 4. JioTV+ Left Side Navigation Guide Drawer (Screenshot 2) */}
      <JioTvGuideDrawer
        isOpen={showGuide}
        activeCategory={activeCategory}
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          setActiveChannelIndex(0);
          setShowEpg(true);
        }}
        onOpenSettings={() => setShowSetupModal(true)}
        onClose={() => setShowGuide(false)}
        favoritesCount={favorites.length}
      />

      {/* 5. Welcome & Sources Setup Modal */}
      <WelcomeSetupModal
        isOpen={showSetupModal}
        onClose={() => {
          setShowSetupModal(false);
          triggerBanner(4500);
        }}
        onChannelsLoaded={(loadedChannels, _source, _name) => {
          setChannels(loadedChannels);
          setActiveChannelIndex(0);
          setActiveCategory('All');
        }}
        onLoadDemo={() => {
          setChannels(DEMO_CHANNELS);
          setActiveChannelIndex(0);
          setActiveCategory('All');
        }}
        channelCount={channels.length}
      />

      {/* 6. Direct Channel Numeric Zapping Overlay */}
      <DirectZappingOverlay
        typedDigits={typedDigits}
        channels={filteredChannels}
      />
    </div>
  );
}
