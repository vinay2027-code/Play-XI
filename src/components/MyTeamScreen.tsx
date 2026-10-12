import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowRightLeft, ArrowUpRight, CalendarDays, Link2, ShieldAlert, Sparkles, Users } from 'lucide-react';
import type { FplBootstrap, FplEntry, FplPicksResponse, FplRecommendationsResponse, FplTransferRecord } from '../types/football';
import { fplAvailability, formatFplPrice, formatLocalDateTime } from '../utils/fpl';
import { PlayerPortrait, TeamBadge } from './FplIdentity';

const STORAGE_KEY = 'playxi-fpl-entry-id';

function rank(value?: number) { return value ? value.toLocaleString() : '—'; }

function picksWithAutomaticSubs(picks: FplPicksResponse | null) {
  const lineup = (picks?.picks ?? []).map((pick) => ({ ...pick }));
  for (const substitution of picks?.automatic_subs ?? []) {
    const starterIndex = lineup.findIndex((pick) => pick.position <= 11 && pick.element === substitution.element_out);
    const benchIndex = lineup.findIndex((pick) => pick.position > 11 && pick.element === substitution.element_in);
    if (starterIndex < 0 || benchIndex < 0) continue;

    const outgoing = lineup[starterIndex];
    const incoming = lineup[benchIndex];
    lineup[starterIndex] = { ...outgoing, element: incoming.element, is_captain: false, is_vice_captain: false };
    lineup[benchIndex] = { ...incoming, element: outgoing.element, is_captain: false, is_vice_captain: false };
  }
  return lineup;
}

export function MyTeamScreen({ onBrowsePlayers, onBrowseFixtures }: { onBrowsePlayers: () => void; onBrowseFixtures: () => void }) {
  const [entryId, setEntryId] = useState('');
  const [entry, setEntry] = useState<FplEntry | null>(null);
  const [bootstrap, setBootstrap] = useState<FplBootstrap | null>(null);
  const [picks, setPicks] = useState<FplPicksResponse | null>(null);
  const [recommendations, setRecommendations] = useState<FplRecommendationsResponse | null>(null);
  const [recommendationsError, setRecommendationsError] = useState('');
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [planningEventId, setPlanningEventId] = useState<number | null>(null);
  const [asOfEventId, setAsOfEventId] = useState<number | null>(null);
  const [planningBankTenths, setPlanningBankTenths] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadTeam(id: string, save = false) {
    const cleanId = id.trim();
    if (!/^\d+$/.test(cleanId) || Number(cleanId) < 1) {
      setError('Enter the numeric Team ID from your Fantasy Premier League team URL.');
      return;
    }
    setLoading(true);
    setError('');
    setEntry(null);
    setBootstrap(null);
    setPicks(null);
    setRecommendations(null);
    setRecommendationsError('');
    setRecommendationsLoading(true);
    setPlanningEventId(null);
    setAsOfEventId(null);
    setPlanningBankTenths(null);
    try {
      const [entryResponse, bootstrapResponse, recommendationsResult] = await Promise.all([
        fetch(`/api/fpl/entry/${cleanId}`),
        fetch('/api/fpl/bootstrap'),
        fetch(`/api/fpl/entry/${cleanId}/recommendations`)
          .then(async (response) => ({ response, payload: await response.json() }))
          .catch(() => null),
      ]);
      const [entryPayload, bootstrapPayload] = await Promise.all([entryResponse.json(), bootstrapResponse.json()]);
      if (!entryResponse.ok) throw new Error(entryPayload.error || 'Could not load this public FPL team.');
      if (!bootstrapResponse.ok) throw new Error(bootstrapPayload.error || 'Could not load current FPL game data.');
      const entryData = entryPayload as FplEntry;
      const bootData = bootstrapPayload as FplBootstrap;
      if (recommendationsResult?.response.ok) setRecommendations(recommendationsResult.payload as FplRecommendationsResponse);
      else setRecommendationsError(recommendationsResult?.payload.error || 'Transfer ideas are temporarily unavailable.');
      const currentEvent = bootData.events.find((event) => event.id === bootData.currentEvent);
      const currentDeadlineIsOpen = Boolean(currentEvent && new Date(currentEvent.deadlineTime).getTime() > Date.now());
      const eventId = currentDeadlineIsOpen
        ? currentEvent?.id
        : bootData.nextEvent ?? currentEvent?.id ?? entryData.current_event;
      let picksData: FplPicksResponse | null = null;
      let transferData: FplTransferRecord[] | null = null;
      let picksEventId: number | null = null;
      if (eventId) {
        const [transfersResponse, picksResponse] = await Promise.all([
          fetch(`/api/fpl/entry/${cleanId}/transfers`),
          fetch(`/api/fpl/entry/${cleanId}/event/${eventId}/picks`),
        ]);
        const [transfersPayload, picksPayload] = await Promise.all([transfersResponse.json(), picksResponse.json()]);
        if (transfersResponse.ok && Array.isArray(transfersPayload)) transferData = transfersPayload as FplTransferRecord[];
        if (picksResponse.ok) {
          picksData = picksPayload as FplPicksResponse;
          picksEventId = eventId;
        } else {
          const fallbackEvent = bootData.events
            .filter((event) => event.finished && event.id < eventId)
            .sort((a, b) => b.id - a.id)[0]?.id;
          if (!fallbackEvent || fallbackEvent === eventId) throw new Error(picksPayload.error || `Could not load the team picks for Gameweek ${eventId}.`);
          const fallbackResponse = await fetch(`/api/fpl/entry/${cleanId}/event/${fallbackEvent}/picks`);
          const fallbackPayload = await fallbackResponse.json();
          if (!fallbackResponse.ok) throw new Error(fallbackPayload.error || `Could not load the team picks for Gameweek ${fallbackEvent}.`);
          picksData = fallbackPayload as FplPicksResponse;
          picksEventId = fallbackEvent;
        }
      }
      let bankTenths = picksData?.entry_history.bank ?? null;
      if (picksData && transferData && picksEventId !== null && eventId !== undefined && eventId > picksEventId) {
        const targetGameweek = eventId;
        const interveningTransfers = transferData
          .filter((transfer) => transfer.event > picksEventId && transfer.event <= targetGameweek)
          .sort((a, b) => a.event - b.event || a.time.localeCompare(b.time));
        for (const transfer of interveningTransfers) {
          if (bankTenths !== null) bankTenths += transfer.element_out_cost - transfer.element_in_cost;
        }
      }
      setEntry(entryData);
      setBootstrap(bootData);
      setPicks(picksData);
      setPlanningEventId(eventId ?? null);
      setAsOfEventId(picksEventId);
      setPlanningBankTenths(bankTenths);
      setEntryId(cleanId);
      if (save) window.localStorage.setItem(STORAGE_KEY, cleanId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load the FPL team. Check the Team ID and try again.');
    } finally {
      setRecommendationsLoading(false);
      setLoading(false);
    }
  }

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setEntryId(saved);
      void loadTeam(saved);
    }
  // The saved ID is read once when this screen opens.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playerById = useMemo(() => new Map((bootstrap?.players ?? []).map((player) => [player.id, player])), [bootstrap]);
  const lineup = useMemo(() => picksWithAutomaticSubs(picks), [picks]);
  const automaticSubIns = useMemo(() => new Set((picks?.automatic_subs ?? []).map((substitution) => substitution.element_in)), [picks]);
  const automaticSubOuts = useMemo(() => new Set((picks?.automatic_subs ?? []).map((substitution) => substitution.element_out)), [picks]);
  const { startingPicks, benchPicks, positionRows, formation, startingExpectedPoints } = useMemo(() => {
    const startingPicks = lineup.filter((pick) => pick.position <= 11).sort((a, b) => a.position - b.position);
    const benchPicks = lineup.filter((pick) => pick.position > 11).sort((a, b) => a.position - b.position);
    const positionRows = (['FWD', 'MID', 'DEF', 'GKP'] as const).map((position) => ({
      position,
      picks: startingPicks.filter((pick) => playerById.get(pick.element)?.position === position),
    })).filter((row) => row.picks.length > 0);
    const formation = (['DEF', 'MID', 'FWD'] as const).map((position) =>
      positionRows.find((row) => row.position === position)?.picks.length ?? 0,
    ).join('-');
    const startingExpectedPoints = startingPicks.reduce((total, pick) =>
      total + (playerById.get(pick.element)?.expectedPointsNext ?? 0), 0,
    );
    return { startingPicks, benchPicks, positionRows, formation, startingExpectedPoints };
  }, [lineup, playerById]);

  const recommendationList = recommendations?.freeIdeas ?? [];
  const selectedEvent = bootstrap?.events.find((event) => event.id === planningEventId)
    ?? bootstrap?.events.find((event) => event.id === (bootstrap.currentEvent ?? bootstrap.nextEvent));
  const picksEvent = bootstrap?.events.find((event) => event.id === asOfEventId);
  const picksAreForPreviousEvent = asOfEventId !== null && planningEventId !== null && asOfEventId !== planningEventId;
  const picksEventLabel = picksEvent?.name ?? (asOfEventId ? `Gameweek ${asOfEventId}` : 'published Gameweek');

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadTeam(entryId, true);
  }

  return (
    <main className="mx-auto max-w-[1480px] space-y-5 p-4 pb-28 sm:space-y-6 sm:p-6 lg:p-8">
      <header className="rounded-3xl border border-white/8 bg-[radial-gradient(ellipse_at_top_right,_rgba(0,255,135,.10),_transparent_42%),linear-gradient(120deg,#0d1c2d,#091726)] p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#00FF87]"><span className="h-1.5 w-1.5 rounded-full bg-[#00FF87]" /> FPL DECISION DESK</div><h1 className="text-3xl font-black tracking-[-.04em] text-white sm:text-4xl">Your next Gameweek,<br className="sm:hidden" /> in focus.</h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Start with the decisions that matter. Your team, budget and transfer ideas in one place.</p></div>
          {entry && <div className="rounded-2xl border border-white/10 bg-[#071521]/70 px-4 py-3 sm:min-w-52"><div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Planning for</div><div className="mt-1 flex items-center gap-2 font-bold text-white"><CalendarDays className="h-4 w-4 text-[#00FF87]" />{selectedEvent?.name ?? 'FPL Gameweek'}</div><div className="mt-1 text-xs text-slate-400">Deadline · {formatLocalDateTime(selectedEvent?.deadlineTime ?? null, 'Not announced')}</div></div>}
        </div>
      </header>

      <section className="rounded-xl border border-white/10 bg-[#0d1c2d] p-4 sm:p-5">
        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
          <label className="flex-1"><span className="mb-1.5 block text-xs font-semibold text-slate-300">FPL Team ID</span><input inputMode="numeric" value={entryId} onChange={(event) => setEntryId(event.target.value)} placeholder="For example: 1234567" className="w-full rounded-lg border border-white/10 bg-[#091726] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#00FF87]" /></label>
          <button type="submit" disabled={loading} className="self-end inline-flex items-center justify-center gap-2 rounded-lg bg-[#00FF87] px-5 py-2.5 text-sm font-bold text-[#051424] hover:bg-[#00e478] disabled:opacity-50"><Link2 className="h-4 w-4" />{loading ? 'Loading team…' : entry ? 'Refresh team' : 'Import team'}</button>
        </form>
        <p className="mt-2 text-xs text-slate-500">Find it in your FPL URL: fantasy.premierleague.com/entry/<strong>TEAM_ID</strong>/event/… Play XI reads public FPL data only and never asks for your FPL password.</p>
        {error && <p role="alert" className="mt-3 rounded-lg border border-rose-900 bg-rose-950/30 px-3 py-2 text-sm text-rose-200">{error}</p>}
      </section>

      {entry && bootstrap && <>
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/8 bg-[#0d1c2d] p-4 sm:p-5"><div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Manager</div><div className="mt-2 text-lg font-extrabold text-white">{entry.player_first_name} {entry.player_last_name}</div><div className="mt-0.5 text-xs text-slate-400">{entry.name}</div></div>
          <div className="rounded-2xl border border-white/8 bg-[#0d1c2d] p-4 sm:p-5"><div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Overall points</div><div className="mt-2 text-3xl font-black tracking-tight text-white">{rank(entry.summary_overall_points)}</div><div className="mt-0.5 text-xs text-slate-400">Rank #{rank(entry.summary_overall_rank)}</div></div>
          <div className="rounded-2xl border border-white/8 bg-[#0d1c2d] p-4 sm:p-5"><div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Latest Gameweek</div><div className="mt-2 text-3xl font-black tracking-tight text-[#00FF87]">{rank(entry.summary_event_points)}<span className="ml-1 text-sm font-bold text-slate-400">pts</span></div><div className="mt-0.5 text-xs text-slate-400">GW rank #{rank(entry.summary_event_rank)}</div></div>
          <div className="rounded-2xl border border-[#00FF87]/20 bg-[#0d1c2d] p-4 sm:p-5"><div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Available bank</div><div className="mt-2 text-3xl font-black tracking-tight text-white">{picks ? formatFplPrice((planningBankTenths ?? picks.entry_history.bank) / 10) : '—'}</div><div className="mt-0.5 text-xs text-slate-400">For position-matched moves</div></div>
        </section>

        {picks && <>
          <section aria-labelledby="starting-xi-title" className="overflow-hidden rounded-3xl border border-white/10 bg-[#0d1c2d] shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-4 py-4 sm:px-6">
              <div><div className="mb-1 text-[10px] font-bold uppercase tracking-[.18em] text-[#00FF87]">{picksAreForPreviousEvent ? `Last published · ${picksEventLabel}` : selectedEvent?.name ?? 'Next Gameweek'}</div><h2 id="starting-xi-title" className="text-xl font-black tracking-tight text-white sm:text-2xl">{picksAreForPreviousEvent ? 'Last confirmed XI' : 'Your starting XI'}</h2><p className="mt-1 text-xs text-slate-400">{picksAreForPreviousEvent ? `Showing official ${picksEventLabel} picks and substitutions. FPL has not published picks for ${selectedEvent?.name ?? 'the upcoming Gameweek'} yet, so its lineup and formation may differ.` : 'Your official FPL lineup, including any automatic substitutions.'}</p></div>
              <div className="flex items-center gap-2"><span className="rounded-lg border border-white/10 bg-[#091726] px-3 py-2 text-xs font-bold text-white">{formation}</span><span className="rounded-lg border border-[#00FF87]/15 bg-[#00FF87]/[.07] px-3 py-2 text-xs font-bold text-[#adffd0]">{startingExpectedPoints.toFixed(1)} xP</span></div>
            </div>

            <div className="relative isolate mx-3 my-3 flex min-h-[450px] flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-emerald-200/25 bg-[linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(180deg,#07864f,#087446)] bg-[size:50%_100%,100%_25%] p-4 py-6 sm:mx-5 sm:my-5 sm:min-h-[560px] sm:gap-5 sm:p-7">
              <div aria-hidden="true" className="pointer-events-none absolute inset-3 rounded-xl border border-white/35" />
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-3 top-1/2 border-t border-white/30" />
              <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30 sm:h-32 sm:w-32" />
              <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-3 h-10 w-36 -translate-x-1/2 rounded-b-full border border-t-0 border-white/25 sm:h-14 sm:w-48" />
              <div aria-hidden="true" className="pointer-events-none absolute bottom-3 left-1/2 h-10 w-36 -translate-x-1/2 rounded-t-full border border-b-0 border-white/25 sm:h-14 sm:w-48" />
              {positionRows.map(({ position, picks: row }) => {
                return <div key={position} className="relative z-10 flex w-full items-center justify-around gap-1">
                  {row.map((pick) => {
                    const player = playerById.get(pick.element);
                    if (!player) return null;
                    const issue = fplAvailability(player);
                    const wasAutomaticallySubbedIn = automaticSubIns.has(pick.element);
                    return <div key={pick.element} className="flex w-[68px] min-w-0 flex-col items-center text-center sm:w-[86px]" aria-label={`${player.webName}, ${player.position}${wasAutomaticallySubbedIn ? ', automatic substitute' : ''}${pick.is_captain ? ', captain' : ''}${pick.is_vice_captain ? ', vice captain' : ''}${issue ? `, ${issue}` : ''}`}>
                      <div className="relative mb-[-7px]">
                        <PlayerPortrait photo={player.photo} name={player.webName} size="md" />
                        <span className="absolute -right-1 bottom-1 rounded-full bg-white p-0.5 shadow"><TeamBadge code={player.teamCode} name={player.teamName} size={16} /></span>
                        {(pick.is_captain || pick.is_vice_captain) && <span className="absolute -left-1 top-0 rounded-full bg-[#d9ff68] px-1.5 py-0.5 text-[9px] font-black text-[#15220a]">{pick.is_captain ? 'C' : 'VC'}</span>}
                        {issue && <span title={issue} className="absolute -right-1 -top-1 rounded-full bg-amber-300 p-0.5 text-[#291d04]"><ShieldAlert className="h-3 w-3" /></span>}
                      </div>
                      <div className="relative z-10 w-full rounded-lg border border-white/15 bg-[#071521]/90 px-1.5 pb-1.5 pt-2 shadow-lg">
                        <div className="truncate text-[10px] font-extrabold text-white sm:text-xs">{player.webName}</div>
                        {wasAutomaticallySubbedIn && <div className="text-[8px] font-black uppercase tracking-wider text-[#8bffb8]">Auto-sub</div>}
                        <div className="mt-0.5 font-mono text-[10px] font-bold text-[#8bffb8]">{player.expectedPointsNext.toFixed(1)} xP</div>
                      </div>
                    </div>;
                  })}
                </div>;
              })}
            </div>

            <div className="border-t border-white/8 bg-[#091726]/80 p-4 sm:px-6">
              <div className="mb-3 flex items-center justify-between gap-3"><div><h3 className="text-sm font-bold text-white">Bench</h3><p className="text-[11px] text-slate-500">Substitution order from your FPL picks</p></div><span className="text-xs font-semibold text-slate-400">{benchPicks.length} reserves</span></div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {benchPicks.map((pick) => {
                  const player = playerById.get(pick.element);
                  if (!player) return null;
                  const issue = fplAvailability(player);
                  return <div key={pick.element} className="flex min-w-0 items-center gap-2 rounded-xl border border-white/8 bg-[#0d1c2d] p-2.5">
                    <PlayerPortrait photo={player.photo} name={player.webName} size="sm" />
                    <div className="min-w-0"><div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{automaticSubOuts.has(pick.element) ? 'Auto-subbed out' : player.position === 'GKP' ? 'Reserve GK' : `Sub ${pick.position - 11}`}</div><div className="truncate text-xs font-bold text-white">{player.webName}</div><div className="flex items-center gap-1 text-[10px] text-slate-400"><TeamBadge code={player.teamCode} name={player.teamName} size={13} />{player.position} · {player.expectedPointsNext.toFixed(1)} xP</div></div>
                    {issue && <span title={issue} className="ml-auto text-amber-300"><ShieldAlert className="h-3.5 w-3.5" /></span>}
                  </div>;
                })}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-[#00FF87]/20 bg-[radial-gradient(ellipse_at_top_right,_rgba(0,255,135,.08),_transparent_50%),#0b1a29] p-4 sm:p-6">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><div className="mb-1 text-[10px] font-bold uppercase tracking-[.18em] text-[#00FF87]">Your free shortlist</div><h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">Transfer ideas to consider</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">Compare the outgoing and incoming player, expected-points difference and bank left after the move.</p></div><span className="rounded-full border border-[#00FF87]/20 bg-[#00FF87]/[.07] px-3 py-1.5 text-xs font-bold text-[#c4ffb4]">{recommendationList.length} of 3 free ideas</span></div>
            {recommendationsLoading ? <p className="rounded-2xl border border-white/8 bg-[#091726]/70 p-5 text-sm text-slate-300">Checking your squad against current FPL data…</p> : recommendationList.length ? <div className="grid gap-3 xl:grid-cols-3">{recommendationList.map((move, index) => {
              const bankAfter = (planningBankTenths ?? picks.entry_history.bank) / 10 + move.saleValue - move.incoming.cost;
              return <article key={`${move.outgoing.id}-${move.incoming.id}`} className="rounded-2xl border border-white/8 bg-[#091726]/85 p-4 transition hover:border-[#00FF87]/25 sm:p-5">
                <div className="mb-4 flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">IDEA {String(index + 1).padStart(2, '0')}</span><span className={`rounded-full px-2.5 py-1 font-mono text-xs font-bold ${move.delta >= 0 ? 'bg-[#00FF87]/10 text-[#a9ffc9]' : 'bg-amber-300/10 text-amber-200'}`}>{move.delta > 0 ? '+' : ''}{move.delta.toFixed(1)} xP</span></div>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl border border-white/6 bg-[#0d1c2d]/70 p-3 sm:gap-3 sm:p-4">
                  <div className="min-w-0"><div className="mb-2 flex items-center gap-2"><PlayerPortrait photo={move.outgoing.photo} name={move.outgoing.webName} size="sm" /><div className="min-w-0"><div className="text-[9px] font-bold uppercase tracking-widest text-rose-300/75">OUT · {move.outgoing.position}</div><div className="mt-1 truncate text-sm font-extrabold text-white">{move.outgoing.webName}</div></div></div><div className="flex items-center gap-1 truncate text-[10px] text-slate-400"><TeamBadge code={move.outgoing.teamCode} name={move.outgoing.teamName} size={16} />{move.outgoing.teamName}</div><div className="mt-2 text-xs font-semibold text-slate-300">{formatFplPrice(move.saleValue)} <span className="font-normal text-slate-500">sale value</span></div></div>
                  <ArrowRightLeft className="h-4 w-4 text-slate-500" />
                  <div className="min-w-0"><div className="mb-2 flex items-center gap-2"><PlayerPortrait photo={move.incoming.photo} name={move.incoming.webName} size="sm" /><div className="min-w-0"><div className="text-[9px] font-bold uppercase tracking-widest text-[#00FF87]/75">IN · {move.incoming.position}</div><div className="mt-1 truncate text-sm font-extrabold text-white">{move.incoming.webName}</div></div></div><div className="flex items-center gap-1 truncate text-[10px] text-slate-400"><TeamBadge code={move.incoming.teamCode} name={move.incoming.teamName} size={16} />{move.incoming.teamName}</div><div className="mt-2 text-xs font-semibold text-slate-300">{formatFplPrice(move.incoming.cost)} <span className="font-normal text-slate-500">price</span></div></div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl bg-white/[.035] p-3"><div className="text-[10px] text-slate-500">Next GW xP</div><div className="mt-1 font-mono font-bold text-slate-200">{move.outgoing.expectedPointsNext.toFixed(1)} → <span className="text-[#00FF87]">{move.incoming.expectedPointsNext.toFixed(1)}</span></div></div><div className="rounded-xl bg-white/[.035] p-3"><div className="text-[10px] text-slate-500">Bank after move</div><div className="mt-1 font-mono font-bold text-white">{formatFplPrice(bankAfter)}</div></div></div>
                <ul className="mt-3 space-y-1.5 border-t border-white/6 pt-3 text-xs leading-5 text-slate-400">{move.reasons.slice(0, 2).map((reason) => <li key={reason} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#00FF87]" />{reason}</li>)}</ul>
              </article>;
            })}</div> : <p className="rounded-2xl border border-white/8 bg-[#091726]/70 p-5 text-sm leading-6 text-slate-300">{recommendationsError || (recommendations ? 'No affordable same-position move improves FPL’s next-gameweek projection right now.' : 'Transfer ideas are temporarily unavailable. Try refreshing your team.')}</p>}
            {recommendations && recommendations.lockedCount > 0 && <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/[.04] p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="font-semibold text-white">{recommendations.lockedCount} more transfer {recommendations.lockedCount === 1 ? 'idea' : 'ideas'} available</div><p className="mt-1 text-xs text-slate-400">One-time Gameweek unlock · ₹29 · no subscription</p></div><button type="button" disabled aria-describedby="unlock-payment-note" className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-400">Payments coming later <span aria-hidden="true">↗</span></button><span id="unlock-payment-note" className="sr-only">Payments are not available yet.</span></div>}
            <p className="mt-4 text-[11px] leading-5 text-slate-500">Suggestions compare FPL’s next-gameweek expected points and estimate sale values from transfer history and price-change rules. Hits and chip strategy are not included. Advice only; Play XI never submits transfers.</p>
          </section>

        </>}

        <div className="flex flex-wrap gap-2"><button onClick={onBrowsePlayers} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#0d1c2d] px-4 py-2 text-sm font-semibold text-slate-200 hover:border-[#00FF87]/40 hover:text-white"><Users className="h-4 w-4 text-[#00FF87]" />Explore player stats</button><button onClick={onBrowseFixtures} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#0d1c2d] px-4 py-2 text-sm font-semibold text-slate-200 hover:border-[#00FF87]/40 hover:text-white"><ArrowRightLeft className="h-4 w-4 text-[#00FF87]" />Plan with fixtures</button></div>
      </>}
      {!entry && !loading && !error && <div className="rounded-xl border border-dashed border-white/15 bg-[#0d1c2d]/70 p-8 text-center"><Users className="mx-auto mb-3 h-7 w-7 text-[#00FF87]" /><h2 className="font-bold text-white">Connect your FPL squad</h2><p className="mx-auto mt-1 max-w-lg text-sm text-slate-400">Enter your public Team ID above. Play XI will load your real squad and tailor transfer suggestions to your budget and positions.</p></div>}
    </main>
  );
}
