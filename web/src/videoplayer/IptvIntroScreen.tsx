import React, { useState, useRef } from 'react';
import {
  Play,
  ShieldCheck,
  Upload,
  Globe,
  HelpCircle,
  Mail,
  ChevronRight,
  Sparkles,
  Bookmark,
  Layers,
  Cpu,
  Copy,
  Check,
  ArrowDown,
  Server,
  RefreshCw,
  Eye,
  EyeOff,
  Dice5,
  Settings,
  AlertCircle,
  Radio,
  Sliders
} from 'lucide-react';
import { ArrjsTvLogo } from './ArrjsTvLogo';
import { getXtreamM3uUrl } from './xtreamClient';
import { formatMacAddress, generateRandomMagMac } from './stalkerClient';
import { useSpatialNavigation } from './useSpatialNavigation';

interface IptvIntroScreenProps {
  onComplete: () => void;
  onRequestFullscreen?: () => void;
  onRequestOpenSettings?: () => void;
  onSavePlaylistUrl?: (url: string) => Promise<void>;
  onLoginXtream?: (server: string, user: string, pass: string) => Promise<void>;
  onLoginStalker?: (portalUrl: string, macAddress: string) => Promise<void>;
}

export const IptvIntroScreen: React.FC<IptvIntroScreenProps> = ({
  onComplete,
  onRequestFullscreen,
  onRequestOpenSettings,
  onSavePlaylistUrl,
  onLoginXtream,
  onLoginStalker,
}) => {
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [showBookmarkToast, setShowBookmarkToast] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'m3u' | 'xtream' | 'stalker'>('m3u');

  // Direct configuration state on the landing page
  const [introM3uUrl, setIntroM3uUrl] = useState<string>('');
  const [introXtreamServer, setIntroXtreamServer] = useState<string>('');
  const [introXtreamUser, setIntroXtreamUser] = useState<string>('');
  const [introXtreamPass, setIntroXtreamPass] = useState<string>('');
  const [showXtreamPass, setShowXtreamPass] = useState<boolean>(false);
  const [introStalkerUrl, setIntroStalkerUrl] = useState<string>('');
  const [introStalkerMac, setIntroStalkerMac] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const guideSectionRef = useRef<HTMLDivElement>(null);

  const handleFinish = (withFullscreen = false) => {
    setIsFadingOut(true);
    setTimeout(() => {
      if (withFullscreen && onRequestFullscreen) {
        onRequestFullscreen();
      }
      onComplete();
    }, 350);
  };

  const handleOpenSettingsFromIntro = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      if (onRequestOpenSettings) {
        onRequestOpenSettings();
      } else {
        onComplete();
      }
    }, 250);
  };

  useSpatialNavigation(containerRef, {
    enabled: !isFadingOut,
    onBack: () => handleFinish(false),
  });

  const handleBookmarkClick = () => {
    try {
      if (typeof window !== 'undefined') {
        navigator.clipboard.writeText(window.location.href);
        setCopiedUrl(true);
      }
    } catch {
      // ignore
    }
    setShowBookmarkToast(true);
    setTimeout(() => {
      setShowBookmarkToast(false);
      setCopiedUrl(false);
    }, 4500);
  };

  const scrollToGuide = () => {
    guideSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePasteInto = async (setter: (val: string) => void) => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setter(text.trim());
    } catch {
      // fallback
    }
  };

  // Direct Submission Handlers
  const handleDirectM3uConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!introM3uUrl.trim()) return;
    setStatusMessage(null);
    setLoading(true);
    try {
      if (onSavePlaylistUrl) {
        await onSavePlaylistUrl(introM3uUrl.trim());
        handleFinish();
      } else {
        handleOpenSettingsFromIntro();
      }
    } catch (err: unknown) {
      setStatusMessage({
        text: err instanceof Error ? err.message : 'Could not fetch remote playlist. Check URL or use Local File tab in Settings.',
        isError: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDirectXtreamConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!introXtreamServer.trim() || !introXtreamUser.trim() || !introXtreamPass.trim()) return;
    setStatusMessage(null);
    setLoading(true);
    try {
      if (onLoginXtream) {
        await onLoginXtream(introXtreamServer.trim(), introXtreamUser.trim(), introXtreamPass.trim());
        handleFinish();
      } else {
        handleOpenSettingsFromIntro();
      }
    } catch (err: unknown) {
      setStatusMessage({
        text: err instanceof Error ? err.message : 'Xtream authentication failed. Check credentials or server URL.',
        isError: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDirectStalkerConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!introStalkerUrl.trim() || !introStalkerMac.trim()) return;
    setStatusMessage(null);
    setLoading(true);
    try {
      if (onLoginStalker) {
        await onLoginStalker(introStalkerUrl.trim(), introStalkerMac.trim());
        handleFinish();
      } else {
        handleOpenSettingsFromIntro();
      }
    } catch (err: unknown) {
      setStatusMessage({
        text: err instanceof Error ? err.message : 'Stalker portal handshake failed. Check portal URL and registered MAC.',
        isError: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const generatedIntroXtreamM3u =
    introXtreamServer && introXtreamUser && introXtreamPass
      ? getXtreamM3uUrl(introXtreamServer, introXtreamUser, introXtreamPass)
      : '';

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[100] bg-[#03060c] text-white transition-all duration-300 overflow-y-auto iptv-custom-scrollbar scroll-smooth ${
        isFadingOut ? 'opacity-0 scale-[1.01] pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* High-End Atmospheric Background Lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden select-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[950px] h-[600px] bg-gradient-to-b from-cyan-500/15 via-blue-600/10 to-transparent rounded-full blur-[160px]" />
        <div className="absolute top-1/2 -right-40 w-[600px] h-[500px] bg-indigo-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 -left-32 w-[650px] h-[450px] bg-violet-600/10 rounded-full blur-[160px]" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40" />
      </div>

      {/* Bookmark Toast Notification */}
      {showBookmarkToast && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 p-4 max-w-sm rounded-2xl bg-neutral-900/95 border border-cyan-400/50 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 flex-shrink-0 mt-0.5">
              <Bookmark className="w-4 h-4 fill-cyan-400/40" />
            </div>
            <div>
              <div className="text-xs font-bold text-white mb-0.5 flex items-center gap-1.5">
                <span>Bookmark ARRJS Video Player</span>
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <p className="text-[11px] text-neutral-300 leading-relaxed">
                Press <kbd className="px-1.5 py-0.5 rounded bg-black/60 border border-white/20 text-cyan-300 font-mono font-bold">Ctrl + D</kbd> (or <kbd className="px-1.5 py-0.5 rounded bg-black/60 border border-white/20 text-cyan-300 font-mono font-bold">⌘ + D</kbd> on Mac) to bookmark for instant access!
              </p>
              {copiedUrl && (
                <div className="mt-2 text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Player URL copied to clipboard</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sticky Glass Navbar */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-[#03060c]/85 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo & Version */}
          <div className="flex items-center gap-3">
            <ArrjsTvLogo size="md" showText={true} />
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-gradient-to-r from-cyan-400/20 to-sky-400/20 border border-cyan-400/30 text-cyan-300 font-mono tracking-wider shadow-sm">
              <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span>Smart TV Engine</span>
            </span>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleOpenSettingsFromIntro}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
              title="Open Settings & Stream Sources"
            >
              <Settings className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden xs:inline">Settings</span>
            </button>

            <button
              type="button"
              onClick={handleBookmarkClick}
              className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
              title="Bookmark in browser"
            >
              <Bookmark className="w-3.5 h-3.5 fill-cyan-400/20" />
              <span className="hidden xs:inline">Bookmark</span>
            </button>

            <button
              type="button"
              onClick={() => handleFinish(true)}
              className="px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black text-xs font-black transition-all shadow-md shadow-cyan-500/20 active:scale-95 flex items-center gap-1 cursor-pointer"
            >
              <span>Launch Player</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Content Wrapper */}
      <main className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-8">
        {/* ========================================================= */}
        {/* HERO SECTION: FILLS FIRST SCREEN CLEANLY                  */}
        {/* ========================================================= */}
        <section className="min-h-[calc(100vh-5rem)] flex flex-col justify-between py-6 sm:py-10 text-center">
          {/* Top Hero Text Group */}
          <div className="flex flex-col items-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-cyan-500/15 via-sky-500/15 to-indigo-500/15 border border-cyan-400/30 text-cyan-300 text-[11px] sm:text-xs font-bold uppercase tracking-widest shadow-md mb-4 sm:mb-5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Pure Client-Side IPTV Player</span>
            </div>

            {/* Heading */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white font-display max-w-4xl leading-tight">
              Welcome to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 drop-shadow-[0_4px_24px_rgba(0,240,255,0.4)]">
                ARRJS Video Player
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-3 sm:mt-4 text-xs sm:text-base text-neutral-300 font-normal leading-relaxed max-w-2xl mx-auto">
              Your high-performance Smart Video Player for streaming online media, M3U playlists, Xtream Codes API, and MAG Stalker portals directly in your browser.
            </p>

            {/* Primary Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md">
              <button
                type="button"
                data-autofocus
                onClick={() => handleFinish(true)}
                className="w-full sm:flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 active:scale-95 text-black font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-cyan-400/25 group cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                <span>Enter Player Experience</span>
                <ChevronRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={scrollToGuide}
                className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all border border-white/15 cursor-pointer"
              >
                <ArrowDown className="w-4 h-4 text-cyan-400" />
                <span>Connect Streams</span>
              </button>
            </div>
          </div>

          {/* 3 Balanced Feature & Transparency Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 w-full text-left my-6 sm:my-8">
            {/* Card 1: Add M3U, Xtream & MAC */}
            <div className="p-5 sm:p-6 rounded-3xl bg-neutral-900/60 border border-cyan-500/25 hover:border-cyan-400/50 backdrop-blur-xl transition-all flex flex-col justify-between group shadow-xl hover:-translate-y-0.5 duration-300">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400 mb-3 shadow-md group-hover:scale-105 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-white mb-1.5 flex items-center justify-between">
                  <span>Add M3U, Xtream & MAC</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                    Multi-Source
                  </span>
                </h2>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Connect your subscriptions via remote M3U / M3U8 links, Xtream Codes API (User & Pass), or Stalker MAG Portal MAC.
                </p>
              </div>

              <button
                type="button"
                onClick={scrollToGuide}
                className="mt-4 w-full py-2.5 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all group-hover:border-cyan-400/60 cursor-pointer"
              >
                <span>Configure Streams</span>
                <ArrowDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
              </button>
            </div>

            {/* Card 2: 100% In-Browser & We Do Not Host */}
            <div className="p-5 sm:p-6 rounded-3xl bg-neutral-900/60 border border-white/10 hover:border-emerald-500/40 backdrop-blur-xl transition-all flex flex-col justify-between group shadow-xl hover:-translate-y-0.5 duration-300">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 shadow-md group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-white mb-1.5 flex items-center justify-between">
                  <span>We Do Not Host Any IPTV</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Client-Side
                  </span>
                </h2>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  ARRJS provides purely client-side player technology. We do not host, broadcast, archive, or transmit any video streams.
                </p>
              </div>

              <div className="mt-4 py-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center gap-1.5 text-xs text-emerald-300 font-semibold">
                <Check className="w-3.5 h-3.5" />
                <span>100% In-Browser Playback</span>
              </div>
            </div>

            {/* Card 3: Open Demonstrations & Support */}
            <div className="p-5 sm:p-6 rounded-3xl bg-neutral-900/60 border border-white/10 hover:border-indigo-400/40 backdrop-blur-xl transition-all flex flex-col justify-between group shadow-xl hover:-translate-y-0.5 duration-300">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-400/30 flex items-center justify-center text-indigo-400 mb-3 shadow-md group-hover:scale-105 transition-transform">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-white mb-1.5 flex items-center justify-between">
                  <span>Open Streams & Support</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                    Open HLS
                  </span>
                </h2>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Demonstration test streams are public benchmark streams widely available on the web. Feel free to contact our team.
                </p>
              </div>

              <a
                href="mailto:support@arrjs.in?subject=ARRJS%20Video%20Player%20Inquiry"
                className="mt-4 w-full py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-neutral-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                <span>Feel Free to Reach Out</span>
              </a>
            </div>
          </div>

          {/* Bottom Fold Cue Button */}
          <div className="flex justify-center pb-2">
            <button
              type="button"
              onClick={scrollToGuide}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/30 text-xs font-bold text-cyan-300 hover:text-white transition-all cursor-pointer group shadow-md"
            >
              <span>Scroll down for Stream Settings & Setup Console</span>
              <ArrowDown className="w-3.5 h-3.5 text-cyan-400 animate-bounce group-hover:translate-y-0.5" />
            </button>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 2: STREAM SETTINGS & INTERACTIVE SETUP CONSOLE     */}
        {/* ========================================================= */}
        <section ref={guideSectionRef} className="min-h-screen flex flex-col justify-center py-16 sm:py-24 border-t border-white/10 scroll-mt-20">
          <div className="text-center space-y-3 mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-bold uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Connect Streams & Setup Console</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Connect M3U, Xtream Codes & MAC Portal
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-xl mx-auto">
              Enter your subscription link or credentials below to start streaming immediately. On TV, use your remote arrows to navigate.
            </p>
          </div>

          {/* Status / Error Banner */}
          {statusMessage && (
            <div
              className={`p-4 rounded-2xl text-xs sm:text-sm flex items-center gap-3 max-w-xl mx-auto mb-8 shadow-lg ${
                statusMessage.isError
                  ? 'bg-red-500/20 border border-red-500/40 text-red-200'
                  : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-200'
              }`}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Tab Navigation Selector */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-black/60 border border-white/15 max-w-md mx-auto shadow-2xl mb-8">
            <button
              type="button"
              onClick={() => setActiveGuideTab('m3u')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeGuideTab === 'm3u'
                  ? 'bg-gradient-to-r from-cyan-400 to-sky-400 text-black shadow-lg font-black'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>M3U Playlist</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveGuideTab('xtream')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeGuideTab === 'xtream'
                  ? 'bg-gradient-to-r from-cyan-400 to-sky-400 text-black shadow-lg font-black'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Xtream Codes</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveGuideTab('stalker')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeGuideTab === 'stalker'
                  ? 'bg-gradient-to-r from-cyan-400 to-sky-400 text-black shadow-lg font-black'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>MAC Portal</span>
            </button>
          </div>

          {/* ========================================================= */}
          {/* TAB 1: M3U PLAYLIST CONFIGURATION & GUIDE                  */}
          {/* ========================================================= */}
          {activeGuideTab === 'm3u' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl bg-neutral-900/60 border border-cyan-500/30 p-6 sm:p-10 backdrop-blur-2xl shadow-2xl animate-in fade-in duration-200">
              {/* Left Column: Instructions & Setup Tips */}
              <div className="lg:col-span-6 space-y-5 text-left">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-400/30 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Option 1: M3U / M3U8 Subscription Link</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Add Remote M3U URL or Local File
                </h3>

                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                  Connect your live TV subscription using standard M3U playlists with full category breakdown and EPG electronic program guide support.
                </p>

                <div className="space-y-4 pt-1">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white">Paste Remote M3U URL</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        Enter your provider link directly on the right or access full settings.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white">Bypass Browser CORS with Local File</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        If your remote host restricts browser requests, download the <code className="text-cyan-300 bg-white/5 px-1 py-0.5 rounded">.m3u</code> file and drag & drop it inside Settings!
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleOpenSettingsFromIntro}
                    className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Open Settings Modal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFinish(false)}
                    className="py-2.5 px-4 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Launch Default Channels</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right Column: Working Direct Form */}
              <form
                onSubmit={handleDirectM3uConnect}
                className="lg:col-span-6 p-6 sm:p-7 rounded-2xl bg-black/80 border border-cyan-500/30 shadow-2xl backdrop-blur-md space-y-4 text-left"
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Direct M3U Connect</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Instant Stream
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider">
                    Enter Playlist URL (.m3u / .m3u8)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="url"
                      value={introM3uUrl}
                      onChange={(e) => setIntroM3uUrl(e.target.value)}
                      placeholder="https://provider.com/get.php?username=...&type=m3u_plus"
                      className="w-full bg-neutral-900 border border-white/15 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl pl-3 pr-20 py-2.5 text-xs text-white outline-none font-mono placeholder:text-neutral-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => handlePasteInto(setIntroM3uUrl)}
                      className="absolute right-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Paste</span>
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-[11px] text-neutral-300 leading-relaxed">
                  💡 <strong>Pro Tip:</strong> You can also drag & drop any <code className="text-cyan-300">.m3u</code> file directly from your computer inside Settings for 100% private, CORS-free playback.
                </div>

                <button
                  type="submit"
                  disabled={loading || !introM3uUrl.trim()}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-400/20 disabled:opacity-40 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Loading Channels...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Connect M3U & Launch Player</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: XTREAM CODES API CONFIGURATION & GUIDE              */}
          {/* ========================================================= */}
          {activeGuideTab === 'xtream' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl bg-neutral-900/60 border border-cyan-500/30 p-6 sm:p-10 backdrop-blur-2xl shadow-2xl animate-in fade-in duration-200">
              {/* Left Column */}
              <div className="lg:col-span-6 space-y-5 text-left">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-400/30 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Option 2: Xtream Codes API Login</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Server URL, Username & Password
                </h3>

                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                  Log in directly with your Xtream account credentials. The player connects directly to the server endpoints to retrieve categories and live streams.
                </p>

                <div className="space-y-4 pt-1">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white">Enter Server Host & Port</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        Example: <code className="text-cyan-300 bg-white/5 px-1 py-0.5 rounded">http://line.provider.com:8080</code>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white">Enter Username & Password</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        Your account credentials with password visibility toggle.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleOpenSettingsFromIntro}
                    className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Open Settings Modal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFinish(false)}
                    className="py-2.5 px-4 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Launch Default Channels</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right Column: Xtream Form */}
              <form
                onSubmit={handleDirectXtreamConnect}
                className="lg:col-span-6 p-6 sm:p-7 rounded-2xl bg-black/80 border border-cyan-500/30 shadow-2xl backdrop-blur-md space-y-3.5 text-left"
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Xtream API Direct Login</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    REST API
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-neutral-400">Server Host / URL</label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={introXtreamServer}
                      onChange={(e) => setIntroXtreamServer(e.target.value)}
                      placeholder="http://iptv-server.com:8080"
                      className="w-full bg-neutral-900 border border-white/15 focus:border-cyan-400 rounded-xl pl-3 pr-16 py-2.5 text-xs text-white font-mono placeholder:text-neutral-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handlePasteInto(setIntroXtreamServer)}
                      className="absolute right-1.5 px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-neutral-300 text-[10px] font-semibold cursor-pointer"
                    >
                      Paste
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-neutral-400">Username</label>
                    <input
                      type="text"
                      value={introXtreamUser}
                      onChange={(e) => setIntroXtreamUser(e.target.value)}
                      placeholder="Username"
                      className="w-full bg-neutral-900 border border-white/15 focus:border-cyan-400 rounded-xl px-3 py-2.5 text-xs text-white font-mono placeholder:text-neutral-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-neutral-400">Password</label>
                    <div className="relative flex items-center">
                      <input
                        type={showXtreamPass ? 'text' : 'password'}
                        value={introXtreamPass}
                        onChange={(e) => setIntroXtreamPass(e.target.value)}
                        placeholder="Password"
                        className="w-full bg-neutral-900 border border-white/15 focus:border-cyan-400 rounded-xl pl-3 pr-9 py-2.5 text-xs text-white font-mono placeholder:text-neutral-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowXtreamPass(!showXtreamPass)}
                        className="absolute right-2 text-neutral-400 hover:text-white cursor-pointer"
                      >
                        {showXtreamPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {generatedIntroXtreamM3u ? (
                  <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-[11px] text-cyan-200 font-mono truncate">
                    Direct M3U: {generatedIntroXtreamM3u}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading || !introXtreamServer.trim() || !introXtreamUser.trim() || !introXtreamPass.trim()}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-400/20 disabled:opacity-40 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authenticating Xtream...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Connect Xtream & Launch Player</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: STALKER / MAG PORTAL CONFIGURATION & GUIDE         */}
          {/* ========================================================= */}
          {activeGuideTab === 'stalker' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl bg-neutral-900/60 border border-cyan-500/30 p-6 sm:p-10 backdrop-blur-2xl shadow-2xl animate-in fade-in duration-200">
              {/* Left Column */}
              <div className="lg:col-span-6 space-y-5 text-left">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-400/30 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Option 3: Stalker MAG Portal MAC</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Stalker Portal URL & Device MAC
                </h3>

                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                  Authenticate using your portal URL and registered MAG Box MAC address (e.g. 00:1A:79:XX:XX:XX) using client-side token handshakes.
                </p>

                <div className="space-y-4 pt-1">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white">Enter Stalker Portal URL</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        Example: <code className="text-cyan-300 bg-white/5 px-1 py-0.5 rounded">http://mag.provider.com/c/</code>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white">Enter or Generate Device MAC</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        Standard 12-character hex MAC address formatted with colons.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleOpenSettingsFromIntro}
                    className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Open Settings Modal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFinish(false)}
                    className="py-2.5 px-4 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Launch Default Channels</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right Column: Stalker Form */}
              <form
                onSubmit={handleDirectStalkerConnect}
                className="lg:col-span-6 p-6 sm:p-7 rounded-2xl bg-black/80 border border-cyan-500/30 shadow-2xl backdrop-blur-md space-y-3.5 text-left"
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Stalker Portal Handshake</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    MAG 250/322
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-neutral-400">Portal URL</label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={introStalkerUrl}
                      onChange={(e) => setIntroStalkerUrl(e.target.value)}
                      placeholder="http://portal.example.com/c/"
                      className="w-full bg-neutral-900 border border-white/15 focus:border-cyan-400 rounded-xl pl-3 pr-16 py-2.5 text-xs text-white font-mono placeholder:text-neutral-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handlePasteInto(setIntroStalkerUrl)}
                      className="absolute right-1.5 px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-neutral-300 text-[10px] font-semibold cursor-pointer"
                    >
                      Paste
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase text-neutral-400">Device MAC Address</label>
                    <button
                      type="button"
                      onClick={() => setIntroStalkerMac(generateRandomMagMac())}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Dice5 className="w-3 h-3" />
                      <span>Generate MAC</span>
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={introStalkerMac}
                      onChange={(e) => setIntroStalkerMac(formatMacAddress(e.target.value))}
                      placeholder="00:1A:79:XX:XX:XX"
                      maxLength={17}
                      className="w-full bg-neutral-900 border border-white/15 focus:border-cyan-400 rounded-xl pl-3 pr-16 py-2.5 text-xs text-cyan-300 font-mono font-bold tracking-wider placeholder:text-neutral-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handlePasteInto((v) => setIntroStalkerMac(formatMacAddress(v)))}
                      className="absolute right-1.5 px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-neutral-300 text-[10px] font-semibold cursor-pointer"
                    >
                      Paste
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-[11px] text-purple-200">
                  Negotiates token handshake directly with Stalker server/load.php endpoints.
                </div>

                <button
                  type="submit"
                  disabled={loading || !introStalkerUrl.trim() || !introStalkerMac.trim()}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-400/20 disabled:opacity-40 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Connecting to Stalker...</span>
                    </>
                  ) : (
                    <>
                      <Cpu className="w-4 h-4" />
                      <span>Connect Stalker & Launch Player</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </section>
      </main>

      {/* ========================================================= */}
      {/* FOOTER: LEGAL TRANSPARENCY & COMPLIANCE NOTICE            */}
      {/* ========================================================= */}
      <footer className="w-full py-10 border-t border-white/10 text-center bg-black/60 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>ARRJS Legal & Transparency Compliance</span>
          </div>

          <p className="text-xs text-neutral-400 leading-relaxed max-w-3xl mx-auto">
            <strong className="text-white">Legal Notice:</strong> ARRJS Technologies does not provide, host, sell, or broadcast any IPTV subscriptions, video channels, or copyright media. ARRJS Video Player is purely client-side software designed for user-provided stream sources.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-neutral-500">
            <span>© {new Date().getFullYear()} ARRJS Technologies. All rights reserved.</span>
            <span>•</span>
            <span className="text-neutral-400">Pure In-Browser Player</span>
            <span>•</span>
            <a
              href="mailto:support@arrjs.in"
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              support@arrjs.in
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default IptvIntroScreen;
