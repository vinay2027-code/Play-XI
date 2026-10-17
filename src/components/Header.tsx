import React, { useEffect, useState } from 'react';
import { Search, ChevronDown, Home, ArrowRight, Users, LogIn, LogOut } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import type { FplEntry } from '../types/football';
import type { FplBootstrap, FplEvent } from '../types/football';
import { formatLocalDateTime } from '../utils/fpl';
import { BrandMark } from './BrandMark';

interface HeaderProps {
  entry: FplEntry | null;
  entryId: string;
  authUser: User | null;
  onOpenAccount: () => void;
  activeScreen: string;
  onOpenSearch: () => void;
  onReturnHome: () => void;
  onNavigate: (screen: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  entry,
  entryId,
  authUser,
  onOpenAccount,
  activeScreen,
  onOpenSearch,
  onReturnHome,
  onNavigate,
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [planningEvent, setPlanningEvent] = useState<FplEvent | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/fpl/bootstrap')
      .then((response) => response.json())
      .then((data: FplBootstrap) => {
        const current = data.events.find((event) => event.id === data.currentEvent);
        const target = current && new Date(current.deadlineTime).getTime() > Date.now()
          ? current
          : data.events.find((event) => event.id === data.nextEvent) ?? current;
        if (active) setPlanningEvent(target ?? null);
      })
      .catch(() => { if (active) setPlanningEvent(null); });
    return () => { active = false; };
  }, []);

  const deadlineLabel = formatLocalDateTime(planningEvent?.deadlineTime ?? null, 'Loading FPL data');

  return (
    <header className="h-16 border-b border-white/8 bg-[#051424]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Zone 1: Breadcrumb Trail */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
        <button 
          onClick={() => onNavigate('myteam')}
          className="hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <BrandMark size={28} />
          <span className="font-extrabold tracking-tight text-white">PLAY<span className="text-[#c7f36b]">XI</span></span>
        </button>
        <span className="text-slate-600">›</span>
        <span className="text-[#00FF87] font-semibold">
          {activeScreen === 'myteam' && 'My FPL Team'}
          {activeScreen === 'players' && 'Player Explorer & Analytics'}
          {activeScreen === 'fixtures' && 'Fixture Difficulty Matrix'}
          {activeScreen === 'manager' && 'FPL Manager'}
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

        <div className="flex items-center gap-3 px-3 py-1.5 rounded-md bg-[#0d1c2d] border border-white/10 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00FF87]"></span>
              <span className="font-semibold text-white">{planningEvent?.name ?? 'FPL'}</span>
            </div>
            <div className="text-slate-400 text-[11px] font-mono border-l border-white/10 pl-2">
              Deadline: {deadlineLabel}
            </div>
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

        <button type="button" onClick={onOpenAccount} title={authUser?.email ?? 'Sign in to sync your team'} aria-label={authUser ? `Account: ${authUser.email ?? 'signed in'}` : 'Sign in to save your team across devices'} className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#c7f36b]/25 bg-[#c7f36b]/[.07] px-2.5 text-[11px] font-bold text-[#d9ffa1] transition hover:bg-[#c7f36b]/15">
          {authUser ? <LogOut className="h-3.5 w-3.5" /> : <LogIn className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">{authUser ? 'Account' : 'Sign in'}</span>
        </button>

        {/* User Pill */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-md bg-[#0d1c2d] border border-white/10 hover:border-[#00FF87]/40 transition-colors text-left"
          >
            <div className="relative">
              <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded border border-[#00FF87]/50 bg-[#00FF87] text-[10px] font-black text-[#051424]">XI</span>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#00FF87] ring-2 ring-[#051424]"></span>
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-semibold text-white leading-none">{entry?.player_first_name || 'FPL Manager'}</div>
              <div className="text-[10px] font-mono text-[#00FF87] leading-tight font-medium mt-0.5">
                {entry ? `OR #${entry.summary_overall_rank.toLocaleString()}` : 'Link your FPL team'}
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
          </button>

          {profileDropdownOpen && (
            <div className="absolute top-full mt-1.5 right-0 w-64 rounded-lg bg-[#0d1c2d] border border-white/12 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-white/8 mb-1">
                <div className="text-xs font-bold text-white">{entry ? `${entry.player_first_name} ${entry.player_last_name}`.trim() : 'FPL Manager'}</div>
                {entry && <div className="mt-0.5 text-[11px] text-slate-400">{entry.name}</div>}
                <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono bg-[#162638] px-2 py-1 rounded">
                  <span className="text-slate-400">FPL TEAM</span>
                  <span className="text-[#00FF87] font-bold">{entry ? `ID ${entryId} · OR #${entry.summary_overall_rank.toLocaleString()}` : 'Add your Team ID in My Team'}</span>
                </div>
              </div>

              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    onNavigate(entry ? 'manager' : 'myteam');
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded text-xs text-slate-300 hover:bg-white/5 hover:text-white flex items-center justify-between"
                >
                  <span>{entry ? 'Manager Overview' : 'Connect your FPL team'}</span>
                  {entry ? <ArrowRight className="w-3.5 h-3.5 text-slate-500" /> : <Users className="w-3.5 h-3.5 text-slate-500" />}
                </button>
                <button
                  onClick={() => {
                    onReturnHome();
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded text-xs text-slate-300 hover:bg-white/5 hover:text-white flex items-center justify-between"
                >
                  <span>Return to welcome page</span>
                  <Home className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
