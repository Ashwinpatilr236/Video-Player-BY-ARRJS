import React, { useRef, useEffect } from 'react';

export default function EpgGrid({ channels, activeChannel, onSelectChannel, playingChannelId, epgData, favorites = [], onToggleFavorite, categoryName = "Channels" }) {
  const timeHeaderRef = useRef(null);
  const rowsRef = useRef([]);
  const activeRowRef = useRef(null);

  useEffect(() => {
    if (activeRowRef.current) {
      activeRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeChannel]);

  // Helper to remove (1080p), (720p), [Geo-blocked] etc.
  const cleanText = (text) => {
    if (!text) return '';
    return text
      .replace(/\s*[\(\[]\d+p[\)\]]/gi, '') // removes (1080p), [720p]
      .replace(/\s*\[Geo-blocked\]/gi, '') // removes [Geo-blocked]
      .trim();
  };

  // Generate mock time headers from current time
  const timeSlots = [];
  let current = new Date();
  current.setMinutes(0, 0, 0); // start of hour
  for (let i = 0; i < 12; i++) {
    timeSlots.push(new Date(current.getTime() + i * 30 * 60000));
  }

  // Handle synced horizontal scrolling
  const handleScroll = (e, index) => {
    const scrollLeft = e.target.scrollLeft;
    if (timeHeaderRef.current && index !== 'header') {
      timeHeaderRef.current.scrollLeft = scrollLeft;
    }
    rowsRef.current.forEach((row, i) => {
      if (row && i !== index) {
        row.scrollLeft = scrollLeft;
      }
    });
  };

  return (
    <div className="w-full flex flex-col overflow-hidden rounded-t-3xl" style={{ height: '400px' }}>
      {/* Header */}
      {/* Header */}
      <div className="flex items-center py-3 pr-3 mb-2 rounded-2xl text-[10px] uppercase text-gray-400 font-bold tracking-widest" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', paddingLeft: '1.5rem' }}>
        <div className="font-bold flex-shrink-0 pr-4 border-r border-white border-opacity-20" style={{ width: '19rem', minWidth: '19rem', maxWidth: '19rem' }}>{categoryName}</div>
        <div 
          className="flex-1 flex overflow-x-auto no-scrollbar pl-3" 
          ref={timeHeaderRef}
          onScroll={(e) => handleScroll(e, 'header')}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {timeSlots.map((time, i) => (
            <div key={i} className="flex-shrink-0 font-medium" style={{ width: '150px' }}>
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          ))}
        </div>
      </div>
      
      {/* Channels List */}
      <div className="flex-1 overflow-y-auto">
        {channels.map((channel, idx) => {
          
          let programs = [];
          if (epgData && epgData[channel.tvgId] && epgData[channel.tvgId].length > 0) {
            // Real EPG Data
            const now = new Date();
            programs = epgData[channel.tvgId].map(prog => {
              const isLive = now >= prog.start && now < prog.stop;
              // Estimate width based on duration (e.g., 30 mins = 150px)
              const durationMinutes = (prog.stop - prog.start) / 60000;
              const width = Math.max(100, (durationMinutes / 30) * 150);
              return { title: prog.title, width: width, isLive: isLive };
            });
          } else {
             // Mock fallback
             programs = [
               { title: 'Morning Show', width: 200, isLive: false },
               { title: channel.name + ' Special', width: 400, isLive: true },
               { title: 'News Update', width: 200, isLive: false },
               { title: 'Late Night Movie', width: 600, isLive: false },
             ];
          }

          return (
            <div 
              key={channel.id} 
              ref={activeChannel === idx ? activeRowRef : null}
              className={`flex items-center py-1 pr-3 transition-colors border-b border-white border-opacity-5 rounded-lg mb-1 ${activeChannel === idx ? 'bg-white bg-opacity-10 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.2)]' : 'hover:bg-white hover:bg-opacity-5'} ${playingChannelId === channel.id ? 'bg-accent bg-opacity-20 shadow-[inset_0_0_0_2px_#00e5ff]' : ''}`}
              style={{ paddingLeft: '1.5rem' }}
            >
              {/* Channel Info */}
              <div 
                className="overflow-hidden flex items-center gap-4 flex-shrink-0 cursor-pointer pr-4 border-r border-white border-opacity-20"
                style={{ width: '19rem', minWidth: '19rem', maxWidth: '19rem' }}
                onClick={() => onSelectChannel(idx)}
              >
                {channel.logo ? (
                  <img src={channel.logo} alt={channel.name} className="w-12 h-12 object-contain" style={{ borderRadius: '8px', backgroundColor: 'transparent' }} />
                ) : (
                  <div className="w-12 h-12 rounded bg-dark flex items-center justify-center text-[12px]" style={{ borderRadius: '8px' }}>TV</div>
                )}
                <div className="flex-1 overflow-hidden flex items-center">
                  <span className="text-gray-400 text-xs font-medium w-8 flex-shrink-0">{channel.id}</span>
                  <div className={`font-bold text-sm truncate flex-1 ${activeChannel === idx ? 'text-accent' : ''}`} title={cleanText(channel.name)}>
                    {cleanText(channel.name)}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite && onToggleFavorite(channel.id); }}
                    className="ml-2 p-1 rounded-full transition-all duration-300 hover:bg-white hover:bg-opacity-10 focus:outline-none"
                    title="Toggle Favorite"
                  >
                    {favorites.includes(channel.id) ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-pink-500 drop-shadow-md transform scale-110" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Programs Timeline */}
              <div 
                className="flex-1 flex gap-1 overflow-x-auto no-scrollbar pl-3"
                ref={el => rowsRef.current[idx] = el}
                onScroll={(e) => handleScroll(e, idx)}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {programs.map((prog, pIdx) => (
                  <div 
                    key={pIdx} 
                    className={`p-2 px-3 flex-shrink-0 cursor-pointer transition-all duration-300 ${prog.isLive && activeChannel === idx ? 'shadow-lg' : 'hover:bg-white hover:bg-opacity-10'}`}
                    style={{ 
                      width: `${prog.width}px`, 
                      backgroundColor: (prog.isLive && activeChannel === idx) ? '#ffffff' : 'rgba(20, 20, 20, 0.5)',
                      color: (prog.isLive && activeChannel === idx) ? '#000000' : '',
                      borderRadius: '16px'
                    }}
                    onClick={() => onSelectChannel(idx)}
                  >
                    <div className={`font-bold text-[13px] truncate ${prog.isLive && activeChannel === idx ? 'text-black' : 'text-gray-300'}`}>{cleanText(prog.title)}</div>
                    <div className={`text-[11px] ${prog.isLive && activeChannel === idx ? 'text-gray-800 font-bold' : 'text-gray-500'}`}>{prog.isLive ? 'Live Now' : 'Upcoming'}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
