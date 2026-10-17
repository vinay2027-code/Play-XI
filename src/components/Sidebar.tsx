import { CalendarDays, LayoutDashboard, Users, UserSearch } from 'lucide-react';
interface SidebarProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
}
const items = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'myteam', label: 'My Team', icon: Users },
  { id: 'players', label: 'Players', icon: UserSearch },
  { id: 'fixtures', label: 'Fixtures', icon: CalendarDays },
];
export function Sidebar({ activeScreen, onNavigate }: SidebarProps) {
  return (
    <>
      <aside className="sport-sidebar">
        <nav aria-label="Workspace navigation">
          {items.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              aria-current={activeScreen === id ? 'page' : undefined}
              title={label}
            >
              <Icon size={22} strokeWidth={1.7} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <span className="sport-sidebar-footer">
          FPL
          <br />
          26/27
        </span>
      </aside>
      <nav className="sport-mobile-nav" aria-label="Primary navigation">
        {items.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onNavigate(id)}
            aria-current={activeScreen === id ? 'page' : undefined}
          >
            <Icon size={21} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
