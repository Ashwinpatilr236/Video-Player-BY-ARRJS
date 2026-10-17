import React from 'react';
import { Heart, Tv, Grid, Settings, Play, Pause, Maximize, Minimize, Clock } from 'lucide-react';
import { ChannelItem, cleanChannelName, getChannelQualityBadge } from './types';

interface JioTvLiveBannerProps {
  channel: ChannelItem | null;
  channelIndex: number;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onOpenGuide: () => void;
  onOpenSettings: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentProgramTitle?: string;
  currentProgramDesc?: string;
  progressPercent?: number;
  timeSlotText?: string;
  timeLeftText?: string;
  nextProgramTitle?: string;
  nextProgramTime?: string;
  isVisible: boolean;
}

export const JioTvLiveBanner: React.FC<JioTvLiveBannerProps> = ({
  channel,
  channelIndex,
  isFavorite,
  onToggleFavorite,
  onOpenGuide,
  onOpenSettings,
  onToggleFullscreen,
  isFullscreen,
  isPlaying,
  onTogglePlay,
  currentProgramTitle = 'Live Broadcast Stream',
  currentProgramDesc = 'Streaming live broadcast via Video Player by ARRJS',
  progressPercent = 45,
  timeSlotText,
  timeLeftText,
  nextProgramTitle,
  nextProgramTime,
  isVisible,
}) => {
  if (!channel) return null;

  const { badge: qualityBadge, resText, is4K, isFHD } = getChannelQualityBadge(channel.name);
  const cleanName = cleanChannelName(channel.name);

  const badgeClass = is4K
    ? 'badge-rose-metallic'
    : isFHD
    ? 'badge-gold-metallic'
    : 'badge-cyan-metallic';

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`absolute inset-x-0 bottom-0 z-30 transition-all duration-300 pointer-events-auto select-none ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-6 pointer-events-none'
      }`}
    >
      {/* JioTV+ Full-Width Bottom Cinema Gradient */}
      <div className="w-full bg-gradient-to-t from-black/95 via-black/85 to-transparent pt-14 pb-5 sm:pb-6 px-4 sm:px-8 md:px-12">
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-3">
          
          {/* Main Top Row: Left Channel Info + Right Action Buttons */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            
            {/* Left: Channel Number, Logo, Clean Name, Quality Badge & Favorite */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <span className="font-mono font-black text-2xl sm:text-3xl text-cyan-400 drop-shadow-[0_0_12px_rgba(0,242,254,0.4)] flex-shrink-0">
                #{channelIndex + 1}
              </span>

              {channel.logo ? (
                <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl bg-black/50 border border-white/15 p-1 flex items-center justify-center flex-shrink-0 shadow-inner overflow-hidden">
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
                <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl bg-neutral-900 border border-white/10 flex items-center justify-center flex-shrink-0 text-cyan-400 shadow-inner">
                  <Tv className="w-6 h-6" />
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-black text-base sm:text-xl text-white truncate tracking-wide">
                    {cleanName}
                  </h2>

                  {/* Resolution Badge */}
                  <div className={`p-0.5 rounded-md ${badgeClass} flex-shrink-0`}>
                    <div className="bg-neutral-950 px-1.5 py-0.5 rounded flex items-center gap-1 leading-none">
                      <span className="text-[9px] font-black tracking-wider text-white">{resText}</span>
                      <span className="text-[8px] font-black tracking-widest text-cyan-300">{qualityBadge}</span>
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
                    LIVE
                  </span>
                </div>
              </div>

              {/* 1-Click Favorite Toggle */}
              <button
                type="button"
                onClick={onToggleFavorite}
                className="p-2 rounded-xl hover:bg-white/10 active:scale-90 transition-all flex-shrink-0"
                title={isFavorite ? 'Remove Favorite' : 'Save to Favorites'}
              >
                <Heart
                  className={`w-5 h-5 sm:w-6 sm:h-6 ${
                    isFavorite
                      ? 'fill-pink-500 text-pink-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.7)]'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                />
              </button>
            </div>

            {/* Right: JioTV+ Clean Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Play / Pause */}
              <button
                onClick={onTogglePlay}
                className="px-4 py-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 text-black font-extrabold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(0,242,254,0.5)] active:scale-95 transition-all"
                title="Play / Pause (Space)"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>

              {/* TV Guide / Channel List */}
              <button
                onClick={onOpenGuide}
                className="px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all border border-white/15 active:scale-95 shadow-md"
                title="Open Channel Guide (Left Arrow or G)"
              >
                <Grid className="w-4 h-4 text-cyan-400" />
                <span>Guide</span>
              </button>

              {/* Settings */}
              <button
                onClick={onOpenSettings}
                className="p-2 sm:p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-all border border-white/15 active:scale-95"
                title="Settings & Playlist (S)"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={onToggleFullscreen}
                className="p-2 sm:p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-all border border-white/15 active:scale-95"
                title="Toggle Fullscreen (F)"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>

              {/* Real-time Clock */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-black/60 border border-white/10 text-white font-mono text-xs font-bold shadow-inner ml-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>{new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent w-full"></div>

          {/* Bottom Row: Program Info & Sleek Timeline Progress */}
          <div className="flex flex-col gap-1.5 w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1">
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

            {/* Clean Progress Timeline Bar */}
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
