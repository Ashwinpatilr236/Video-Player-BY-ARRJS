import React from 'react';
import { RotateCw, ChevronLeft, ChevronRight, Tv } from 'lucide-react';
import { ChannelItem, ProgramItem } from '../types';

interface JioTvInfoBannerProps {
  isVisible: boolean;
  channel: ChannelItem | null;
  currentProgram?: ProgramItem;
  nextProgram?: ProgramItem;
  remainingText?: string;
  progressPercent?: number;
  currentTimeStr: string;
  onPrevChannel: () => void;
  onNextChannel: () => void;
  onReload: () => void;
  onOpenGuide: () => void;
}

export const JioTvInfoBanner: React.FC<JioTvInfoBannerProps> = ({
  isVisible,
  channel,
  currentProgram,
  nextProgram,
  remainingText = '45 min remaining',
  progressPercent = 40,
  currentTimeStr,
  onPrevChannel,
  onNextChannel,
  onReload,
  onOpenGuide,
}) => {
  if (!channel) return null;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`absolute inset-x-0 bottom-0 z-30 transition-all duration-300 pointer-events-auto select-none ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'
      }`}
    >
      {/* Full Width JioTV+ Cinema Gradient with generous bottom clearance */}
      <div className="w-full bg-gradient-to-t from-black via-black/85 to-transparent pt-24 pb-12 px-8 sm:px-14 lg:px-20">
        <div className="w-full flex items-end justify-between gap-6 lg:gap-14">
          
          {/* Left Block: TV GUIDE Button + Show Card */}
          <div className="flex flex-col gap-3 flex-shrink-0">
            
            {/* Quick Actions Row */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={onOpenGuide}
                className="px-5 py-2 rounded-full bg-[#202124] hover:bg-neutral-800 text-white font-extrabold text-xs tracking-wider border border-white/20 transition-all active:scale-95 shadow-lg flex items-center gap-1.5"
              >
                <span>TV GUIDE</span>
              </button>

              <button
                onClick={onReload}
                className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-all active:scale-95 shadow-[0_2px_12px_rgba(37,99,235,0.5)]"
                title="Reload Stream"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            {/* Poster Card */}
            <div className="relative w-44 h-26 sm:w-48 sm:h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-neutral-900 to-neutral-950 border border-white/15 shadow-2xl">
              {currentProgram?.poster ? (
                <img
                  src={currentProgram.poster}
                  alt={currentProgram.title}
                  className="w-full h-full object-cover"
                />
              ) : channel.logo ? (
                <img
                  src={channel.logo}
                  alt={channel.name}
                  className="w-full h-full object-contain p-4"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 gap-1.5 p-3 text-center">
                  <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-blue-400">
                    <Tv className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-neutral-300 truncate w-full px-2">
                    {channel.name}
                  </span>
                </div>
              )}

              {/* Progress bar at bottom of card */}
              <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(5, progressPercent))}%` }}
                />
              </div>
            </div>

            {/* Status under Card */}
            <div className="flex flex-col">
              <span className="text-white font-black text-sm leading-tight tracking-wide">
                {remainingText}
              </span>
              <span className="text-neutral-400 text-xs font-normal mt-0.5">
                Currently Playing
              </span>
            </div>
          </div>

          {/* Center Block: Channel Name, Date & Royal Blue Program Pill */}
          <div className="flex-1 flex flex-col gap-3 pb-1">
            
            {/* Header: Channel Switcher & Date */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={onPrevChannel}
                  className="p-1 rounded-full hover:bg-white/10 text-white transition-all"
                  title="Previous Channel"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <h2 className="text-white font-black text-xl sm:text-2xl tracking-wide flex items-center gap-2.5">
                  <span>{channel.channelNo}</span>
                  <span>{channel.name}</span>
                </h2>

                <button
                  onClick={onNextChannel}
                  className="p-1 rounded-full hover:bg-white/10 text-white transition-all"
                  title="Next Channel"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              {/* Date & Time in Clean Sans */}
              <span className="text-neutral-200 font-bold text-sm tracking-wide">
                {currentTimeStr}
              </span>
            </div>

            {/* Current Program: Royal Blue Full Pill */}
            <div className="w-full px-6 py-3.5 rounded-full bg-blue-600 text-white flex items-center justify-between shadow-[0_4px_22px_rgba(37,99,235,0.5)]">
              <span className="font-extrabold text-base sm:text-lg truncate">
                {currentProgram ? currentProgram.title : 'Live Television Broadcast'}
              </span>
              <span className="text-sm font-bold opacity-95 flex-shrink-0 ml-4">
                {currentProgram ? `${formatTime(currentProgram.start)} - ${formatTime(currentProgram.stop)}` : 'Live Stream'}
              </span>
            </div>

            {/* Next Program Row */}
            {nextProgram && (
              <div className="w-full px-6 py-1.5 flex items-center justify-between text-neutral-300">
                <span className="font-medium text-sm sm:text-base truncate">
                  {nextProgram.title}
                </span>
                <span className="text-sm font-medium text-neutral-400 flex-shrink-0 ml-4">
                  {formatTime(nextProgram.start)} - {formatTime(nextProgram.stop)}
                </span>
              </div>
            )}
          </div>

          {/* Right Block: LiveTV Badge */}
          <div className="flex-shrink-0 pb-3 flex items-center gap-2 text-red-500 font-black text-sm">
            <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white text-[11px] shadow-md">
              <Tv className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="tracking-wide">LiveTV</span>
          </div>

        </div>
      </div>
    </div>
  );
};

const formatTime = (d: Date) => {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
};
