import React from 'react';
import {
  LayoutDashboard,
  Users,
  Crosshair,
  UserSearch,
  CalendarDays,
  ArrowLeftRight,
  TrendingUp,
  SlidersHorizontal,
  UserCircle,
  Zap,
} from 'lucide-react';
import { ActiveUser } from '../types/fpl';

interface SidebarProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
  user: ActiveUser;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeScreen, onNavigate, user }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'myteam', label: 'My Team', icon: Users },
    { id: 'build', label: 'Build XI', icon: Crosshair, badge: 'CORE' },
    { id: 'players', label: 'Players', icon: UserSearch },
    { id: 'fixtures', label: 'Fixtures', icon: CalendarDays },
    { id: 'transfers', label: 'Transfers', icon: ArrowLeftRight },
    { id: 'insights', label: 'Insights', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: SlidersHorizontal },
    { id: 'profile', label: 'Profile', icon: UserCircle },
  ];

  return (
    <aside className="w-60 bg-[#051424] border-r border-white/8 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-40">
      <div>
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-white/8">
          <div 
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-6 h-6 rounded bg-[#00FF87] flex items-center justify-center text-[#051424] font-black text-xs">
              <Zap className="w-3.5 h-3.5 fill-[#051424]" />
            </div>
            <span className="font-extrabold tracking-tight text-lg text-white font-sans">
              PLAY<span className="text-[#00FF87]">XI</span>
            </span>
          </div>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#00FF87]/10 text-[#00FF87] border border-[#00FF87]/20 font-semibold tracking-wider">
            v2.4 TAC
          </span>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-[#00FF87] text-[#051424] font-bold shadow-lg shadow-[#00FF87]/20'
                    : 'text-slate-300 hover:text-white hover:bg-[#122131]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-[#051424]' : 'text-slate-400 group-hover:text-white'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.2 rounded font-bold tracking-wider ${
                      isActive
                        ? 'bg-[#051424] text-[#00FF87]'
                        : 'bg-[#00FF87]/20 text-[#00FF87] border border-[#00FF87]/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Active Squad Widget */}
      <div className="p-3 border-t border-white/8">
        <div 
          onClick={() => onNavigate('build')}
          className="p-3 rounded-lg bg-[#0d1c2d] border border-white/10 hover:border-[#00FF87]/40 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
            <span className="text-slate-400 uppercase tracking-wider font-semibold">Active Squad</span>
            <span className="text-[#00FF87] bg-[#00FF87]/10 px-1.5 py-0.5 rounded font-bold border border-[#00FF87]/20">
              £{user.budgetRemaining.toFixed(1)}m ITB
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white group-hover:text-[#00FF87] transition-colors">
              {user.activeSquadName}
            </span>
            <span className="font-mono text-slate-400 font-medium">
              {user.squadFormation}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
