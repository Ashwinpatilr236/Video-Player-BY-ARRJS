import React, { useEffect, useRef, forwardRef } from 'react';
import Hls from 'hls.js';

const VideoPlayer = forwardRef(({ streamUrl, aspectRatio = 'cover', onHlsReady }, ref) => {
  const internalVideoRef = useRef(null);
  
  // Use either the forwarded ref or the internal one
  const videoRef = ref || internalVideoRef;

  useEffect(() => {
    let hls;
    if (videoRef.current && streamUrl) {
      const video = videoRef.current;

      const playVideo = () => {
        video.play().catch(err => {
          console.warn("Autoplay with sound prevented, attempting muted playback:", err);
          video.muted = true;
          video.play().catch(e => console.error("Muted playback also failed:", e));
        });
      };

      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: false,
          lowLatencyMode: true,
          backBufferLength: 90,
          xhrSetup: function(xhr, url) {
            xhr.withCredentials = false;
          }
        });
        
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (onHlsReady) onHlsReady(hls);
          playVideo();
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.warn('HLS Network error, attempting recovery...');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.warn('HLS Media error, attempting recovery...');
                hls.recoverMediaError();
                break;
              default:
                console.warn('Fatal HLS error, switching to direct video src...');
                hls.destroy();
                video.src = streamUrl;
                playVideo();
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl') || video.canPlayType('video/mp4')) {
        // Fallback for Safari & native browser video playback
        video.src = streamUrl;
        video.addEventListener('loadedmetadata', playVideo);
      } else {
        video.src = streamUrl;
        playVideo();
      }
    }
    
    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [streamUrl]);

  return (
    <video 
      ref={videoRef}
      className={`w-full h-full transition-all duration-300 ${aspectRatio === 'contain' ? 'object-contain' : aspectRatio === 'stretch' ? 'object-fill' : 'object-cover'}`}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, backgroundColor: '#000000' }}
      autoPlay 
      playsInline
      controls={false}
    />
  );
});

export default VideoPlayer;
