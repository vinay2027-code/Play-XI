import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarClock, ShieldAlert, Sparkles } from 'lucide-react';
import type { FplBootstrap, FplFixture, FplPick, FplPlayer, FplRecommendationsResponse } from '../types/football';
import type { LineupPlan } from '../utils/lineupAdvisor';
import { planProjectedPoints } from '../utils/lineupAdvisor';
import { fplAvailability, formatLocalDateTime } from '../utils/fpl';

type Props = {
  bootstrap: FplBootstrap;
  playerById: Map<number, FplPlayer>;
  eventId: number;
  fixtures: FplFixture[];
  lineup: FplPick[];
  suggestion: LineupPlan | null;
  recommendations: FplRecommendationsResponse | null;
  canApply: boolean;
  onApply: () => void;
};

function timeUntil(iso: string | undefined, now: number) {
  if (!iso) return 'Deadline to be announced';
  const minutes = Math.ceil((new Date(iso).getTime() - now) / 60000);
  if (minutes <= 0) return 'Deadline passed';
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  return days ? `${days}d ${hours}h left` : hours ? `${hours}h ${minutes % 60}m left` : `${minutes}m left`;
}

export function GameweekBrief({ bootstrap, playerById, eventId, fixtures, lineup, suggestion, recommendations, canApply, onApply }: Props) {
  const [now, setNow] = useState(() => Date.now());
  const event = bootstrap.events.find((item) => item.id === eventId);
  const deadlineTime = event?.deadlineTime;
  useEffect(() => {
    setNow(Date.now());
    if (!deadlineTime) return;
    const deadline = new Date(deadlineTime).getTime();
    const remaining = deadline - Date.now();
    if (remaining <= 0) return;
    const timer = window.setInterval(() => {
      setNow(Date.now());
      if (deadline <= Date.now()) window.clearInterval(timer);
    }, 60_000);
    const deadlineTimer = window.setTimeout(() => {
      setNow(Date.now());
      window.clearInterval(timer);
    }, remaining + 10);
    return () => { window.clearTimeout(deadlineTimer); window.clearInterval(timer); };
  }, [deadlineTime]);
  const starters = useMemo(() => lineup.filter((pick) => pick.position <= 11), [lineup]);
  const bench = lineup.filter((pick) => pick.position > 11);
  const flagged = starters.map((pick) => playerById.get(pick.element)).filter((player): player is FplPlayer => Boolean(player && fplAvailability(player)));
  const firstFlagged = flagged[0];
  const benchCover = firstFlagged
    ? bench.map((pick) => playerById.get(pick.element)).find((player) => {
      if (!player || fplAvailability(player)) return false;
      if (firstFlagged.position === 'GKP') return player.position === 'GKP';
      if (player.position === 'GKP') return false;
      const replacementPositions = starters.map((pick) => playerById.get(pick.element)?.position).filter((position): position is FplPlayer['position'] => Boolean(position));
      const outIndex = replacementPositions.indexOf(firstFlagged.position);
      if (outIndex < 0) return false;
      replacementPositions.splice(outIndex, 1, player.position);
      const counts = { DEF: 0, MID: 0, FWD: 0 };
      for (const position of replacementPositions) {
        if (position === 'DEF' || position === 'MID' || position === 'FWD') counts[position]++;
      }
      return counts.DEF >= 3 && counts.DEF <= 5 && counts.MID >= 2 && counts.MID <= 5 && counts.FWD >= 1 && counts.FWD <= 3;
    })
    : bench.map((pick) => playerById.get(pick.element)).find((player) => player && player.position !== 'GKP' && !fplAvailability(player));
  const captain = starters.find((pick) => pick.is_captain);
  const viceCaptain = starters.find((pick) => pick.is_vice_captain);
  const captainName = captain ? playerById.get(captain.element)?.webName : null;
  const suggestedCaptain = suggestion ? playerById.get(suggestion.captain) : null;
  const suggestedVice = suggestion ? playerById.get(suggestion.viceCaptain) : null;
  const promoted = suggestion?.starters.filter((id) => !starters.some((pick) => pick.element === id)) ?? [];
  const dropped = starters.filter((pick) => suggestion && !suggestion.starters.includes(pick.element)).map((pick) => pick.element);
  const lineupMatches = Boolean(suggestion && promoted.length === 0 && captain?.element === suggestion.captain
    && viceCaptain?.element === suggestion.viceCaptain
    && bench.map((pick) => pick.element).join(',') === suggestion.bench.join(','));
  const fixtureWatch = useMemo(() => {
    let hardest: { player: FplPlayer; difficulty: number } | null = null;
    let easiest: { player: FplPlayer; difficulty: number } | null = null;
    for (const pick of starters) {
      const player = playerById.get(pick.element);
      if (!player) continue;
      const next = fixtures.filter((fixture) => fixture.event !== null && fixture.event >= eventId && fixture.event <= eventId + 2
        && (fixture.homeTeamId === player.teamId || fixture.awayTeamId === player.teamId));
      if (!next.length) continue;
      const difficulty = next.reduce((sum, fixture) => sum + (fixture.homeTeamId === player.teamId ? fixture.homeDifficulty : fixture.awayDifficulty), 0) / next.length;
      if (!hardest || difficulty > hardest.difficulty) hardest = { player, difficulty };
      if (!easiest || difficulty < easiest.difficulty) easiest = { player, difficulty };
    }
    return hardest && easiest ? { hardest, easiest } : null;
  }, [starters, playerById, fixtures, eventId]);
  const topMove = recommendations?.eventId === eventId ? recommendations.freeIdeas[0] : null;
  const currentPoints = captain ? planProjectedPoints(starters.map((pick) => pick.element), captain.element, playerById) : null;
  const suggestedPoints = suggestion ? planProjectedPoints(suggestion.starters, suggestion.captain, playerById) : null;
  const difference = suggestedPoints !== null && currentPoints !== null ? suggestedPoints - currentPoints : null;
  const deadlineIsOpen = Boolean(deadlineTime && new Date(deadlineTime).getTime() > now);

  return <section aria-labelledby="gameweek-brief-title" className="overflow-hidden rounded-3xl border border-[#00FF87]/20 bg-[radial-gradient(ellipse_at_top_right,_rgba(0,255,135,.10),_transparent_48%),#0d1c2d]">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/8 p-5 sm:p-6">
      <div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#00FF87]"><Sparkles className="h-3.5 w-3.5" /> Your Gameweek brief</div><h2 id="gameweek-brief-title" className="mt-2 text-2xl font-black tracking-tight text-white">The decisions in your squad</h2><p className="mt-1 text-xs leading-5 text-slate-400">Based on your imported team and the latest public FPL projections.</p></div>
      <div className="rounded-xl border border-white/10 bg-[#071521]/70 px-3 py-2 text-right"><div className="flex items-center justify-end gap-1.5 text-xs font-bold text-white"><CalendarClock className="h-4 w-4 text-[#00FF87]" />{timeUntil(event?.deadlineTime, now)}</div><div className="mt-1 text-[10px] text-slate-400">{formatLocalDateTime(event?.deadlineTime ?? null, 'Deadline TBC')}</div></div>
    </div>
    <div className="grid gap-px bg-white/8 sm:grid-cols-2 xl:grid-cols-4">
      <div className="bg-[#0d1c2d]/95 p-4 sm:p-5"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400"><ShieldAlert className="h-3.5 w-3.5 text-amber-300" /> Availability</div><div className="mt-2 text-base font-bold text-white">{flagged.length ? `${flagged.length} flagged starter${flagged.length === 1 ? '' : 's'}` : 'No flagged starters'}</div><p className="mt-1 text-xs leading-5 text-slate-400">{flagged.length ? flagged.map((player) => `${player.webName} (${fplAvailability(player)})`).join(' · ') : 'No starting XI availability flags in current FPL data.'}</p></div>
      <div className="bg-[#0d1c2d]/95 p-4 sm:p-5"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bench cover</div><div className="mt-2 text-base font-bold text-white">{benchCover?.webName ?? (firstFlagged ? 'No legal cover in XI' : 'Check your reserves')}</div><p className="mt-1 text-xs leading-5 text-slate-400">{benchCover ? `${firstFlagged ? `Legal cover if ${firstFlagged.webName} misses out` : 'Highest available outfield reserve'} · ${benchCover.expectedPointsNext.toFixed(1)} xP` : firstFlagged ? 'No available reserve can replace this starter and keep a valid FPL formation.' : 'No available outfield reserve is listed.'}</p></div>
      <div className="bg-[#0d1c2d]/95 p-4 sm:p-5"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Captain call</div><div className="mt-2 text-base font-bold text-white">{suggestedCaptain ? suggestedCaptain.webName : captainName ?? 'Awaiting projections'}</div><p className="mt-1 text-xs leading-5 text-slate-400">{suggestedCaptain ? `${captainName === suggestedCaptain.webName ? 'Matches your current captain' : `Consider over ${captainName ?? 'current captain'}`} · ${suggestedCaptain.expectedPointsNext.toFixed(1)} FPL xP` : 'FPL projections are needed for a suggestion.'}</p></div>
      <div className="bg-[#0d1c2d]/95 p-4 sm:p-5"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fixture swing</div><div className="mt-2 text-base font-bold text-white">{fixtureWatch ? `Easier: ${fixtureWatch.easiest.player.webName}` : 'No fixture data yet'}</div><p className="mt-1 text-xs leading-5 text-slate-400">{fixtureWatch ? `${fixtureWatch.easiest.difficulty.toFixed(1)} avg FDR vs ${fixtureWatch.hardest.player.webName}'s ${fixtureWatch.hardest.difficulty.toFixed(1)} · next 3 GWs` : 'The next three Gameweeks will appear when FPL fixtures are available.'}</p></div>
    </div>
    <div className="grid gap-4 border-t border-white/8 p-5 lg:grid-cols-[1.3fr_.7fr] sm:p-6">
      <div><div className="text-[10px] font-bold uppercase tracking-wider text-[#00FF87]">Suggested XI, captain and bench</div><h3 className="mt-2 text-lg font-black text-white">{suggestion ? `${suggestion.starters.filter((id) => playerById.get(id)?.position === 'DEF').length}-${suggestion.starters.filter((id) => playerById.get(id)?.position === 'MID').length}-${suggestion.starters.filter((id) => playerById.get(id)?.position === 'FWD').length} formation` : 'Waiting for usable FPL projections'}</h3>
        {suggestion ? <><p className="mt-1 text-xs leading-5 text-slate-300">Captain {suggestedCaptain?.webName} · vice {suggestedVice?.webName} · {difference !== null ? `${difference >= 0 ? '+' : ''}${difference.toFixed(1)} risk-adjusted xP vs your displayed XI` : 'compare your XI below'}</p><p className="mt-2 text-xs leading-5 text-slate-400">{promoted.length ? `Start ${promoted.map((id) => playerById.get(id)?.webName).join(', ')}; bench ${dropped.map((id) => playerById.get(id)?.webName).join(', ')}.` : 'Your starters already match the suggested XI.'} First outfield sub: {playerById.get(suggestion.bench[1])?.webName ?? '—'}.</p></> : <p className="mt-1 text-xs leading-5 text-slate-400">The assistant needs a complete 15-player squad and next-Gameweek projections.</p>}
        {canApply && deadlineIsOpen && suggestion && <button type="button" disabled={lineupMatches} onClick={onApply} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#00FF87] px-4 py-2.5 text-xs font-bold text-[#051424] hover:bg-[#00e478] disabled:cursor-default disabled:opacity-45">{lineupMatches ? 'Plan already matches' : 'Use this in my Play XI plan'} <ArrowRight className="h-3.5 w-3.5" /></button>}
        {(!canApply || !deadlineIsOpen) && <p className="mt-3 text-[11px] text-slate-500">{deadlineIsOpen ? 'Published FPL picks are shown as read-only.' : 'The Gameweek deadline has passed, so this lineup is read-only.'}</p>}
      </div>
      <div className="rounded-2xl border border-white/8 bg-[#071521]/65 p-4"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Transfer to review first</div>{topMove ? <><div className="mt-2 text-sm font-bold text-white">{topMove.outgoing.webName} <ArrowRight className="inline h-3.5 w-3.5 text-[#00FF87]" /> {topMove.incoming.webName}</div><p className={`mt-1 text-xs ${topMove.delta > 0 ? 'text-[#adffd0]' : 'text-amber-200'}`}>{topMove.delta > 0 ? '+' : ''}{topMove.delta.toFixed(1)} next-GW FPL xP</p><p className="mt-2 text-[11px] leading-5 text-slate-400">See the five reasons and cost below before deciding.</p></> : <p className="mt-2 text-xs leading-5 text-slate-400">{recommendations ? 'No qualifying affordable move is available for this Gameweek.' : 'Transfer ideas are loading or unavailable.'}</p>}</div>
    </div>
    <div className="border-t border-white/8 px-5 py-3 text-[10px] leading-4 text-slate-500 sm:px-6">FPL player data checked {formatLocalDateTime(bootstrap.fetchedAt, 'recently')}. xP and FDR are estimates. Injured, suspended and unavailable players count as 0 in the XI comparison. This plan stays on this device and does not change your official FPL team.</div>
  </section>;
}
