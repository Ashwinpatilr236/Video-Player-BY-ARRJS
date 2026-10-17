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
  Settings
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
    { id: 'Favourites', label: 'Favourites', icon: <Heart className="w-5 h-5" /> },
    { id: 'My Reminders', label: 'My Reminders', icon: <Bell className="w-5 h-5" /> },
    { id: 'HD Channels', label: 'HD Channels', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'Kids', label: 'Kids', icon: <Baby className="w-5 h-5" /> },
    { id: 'Entertainment', label: 'Entertainment', icon: <Film className="w-5 h-5" /> },
    { id: 'Movies', label: 'Movies', icon: <Clapperboard className="w-5 h-5" /> },
    { id: 'Sports', label: 'Sports', icon: <Trophy className="w-5 h-5" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex pointer-events-auto select-none font-sans">
      {/* Dark Blurred Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* JioTV+ Left Guide Menu Matching Screenshot 2 Exactly */}
      <aside
        ref={drawerRef}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-92 h-full bg-[#0a0a0c]/95 backdrop-blur-2xl border-r border-white/5 shadow-[0_0_80px_rgba(0,0,0,0.95)] flex flex-col pt-10 pb-8 px-8 animate-in slide-in-from-left duration-300"
      >
        {/* Title: Guide */}
        <h1 className="text-3xl font-black text-white tracking-wide mb-6">
          Guide
        </h1>

        {/* Switch to JioTV+ Pill */}
        <button
          onClick={() => {
            onSelectCategory('All');
            onClose();
          }}
          className="w-full flex items-center gap-3.5 py-3 rounded-full text-white/90 hover:text-white hover:bg-white/5 text-base font-bold transition-all mb-3 text-left"
        >
          <RotateCw className="w-5 h-5 text-white flex-shrink-0" />
          <span>Switch To JioTV+</span>
        </button>

        {/* Category List Matching Android TV / Screenshot 2 */}
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
                className={`w-full flex items-center gap-4 px-6 py-3.5 rounded-full text-base font-bold transition-all text-left ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-[0_4px_20px_rgba(37,99,235,0.45)]'
                    : 'text-neutral-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-neutral-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Subtle Bottom Settings Option */}
        <div className="pt-4 border-t border-white/10 mt-2">
          <button
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="w-full flex items-center gap-3 px-5 py-3 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white text-sm font-semibold transition-all"
          >
            <Settings className="w-4 h-4 text-blue-400" />
            <span>Playlist & IPTV Sources</span>
          </button>
        </div>
      </aside>
    </div>
  );
};
