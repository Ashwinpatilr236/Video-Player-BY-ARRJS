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
        {/* Live Video Canvas */}
        <video
          ref={videoRef}
          className="relative z-10 w-full h-full object-contain bg-black"
          playsInline
          autoPlay
        />

        {/* Subtle Tuning Spinner */}
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 pointer-events-none">
            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-black/80 backdrop-blur-md border border-white/10 shadow-2xl">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              <span className="text-xs font-bold text-white tracking-wider">TUNING LIVE STREAM...</span>
            </div>
          </div>
        )}

        {/* Error Fallback */}
        {hasError && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/85 p-6 text-center">
            <div className="flex flex-col items-center gap-3 max-w-md p-8 rounded-3xl bg-neutral-900 border border-red-500/30">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <h3 className="font-bold text-white text-base">Stream Currently Unavailable</h3>
              <p className="text-xs text-neutral-400">{errorMessage || 'Unable to connect to live stream URL. The broadcast server may be offline.'}</p>
              <button
                onClick={loadStream}
                className="mt-2 px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
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
