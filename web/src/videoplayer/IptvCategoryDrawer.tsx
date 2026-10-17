import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  X, Tv, Clock, Heart, Folder, Settings, Search, Sparkles, 
  Film, Music, Trophy, Smile, Radio, Globe, Shield, BookOpen, 
  Check, Compass, Layers
} from 'lucide-react';
import { ArrjsTvLogo } from './ArrjsTvLogo';
import { isTvBackKey } from './useSpatialNavigation';

interface IptvCategoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  activeCategory: number;
  onSelectCategory: (index: number) => void;
  onOpenSettings: () => void;
  onOpenSearch: () => void;
  channelCounts?: Record<string, number>;
  isDrawerFocused?: boolean;
  onFocusDrawer?: () => void;
  onRequestChannelFocus?: () => void;
}

export const IptvCategoryDrawer: React.FC<IptvCategoryDrawerProps> = ({
  isOpen,
  onClose,
  categories,
  activeCategory,
  onSelectCategory,
  onOpenSettings,
  onOpenSearch,
  channelCounts = {},
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle ESC / Back
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || isTvBackKey(e)) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filtered categories based on user search
  const filteredCategories = categories.filter((cat) =>
    cat.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Category Icon resolver based on genre
  const getCategoryIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('recent')) return <Clock className="w-5 h-5 text-amber-400" />;
    if (n.includes('fav')) return <Heart className="w-5 h-5 text-pink-500 fill-pink-500/20" />;
    if (n.includes('all')) return <Layers className="w-5 h-5 text-cyan-400" />;
    if (n.includes('kid') || n.includes('animation') || n.includes('toon')) return <Smile className="w-5 h-5 text-yellow-400" />;
    if (n.includes('sport') || n.includes('cricket') || n.includes('football')) return <Trophy className="w-5 h-5 text-emerald-400" />;
    if (n.includes('movie') || n.includes('cinema') || n.includes('film')) return <Film className="w-5 h-5 text-rose-400" />;
    if (n.includes('music') || n.includes('song')) return <Music className="w-5 h-5 text-purple-400" />;
    if (n.includes('news')) return <Radio className="w-5 h-5 text-sky-400" />;
    if (n.includes('religio') || n.includes('devotion')) return <BookOpen className="w-5 h-5 text-amber-300" />;
    if (n.includes('doc')) return <Globe className="w-5 h-5 text-teal-400" />;
    return <Folder className="w-5 h-5 text-cyan-400/80" />;
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-2xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl max-h-[85vh] flex flex-col rounded-3xl iptv-cinema-dock border border-white/15 p-5 sm:p-7 shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Compass className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2">
                <span>Browse Categories</span>
                <span className="text-xs font-mono font-normal text-cyan-300 bg-cyan-950/70 px-2.5 py-0.5 rounded-full border border-cyan-500/40">
                  {categories.length} Available
                </span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Select any genre or category to explore live channels
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-all border border-white/10 active:scale-95"
            title="Close (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar inside Modal */}
        <div className="py-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-cyan-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search category (e.g. Movies, Kids, Sports)..."
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-black/60 border border-white/15 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40 transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Categories Grid (Centered & Balanced) */}
        <div className="flex-1 overflow-y-auto iptv-custom-scrollbar pr-1 py-1">
          {filteredCategories.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 text-sm">
              No categories found matching "{searchQuery}"
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-3.5">
              {filteredCategories.map((category) => {
                const originalIndex = categories.indexOf(category);
                const isActive = activeCategory === originalIndex;
                const count = channelCounts[category];

                return (
                  <button
                    key={category}
                    onClick={() => {
                      onSelectCategory(originalIndex);
                      onClose();
                    }}
                    className={`flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl text-left transition-all duration-200 border select-none group relative ${
                      isActive
                        ? 'bg-gradient-to-br from-cyan-500/25 to-indigo-500/20 border-cyan-400 ring-2 ring-cyan-400/70 shadow-[0_0_20px_rgba(0,242,254,0.35)] scale-[1.02]'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-cyan-400/50 hover:scale-[1.02]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-3">
                      <div className="p-2 rounded-xl bg-black/40 border border-white/10 group-hover:scale-110 transition-transform">
                        {getCategoryIcon(category)}
                      </div>
                      {isActive && (
                        <span className="p-1 rounded-full bg-cyan-400 text-black shadow-sm">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className={`font-bold text-sm truncate ${isActive ? 'text-white' : 'text-neutral-200 group-hover:text-white'}`}>
                        {category}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-neutral-400 mt-1 font-mono">
                        <span>{count !== undefined ? `${count} Channels` : 'Explore'}</span>
                        <span className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-white/10 font-mono text-[10px] text-neutral-300">
              Use Mouse / Remote Arrows
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenSearch();
              }}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search All Channels</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Playlist Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
