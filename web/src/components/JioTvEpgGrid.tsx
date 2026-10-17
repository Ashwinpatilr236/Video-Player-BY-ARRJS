import React from 'react';
import { ChevronLeft, Heart } from 'lucide-react';
import { ChannelItem, ProgramItem } from '../types';
import { getChannelSchedule } from '../utils/demoChannels';

interface JioTvEpgGridProps {
  isOpen: boolean;
  onClose: () => void;
  channels: ChannelItem[];
  activeChannelIndex: number;
  onSelectChannel: (index: number) => void;
  categoryName: string;
  onOpenCategoryDrawer: () => void;
  favorites: (string | number)[];
  onToggleFavorite: (id: string | number) => void;
  currentTimeStr: string;
}

export const JioTvEpgGrid: React.FC<JioTvEpgGridProps> = ({
  isOpen,
  onClose,
  channels,
  activeChannelIndex,
  onSelectChannel,
  categoryName,
  onOpenCategoryDrawer,
  favorites,
  onToggleFavorite,
  currentTimeStr,
}) => {
  if (!isOpen) return null;

  // Generate 30-min time column headers based on current time
  const now = new Date();
  const currentHour = now.getHours();
  const timeSlots = [
    `${currentHour % 12 || 12}:00 ${currentHour >= 12 ? 'PM' : 'AM'}`,
    `${currentHour % 12 || 12}:30 ${currentHour >= 12 ? 'PM' : 'AM'}`,
    `${(currentHour + 1) % 12 || 12}:00 ${currentHour + 1 >= 12 ? 'PM' : 'AM'}`,
    `${(currentHour + 1) % 12 || 12}:30 ${currentHour + 1 >= 12 ? 'PM' : 'AM'}`,
    `${(currentHour + 2) % 12 || 12}:00 ${currentHour + 2 >= 12 ? 'PM' : 'AM'}`,
  ];

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute inset-x-0 bottom-0 z-40 bg-gradient-to-t from-black via-black/95 to-black/80 border-t border-white/10 backdrop-blur-2xl p-4 sm:p-6 transition-all duration-300 animate-in slide-in-from-bottom-8 shadow-2xl"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-3">
        
        {/* Top Header Row */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          {/* Left: Category switch trigger `< All` */}
          <button
            onClick={onOpenCategoryDrawer}
            className="flex items-center gap-1.5 text-white hover:text-blue-400 font-extrabold text-base sm:text-lg transition-colors group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>{categoryName || 'All'}</span>
          </button>

          {/* Right: Date & Time */}
          <div className="flex items-center gap-3">
            <span className="text-neutral-300 font-bold text-xs sm:text-sm font-mono tracking-wide">
              {currentTimeStr}
            </span>
            <button
              onClick={onClose}
              className="text-xs text-neutral-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 font-bold"
            >
              Close EPG
            </button>
          </div>
        </div>

        {/* EPG Timeline Grid Table */}
        <div className="overflow-x-auto no-scrollbar">
          <div className="min-w-[850px] flex flex-col gap-2">
            
            {/* Header Times Row */}
            <div className="flex items-center text-xs text-neutral-400 font-bold font-mono">
              <div className="w-56 flex-shrink-0 pl-2">
                Today
              </div>
              <div className="flex-1 grid grid-cols-5 gap-2">
                {timeSlots.map((slot) => (
                  <div key={slot} className="border-l border-white/20 pl-2">
                    | {slot}
                  </div>
                ))}
              </div>
            </div>

            {/* Channels & Programs Rows */}
            <div className="flex flex-col gap-2 max-h-[38vh] overflow-y-auto no-scrollbar pr-1">
              {channels.map((ch, idx) => {
                const isActive = idx === activeChannelIndex;
                const isFav = favorites.includes(ch.id);
                const schedule = getChannelSchedule(ch.channelNo);

                return (
                  <div
                    key={`${ch.id}-${idx}`}
                    className={`flex items-center rounded-2xl p-1.5 transition-all ${
                      isActive
                        ? 'bg-white/10 border border-white/20'
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {/* Left Channel Column */}
                    <div
                      onClick={() => {
                        onSelectChannel(idx);
                        onClose();
                      }}
                      className="w-56 flex-shrink-0 flex items-center justify-between pr-4 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {isActive ? (
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-neutral-600 flex-shrink-0" />
                        )}
                        <span className="font-extrabold text-sm text-white truncate">
                          {ch.channelNo} {ch.name}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(ch.id);
                        }}
                        className="text-neutral-500 hover:text-pink-500 p-1"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            isFav ? 'fill-pink-500 text-pink-500' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {/* Right Horizontal Program Blocks */}
                    <div className="flex-1 grid grid-cols-5 gap-2">
                      {schedule.slice(0, 5).map((prog, pIdx) => {
                        const isCurrentProgram = pIdx === 0 && isActive;

                        return (
                          <button
                            key={prog.id}
                            onClick={() => {
                              onSelectChannel(idx);
                              onClose();
                            }}
                            className={`px-3 py-2.5 rounded-xl text-left text-xs font-bold truncate transition-all ${
                              isCurrentProgram
                                ? 'bg-blue-600 text-white shadow-[0_4px_14px_rgba(37,99,235,0.45)]'
                                : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-white/5'
                            }`}
                            title={`${prog.title}: ${prog.desc || ''}`}
                          >
                            <span className="truncate block">{prog.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
