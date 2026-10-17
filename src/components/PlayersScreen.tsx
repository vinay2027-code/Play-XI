import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  Download,
  LayoutGrid,
  List,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import type { FplPlayer, FplPosition } from '../types/football';
import { fplAvailability, formatFplPrice } from '../utils/fpl';
import { PlayerPortrait, TeamBadge } from './FplIdentity';
import { PlayerCard, PlayerDetails } from './PlayerDetails';
import { useFootballData } from './useFootballData';

type SortKey = 'totalPoints' | 'expectedPointsNext' | 'form' | 'cost';
const positions: Array<'ALL' | FplPosition> = [
  'ALL',
  'GKP',
  'DEF',
  'MID',
  'FWD',
];
type NumericPlayerKey = {
  [K in keyof FplPlayer]: FplPlayer[K] extends number ? K : never;
}[keyof FplPlayer];
const metrics: Array<{
  label: string;
  key: NumericPlayerKey;
  digits?: number;
  suffix?: string;
  lowerWins?: boolean;
}> = [
  { label: 'Price', key: 'cost', digits: 1, suffix: 'm', lowerWins: true },
  { label: 'FPL points', key: 'totalPoints' },
  { label: 'Next GW expected points', key: 'expectedPointsNext', digits: 1 },
  { label: 'Recent form', key: 'form', digits: 1 },
  { label: 'Minutes', key: 'minutes' },
  { label: 'Goals', key: 'goals' },
  { label: 'Assists', key: 'assists' },
  { label: 'Expected goals', key: 'expectedGoals', digits: 2 },
  { label: 'Expected assists', key: 'expectedAssists', digits: 2 },
  { label: 'Clean sheets', key: 'cleanSheets' },
  { label: 'Bonus points', key: 'bonus' },
];
function exportCsv(players: FplPlayer[]) {
  const rows = [
    [
      'Player',
      'Team',
      'Position',
      'Price (£m)',
      'FPL points',
      'Form',
      'Next GW expected points',
      'Ownership (%)',
      'Minutes',
      'Goals',
      'Assists',
      'Expected goals',
      'Expected assists',
      'Availability',
      'News',
    ],
    ...players.map((player) => [
      player.webName,
      player.teamName,
      player.position,
      player.cost,
      player.totalPoints,
      player.form,
      player.expectedPointsNext,
      player.selectedByPercent,
      player.minutes,
      player.goals,
      player.assists,
      player.expectedGoals,
      player.expectedAssists,
      fplAvailability(player) || 'Available',
      player.news,
    ]),
  ];
  const csv = rows
    .map((row) =>
      row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','),
    )
    .join('\n');
  const url = URL.createObjectURL(
    new Blob([csv], { type: 'text/csv;charset=utf-8' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = 'play-xi-fpl-player-stats.csv';
  link.click();
  URL.revokeObjectURL(url);
}
export function PlayersScreen({
  compareIds,
  onCompareChange,
}: {
  compareIds: number[];
  onCompareChange: (ids: number[]) => void;
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
  const [query, setQuery] = useState('');
  const [team, setTeam] = useState('ALL');
  const [position, setPosition] = useState<'ALL' | FplPosition>('ALL');
  const [sortBy, setSortBy] = useState<SortKey>('totalPoints');
  const [maxPrice, setMaxPrice] = useState(20);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const [visibleCount, setVisibleCount] = useState(24);
  const [selected, setSelected] = useState<FplPlayer | null>(null);
  useEffect(
    () => setVisibleCount(24),
    [query, team, position, sortBy, maxPrice, availableOnly],
  );
  const teams = useMemo(
    () =>
      data?.teams.slice().sort((a, b) => a.name.localeCompare(b.name)) ?? [],
    [data],
  );
  const players = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return (data?.players ?? [])
      .filter(
        (player) =>
          (!term ||
            `${player.webName} ${player.firstName} ${player.secondName} ${player.teamName}`
              .toLocaleLowerCase()
              .includes(term)) &&
          (team === 'ALL' || String(player.teamId) === team) &&
          (position === 'ALL' || player.position === position) &&
          player.cost <= maxPrice &&
          (!availableOnly || player.status === 'a'),
      )
      .sort(
        (a, b) => b[sortBy] - a[sortBy] || a.webName.localeCompare(b.webName),
      );
  }, [data, query, team, position, sortBy, maxPrice, availableOnly]);
  const compared = compareIds.flatMap(
    (id) => data?.players.find((player) => player.id === id) ?? [],
  );
  function toggleCompare(id: number) {
    onCompareChange(
      compareIds.includes(id)
        ? compareIds.filter((item) => item !== id)
        : [...compareIds.slice(-1), id],
    );
  }
  function resetFilters() {
    setQuery('');
    setTeam('ALL');
    setPosition('ALL');
    setMaxPrice(20);
    setAvailableOnly(false);
    setSortBy('totalPoints');
  }
  return (
    <div className="sport-page">
      <header className="sport-page-heading">
        <div>
          <span className="sport-eyebrow">SCOUT. COMPARE. DECIDE.</span>
          <h1>
            Find your next
            <br className="sm:hidden" /> difference maker<span>.</span>
          </h1>
          <p>
            Every FPL player. The numbers that matter. A closer look in one tap.
          </p>
        </div>
        <div className="sport-actions">
          <button
            className="sport-button"
            disabled={!data || loading}
            onClick={() => exportCsv(players)}
          >
            <Download size={16} /> Export
          </button>
          <button
            className="sport-icon-button"
            disabled={loading}
            onClick={refresh}
            aria-label="Refresh player data"
          >
            <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>
      <section className="sport-filter-panel" aria-label="Player filters">
        <div className="sport-filter-top">
          <label className="sport-search">
            <Search size={19} />
            <input
              aria-label="Search players or clubs"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search players or clubs…"
            />
          </label>
          <label className="sport-select">
            <span className="sr-only">Club</span>
            <select
              value={team}
              onChange={(event) => setTeam(event.target.value)}
            >
              <option value="ALL">Every club</option>
              {teams.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="sport-select">
            <span className="sr-only">Sort players</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortKey)}
            >
              <option value="totalPoints">Most FPL points</option>
              <option value="expectedPointsNext">Highest next GW xP</option>
              <option value="form">Best recent form</option>
              <option value="cost">Highest price</option>
            </select>
          </label>
        </div>
        <div className="sport-filter-bottom">
          <div className="sport-segments" aria-label="Player position">
            {positions.map((item) => (
              <button
                key={item}
                aria-pressed={position === item}
                onClick={() => setPosition(item)}
              >
                {item === 'ALL' ? 'All players' : item}
              </button>
            ))}
          </div>
          <label className="sport-price">
            <SlidersHorizontal size={15} />
            <span>
              Up to <strong>£{maxPrice.toFixed(1)}m</strong>
            </span>
            <input
              aria-label="Maximum player price"
              type="range"
              min="4"
              max="20"
              step="0.5"
              value={maxPrice}
              onChange={(event) => setMaxPrice(Number(event.target.value))}
            />
          </label>
          <label className="sport-check">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(event) => setAvailableOnly(event.target.checked)}
            />{' '}
            Available only
          </label>
        </div>
      </section>
      {loading && (
        <div className="sport-loading" role="status">
          <RefreshCw className="animate-spin" /> Loading official FPL players…
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
          {compareIds.length > 0 && (
            <section
              className="sport-comparison"
              aria-label="Player comparison"
            >
              <div className="sport-panel-heading">
                <div>
                  <span className="sport-eyebrow">HEAD TO HEAD</span>
                  <h2>Compare your picks</h2>
                </div>
                <button
                  className="sport-icon-button"
                  onClick={() => onCompareChange([])}
                  aria-label="Clear comparison"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="sport-compare-players">
                {compared.map((player) => (
                  <div key={player.id}>
                    <PlayerPortrait
                      photo={player.photo}
                      name={player.webName}
                    />
                    <span>
                      <strong>{player.webName}</strong>
                      <small>
                        {player.teamName} · {player.position}
                      </small>
                    </span>
                    <button
                      className="sport-icon-button"
                      onClick={() => toggleCompare(player.id)}
                      aria-label={`Remove ${player.webName} from comparison`}
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
                {compared.length < 2 && (
                  <p>
                    <ArrowRightLeft size={18} /> Choose one more player from the
                    cards below.
                  </p>
                )}
              </div>
              {compared.length === 2 && (
                <div className="sport-compare-metrics">
                  <div>
                    <span>Metric</span>
                    {compared.map((player) => (
                      <strong key={player.id}>{player.webName}</strong>
                    ))}
                  </div>
                  {metrics.map(
                    ({ label, key, digits = 0, suffix = '', lowerWins }) => {
                      const values = compared.map((player) => player[key]);
                      const best = lowerWins
                        ? Math.min(...values)
                        : Math.max(...values);
                      return (
                        <div key={key}>
                          <span>{label}</span>
                          {compared.map((player, index) => (
                            <strong
                              key={player.id}
                              className={
                                values[0] !== values[1] &&
                                values[index] === best
                                  ? 'is-leading'
                                  : ''
                              }
                            >
                              {values[index].toFixed(digits)}
                              {suffix}
                            </strong>
                          ))}
                        </div>
                      );
                    },
                  )}
                  <p className="sport-note">
                    Lime highlights the higher value, or lower price. Position
                    and role matter when judging a move.
                  </p>
                </div>
              )}
            </section>
          )}
          <div className="sport-results-heading">
            <p aria-live="polite">
              <strong>{players.length}</strong> players to explore{' '}
              <span>· Official FPL data</span>
            </p>
            <div className="sport-segments">
              <button
                aria-label="Player card view"
                aria-pressed={view === 'cards'}
                onClick={() => setView('cards')}
              >
                <LayoutGrid size={17} />
              </button>
              <button
                aria-label="Player table view"
                aria-pressed={view === 'table'}
                onClick={() => setView('table')}
              >
                <List size={17} />
              </button>
            </div>
          </div>
          {players.length === 0 ? (
            <div className="sport-empty">
              <Search size={26} />
              <h2>No players match this search.</h2>
              <p>Try another name, club or budget.</p>
              <button className="sport-button primary" onClick={resetFilters}>
                Reset filters
              </button>
            </div>
          ) : view === 'cards' ? (
            <div className="sport-player-grid">
              {players.slice(0, visibleCount).map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  metric={sortBy === 'cost' ? 'totalPoints' : sortBy}
                  selected={compareIds.includes(player.id)}
                  onOpen={() => setSelected(player)}
                  onCompare={() => toggleCompare(player.id)}
                />
              ))}
            </div>
          ) : (
            <div className="sport-table-wrap">
              <table className="sport-player-table">
                <caption className="sr-only">
                  Filtered FPL player stats, sorted by {sortBy}
                </caption>
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Club</th>
                    <th>Price</th>
                    <th>Points</th>
                    <th>Form</th>
                    <th>Next xP</th>
                    <th>Owned</th>
                    <th>G / A</th>
                    <th>Availability</th>
                    <th>Compare</th>
                  </tr>
                </thead>
                <tbody>
                  {players.slice(0, visibleCount).map((player) => (
                    <tr key={player.id}>
                      <th>
                        <button onClick={() => setSelected(player)}>
                          <PlayerPortrait
                            photo={player.photo}
                            name={player.webName}
                            size="sm"
                          />
                          <span>
                            {player.webName}
                            <small>{player.position}</small>
                          </span>
                        </button>
                      </th>
                      <td>
                        <TeamBadge
                          code={player.teamCode}
                          name={player.teamName}
                        />{' '}
                        {player.teamShortName}
                      </td>
                      <td>{formatFplPrice(player.cost)}</td>
                      <td>
                        <b>{player.totalPoints}</b>
                      </td>
                      <td>{player.form.toFixed(1)}</td>
                      <td>{player.expectedPointsNext.toFixed(1)}</td>
                      <td>{player.selectedByPercent.toFixed(1)}%</td>
                      <td>
                        {player.goals} / {player.assists}
                      </td>
                      <td>{fplAvailability(player) || 'Available'}</td>
                      <td>
                        <button
                          className="sport-button"
                          aria-pressed={compareIds.includes(player.id)}
                          onClick={() => toggleCompare(player.id)}
                        >
                          {compareIds.includes(player.id)
                            ? 'Selected ✓'
                            : 'Compare +'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {players.length > visibleCount && (
            <button
              className="sport-button sport-show-more"
              onClick={() => setVisibleCount((count) => count + 24)}
            >
              Show more players ({players.length - visibleCount} remaining){' '}
              <ArrowRightLeft size={16} />
            </button>
          )}
          <p className="sport-note">
            Names, clubs, images and stats from Fantasy Premier League · Updated{' '}
            {new Date(data.fetchedAt).toLocaleString()}. Expected points are
            estimates.
            {fixtureError
              ? ' Upcoming fixtures are temporarily unavailable.'
              : ''}
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
          onCompare={(id) => {
            if (!compareIds.includes(id))
              onCompareChange([...compareIds.slice(-1), id]);
          }}
        />
      )}
    </div>
  );
}
