'use client';

import React, { useState, useEffect } from 'react';
import Login from '@/components/auth/Login';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/dashboard/Header';
import ChannelGrid from '@/components/dashboard/ChannelGrid';
import VideoPlayer from '@/components/player/VideoPlayer';
import ChannelDetailsModal from '@/components/dashboard/ChannelDetailsModal';
import { Channel, fetchM3U } from '@/lib/iptv';
import { Loader2 } from 'lucide-react';
import axios from 'axios';

export default function Home() {
  const [playlist, setPlaylist] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [detailsChannel, setDetailsChannel] = useState<Channel | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('live');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [stalkerSession, setStalkerSession] = useState<{mac: string, url: string, token: string} | null>(null);

  // ... Login Logic (Same as before) ...
  const handleLogin = async (data: any, type: 'm3u' | 'xtream' | 'stalker') => {
    setLoading(true);
    try {
      if (type === 'm3u') {
        setPlaylist(data.playlist.items);
        setIsAuthenticated(true);
        localStorage.setItem('iptv_session', JSON.stringify({ data, type }));
      } else if (type === 'xtream') {
        const { host, username, password } = data;
        const baseUrl = host.endsWith('/') ? host.slice(0, -1) : host;
        const m3uUrl = `${baseUrl}/get.php?username=${username}&password=${password}&type=m3u_plus&output=ts`;
        
        const fetchedPlaylist = await fetchM3U(m3uUrl);
        setPlaylist(fetchedPlaylist.items);
        setIsAuthenticated(true);
        localStorage.setItem('iptv_session', JSON.stringify({ data, type }));
      } else if (type === 'stalker') {
        const { mac, url, token } = data;
        setStalkerSession({ mac, url, token });
        
        const channelsRes = await axios.get('/api/stalker', {
          params: { action: 'get_channels', mac, url, token }
        });

        const rawChannels = channelsRes.data?.js?.data || [];
        
        const mappedChannels: Channel[] = rawChannels.map((ch: any) => ({
          name: ch.name,
          tvg: {
            id: ch.id,
            name: ch.name,
            logo: ch.logo,
            url: '',
            rec: ''
          },
          group: {
            title: 'All Channels' 
          },
          http: {
            referrer: '',
            'user-agent': ''
          },
          url: `STALKER_CMD:${ch.cmd}`, 
          raw: ''
        }));

        setPlaylist(mappedChannels);
        setIsAuthenticated(true);
        localStorage.setItem('iptv_session', JSON.stringify({ data, type }));
      }
    } catch (error: any) {
      console.error('Login failed', error);
      let message = 'Failed to load playlist. Please try again.';
      
      if (error.response?.data?.details) {
        message = `Login failed: ${error.response.data.details}`;
        if (error.response.data.upstreamStatus) {
           message += ` (Status: ${error.response.data.upstreamStatus})`;
        }
      } else if (error.message) {
        message = `Login failed: ${error.message}`;
      }
      
      alert(message);
      localStorage.removeItem('iptv_session');
    } finally {
      setLoading(false);
    }
  };

  // Custom player wrapper to handle Stalker URL resolution
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);

  useEffect(() => {
    const resolveUrl = async () => {
      if (!selectedChannel) return;

      if (selectedChannel.url.startsWith('STALKER_CMD:')) {
        if (!stalkerSession) return;
        
        const cmd = selectedChannel.url.replace('STALKER_CMD:', '');
        try {
          const res = await axios.get('/api/stalker', {
            params: { 
              action: 'create_link', 
              mac: stalkerSession.mac, 
              url: stalkerSession.url, 
              token: stalkerSession.token,
              cmd 
            }
          });
          
          if (res.data.url) {
            setResolvedUrl(res.data.url);
          } else {
            console.error('Failed to resolve Stalker link');
          }
        } catch (e) {
          console.error('Error resolving Stalker link', e);
        }
      } else {
        setResolvedUrl(selectedChannel.url);
      }
    };

    resolveUrl();
  }, [selectedChannel, stalkerSession]);

  useEffect(() => {
    const savedSession = localStorage.getItem('iptv_session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        handleLogin(session.data, session.type);
      } catch (e) {
        console.error('Failed to restore session', e);
      }
    }
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPlaylist([]);
    setSelectedChannel(null);
    localStorage.removeItem('iptv_session');
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <div className="relative z-10 w-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center text-white">
              <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-4" />
              <p className="text-lg font-medium">Loading your channels...</p>
              <p className="text-sm text-zinc-400">This might take a moment for large playlists</p>
            </div>
          ) : (
            <Login onLogin={handleLogin} />
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-screen bg-black text-white overflow-hidden font-sans">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col h-full relative w-full bg-zinc-950">
        <Header 
          onSearch={setSearchQuery} 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        />

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
          {/* Hero / Player Section */}
          {selectedChannel && (
            <div className="w-full aspect-video max-h-[60vh] bg-black sticky top-0 z-20 shadow-2xl">
              {resolvedUrl && (
                <VideoPlayer 
                  url={resolvedUrl} 
                  poster={selectedChannel.tvg.logo}
                  autoPlay={true}
                />
              )}
            </div>
          )}

          {/* Content Grid */}
          <div className="max-w-[1920px] mx-auto">
            <ChannelGrid 
              channels={playlist}
              onSelectChannel={setSelectedChannel}
              onShowDetails={setDetailsChannel}
              selectedChannel={selectedChannel}
              searchQuery={searchQuery}
              activeCategory={activeCategory}
            />
          </div>
        </div>
      </div>

      <ChannelDetailsModal 
        channel={detailsChannel}
        isOpen={!!detailsChannel}
        onClose={() => setDetailsChannel(null)}
        onPlay={setSelectedChannel}
      />
    </main>
  );
}
