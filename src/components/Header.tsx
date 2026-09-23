import React, { useState } from 'react';
import { Search, Bell, ChevronDown, Check, LogOut, ArrowRight, ShieldCheck } from 'lucide-react';
import { ActiveUser } from '../types/fpl';

interface HeaderProps {
  user: ActiveUser;
  activeScreen: string;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onLogout: () => void;
  onNavigate: (screen: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeScreen,
  onOpenSearch,
  onOpenNotifications,
  onLogout,
  onNavigate,
}) => {
  const [gwDropdownOpen, setGwDropdownOpen] = useState(false);
  const [selectedGW, setSelectedGW] = useState('Gameweek 12');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const gameweeks = [
    { name: 'Gameweek 11', deadline: 'Finished' },
    { name: 'Gameweek 12', deadline: 'Sat 11:00 AM' },
    { name: 'Gameweek 13', deadline: 'Fri 18:30 PM' },
    { name: 'Gameweek 14', deadline: 'Tue 19:30 PM' },
  ];

  return (
    <header className="h-16 border-b border-white/8 bg-[#051424]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Zone 1: Breadcrumb Trail */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
        <button 
          onClick={() => onNavigate('dashboard')}
          className="hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#00FF87]"></span>
          <span className="text-slate-300">Operational Cockpit</span>
        </button>
        <span className="text-slate-600">›</span>
        <span className="text-[#00FF87] font-semibold">
          {activeScreen === 'dashboard' && 'FPL Tactical Engine'}
          {activeScreen === 'build' && 'Squad Optimizer AI'}
          {activeScreen === 'players' && 'Player Explorer & Analytics'}
          {activeScreen === 'fixtures' && 'Fixture Difficulty Matrix'}
          {activeScreen === 'transfers' && 'Transfer Planner'}
          {activeScreen === 'insights' && 'Tactical Radar & Intel'}
          {activeScreen === 'settings' && 'System Preferences'}
          {activeScreen === 'profile' && 'Manager Profile'}
        </span>
      </div>

      {/* Zone 2: Global Search & Gameweek Info */}
      <div className="hidden md:flex items-center gap-4">
        {/* Search Bar with Cmd+K */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-md bg-[#0d1c2d] border border-white/10 hover:border-[#00FF87]/40 text-slate-400 hover:text-slate-200 text-xs transition-all w-64 lg:w-72"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="truncate flex-1 text-left">Search player, club, metric...</span>
          <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
            ⌘K
          </kbd>
        </button>

        {/* Gameweek Dropdown */}
        <div className="relative">
          <button
            onClick={() => setGwDropdownOpen(!gwDropdownOpen)}
            className="flex items-center gap-3 px-3 py-1.5 rounded-md bg-[#0d1c2d] border border-white/10 hover:border-white/20 text-xs transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00FF87] animate-pulse"></span>
              <span className="font-semibold text-white">{selectedGW}</span>
            </div>
            <div className="text-slate-400 text-[11px] font-mono border-l border-white/10 pl-2">
              Deadline: Sat 11:00 AM
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {gwDropdownOpen && (
            <div className="absolute top-full mt-1.5 right-0 w-60 rounded-lg bg-[#0d1c2d] border border-white/10 shadow-2xl p-1.5 z-50">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-2 py-1">
                Select Gameweek Horizon
              </div>
              {gameweeks.map((gw) => (
                <button
                  key={gw.name}
                  onClick={() => {
                    setSelectedGW(gw.name);
                    setGwDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors ${
                    selectedGW === gw.name
                      ? 'bg-[#00FF87]/15 text-[#00FF87] font-semibold'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <span>{gw.name}</span>
                  <span className="font-mono text-[11px] text-slate-400">{gw.deadline}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Zone 3: Notification & User Profile */}
      <div className="flex items-center gap-3">
        {/* Mobile Search Button */}
        <button
          onClick={onOpenSearch}
          className="md:hidden p-2 text-slate-400 hover:text-white rounded-md hover:bg-white/5"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-md bg-[#0d1c2d] border border-white/10 text-slate-300 hover:text-white hover:border-white/20 transition-colors"
            title="Operational Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#00FF87]"></span>
          </button>
        </div>

        {/* User Pill */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-md bg-[#0d1c2d] border border-white/10 hover:border-[#00FF87]/40 transition-colors text-left"
          >
            <div className="relative">
              <img
                src={user.avatarUrl}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded object-cover border border-[#00FF87]/50"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=Alex+Sterling&background=00FF87&color=051424&bold=true';
                }}
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#00FF87] ring-2 ring-[#051424]"></span>
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-semibold text-white leading-none">{user.name}</div>
              <div className="text-[10px] font-mono text-[#00FF87] leading-tight font-medium mt-0.5">
                {user.rankTier}
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
          </button>

          {profileDropdownOpen && (
            <div className="absolute top-full mt-1.5 right-0 w-64 rounded-lg bg-[#0d1c2d] border border-white/12 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-white/8 mb-1">
                <div className="text-xs font-bold text-white">{user.name}</div>
                <div className="text-[11px] text-slate-400">{user.email}</div>
                <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono bg-[#162638] px-2 py-1 rounded">
                  <span className="text-slate-400">GLOBAL OR</span>
                  <span className="text-[#00FF87] font-bold">#14,204 ({user.rankTier})</span>
                </div>
              </div>

              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    onNavigate('profile');
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded text-xs text-slate-300 hover:bg-white/5 hover:text-white flex items-center justify-between"
                >
                  <span>Manager Overview</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
                <button
                  onClick={() => {
                    onNavigate('landing');
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded text-xs text-slate-300 hover:bg-white/5 hover:text-white flex items-center justify-between"
                >
                  <span>View Landing Page</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                </button>
                <button
                  onClick={() => {
                    onLogout();
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded text-xs text-rose-400 hover:bg-rose-500/10 flex items-center justify-between"
                >
                  <span>Sign Out</span>
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
