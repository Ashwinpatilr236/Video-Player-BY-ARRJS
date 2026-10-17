import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import Hls from 'hls.js';
import { Loader2, AlertCircle } from 'lucide-react';

interface LivePlayerProps {
  streamUrl: string;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onClick?: () => void;
  onDoubleClick?: () => void;
}

export interface LivePlayerHandle {
  togglePlay: () => void;
  reloadStream: () => void;
  getVideoElement: () => HTMLVideoElement | null;
}

export const LivePlayer = forwardRef<LivePlayerHandle, LivePlayerProps>(
  ({ streamUrl, onPlayStateChange, onClick, onDoubleClick }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [hasError, setHasError] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');

    const startPlayback = (video: HTMLVideoElement) => {
      video.play().then(() => {
        setIsLoading(false);
        setHasError(false);
        if (onPlayStateChange) onPlayStateChange(true);
      }).catch(() => {
        // Muted fallback on browser autoplay restrictions
        video.muted = true;
        video.play().then(() => {
          setIsLoading(false);
          setHasError(false);
          if (onPlayStateChange) onPlayStateChange(true);
        }).catch((err) => {
          console.warn('Playback blocked:', err);
          setIsLoading(false);
        });
      });
    };

    const loadStream = () => {
      const video = videoRef.current;
      if (!video || !streamUrl) return;

      setIsLoading(true);
      setHasError(false);

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      const isHls = streamUrl.includes('.m3u8') || !streamUrl.match(/\.(mp4|webm)(\?|$)/i);

      if (isHls && Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 60,
          xhrSetup: (xhr) => {
            xhr.withCredentials = false;
          },
        });
        hlsRef.current = hls;

        hls.loadSource(streamUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          startPlayback(video);
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                hlsRef.current = null;
                video.src = streamUrl;
                startPlayback(video);
                break;
            }
          }
        });
      } else {
        video.src = streamUrl;
        startPlayback(video);
      }
    };

    useEffect(() => {
      loadStream();
      return () => {
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
      };
    }, [streamUrl]);

    useImperativeHandle(ref, () => ({
      togglePlay: () => {
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) {
          video.play().catch(() => {});
          if (onPlayStateChange) onPlayStateChange(true);
        } else {
          video.pause();
          if (onPlayStateChange) onPlayStateChange(false);
        }
      },
      reloadStream: () => {
        loadStream();
      },
      getVideoElement: () => videoRef.current,
    }));

    return (
      <div
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden select-none"
      >
        {/* Authentic Broadcast Scene Backdrop (Matching Screenshot 3) */}
        <img
          src="/anupamaa_backdrop.png"
          alt="Live TV Broadcast"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Live Video Canvas */}
        <video
          ref={videoRef}
          className="relative z-10 w-full h-full object-cover"
          playsInline
          autoPlay
        />

        {/* Top-Right Channel Watermark */}
        <div className="absolute top-6 right-8 z-20 pointer-events-none flex flex-col items-center select-none opacity-90">
          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
            <span className="text-white text-xs font-black">★</span>
          </div>
          <span className="text-[10px] font-black text-white tracking-widest mt-0.5 drop-shadow-md">
            StarPlus HD
          </span>
        </div>

        {/* Subtle Tuning Spinner */}
        {isLoading && (
          <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-5 py-2.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 pointer-events-none">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            <span className="text-xs font-bold text-white tracking-wider">LIVE STREAM TUNING...</span>
          </div>
        )}

        {/* Error Fallback */}
        {hasError && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 p-6 text-center">
            <div className="flex flex-col items-center gap-3 max-w-md p-6 rounded-3xl bg-neutral-900 border border-red-500/30">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <h3 className="font-bold text-white text-base">Stream Currently Unavailable</h3>
              <p className="text-xs text-neutral-400">{errorMessage || 'Unable to connect to live stream URL. The broadcast server may be offline.'}</p>
              <button
                onClick={loadStream}
                className="mt-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
              >
                Retry Stream
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);
