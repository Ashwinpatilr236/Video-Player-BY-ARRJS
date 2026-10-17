import React, { useEffect, useRef } from 'react';
import {
  RotateCw,
  Radio,
  Search,
  Clock,
  Heart,
  Bell,
  Sparkles,
  Baby,
  Film,
  Clapperboard,
  Trophy,
  Settings,
  X
} from 'lucide-react';

interface JioTvGuideDrawerProps {
  isOpen: boolean;
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  onOpenSettings: () => void;
  onClose: () => void;
  favoritesCount: number;
}

export const JioTvGuideDrawer: React.FC<JioTvGuideDrawerProps> = ({
  isOpen,
  activeCategory,
  onSelectCategory,
  onOpenSettings,
  onClose,
  favoritesCount,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

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

  const menuItems = [
    { id: 'All', label: 'All', icon: <Radio className="w-5 h-5" /> },
    { id: 'Search', label: 'Search', icon: <Search className="w-5 h-5" /> },
    { id: 'Recently Viewed', label: 'Recently Viewed', icon: <Clock className="w-5 h-5" /> },
    { id: 'Favourites', label: 'Favourites', icon: <Heart className="w-5 h-5" />, count: favoritesCount },
    { id: 'My Reminders', label: 'My Reminders', icon: <Bell className="w-5 h-5" /> },
    { id: 'HD Channels', label: 'HD Channels', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'Kids', label: 'Kids', icon: <Baby className="w-5 h-5" /> },
    { id: 'Entertainment', label: 'Entertainment', icon: <Film className="w-5 h-5" /> },
    { id: 'Movies', label: 'Movies', icon: <Clapperboard className="w-5 h-5" /> },
    { id: 'Sports', label: 'Sports', icon: <Trophy className="w-5 h-5" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex pointer-events-auto select-none">
      {/* Dark Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
      />

      {/* JioTV+ Left Guide Menu */}
      <aside
        ref={drawerRef}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-80 h-full bg-neutral-950/95 backdrop-blur-2xl border-r border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.95)] flex flex-col p-6 animate-in slide-in-from-left duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-white tracking-wide">
            Guide
          </h1>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-all"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Switch to JioTV+ Pill */}
        <button
          onClick={() => {
            onSelectCategory('All');
            onClose();
          }}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-white/90 hover:text-white hover:bg-white/10 text-sm font-bold transition-all mb-2"
        >
          <RotateCw className="w-4 h-4" />
          <span>Switch To JioTV+</span>
        </button>

        {/* Category List */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-1.5 pr-1">
          {menuItems.map((item) => {
            const isActive = activeCategory === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectCategory(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-[0_4px_16px_rgba(37,99,235,0.45)]'
                    : 'text-neutral-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span className={isActive ? 'text-white' : 'text-neutral-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.count !== undefined && item.count > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-mono">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Settings Button */}
        <div className="pt-4 mt-2 border-t border-white/10">
          <button
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs tracking-wider border border-white/10 transition-all shadow-md active:scale-95"
          >
            <Settings className="w-4 h-4 text-blue-400" />
            <span>PLAYLIST & SETTINGS</span>
          </button>
        </div>
      </aside>
    </div>
  );
};
