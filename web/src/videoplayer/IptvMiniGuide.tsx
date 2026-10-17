import React from 'react';
import { Heart, Tv, Grid, Search, Settings as SettingsIcon, Play, Pause, Maximize, LayoutGrid, Clock, ChevronRight } from 'lucide-react';
import { ChannelItem, cleanChannelName, getChannelQualityBadge } from './types';

interface IptvMiniGuideProps {
  channel: ChannelItem;
  channelIndex: number;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onOpenEpg: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onToggleFullscreen: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onToggleShelf?: () => void;
  isShelfOpen?: boolean;
  currentProgramTitle?: string;
  currentProgramDesc?: string;
  progressPercent?: number;
  timeSlotText?: string;
  timeLeftText?: string;
  nextProgramTitle?: string;
  nextProgramTime?: string;
}

export const IptvMiniGuide: React.FC<IptvMiniGuideProps> = ({
  channel,
  channelIndex,
  isFavorite,
  onToggleFavorite,
  onOpenEpg,
  onOpenSearch,
  onOpenSettings,
  onToggleFullscreen,
  isPlaying,
  onTogglePlay,
  onToggleShelf,
  isShelfOpen = false,
  currentProgramTitle = 'Live Broadcast Stream',
  currentProgramDesc = 'Broadcasting online content via Video Player by ARRJS',
  progressPercent = 45,
  timeSlotText,
  timeLeftText,
  nextProgramTitle,
  nextProgramTime,
}) => {
  const { badge: qualityBadge, resText, is4K, isFHD } = getChannelQualityBadge(channel.name);

  const badgeClass = is4K
    ? 'badge-rose-metallic'
    : isFHD
    ? 'badge-gold-metallic'
    : 'badge-cyan-metallic';

  const cleanName = cleanChannelName(channel.name);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-6xl mx-auto px-3 sm:px-6 pointer-events-auto transition-all duration-300"
    >
      <div className="iptv-cinema-dock rounded-3xl p-3.5 sm:p-5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.85)]">
        <div className="w-full flex flex-col gap-3">
          {/* Main Top Row: Left Channel Meta + Center Timeline + Right Actions */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4">
            
            {/* Left: Channel Number, Logo, Name & Badges */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-shrink-0">
              <span className="font-black text-2xl sm:text-4xl text-cyan-400 font-mono leading-none tracking-tight flex-shrink-0 drop-shadow-[0_0_12px_rgba(0,242,254,0.4)]">
                #{channelIndex + 1}
              </span>

              {channel.logo ? (
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-black/40 border border-white/15 p-1.5 flex items-center justify-center flex-shrink-0 shadow-inner overflow-hidden">
                  <img
                    src={channel.logo}
                    alt={cleanName}
                    className="w-full h-full object-contain filter drop-shadow"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-center flex-shrink-0 text-cyan-400 shadow-inner">
                  <Tv className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-extrabold text-base sm:text-xl text-white truncate tracking-wide">
                    {cleanName}
                  </h2>
                  
                  {/* Metallic Resolution Badge */}
                  <div className={`p-0.5 rounded-lg ${badgeClass} flex-shrink-0`}>
                    <div className="bg-neutral-950 px-1.5 sm:px-2 py-0.5 rounded-md flex items-center gap-1 leading-none">
                      <span className="text-[9px] font-black tracking-wider text-white">
                        {resText}
                      </span>
                      <span className="text-[8px] font-black tracking-widest text-cyan-300">
                        {qualityBadge}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-400">
                  {channel.group && (
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 text-[10px] font-medium truncate">
                      {channel.group}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Broadcast
                  </span>
                </div>
              </div>

              {/* Favorite Heart Button */}
              <button
                type="button"
                onClick={onToggleFavorite}
                className="p-2 rounded-xl hover:bg-white/10 active:scale-90 transition-all flex-shrink-0"
                title={isFavorite ? 'Remove Favorite' : 'Save to Favorites'}
              >
                <Heart
                  className={`w-5 h-5 sm:w-6 sm:h-6 ${
                    isFavorite ? 'fill-pink-500 text-pink-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.7)]' : 'text-neutral-400 hover:text-white'
                  }`}
                />
              </button>
            </div>

            {/* Right: Modern OTT Control Deck & Digital Clock */}
            <div className="flex items-center gap-2 sm:gap-2.5 w-full lg:w-auto justify-end flex-wrap flex-shrink-0">
              {/* Play / Pause Primary Action */}
              <button
                onClick={onTogglePlay}
                className="px-4 py-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 text-black font-extrabold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(0,242,254,0.5)] active:scale-95 transition-all"
                title="Play / Pause"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>

              {/* Browse Channels Shelf Toggle */}
              {onToggleShelf && (
                <button
                  onClick={onToggleShelf}
                  className={`px-3.5 py-2 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all border ${
                    isShelfOpen
                      ? 'bg-cyan-500/30 text-cyan-300 border-cyan-400/60 shadow-[0_0_15px_rgba(0,242,254,0.4)]'
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                  }`}
                  title="Browse Channel Shelf"
                >
                  <LayoutGrid className="w-4 h-4 text-cyan-400" />
                  <span>Channels</span>
                </button>
              )}

              {/* TV Guide / EPG */}
              <button
                onClick={onOpenEpg}
                className="px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-white/10"
                title="Open TV Guide / EPG (G)"
              >
                <Grid className="w-4 h-4 text-cyan-400" />
                <span>Guide</span>
              </button>

              {/* Search */}
              <button
                onClick={onOpenSearch}
                className="p-2 sm:p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10"
                title="Search Channels (/)"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Settings */}
              <button
                onClick={onOpenSettings}
                className="p-2 sm:p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10"
                title="Playlist & Stream Settings (S)"
              >
                <SettingsIcon className="w-4 h-4" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={onToggleFullscreen}
                className="p-2 sm:p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10"
                title="Fullscreen Mode (F)"
              >
                <Maximize className="w-4 h-4" />
              </button>

              {/* Digital Clock */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-black/60 border border-white/10 text-white font-mono text-xs font-bold shadow-inner ml-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>{new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
              </div>
            </div>
          </div>

          {/* Divider Line */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent w-full"></div>

          {/* Bottom Row: Program Info & Full-Width Timeline Progress */}
          <div className="flex flex-col gap-1.5 w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  LIVE NOW:
                </span>
                <span className="text-sm font-bold text-white truncate max-w-sm sm:max-w-xl">
                  {currentProgramTitle}
                </span>
                {timeSlotText && (
                  <span className="text-[10px] font-semibold text-cyan-300 font-mono bg-cyan-950/70 px-2 py-0.5 rounded-md border border-cyan-500/40">
                    {timeSlotText} {timeLeftText ? `• ${timeLeftText}` : ''}
                  </span>
                )}
              </div>

              {/* Next Program Preview */}
              {nextProgramTitle && (
                <div className="flex items-center gap-1.5 text-xs text-neutral-300 truncate">
                  <span className="text-[9px] font-black uppercase tracking-wider text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-1.5 py-0.5 rounded flex-shrink-0">
                    NEXT
                  </span>
                  <span className="text-neutral-200 font-medium truncate max-w-[200px] sm:max-w-xs">
                    {nextProgramTitle}
                  </span>
                  {nextProgramTime && (
                    <span className="text-cyan-400 font-mono text-[10px] flex-shrink-0">
                      @{nextProgramTime}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Cinematic Full-Width Progress Timeline Bar */}
            <div className="w-full h-1.5 sm:h-2 bg-white/15 rounded-full overflow-hidden relative shadow-inner mt-1">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(0,242,254,0.8)]"
                style={{ width: `${Math.min(100, Math.max(4, progressPercent))}%` }}
              />
            </div>

            <p className="text-[11px] text-neutral-400 truncate mt-0.5 hidden sm:block">
              {currentProgramDesc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
