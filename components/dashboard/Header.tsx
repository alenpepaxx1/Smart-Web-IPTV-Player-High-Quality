import React, { useState } from 'react';
import { Search, Bell, User, X } from 'lucide-react';

interface HeaderProps {
  onSearch: (query: string) => void;
  toggleSidebar: () => void;
}

export default function Header({ onSearch, toggleSidebar }: HeaderProps) {
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 py-4 flex items-center justify-between gap-4">
      {/* Mobile Search Overlay */}
      {showMobileSearch ? (
        <div className="absolute inset-0 bg-zinc-950 z-50 flex items-center px-4 gap-4 animate-in fade-in slide-in-from-top-2">
          <Search className="w-5 h-5 text-zinc-500" />
          <input 
            type="text"
            autoFocus
            placeholder="Search channels..."
            onChange={(e) => onSearch(e.target.value)}
            className="flex-1 bg-transparent border-none text-white placeholder-zinc-500 focus:outline-none text-base"
          />
          <button 
            onClick={() => {
              setShowMobileSearch(false);
              onSearch(''); // Clear search on close? Maybe optional.
            }}
            className="p-2 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={toggleSidebar}
              className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </button>
            
            {/* Desktop Search */}
            <div className="relative max-w-md w-full hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text"
                placeholder="Search channels, movies, series..."
                onChange={(e) => onSearch(e.target.value)}
                className="w-full bg-zinc-900/50 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            {/* Mobile Search Toggle */}
            <button 
              onClick={() => setShowMobileSearch(true)}
              className="md:hidden p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <Search className="w-5 h-5" />
            </button>

            <button className="relative p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-zinc-950"></span>
            </button>
            
            <div className="flex items-center gap-3 pl-3 border-l border-white/5">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-white">User</p>
                <p className="text-xs text-zinc-500">Premium</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[2px]">
                <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden">
                  <User className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
