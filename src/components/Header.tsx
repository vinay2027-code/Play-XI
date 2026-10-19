import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  ChevronDown,
  Home,
  LogIn,
  Search,
  Users,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import type { FplBootstrap, FplEntry, FplEvent } from '../types/football';
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
export function Header({
  entry,
  entryId,
  authUser,
  onOpenAccount,
  activeScreen,
  onOpenSearch,
  onReturnHome,
  onNavigate,
}: HeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [planningEvent, setPlanningEvent] = useState<FplEvent | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/fpl/bootstrap', { signal: controller.signal })
      .then((response) => response.json())
      .then((data: FplBootstrap) => {
        const current = data.events.find(
          (event) => event.id === data.currentEvent,
        );
        setPlanningEvent(
          current && new Date(current.deadlineTime).getTime() > Date.now()
            ? current
            : (data.events.find((event) => event.id === data.nextEvent) ??
                current ??
                null),
        );
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  return (
    <header className="sport-header">
      <button
        className="sport-brand"
        onClick={() => onNavigate('dashboard')}
        aria-label="Play XI overview"
      >
        <BrandMark size={35} />
        <span>
          PLAY<span>XI</span>
          <small>FANTASY CLUBHOUSE</small>
        </span>
      </button>
      <div className="sport-header-location">
        {
          (
            {
              dashboard: 'Overview',
              myteam: 'My Team',
              players: 'Player explorer',
              fixtures: 'Fixtures',
              matchcentre: 'Match Centre',
              manager: 'FPL Manager',
            } as Record<string, string>
          )[activeScreen]
        }
      </div>
      <div className="sport-header-tools">
        <button
          className="sport-header-search"
          onClick={onOpenSearch}
          aria-label="Search players"
        >
          <Search size={18} />
          <span>Find a player</span>
          <kbd>⌘ K</kbd>
        </button>
        {planningEvent && (
          <div className="sport-header-deadline">
            <span>{planningEvent.name}</span>
            <small>
              {formatLocalDateTime(planningEvent.deadlineTime, 'Deadline TBC')}
            </small>
          </div>
        )}
        <button
          className="sport-signin"
          onClick={onOpenAccount}
          aria-label={
            authUser
              ? `Account: ${authUser.email ?? 'signed in'}`
              : 'Sign in to save your team'
          }
        >
          <LogIn size={17} />
          <span>{authUser ? 'Account' : 'Sign in'}</span>
        </button>
        <div className="sport-profile">
          <button
            className="sport-profile-trigger"
            onClick={() => setProfileOpen(!profileOpen)}
            aria-label="FPL manager menu"
            aria-expanded={profileOpen}
          >
            <span>{entry?.player_first_name?.slice(0, 1) || 'XI'}</span>
            <ChevronDown size={14} />
          </button>
          {profileOpen && (
            <div className="sport-profile-menu">
              <strong>
                {entry
                  ? `${entry.player_first_name} ${entry.player_last_name}`
                  : 'Your FPL manager'}
              </strong>
              <p>
                {entry
                  ? `${entry.name} · ID ${entryId}`
                  : 'Connect a public FPL Team ID to get started.'}
              </p>
              <button
                onClick={() => {
                  onNavigate(entry ? 'manager' : 'myteam');
                  setProfileOpen(false);
                }}
              >
                <Users size={16} />
                {entry ? 'Manager overview' : 'Connect your FPL team'}
                <ArrowUpRight size={15} />
              </button>
              <button
                onClick={() => {
                  onReturnHome();
                  setProfileOpen(false);
                }}
              >
                <Home size={16} />
                Welcome page
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
