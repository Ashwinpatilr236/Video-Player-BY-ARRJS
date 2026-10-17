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
  AlertCircle
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
        setErrorMessage(err.message || 'Failed to parse file.');
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  };

  // Handle Xtream Login
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
      setSuccessMessage(`Logged in! Loaded ${channels.length} live channels.`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md select-none">
      <div className="w-full max-w-3xl bg-neutral-950 border border-white/15 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-[0_0_15px_rgba(37,99,235,0.5)]">
              TV
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-wide flex items-center gap-2">
                Live TV Sources Setup
                {channelCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {channelCount} Active
                  </span>
                )}
              </h2>
              <p className="text-xs text-neutral-400">
                Connect your M3U playlist, Xtream Codes, Stalker MAC, or demo channels
              </p>
            </div>
          </div>

          {channelCount > 0 && (
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-6 pt-4 border-b border-white/10 overflow-x-auto no-scrollbar bg-black/30">
          <button
            onClick={() => { setActiveTab('m3u-url'); setErrorMessage(''); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
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
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
              activeTab === 'm3u-file'
                ? 'border-blue-500 text-white bg-white/5'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Local M3U File</span>
          </button>

          <button
            onClick={() => { setActiveTab('xtream'); setErrorMessage(''); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
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
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
              activeTab === 'stalker'
                ? 'border-blue-500 text-white bg-white/5'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>MAC Stalker</span>
          </button>

          <button
            onClick={() => { setActiveTab('demo'); setErrorMessage(''); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
              activeTab === 'demo'
                ? 'border-blue-500 text-white bg-white/5'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Demo Live TV</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* 1. M3U URL */}
          {activeTab === 'm3u-url' && (
            <form onSubmit={handleM3uUrlSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  M3U / M3U8 Subscription URL
                </label>
                <input
                  type="url"
                  required
                  value={m3uUrl}
                  onChange={(e) => setM3uUrl(e.target.value)}
                  placeholder="https://example.com/playlist.m3u"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm transition-all shadow-[0_4px_16px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tv className="w-4 h-4" />}
                <span>LOAD M3U PLAYLIST</span>
              </button>
            </form>
          )}

          {/* 2. Local M3U File */}
          {activeTab === 'm3u-file' && (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/20 hover:border-blue-500/60 rounded-2xl p-8 text-center transition-all bg-white/[0.02]">
              <Upload className="w-12 h-12 text-blue-400 mb-3" />
              <h3 className="font-bold text-white text-sm">Upload Local M3U / M3U8 Playlist File</h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                Completely bypasses browser CORS restrictions by parsing directly in memory.
              </p>
              <label className="mt-4 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer shadow-md transition-all">
                Browse M3U File
                <input
                  type="file"
                  accept=".m3u,.m3u8,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* 3. Xtream Codes API */}
          {activeTab === 'xtream' && (
            <form onSubmit={handleXtreamSubmit} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  Server URL
                </label>
                <input
                  type="text"
                  required
                  value={xtreamServer}
                  onChange={(e) => setXtreamServer(e.target.value)}
                  placeholder="http://domain.com:8080"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={xtreamUser}
                    onChange={(e) => setXtreamUser(e.target.value)}
                    placeholder="Username"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={xtreamPass}
                    onChange={(e) => setXtreamPass(e.target.value)}
                    placeholder="Password"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm transition-all shadow-[0_4px_16px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                <span>LOGIN & SYNC XTREAM CHANNELS</span>
              </button>
            </form>
          )}

          {/* 4. Stalker MAC Portal */}
          {activeTab === 'stalker' && (
            <form onSubmit={handleStalkerSubmit} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  Stalker Portal URL
                </label>
                <input
                  type="text"
                  required
                  value={stalkerUrl}
                  onChange={(e) => setStalkerUrl(e.target.value)}
                  placeholder="http://portal.domain.com:8080/c/"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  MAG Device MAC Address
                </label>
                <input
                  type="text"
                  required
                  value={stalkerMac}
                  onChange={(e) => setStalkerMac(formatMacAddress(e.target.value))}
                  placeholder="00:1A:79:XX:XX:XX"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm transition-all shadow-[0_4px_16px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
                <span>CONNECT STALKER PORTAL</span>
              </button>
            </form>
          )}

          {/* 5. Demo Live TV */}
          {activeTab === 'demo' && (
            <div className="flex flex-col items-center text-center p-4">
              <Sparkles className="w-10 h-10 text-cyan-400 mb-2" />
              <h3 className="font-bold text-white text-base">Quick Demo Channels (JioTV+ Style)</h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-md">
                Load authentic Indian channels (Star Plus HD, Colors HD, Aaj Tak, Pogo, Star Gold HD) with complete EPG schedules and verified working high-definition streams.
              </p>
              <button
                onClick={() => {
                  onLoadDemo();
                  onClose();
                }}
                className="mt-5 px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm transition-all shadow-[0_4px_20px_rgba(37,99,235,0.5)]"
              >
                LAUNCH DEMO LIVE TV
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-black/40 text-[11px] text-neutral-400 flex items-center justify-between">
          <span>Video Player by ARRJS • Smart TV & Web Edition</span>
          <button
            onClick={() => {
              onLoadDemo();
              onClose();
            }}
            className="text-blue-400 font-bold hover:underline"
          >
            Or Launch Instant Demo TV &rarr;
          </button>
        </div>

      </div>
    </div>
  );
};
