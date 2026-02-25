import React from 'react';
import { Channel } from '@/lib/iptv';
import { X, Play, Info, Tv, Hash, Link as LinkIcon, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChannelDetailsModalProps {
  channel: Channel | null;
  isOpen: boolean;
  onClose: () => void;
  onPlay: (channel: Channel) => void;
}

export default function ChannelDetailsModal({ channel, isOpen, onClose, onPlay }: ChannelDetailsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && channel && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Background with Blur */}
            <div className="absolute inset-0 h-32 bg-gradient-to-b from-indigo-500/20 to-transparent pointer-events-none" />

            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 pt-12">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Left Column: Logo & Actions */}
                <div className="flex-shrink-0 flex flex-col items-center space-y-4">
                  <div className="w-32 h-32 bg-black/40 rounded-xl border border-white/5 flex items-center justify-center p-4 shadow-lg">
                    {channel.tvg.logo ? (
                      <img 
                        src={channel.tvg.logo} 
                        alt={channel.name} 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <span className={`text-4xl font-bold text-zinc-700 ${channel.tvg.logo ? 'hidden' : ''}`}>
                      {channel.name.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  
                  <button 
                    onClick={() => {
                      onPlay(channel);
                      onClose();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Watch Now
                  </button>
                </div>

                {/* Right Column: Details */}
                <div className="flex-1 space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">{channel.name}</h2>
                    <div className="flex items-center gap-2 text-zinc-400 text-sm">
                      <span className="px-2 py-0.5 bg-white/10 rounded text-white/80">
                        {channel.group?.title || 'Uncategorized'}
                      </span>
                      {channel.tvg.id && (
                        <>
                          <span>•</span>
                          <span>ID: {channel.tvg.id}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                      <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                        <Info className="w-4 h-4 text-indigo-400" />
                        Channel Information
                      </h3>
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <div className="flex items-start gap-3">
                          <Tv className="w-4 h-4 text-zinc-500 mt-0.5" />
                          <div>
                            <span className="block text-zinc-500 text-xs">Stream URL</span>
                            <span className="text-zinc-300 break-all font-mono text-xs opacity-70">
                              {channel.url}
                            </span>
                          </div>
                        </div>
                        {channel.tvg.rec && (
                          <div className="flex items-start gap-3">
                            <Calendar className="w-4 h-4 text-zinc-500 mt-0.5" />
                            <div>
                              <span className="block text-zinc-500 text-xs">Catchup Days</span>
                              <span className="text-zinc-300">{channel.tvg.rec}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* EPG Placeholder */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                      <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-400" />
                        Program Guide
                      </h3>
                      <div className="text-center py-6 text-zinc-500 text-sm">
                        <p>No EPG data available for this channel.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
