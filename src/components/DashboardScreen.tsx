import { useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  RefreshCw,
  Sparkles,
  Users,
} from 'lucide-react';
import type { FplEntry, FplPlayer } from '../types/football';
import { PlayerCard, PlayerDetails } from './PlayerDetails';
import { TeamBadge } from './FplIdentity';
import { useFootballData } from './useFootballData';

type LeaderMetric = 'totalPoints' | 'goals' | 'form';
export function DashboardScreen({
  entry,
  onNavigate,
  onCompare,
}: {
  entry: FplEntry | null;
  onNavigate: (screen: string) => void;
  onCompare: (id: number) => void;
}) {
  const {
    data,
    fixtures,
    fixtureError,
    fixturesLoading,
    error,
    loading,
    refresh,
  } = useFootballData();
  const [metric, setMetric] = useState<LeaderMetric>('totalPoints');
  const [selected, setSelected] = useState<FplPlayer | null>(null);
  const teams = new Map(data?.teams.map((team) => [team.id, team]));
  const leaders = useMemo(
    () =>
      [...(data?.players ?? [])]
        .sort(
          (a, b) => b[metric] - a[metric] || a.webName.localeCompare(b.webName),
        )
        .slice(0, 4),
    [data, metric],
  );
  const projections = useMemo(
    () =>
      [...(data?.players ?? [])]
        .sort(
          (a, b) =>
            b.expectedPointsNext - a.expectedPointsNext ||
            a.webName.localeCompare(b.webName),
        )
        .slice(0, 5),
    [data],
  );
  const live = fixtures.filter(
    (fixture) => fixture.started && !fixture.finished,
  );
  const matches = [
    ...live,
    ...fixtures
      .filter((fixture) => !fixture.started && !fixture.finished)
      .sort(
        (a, b) =>
          (a.event ?? 99) - (b.event ?? 99) ||
          (a.kickoffTime ?? '').localeCompare(b.kickoffTime ?? ''),
      ),
  ].slice(0, 6);
  const nextEvent =
    data?.events.find((event) => event.id === data.nextEvent) ??
    data?.events.find((event) => event.id === data.currentEvent);
  return (
    <div className="sport-page">
      <header className="sport-page-heading">
        <div>
          <span className="sport-eyebrow">THE FPL CLUBHOUSE</span>
          <h1>
            Your Gameweek.
            <br className="sm:hidden" /> A clearer game plan<span>.</span>
          </h1>
          <p>Meet the form players. Read the numbers. Make your next move.</p>
        </div>
        <button className="sport-button" onClick={refresh} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />{' '}
          Refresh
        </button>
      </header>
      {loading && (
        <div className="sport-loading" role="status">
          <RefreshCw className="animate-spin" /> Bringing the latest FPL data
          onto the pitch…
        </div>
      )}
      {!loading && error && (
        <div className="sport-empty" role="alert">
          <p>{error}</p>
          <button className="sport-button primary" onClick={refresh}>
            Try again
          </button>
        </div>
      )}
      {!loading && !error && data && (
        <>
          <section
            className="sport-match-strip"
            aria-label={
              live.length ? 'Matches in progress' : 'Upcoming matches'
            }
          >
            <div className="sport-strip-title">
              <h2>
                {live.length ? 'IN PLAY' : 'NEXT UP'}
                <span className={live.length ? 'is-live' : ''} />
              </h2>
              <span>PREMIER LEAGUE</span>
              <button
                onClick={() => onNavigate('fixtures')}
                aria-label="View all fixtures"
              >
                <ArrowUpRight size={23} />
              </button>
            </div>
            <div className="sport-match-scroll">
              {matches.map((fixture) => (
                <button
                  key={fixture.id}
                  className="sport-match-card"
                  onClick={() => onNavigate('fixtures')}
                >
                  <div className="sport-match-meta">
                    <span>
                      {fixture.started
                        ? 'In progress'
                        : `GW ${fixture.event ?? 'TBC'}`}
                    </span>
                    <span>
                      {fixture.started
                        ? 'LIVE'
                        : fixture.kickoffTime
                          ? new Date(fixture.kickoffTime).toLocaleDateString(
                              undefined,
                              { day: 'numeric', month: 'short' },
                            )
                          : 'Date TBC'}
                    </span>
                  </div>
                  <div>
                    <TeamBadge
                      code={teams.get(fixture.homeTeamId)?.code}
                      name={fixture.homeTeam}
                      size={27}
                    />
                    <strong>{fixture.homeTeam}</strong>
                    <b>{fixture.homeScore ?? '–'}</b>
                  </div>
                  <div>
                    <TeamBadge
                      code={teams.get(fixture.awayTeamId)?.code}
                      name={fixture.awayTeam}
                      size={27}
                    />
                    <strong>{fixture.awayTeam}</strong>
                    <b>{fixture.awayScore ?? '–'}</b>
                  </div>
                </button>
              ))}
              {!matches.length && (
                <p className="sport-strip-empty">
                  {fixturesLoading
                    ? 'Loading fixtures…'
                    : fixtureError
                      ? 'Fixtures are temporarily unavailable. Refresh to try again.'
                      : 'No upcoming fixtures have been published.'}
                </p>
              )}
            </div>
          </section>
          <div className="sport-dashboard-grid">
            <section className="sport-panel">
              <div className="sport-panel-heading">
                <div>
                  <span className="sport-eyebrow">THE ONES TO WATCH</span>
                  <h2>Top players</h2>
                </div>
                <div className="sport-segments" aria-label="Rank players by">
                  {(['totalPoints', 'goals', 'form'] as const).map((key) => (
                    <button
                      key={key}
                      aria-pressed={metric === key}
                      onClick={() => setMetric(key)}
                    >
                      {key === 'totalPoints'
                        ? 'Points'
                        : key === 'goals'
                          ? 'Goals'
                          : 'Form'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sport-leaders-grid">
                {leaders.map((player) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    metric={metric}
                    onOpen={() => setSelected(player)}
                  />
                ))}
              </div>
              <button
                className="sport-text-link"
                onClick={() => onNavigate('players')}
              >
                Explore every player <ArrowRight size={16} />
              </button>
            </section>
            <section className="sport-panel sport-projections">
              <div className="sport-panel-heading">
                <div>
                  <span className="sport-eyebrow">THE NEXT GAMEWEEK</span>
                  <h2>Projected leaders</h2>
                </div>
                <span className="sport-round-icon">
                  <Sparkles size={19} />
                </span>
              </div>
              <p className="sport-note">
                FPL’s published expected points. Tap a player to look closer.
              </p>
              <div className="sport-projection-list">
                {projections.map((player, index) => (
                  <button key={player.id} onClick={() => setSelected(player)}>
                    <span className="sport-rank">0{index + 1}</span>
                    <TeamBadge
                      code={player.teamCode}
                      name={player.teamName}
                      size={24}
                    />
                    <div>
                      <strong>{player.webName}</strong>
                      <span>
                        {player.teamShortName} · {player.position}
                      </span>
                    </div>
                    <div className="sport-projection-bar">
                      <span
                        style={{
                          width: `${(Math.max(0, player.expectedPointsNext) / Math.max(...projections.map((item) => item.expectedPointsNext), 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <b>
                      {player.expectedPointsNext.toFixed(1)}
                      <small>xP</small>
                    </b>
                  </button>
                ))}
              </div>
              <p className="sport-note">
                Estimates, not guaranteed points. Availability and fixtures can
                change the outlook.
              </p>
            </section>
            <section className="sport-team-callout">
              <div>
                <span className="sport-eyebrow">
                  YOUR TEAM. YOUR NEXT MOVE.
                </span>
                <h2>{entry ? entry.name : 'Bring your XI into focus.'}</h2>
                <p>
                  {entry
                    ? `${entry.summary_overall_points.toLocaleString()} points · Overall rank #${entry.summary_overall_rank.toLocaleString()}`
                    : 'Connect your public FPL Team ID for your squad, captain and transfer ideas.'}
                </p>
                <button
                  className="sport-button dark"
                  onClick={() => onNavigate('myteam')}
                >
                  {entry ? 'Open my team' : 'Connect my team'}
                  <ArrowUpRight size={18} />
                </button>
              </div>
              <span className="sport-callout-art" aria-hidden="true">
                <Users size={100} strokeWidth={1} />
              </span>
            </section>
            <section className="sport-deadline-card">
              <CalendarDays size={24} />
              <div>
                <span className="sport-eyebrow">ON YOUR CALENDAR</span>
                <h2>{nextEvent?.name ?? 'Next Gameweek'}</h2>
                <p>
                  {nextEvent
                    ? new Date(nextEvent.deadlineTime).toLocaleString(
                        undefined,
                        {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        },
                      )
                    : 'Deadline not announced'}
                </p>
                <button
                  className="sport-text-link"
                  onClick={() => onNavigate('fixtures')}
                >
                  Plan the fixtures <ArrowRight size={16} />
                </button>
              </div>
            </section>
          </div>
          <p className="sport-note">
            Official Fantasy Premier League data · Updated{' '}
            {new Date(data.fetchedAt).toLocaleString()} · Match scores update
            when you refresh.
          </p>
        </>
      )}
      {selected && (
        <PlayerDetails
          key={selected.id}
          player={selected}
          fixtures={fixtures}
          fixturesLoading={fixturesLoading}
          onClose={() => setSelected(null)}
          onCompare={onCompare}
        />
      )}
    </div>
  );
}
