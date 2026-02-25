'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Channel } from '@/lib/iptv';
import { Search, Play, Star } from 'lucide-react';

interface ChannelListProps {
  channels: Channel[];
  onSelectChannel: (channel: Channel) => void;
  selectedChannel?: Channel | null;
}

export default function ChannelList({ channels, onSelectChannel, selectedChannel }: ChannelListProps) {
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState<string>('All');
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('iptv_favorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse favorites', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('iptv_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Extract unique groups
  const groups = useMemo(() => {
    const g = new Set(channels.map(c => c.group.title || 'Uncategorized'));
    return ['All', 'Favorites', ...Array.from(g).sort()];
  }, [channels]);

  // Filter channels
  const filteredChannels = useMemo(() => {
    let filtered = channels;

    if (activeGroup === 'Favorites') {
      filtered = filtered.filter(c => favorites.includes(c.name)); // Simple name match for now, ideally use ID
    } else if (activeGroup !== 'All') {
      filtered = filtered.filter(c => (c.group.title || 'Uncategorized') === activeGroup);
    }

    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(c => c.name.toLowerCase().includes(lowerSearch));
    }

    return filtered;
  }, [channels, activeGroup, search, favorites]);

  const toggleFavorite = (e: React.MouseEvent, channelName: string) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(channelName) 
        ? prev.filter(n => n !== channelName)
        : [...prev, channelName]
    );
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-r border-white/5 w-80 flex-shrink-0">
      {/* Search Header */}
      <div className="p-4 border-b border-white/5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search channels..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50"
          />
        </div>
      </div>

      {/* Groups (Horizontal Scroll) */}
      <div className="flex overflow-x-auto p-2 gap-2 border-b border-white/5 scrollbar-hide shrink-0">
        {groups.map(group => (
          <button
            key={group}
            onClick={() => setActiveGroup(group)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeGroup === group
                ? 'bg-indigo-600 text-white'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {group}
          </button>
        ))}
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredChannels.length === 0 ? (
          <div className="text-center py-10 text-zinc-500 text-sm">
            No channels found
          </div>
        ) : (
          filteredChannels.map((channel, idx) => (
            <div
              key={`${channel.name}-${idx}`}
              onClick={() => onSelectChannel(channel)}
              className={`group flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                selectedChannel?.url === channel.url
                  ? 'bg-indigo-600/20 border border-indigo-500/30'
                  : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="w-10 h-10 rounded bg-black/40 flex items-center justify-center flex-shrink-0 overflow-hidden border border-white/5">
                {channel.tvg.logo ? (
                  <img src={channel.tvg.logo} alt={channel.name} className="w-full h-full object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                ) : (
                  <TvIcon className="w-5 h-5 text-zinc-600" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-medium truncate ${selectedChannel?.url === channel.url ? 'text-indigo-300' : 'text-zinc-300 group-hover:text-white'}`}>
                  {channel.name}
                </h3>
                <p className="text-xs text-zinc-500 truncate">
                  {channel.group.title || 'Uncategorized'}
                </p>
              </div>

              <button
                onClick={(e) => toggleFavorite(e, channel.name)}
                className={`p-1.5 rounded-full transition-colors ${
                  favorites.includes(channel.name)
                    ? 'text-yellow-500 hover:bg-yellow-500/10'
                    : 'text-zinc-600 opacity-0 group-hover:opacity-100 hover:text-zinc-300 hover:bg-white/10'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${favorites.includes(channel.name) ? 'fill-current' : ''}`} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TvIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}
