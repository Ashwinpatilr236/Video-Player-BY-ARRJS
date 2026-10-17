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
  Play,
  ArrowRight
} from 'lucide-react';
import { parseM3u } from '../utils/m3uParser';
import { fetchXtreamChannels } from '../utils/xtreamClient';
import { fetchStalkerChannels, formatMacAddress } from '../utils/stalkerClient';
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
  const [activeTab, setActiveTab] = useState<'demo' | 'm3u-url' | 'm3u-file' | 'xtream' | 'stalker'>('demo');
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
        if (!pRes.ok) throw new Error('Failed to load playlist. Please verify URL or check CORS.');
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

  const navTiles = [
    {
      id: 'demo' as const,
      title: 'Indian Live TV',
      subtitle: 'Star Plus, Colors, Aaj Tak, Pogo',
      icon: <Sparkles className="w-5 h-5 text-amber-400" />,
      tag: 'Instant Play',
    },
    {
      id: 'm3u-url' as const,
      title: 'M3U Playlist URL',
      subtitle: 'Direct HLS subscription link',
      icon: <Globe className="w-5 h-5 text-blue-400" />,
      tag: 'Online URL',
    },
    {
      id: 'm3u-file' as const,
      title: 'Upload M3U File',
      subtitle: 'Upload local .m3u / .m3u8 file',
      icon: <Upload className="w-5 h-5 text-emerald-400" />,
      tag: 'Local File',
    },
    {
      id: 'xtream' as const,
      title: 'Xtream Codes API',
      subtitle: 'Server, username & password',
      icon: <Layers className="w-5 h-5 text-cyan-400" />,
      tag: 'Xtream Login',
    },
    {
      id: 'stalker' as const,
      title: 'Stalker Portal',
      subtitle: 'MAC address authentication',
      icon: <Cpu className="w-5 h-5 text-purple-400" />,
      tag: 'MAC Portal',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/85 backdrop-blur-2xl select-none font-sans">
      <div className="w-full max-w-5xl max-h-[90vh] bg-[#0c0d12]/95 border border-white/10 rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-[0_4px_20px_rgba(37,99,235,0.5)]">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-white tracking-tight">
                  IPTV Sources & Playlists
                </h2>
                {channelCount > 0 && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    {channelCount} Channels Active
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-400 mt-0.5">
                M3U Playlists, Xtream Codes, Stalker MAC Portal, ya Instant Indian Live TV
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 active:scale-95"
          >
            <span>Back to Video</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Left OTT Tiles + Right Form Stage */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left: Source Navigation Tiles */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-white/10 p-5 space-y-2 bg-black/40 overflow-y-auto no-scrollbar">
            {navTiles.map((tile) => {
              const isActive = activeTab === tile.id;
              return (
                <button
                  key={tile.id}
                  onClick={() => {
                    setActiveTab(tile.id);
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className={`w-full p-4 rounded-2xl text-left transition-all flex items-center justify-between ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-[0_4px_20px_rgba(37,99,235,0.4)]'
                      : 'bg-white/[0.03] hover:bg-white/[0.08] text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`p-2.5 rounded-xl ${isActive ? 'bg-white/20' : 'bg-white/5'}`}>
                      {tile.icon}
                    </div>
                    <div className="truncate">
                      <div className="font-extrabold text-sm truncate">{tile.title}</div>
                      <div className={`text-xs truncate mt-0.5 ${isActive ? 'text-white/80' : 'text-neutral-400'}`}>
                        {tile.subtitle}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className={`w-4 h-4 flex-shrink-0 ml-2 ${isActive ? 'opacity-100' : 'opacity-30'}`} />
                </button>
              );
            })}
          </div>

          {/* Right: Dynamic Configuration Stage */}
          <div className="flex-1 p-8 overflow-y-auto no-scrollbar flex flex-col justify-between">
            <div>
              {/* Alert Feedback Messages */}
              {errorMessage && (
                <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-sm font-medium">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-400 text-sm font-medium">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* VIEW 1: Instant Demo TV */}
              {activeTab === 'demo' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-black text-white">Instant Indian Live TV Experience</h3>
                    <p className="text-sm text-neutral-400 mt-1">
                      Pre-configured with Star Plus HD, Colors HD, Aaj Tak, and Pogo with authentic JioTV+ EPG show schedules.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {['115 Star Plus HD', '147 Colors HD', '509 Aaj Tak', '670 Pogo'].map((name) => (
                      <div key={name} className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block mb-2 animate-pulse" />
                        <div className="text-sm font-bold text-white">{name}</div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">Live Broadcast</div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() => {
                        onLoadDemo();
                        onClose();
                      }}
                      className="w-full py-4 px-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-base tracking-wide shadow-[0_4px_25px_rgba(37,99,235,0.45)] transition-all flex items-center justify-center gap-3 active:scale-95"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      <span>START WATCHING LIVE TV</span>
                    </button>
                  </div>
                </div>
              )}

              {/* VIEW 2: M3U URL */}
              {activeTab === 'm3u-url' && (
                <form onSubmit={handleM3uUrlSubmit} className="space-y-6">
                  <div>
                    <h3 className="text-xl font-black text-white">Connect Remote M3U / M3U8 Playlist</h3>
                    <p className="text-sm text-neutral-400 mt-1">
                      Enter the direct M3U subscription URL provided by your IPTV service provider.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-neutral-200 mb-2">
                      Playlist URL
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://example.com/playlist.m3u8"
                      value={m3uUrl}
                      onChange={(e) => setM3uUrl(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl bg-white/[0.06] border border-white/15 text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 text-base font-medium transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 px-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-base tracking-wide shadow-[0_4px_25px_rgba(37,99,235,0.45)] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Loading Playlist Streams...</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-5 h-5" />
                        <span>LOAD REMOTE PLAYLIST</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* VIEW 3: Upload M3U File */}
              {activeTab === 'm3u-file' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-black text-white">Upload Local Playlist File</h3>
                    <p className="text-sm text-neutral-400 mt-1">
                      Upload .m3u, .m3u8, or text file saved on your computer or flash drive.
                    </p>
                  </div>

                  <div className="border-2 border-dashed border-white/15 rounded-3xl p-10 text-center hover:border-blue-500/60 transition-all bg-white/[0.02]">
                    <Upload className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                    <p className="text-base font-extrabold text-white mb-1">
                      Select or drop playlist file here
                    </p>
                    <p className="text-xs text-neutral-400 mb-5">
                      Supports .m3u, .m3u8 files of any size
                    </p>
                    <label className="inline-block px-7 py-3.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold cursor-pointer transition-all shadow-[0_4px_20px_rgba(37,99,235,0.4)]">
                      Browse Computer
                      <input
                        type="file"
                        accept=".m3u,.m3u8,text/plain"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* VIEW 4: Xtream Codes */}
              {activeTab === 'xtream' && (
                <form onSubmit={handleXtreamSubmit} className="space-y-5">
                  <div>
                    <h3 className="text-xl font-black text-white">Login with Xtream Codes API</h3>
                    <p className="text-sm text-neutral-400 mt-1">
                      Connect directly to Xtream-compatible IPTV servers with your credentials.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                      Server URL / Host
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="http://iptv-server.com:8080"
                      value={xtreamServer}
                      onChange={(e) => setXtreamServer(e.target.value)}
                      className="w-full px-5 py-3.5 rounded-2xl bg-white/[0.06] border border-white/15 text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 text-base font-medium transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Your Username"
                        value={xtreamUser}
                        onChange={(e) => setXtreamUser(e.target.value)}
                        className="w-full px-5 py-3.5 rounded-2xl bg-white/[0.06] border border-white/15 text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 text-base font-medium transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Your Password"
                        value={xtreamPass}
                        onChange={(e) => setXtreamPass(e.target.value)}
                        className="w-full px-5 py-3.5 rounded-2xl bg-white/[0.06] border border-white/15 text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 text-base font-medium transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 px-8 mt-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-base tracking-wide shadow-[0_4px_25px_rgba(37,99,235,0.45)] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Connecting Xtream Server...</span>
                      </>
                    ) : (
                      <>
                        <Layers className="w-5 h-5" />
                        <span>CONNECT XTREAM CODES</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* VIEW 5: Stalker MAC */}
              {activeTab === 'stalker' && (
                <form onSubmit={handleStalkerSubmit} className="space-y-5">
                  <div>
                    <h3 className="text-xl font-black text-white">Connect Stalker Portal (MAC)</h3>
                    <p className="text-sm text-neutral-400 mt-1">
                      Authenticate with your device MAC address on Stalker middleware portals.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                      Portal URL
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="http://stalker-portal.com/c/"
                      value={stalkerUrl}
                      onChange={(e) => setStalkerUrl(e.target.value)}
                      className="w-full px-5 py-3.5 rounded-2xl bg-white/[0.06] border border-white/15 text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 text-base font-medium transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                      Device MAC Address
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={17}
                      placeholder="00:1A:79:XX:XX:XX"
                      value={stalkerMac}
                      onChange={(e) => setStalkerMac(formatMacAddress(e.target.value))}
                      className="w-full px-5 py-3.5 rounded-2xl bg-white/[0.06] border border-white/15 text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 text-base font-medium transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 px-8 mt-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-base tracking-wide shadow-[0_4px_25px_rgba(37,99,235,0.45)] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Connecting MAC Portal...</span>
                      </>
                    ) : (
                      <>
                        <Cpu className="w-5 h-5" />
                        <span>CONNECT STALKER PORTAL</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
              <span>Video Player by ARRJS • Smart TV & Web Edition</span>
              <button
                onClick={onClose}
                className="text-blue-400 hover:text-white font-bold transition-all"
              >
                Close & Return to Stream
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
