import { useEffect, useRef } from 'react';
import { ArrowRightLeft, ShieldCheck, X } from 'lucide-react';
import type { FplFixture, FplPlayer } from '../types/football';
import { fplAvailability, formatFplPrice } from '../utils/fpl';
import { PlayerPortrait, TeamBadge } from './FplIdentity';

export function PlayerDetails({
  player,
  fixtures,
  fixturesLoading = false,
  onClose,
  onCompare,
}: {
  player: FplPlayer;
  fixtures: FplFixture[];
  fixturesLoading?: boolean;
  onClose: () => void;
  onCompare: (id: number) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  const status = fplAvailability(player);
  const upcoming = fixtures
    .filter(
      (fixture) =>
        !fixture.finished &&
        (fixture.homeTeamId === player.teamId ||
          fixture.awayTeamId === player.teamId),
    )
    .sort(
      (a, b) =>
        (a.event ?? 99) - (b.event ?? 99) ||
        (a.kickoffTime ?? '').localeCompare(b.kickoffTime ?? ''),
    )
    .slice(0, 3);
  const returns = [
    { label: 'Goals', value: player.goals, expected: player.expectedGoals },
    {
      label: 'Assists',
      value: player.assists,
      expected: player.expectedAssists,
    },
  ];
  return (
    <dialog
      ref={dialog}
      className="player-dialog"
      aria-labelledby="player-detail-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="player-dialog-content">
        <button
          type="button"
          className="sport-icon-button player-dialog-close"
          onClick={onClose}
          aria-label="Close player details"
        >
          <X size={20} />
        </button>
        <div className="player-profile-hero">
          <div className="player-profile-copy">
            <span className="sport-eyebrow">
              PLAYER SPOTLIGHT / {player.position}
            </span>
            <h2 id="player-detail-title">{player.webName}</h2>
            <p>
              {player.firstName} {player.secondName}
            </p>
            <div className="sport-club">
              <TeamBadge
                code={player.teamCode}
                name={player.teamName}
                size={25}
              />
              {player.teamName}
            </div>
            <strong>{formatFplPrice(player.cost)}</strong>
          </div>
          <div className="player-profile-art player-art">
            <PlayerPortrait
              key={player.id}
              photo={player.photo}
              name={player.webName}
              size="lg"
            />
          </div>
        </div>
        <div className="player-profile-body">
          <div className="sport-stat-grid">
            {[
              ['FPL points', player.totalPoints],
              ['Recent form', player.form.toFixed(1)],
              ['Next GW xP', player.expectedPointsNext.toFixed(1)],
              ['Ownership', `${player.selectedByPercent.toFixed(1)}%`],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <div className={`sport-availability ${status ? 'is-warning' : ''}`}>
            <ShieldCheck size={17} />
            <div>
              <strong>{status || 'Available for selection'}</strong>
              {player.news && <p>{player.news}</p>}
            </div>
          </div>
          <section>
            <h3 className="sport-section-title">Season returns</h3>
            <div className="sport-return-chart">
              {returns.map(({ label, value, expected }) => {
                const max = Math.max(value, expected, 1);
                return (
                  <div key={label}>
                    <div className="sport-return-label">
                      <strong>{label}</strong>
                      <span>
                        {value} actual / {expected.toFixed(2)} expected
                      </span>
                    </div>
                    <div className="sport-bar-track">
                      <span style={{ width: `${(value / max) * 100}%` }} />
                    </div>
                    <div className="sport-bar-track is-purple">
                      <span style={{ width: `${(expected / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="sport-note">
              Actual returns in lime · expected returns in purple. These are
              season totals, not predictions.
            </p>
          </section>
          <div className="sport-stat-grid compact">
            {[
              ['Minutes', player.minutes.toLocaleString()],
              ['Points / game', player.pointsPerGame.toFixed(1)],
              ['Clean sheets', player.cleanSheets],
              ['Bonus points', player.bonus],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <section>
            <h3 className="sport-section-title">Next opponents</h3>
            <div className="sport-opponents">
              {upcoming.map((fixture) => {
                const home = fixture.homeTeamId === player.teamId;
                const difficulty = home
                  ? fixture.homeDifficulty
                  : fixture.awayDifficulty;
                return (
                  <div key={fixture.id}>
                    <span>GW {fixture.event ?? 'TBC'}</span>
                    <strong>
                      {home ? fixture.awayTeamShort : fixture.homeTeamShort} (
                      {home ? 'H' : 'A'})
                    </strong>
                    <span className={`sport-fdr fdr-${difficulty}`}>
                      FDR {difficulty}/5
                    </span>
                  </div>
                );
              })}
              {!upcoming.length && (
                <p className="sport-note">
                  {fixturesLoading
                    ? 'Loading upcoming fixtures…'
                    : 'Upcoming fixtures aren’t available right now.'}
                </p>
              )}
            </div>
          </section>
          <button
            type="button"
            className="sport-button primary full-width"
            onClick={() => {
              onCompare(player.id);
              onClose();
            }}
          >
            <ArrowRightLeft size={17} /> Add to comparison
          </button>
          <p className="sport-note">
            Official Fantasy Premier League data. xP is FPL’s next Gameweek
            projection and can change.
          </p>
        </div>
      </div>
    </dialog>
  );
}

export function PlayerCard({
  player,
  metric,
  selected = false,
  onOpen,
  onCompare,
}: {
  player: FplPlayer;
  metric: 'totalPoints' | 'goals' | 'form' | 'expectedPointsNext';
  selected?: boolean;
  onOpen: () => void;
  onCompare?: () => void;
}) {
  const label = {
    totalPoints: 'FPL points',
    goals: 'Goals',
    form: 'Recent form',
    expectedPointsNext: 'Next GW xP',
  }[metric];
  return (
    <article className={`sport-player-card ${selected ? 'is-selected' : ''}`}>
      <button
        className="sport-player-open"
        type="button"
        onClick={onOpen}
        aria-label={`View ${player.webName} player details`}
      >
        <div className="sport-player-copy">
          <span className="sport-eyebrow">
            {player.teamShortName} / {player.position}
          </span>
          <h3>{player.webName}</h3>
          <div className="sport-player-metric">
            <span>{label}</span>
            <strong>
              {Number.isInteger(player[metric])
                ? player[metric]
                : player[metric].toFixed(1)}
            </strong>
          </div>
        </div>
        <span className="sport-player-number" aria-hidden="true">
          {player.totalPoints}
        </span>
        <div className="sport-player-image player-art">
          <PlayerPortrait
            key={player.id}
            photo={player.photo}
            name={player.webName}
            size="lg"
          />
        </div>
        <span className="sport-player-crest">
          <TeamBadge code={player.teamCode} name={player.teamName} size={25} />
        </span>
      </button>
      <div className="sport-player-footer">
        <span>
          {formatFplPrice(player.cost)}{' '}
          <span>· {player.selectedByPercent.toFixed(1)}% owned</span>
        </span>
        {onCompare && (
          <button
            type="button"
            onClick={onCompare}
            aria-pressed={selected}
            aria-label={`${selected ? 'Remove' : 'Compare'} ${player.webName}`}
          >
            {selected ? 'Selected ✓' : 'Compare +'}
          </button>
        )}
      </div>
    </article>
  );
}
