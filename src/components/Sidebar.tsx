import React from 'react';
import {
  Users,
  UserSearch,
  CalendarDays,
} from 'lucide-react';
import { BrandMark } from './BrandMark';

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
    <>
    <aside className="hidden w-60 shrink-0 flex-col justify-between border-r border-white/8 bg-[#051424] md:sticky md:top-16 md:flex md:h-[calc(100vh-4rem)] md:self-start md:z-20">
      <div>
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-white/8">
          <button
            type="button"
            onClick={() => onNavigate('myteam')}
            aria-label="Play XI — open My Team"
            className="flex cursor-pointer items-center gap-2.5 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-[#c7f36b]"
          >
            <BrandMark size={32} />
            <span className="font-extrabold tracking-tight text-lg text-white font-sans">
              PLAY<span className="text-[#00FF87]">XI</span>
            </span>
          </button>
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
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-[#c7f36b]/10 text-[#d9ffa1] font-bold shadow-[inset_3px_0_0_#c7f36b]'
                    : 'text-slate-300 hover:text-white hover:bg-white/[.045]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-[#c7f36b]' : 'text-slate-400 group-hover:text-white'
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
    <nav aria-label="Primary navigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-white/10 bg-[#071521]/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeScreen === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold transition ${isActive ? 'bg-[#c7f36b]/10 text-[#d9ffa1]' : 'text-slate-400 hover:text-white'}`}
          >
            <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
    </>
  );
};
