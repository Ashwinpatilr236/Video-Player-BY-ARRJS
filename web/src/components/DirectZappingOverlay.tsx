import React from 'react';
import { ChannelItem } from '../types';

interface DirectZappingOverlayProps {
  typedDigits: string;
  channels: ChannelItem[];
}

export const DirectZappingOverlay: React.FC<DirectZappingOverlayProps> = ({
  typedDigits,
  channels,
}) => {
  if (!typedDigits) return null;

  const targetNo = parseInt(typedDigits, 10);
  const targetChannel = channels.find((c) => c.channelNo === targetNo);

  return (
    <div className="absolute top-8 right-8 z-50 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-150">
      <div className="px-6 py-4 rounded-2xl bg-black/90 border border-blue-500/50 shadow-[0_0_40px_rgba(37,99,235,0.4)] backdrop-blur-xl flex items-center gap-4">
        <div className="font-mono font-black text-4xl text-blue-400 tracking-widest leading-none">
          {typedDigits}
          <span className="animate-pulse text-blue-200">_</span>
        </div>

        {targetChannel && (
          <div className="border-l border-white/20 pl-4 flex flex-col">
            <span className="text-[10px] uppercase font-black tracking-widest text-blue-400">
              TUNING TO
            </span>
            <span className="font-bold text-white text-sm truncate max-w-xs">
              {targetChannel.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
