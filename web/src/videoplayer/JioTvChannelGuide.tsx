import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Search, Heart, Tv, Film, Trophy, Newspaper, Music, Sparkles, Filter } from 'lucide-react';
import { ChannelItem, cleanChannelName, getChannelQualityBadge } from './types';

interface JioTvChannelGuideProps {
  isOpen: boolean;
  onClose: () => void;
  channels: ChannelItem[];
  activeChannelIndex: number;
  onSelectChannel: (index: number) => void;
  favorites: string[];
  onToggleFavorite: (channelName: string) => void;
}

export const JioTvChannelGuide: React.FC<JioTvChannelGuideProps> = ({
  isOpen,
  onClose,
  channels,
  activeChannelIndex,
  onSelectChannel,
  favorites,
  onToggleFavorite,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const activeItemRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    channels.forEach((c) => {
      if (c.group && c.group.trim()) {
        set.add(c.group.trim());
      }
    });
    return Array.from(set);
  }, [channels]);

  // Filter channels based on category and search
  const filteredChannels = useMemo(() => {
    return channels
      .map((ch, originalIndex) => ({ ch, originalIndex }))
      .filter(({ ch }) => {
        // Category filter
        if (selectedCategory === 'FAVORITES') {
          if (!favorites.includes(ch.name)) return false;
        } else if (selectedCategory !== 'ALL') {
          if (ch.group !== selectedCategory) return false;
        }

        // Search query filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const cleanName = cleanChannelName(ch.name).toLowerCase();
          const groupName = (ch.group || '').toLowerCase();
          return cleanName.includes(query) || groupName.includes(query);
        }

        return true;
      });
  }, [channels, selectedCategory, searchQuery, favorites]);

  // Focus search input or active channel when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (activeItemRef.current) {
          activeItemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Listen to Esc key to close guide
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex pointer-events-auto select-none">
      {/* Dark frosted backdrop - click outside dismisses guide */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* JioTV+ Left Slide-over Panel */}
      <aside
        className="relative z-10 w-full max-w-md h-full bg-neutral-950/95 backdrop-blur-2xl border-r border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col transition-transform duration-300 animate-in slide-in-from-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-black font-black text-xs shadow-md">
                JIO
              </div>
              <div>
                <h2 className="text-base font-black text-white tracking-wide flex items-center gap-2">
                  Channel Guide
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                    {channels.length} CHANNELS
                  </span>
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white transition-all active:scale-90"
              title="Close Guide (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search channels, genres, shows..."
              className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 focus:border-cyan-400 rounded-xl pl-9 pr-8 py-2 text-sm text-white placeholder-neutral-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Tabs Ribbon */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs font-semibold">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                selectedCategory === 'ALL'
                  ? 'bg-cyan-500 text-black font-black shadow-[0_0_12px_rgba(0,242,254,0.4)]'
                  : 'bg-white/5 hover:bg-white/10 text-neutral-300'
              }`}
            >
              All Channels
            </button>

            {favorites.length > 0 && (
              <button
                onClick={() => setSelectedCategory('FAVORITES')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap flex items-center gap-1 transition-all ${
                  selectedCategory === 'FAVORITES'
                    ? 'bg-pink-500 text-white font-black shadow-[0_0_12px_rgba(236,72,153,0.5)]'
                    : 'bg-white/5 hover:bg-white/10 text-pink-400'
                }`}
              >
                <Heart className="w-3 h-3 fill-current" />
                <span>Favorites ({favorites.length})</span>
              </button>
            )}

            {categories.slice(0, 15).map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'bg-cyan-500 text-black font-black shadow-[0_0_12px_rgba(0,242,254,0.4)]'
                    : 'bg-white/5 hover:bg-white/10 text-neutral-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Channel List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 focus:outline-none">
          {filteredChannels.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-neutral-400">
              <Tv className="w-10 h-10 text-neutral-600 mb-2 stroke-1" />
              <p className="text-sm font-semibold text-neutral-300">No channels found</p>
              <p className="text-xs text-neutral-500 mt-1">Try another category or search term</p>
            </div>
          ) : (
            filteredChannels.map(({ ch, originalIndex }) => {
              const isActive = originalIndex === activeChannelIndex;
              const isFav = favorites.includes(ch.name);
              const cleanName = cleanChannelName(ch.name);
              const { badge: qualityBadge, resText } = getChannelQualityBadge(ch.name);

              return (
                <div
                  key={`${ch.url}-${originalIndex}`}
                  className="group relative flex items-center"
                >
                  <button
                    ref={isActive ? activeItemRef : undefined}
                    onClick={() => {
                      onSelectChannel(originalIndex);
                      onClose(); // Instant close on select just like JioTV+
                    }}
                    className={`w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-950/80 to-blue-950/40 border border-cyan-400 shadow-[0_0_20px_rgba(0,242,254,0.2)] text-white'
                        : 'bg-white/[0.03] hover:bg-white/[0.08] text-neutral-200 border border-white/5 hover:border-white/15'
                    }`}
                  >
                    {/* Channel Number */}
                    <span
                      className={`font-mono font-bold text-xs w-8 flex-shrink-0 ${
                        isActive ? 'text-cyan-400' : 'text-neutral-500'
                      }`}
                    >
                      #{originalIndex + 1}
                    </span>

                    {/* Logo / Thumbnail */}
                    <div className="w-10 h-10 rounded-lg bg-black/60 border border-white/10 p-1 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {ch.logo ? (
                        <img
                          src={ch.logo}
                          alt={cleanName}
                          className="w-full h-full object-contain filter drop-shadow"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Tv className="w-4 h-4 text-neutral-400" />
                      )}
                    </div>

                    {/* Name & Subtitle */}
                    <div className="flex-1 min-w-0 pr-8">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm truncate text-white">
                          {cleanName}
                        </span>
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-neutral-800 text-cyan-300 flex-shrink-0 border border-white/10">
                          {qualityBadge}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-neutral-400 truncate">
                        {ch.group && (
                          <span className="text-[10px] text-neutral-400 truncate">
                            {ch.group}
                          </span>
                        )}
                        {isActive && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            PLAYING
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Favorite toggle button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(ch.name);
                    }}
                    className="absolute right-3 p-2 rounded-lg text-neutral-400 hover:text-white transition-all opacity-80 hover:opacity-100"
                    title={isFav ? 'Remove Favorite' : 'Add to Favorites'}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        isFav ? 'fill-pink-500 text-pink-500' : 'text-neutral-500 hover:text-white'
                      }`}
                    />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-white/10 bg-black/40 text-[11px] text-neutral-400 flex items-center justify-between">
          <span>Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-cyan-400">G</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-cyan-400">Left Arrow</kbd> to toggle guide</span>
          <button
            onClick={onClose}
            className="text-cyan-400 font-bold hover:underline"
          >
            Back to TV
          </button>
        </div>
      </aside>
    </div>
  );
};
