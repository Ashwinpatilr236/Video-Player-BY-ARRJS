import React from 'react';
import { VideoPlayerTool } from './VideoPlayerTool';

export default function App() {
  const handleExitToHome = () => {
    // In standalone web mode, exiting brings back intro/preset screen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative">
      <VideoPlayerTool onExitToHome={handleExitToHome} />
    </div>
  );
}
