'use client';

import React, { useState } from 'react';
import { fetchM3U, xtreamLogin } from '@/lib/iptv';
import { Loader2, Tv, Link as LinkIcon, Server, Settings } from 'lucide-react';
import axios from 'axios';

interface LoginProps {
  onLogin: (data: any, type: 'm3u' | 'xtream' | 'stalker') => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [activeTab, setActiveTab] = useState<'m3u' | 'xtream' | 'stalker'>('xtream');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Xtream State
  const [host, setHost] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // M3U State
  const [m3uUrl, setM3uUrl] = useState('');

  // Stalker State
  const [macAddress, setMacAddress] = useState('');
  const [portalUrl, setPortalUrl] = useState('');

  const handleXtreamLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await xtreamLogin(host, username, password);
      if (data.user_info && data.user_info.auth === 1) {
        onLogin({ ...data, host, username, password }, 'xtream');
      } else {
        setError('Authentication failed. Please check credentials.');
      }
    } catch (err) {
      setError('Failed to connect to server. Check URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleM3uLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const playlist = await fetchM3U(m3uUrl);
      if (playlist.items.length > 0) {
        onLogin({ playlist, url: m3uUrl }, 'm3u');
      } else {
        setError('No channels found in playlist.');
      }
    } catch (err) {
      setError('Failed to load playlist. Check URL.');
    } finally {
      setLoading(false);
    }
  };

  const handleStalkerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Handshake
      const handshakeRes = await axios.get('/api/stalker', {
        params: { action: 'handshake', mac: macAddress, url: portalUrl }
      });
      
      const token = handshakeRes.data?.js?.token;
      if (!token) {
        throw new Error('Handshake failed: No token received');
      }

      const realUrl = handshakeRes.data.real_url || portalUrl;
      console.log('Stalker Handshake success. Real URL:', realUrl);

      // 2. Get Profile (Verify)
      const profileRes = await axios.get('/api/stalker', {
        params: { action: 'get_profile', mac: macAddress, url: realUrl, token }
      });

      if (profileRes.data?.js?.id) {
        onLogin({ mac: macAddress, url: realUrl, token, profile: profileRes.data.js }, 'stalker');
      } else {
        setError('Stalker authentication failed. Check MAC address.');
      }

    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to connect to Stalker portal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-md mx-auto p-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 mb-4 shadow-lg shadow-indigo-500/20">
          <Tv className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Smart IPTV</h1>
        <p className="text-zinc-400">Enter your details to start watching</p>
      </div>

      <div className="w-full bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-2 mb-6 flex overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab('xtream')}
          className={`flex-1 py-3 px-4 text-sm font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap ${
            activeTab === 'xtream'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Server className="w-4 h-4" />
          Xtream
        </button>
        <button
          onClick={() => setActiveTab('m3u')}
          className={`flex-1 py-3 px-4 text-sm font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap ${
            activeTab === 'm3u'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <LinkIcon className="w-4 h-4" />
          M3U
        </button>
        <button
          onClick={() => setActiveTab('stalker')}
          className={`flex-1 py-3 px-4 text-sm font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap ${
            activeTab === 'stalker'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Settings className="w-4 h-4" />
          Stalker
        </button>
      </div>

      <div className="w-full bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-xl">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {activeTab === 'xtream' && (
          <form onSubmit={handleXtreamLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Server URL</label>
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="http://example.com:8080"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3.5 rounded-xl transition-all duration-200 mt-2 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Connect'}
            </button>
          </form>
        )}

        {activeTab === 'm3u' && (
          <form onSubmit={handleM3uLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Playlist URL</label>
              <input
                type="url"
                value={m3uUrl}
                onChange={(e) => setM3uUrl(e.target.value)}
                placeholder="http://example.com/playlist.m3u"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3.5 rounded-xl transition-all duration-200 mt-2 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Load Playlist'}
            </button>
          </form>
        )}

        {activeTab === 'stalker' && (
          <form onSubmit={handleStalkerLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Portal URL</label>
              <input
                type="text"
                value={portalUrl}
                onChange={(e) => setPortalUrl(e.target.value)}
                placeholder="http://example.com/c/"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">MAC Address</label>
              <input
                type="text"
                value={macAddress}
                onChange={(e) => setMacAddress(e.target.value)}
                placeholder="00:1A:79:XX:XX:XX"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3.5 rounded-xl transition-all duration-200 mt-2 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Connect Portal'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
