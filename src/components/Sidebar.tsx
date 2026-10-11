import React from 'react';
import {
  Users,
  UserSearch,
  CalendarDays,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeScreen, onNavigate }) => {
  const navItems = [
    { id: 'myteam', label: 'My Team', icon: Users },
    { id: 'players', label: 'Players', icon: UserSearch },
    { id: 'fixtures', label: 'Fixtures', icon: CalendarDays },
  ];

  return (
    <aside className="w-60 bg-[#051424] border-r border-white/8 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-40">
      <div>
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-white/8">
          <div 
            onClick={() => onNavigate('myteam')}
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
            FPL
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
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-white/8 text-xs leading-relaxed text-slate-400">
        Import your public FPL Team ID in <button className="text-[#00FF87] hover:underline" onClick={() => onNavigate('myteam')}>My Team</button> to see your live squad and transfer ideas.
      </div>
    </aside>
  );
};
