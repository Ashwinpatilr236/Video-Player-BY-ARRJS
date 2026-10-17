import React, { useState } from 'react';
import {
  Globe,
  Upload,
  Layers,
  Cpu,
  Tv,
  Sparkles,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Play
} from 'lucide-react';
import { parseM3u } from '../utils/m3uParser';
import { fetchXtreamChannels } from '../utils/xtreamClient';
import { fetchStalkerChannels, formatMacAddress, isValidMacAddress } from '../utils/stalkerClient';
import { ChannelItem, IptvSourceType } from '../types';

interface WelcomeSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChannelsLoaded: (channels: ChannelItem[], source: IptvSourceType, sourceName: string) => void;
  onLoadDemo: () => void;
  channelCount: number;
}

export const WelcomeSetupModal: React.FC<WelcomeSetupModalProps> = ({
  isOpen,
  onClose,
  onChannelsLoaded,
  onLoadDemo,
  channelCount,
}) => {
  const [activeTab, setActiveTab] = useState<'m3u-url' | 'm3u-file' | 'xtream' | 'stalker' | 'demo'>('m3u-url');
  const [m3uUrl, setM3uUrl] = useState('');
  const [xtreamServer, setXtreamServer] = useState('');
  const [xtreamUser, setXtreamUser] = useState('');
  const [xtreamPass, setXtreamPass] = useState('');
  const [stalkerUrl, setStalkerUrl] = useState('');
  const [stalkerMac, setStalkerMac] = useState('00:1A:79:');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  // Handle M3U URL submit
  const handleM3uUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!m3uUrl.trim()) return;

    setIsLoading(true);
    setErrorMessage('');
    try {
      let text = '';
      try {
        const res = await fetch(m3uUrl.trim());
        if (res.ok) text = await res.text();
        else throw new Error(`HTTP ${res.status}`);
      } catch {
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(m3uUrl.trim())}`;
        const pRes = await fetch(proxyUrl);
        if (!pRes.ok) throw new Error('Failed to download M3U URL. Please check the URL.');
        text = await pRes.text();
      }

      const parsed = parseM3u(text);
      if (parsed.length === 0) throw new Error('No valid streams found in this M3U playlist.');

      onChannelsLoaded(parsed, 'm3u', m3uUrl.split('/').pop() || 'Remote M3U');
      setSuccessMessage(`Loaded ${parsed.length} channels successfully!`);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load M3U.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setErrorMessage('');
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = parseM3u(text);
        if (parsed.length === 0) throw new Error('No channels found in this playlist file.');

        onChannelsLoaded(parsed, 'm3u', file.name);
        setSuccessMessage(`Loaded ${parsed.length} channels from ${file.name}!`);
        setTimeout(() => {
          onClose();
        }, 700);
      } catch (err: any) {
        setErrorMessage(err.message || 'Could not parse playlist file.');
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read local file.');
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  // Handle Xtream Submit
  const handleXtreamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!xtreamServer || !xtreamUser || !xtreamPass) {
      setErrorMessage('Please enter Server URL, Username, and Password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      const channels = await fetchXtreamChannels({
        serverUrl: xtreamServer,
        username: xtreamUser,
        password: xtreamPass,
      });

      onChannelsLoaded(channels, 'xtream', `Xtream: ${xtreamUser}`);
      setSuccessMessage(`Connected! Loaded ${channels.length} live channels.`);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Xtream authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Stalker Submit
  const handleStalkerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stalkerUrl || !stalkerMac) {
      setErrorMessage('Please enter Portal URL and MAC Address.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      const channels = await fetchStalkerChannels({
        portalUrl: stalkerUrl,
        macAddress: stalkerMac,
      });

      onChannelsLoaded(channels, 'stalker', `Stalker: ${stalkerMac}`);
      setSuccessMessage(`Portal connected! Loaded ${channels.length} channels.`);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Stalker portal connection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/85 backdrop-blur-xl select-none">
      <div className="w-full max-w-4xl bg-neutral-950/95 border border-white/20 rounded-3xl shadow-[0_0_90px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between bg-white/[0.03]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white font-black text-xl shadow-[0_0_25px_rgba(37,99,235,0.6)]">
              TV
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-white tracking-wide font-display">
                  Live TV Setup
                </h2>
                {channelCount > 0 && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {channelCount} Channels Ready
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-400 mt-0.5">
                M3U Playlist, Xtream Codes, Stalker MAC Portal, ya Demo Channels
              </p>
            </div>
          </div>

          {channelCount > 0 && (
            <button
              onClick={onClose}
              className="p-2.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-all"
              title="Close and Watch TV"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Quick Demo Indian Live TV Hero Card */}
        <div className="mx-8 mt-6 p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 via-blue-800/20 to-neutral-900 border border-blue-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Quick Start: Indian Live TV
              </h3>
              <p className="text-xs text-neutral-300 mt-0.5">
                Star Plus HD, Colors HD, Aaj Tak, Pogo with authentic JioTV+ EPG
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              onLoadDemo();
              onClose();
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm tracking-wide shadow-[0_4px_16px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Start Watching Now</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-8 pt-5 border-b border-white/10 overflow-x-auto no-scrollbar bg-black/40">
          <button
            onClick={() => { setActiveTab('m3u-url'); setErrorMessage(''); }}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-t-xl text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'm3u-url'
                ? 'border-blue-500 text-white bg-white/5'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4 text-blue-400" />
            <span>Remote M3U URL</span>
          </button>

          <button
            onClick={() => { setActiveTab('m3u-file'); setErrorMessage(''); }}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-t-xl text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'm3u-file'
                ? 'border-blue-500 text-white bg-white/5'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Upload M3U File</span>
          </button>

          <button
            onClick={() => { setActiveTab('xtream'); setErrorMessage(''); }}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-t-xl text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'xtream'
                ? 'border-blue-500 text-white bg-white/5'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Xtream Codes</span>
          </button>

          <button
            onClick={() => { setActiveTab('stalker'); setErrorMessage(''); }}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-t-xl text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'stalker'
                ? 'border-blue-500 text-white bg-white/5'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>MAC Stalker</span>
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="p-8">
          {/* Status Messages */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-sm font-medium">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-400 text-sm font-medium">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: M3U URL */}
          {activeTab === 'm3u-url' && (
            <form onSubmit={handleM3uUrlSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-neutral-200 mb-2">
                  M3U / M3U8 Subscription Playlist URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/playlist.m3u"
                  value={m3uUrl}
                  onChange={(e) => setM3uUrl(e.target.value)}
                  className="w-full h-14 px-4 rounded-xl bg-white/5 border border-white/15 text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 text-base font-medium transition-all"
                />
                <p className="text-xs text-neutral-400 mt-2">
                  Direct HLS/M3U playlist links supported with built-in CORS stream proxy.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-base tracking-wide transition-all shadow-[0_4px_20px_rgba(37,99,235,0.45)] flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Loading Playlist Channels...</span>
                  </>
                ) : (
                  <>
                    <Tv className="w-5 h-5" />
                    <span>LOAD M3U PLAYLIST</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: Upload File */}
          {activeTab === 'm3u-file' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-neutral-200 mb-2">
                  Select Local .m3u / .m3u8 Playlist File
                </label>
                <div className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center hover:border-blue-500/60 transition-all bg-white/[0.02]">
                  <Upload className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <p className="text-base font-extrabold text-white mb-1">
                    Drag and drop or browse file
                  </p>
                  <p className="text-xs text-neutral-400 mb-4">
                    Supports .m3u, .m3u8, and text playlist files from your computer
                  </p>
                  <label className="inline-block px-6 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-bold cursor-pointer transition-all border border-white/15">
                    Browse Local File
                    <input
                      type="file"
                      accept=".m3u,.m3u8,text/plain"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Xtream Codes */}
          {activeTab === 'xtream' && (
            <form onSubmit={handleXtreamSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-neutral-200 mb-1.5">
                  Server URL / Host
                </label>
                <input
                  type="text"
                  required
                  placeholder="http://example.com:8080"
                  value={xtreamServer}
                  onChange={(e) => setXtreamServer(e.target.value)}
                  className="w-full h-13 px-4 rounded-xl bg-white/5 border border-white/15 text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 text-base font-medium transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-neutral-200 mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter Username"
                    value={xtreamUser}
                    onChange={(e) => setXtreamUser(e.target.value)}
                    className="w-full h-13 px-4 rounded-xl bg-white/5 border border-white/15 text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 text-base font-medium transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-neutral-200 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter Password"
                    value={xtreamPass}
                    onChange={(e) => setXtreamPass(e.target.value)}
                    className="w-full h-13 px-4 rounded-xl bg-white/5 border border-white/15 text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 text-base font-medium transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 mt-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-base tracking-wide transition-all shadow-[0_4px_20px_rgba(37,99,235,0.45)] flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Connecting Xtream Codes...</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-5 h-5" />
                    <span>LOGIN WITH XTREAM CODES</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 4: Stalker MAC */}
          {activeTab === 'stalker' && (
            <form onSubmit={handleStalkerSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-neutral-200 mb-1.5">
                  Portal URL
                </label>
                <input
                  type="text"
                  required
                  placeholder="http://example.com/c/"
                  value={stalkerUrl}
                  onChange={(e) => setStalkerUrl(e.target.value)}
                  className="w-full h-13 px-4 rounded-xl bg-white/5 border border-white/15 text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 text-base font-medium transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-200 mb-1.5">
                  MAC Address
                </label>
                <input
                  type="text"
                  required
                  maxLength={17}
                  placeholder="00:1A:79:XX:XX:XX"
                  value={stalkerMac}
                  onChange={(e) => setStalkerMac(formatMacAddress(e.target.value))}
                  className="w-full h-13 px-4 rounded-xl bg-white/5 border border-white/15 text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 text-base font-mono font-medium transition-all"
                />
                <p className="text-xs text-neutral-400 mt-1.5">
                  Standard IPTV Stalker format: 00:1A:79:XX:XX:XX
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 mt-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-base tracking-wide transition-all shadow-[0_4px_20px_rgba(37,99,235,0.45)] flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Connecting Stalker Portal...</span>
                  </>
                ) : (
                  <>
                    <Cpu className="w-5 h-5" />
                    <span>CONNECT STALKER MAC PORTAL</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-8 py-4 bg-black/60 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
          <span>Video Player by ARRJS • Smart TV & Web Edition</span>
          {channelCount > 0 && (
            <button
              onClick={onClose}
              className="text-blue-400 hover:text-white font-bold transition-all underline"
            >
              Back to Player
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
