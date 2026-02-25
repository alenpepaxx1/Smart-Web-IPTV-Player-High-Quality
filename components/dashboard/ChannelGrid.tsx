import React from 'react';
import { Channel } from '@/lib/iptv';
import { Play, Star, Info } from 'lucide-react';

interface ChannelGridProps {
  channels: Channel[];
  onSelectChannel: (channel: Channel) => void;
  onShowDetails: (channel: Channel) => void;
  selectedChannel: Channel | null;
  searchQuery: string;
  activeCategory: string;
}

export default function ChannelGrid({ channels, onSelectChannel, onShowDetails, selectedChannel, searchQuery, activeCategory }: ChannelGridProps) {
  // Filter channels based on search and category
  const filteredChannels = channels.filter(channel => {
    const matchesSearch = channel.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || (channel.group?.title === activeCategory);
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = ['All', ...Array.from(new Set(channels.map(c => c.group?.title).filter(Boolean)))].slice(0, 20); // Limit categories for now

  return (
    <div className="p-6 space-y-6">
      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat 
                ? 'bg-white text-black' 
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
        {filteredChannels.map((channel, idx) => (
          <div 
            key={`${channel.name}-${idx}`}
            onClick={() => onSelectChannel(channel)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectChannel(channel);
              }
            }}
            tabIndex={0}
            role="button"
            className={`group relative aspect-video bg-zinc-900 rounded-xl overflow-hidden border transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              selectedChannel?.name === channel.name 
                ? 'border-indigo-500 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500' 
                : 'border-white/5 hover:border-white/20 hover:shadow-xl hover:-translate-y-1'
            }`}
          >
            {/* Logo / Placeholder */}
            <div className="absolute inset-0 flex items-center justify-center p-4 bg-zinc-900">
              {channel.tvg.logo ? (
                <img 
                  src={channel.tvg.logo} 
                  alt={channel.name} 
                  className="w-full h-full object-contain opacity-80 group-hover:opacity-100 group-focus:opacity-100 transition-opacity"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <span className={`text-2xl font-bold text-zinc-700 ${channel.tvg.logo ? 'hidden' : ''}`}>
                {channel.name.substring(0, 2).toUpperCase()}
              </span>
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 group-focus:opacity-100 focus-within:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
              <div className="transform translate-y-2 group-hover:translate-y-0 group-focus:translate-y-0 transition-transform duration-300">
                <h3 className="text-white font-medium text-sm truncate">{channel.name}</h3>
                <p className="text-zinc-400 text-xs truncate">{channel.group?.title || 'Unknown'}</p>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectChannel(channel);
                      }}
                      className="p-1.5 bg-white text-black rounded-full hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      tabIndex={0}
                    >
                      <Play className="w-3 h-3 fill-current" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onShowDetails(channel);
                      }}
                      className="p-1.5 bg-zinc-800 text-zinc-400 rounded-full hover:bg-zinc-700 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      tabIndex={0}
                    >
                      <Info className="w-3 h-3" />
                    </button>
                  </div>
                  <button 
                    className="p-1.5 text-zinc-400 hover:text-yellow-400 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded-full"
                    tabIndex={0}
                  >
                    <Star className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Indicator */}
            {selectedChannel?.name === channel.name && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
