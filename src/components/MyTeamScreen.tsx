import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowDownRight, ArrowRightLeft, ArrowUpRight, Link2, RefreshCw, ShieldAlert, Sparkles, Users } from 'lucide-react';
import type { FplBootstrap, FplEntry, FplPlayer, FplPicksResponse, FplTransferRecord } from '../types/football';
import { fplAvailability, formatFplPrice } from '../utils/fpl';

const STORAGE_KEY = 'playxi-fpl-entry-id';

type Recommendation = { outgoing: FplPlayer; incoming: FplPlayer; delta: number; saleValue: number; reasons: string[] };

function rank(value?: number) { return value ? value.toLocaleString() : '—'; }
function sellingValueTenths(player: FplPlayer, transfers: FplTransferRecord[], targetEventId: number | null) {
  const latestBuy = transfers
    .filter((transfer) => transfer.element_in === player.id && (targetEventId === null || transfer.event <= targetEventId))
    .sort((a, b) => a.event - b.event || a.time.localeCompare(b.time))
    .at(-1);
  const purchaseCost = latestBuy?.element_in_cost ?? player.costTenths - player.costChangeStart;
  if (!Number.isFinite(purchaseCost) || purchaseCost < 0) return null;
  return player.costTenths > purchaseCost
    ? purchaseCost + Math.floor((player.costTenths - purchaseCost) / 2)
    : player.costTenths;
}

export function MyTeamScreen({ onBrowsePlayers, onBrowseFixtures }: { onBrowsePlayers: () => void; onBrowseFixtures: () => void }) {
  const [entryId, setEntryId] = useState('');
  const [entry, setEntry] = useState<FplEntry | null>(null);
  const [bootstrap, setBootstrap] = useState<FplBootstrap | null>(null);
  const [picks, setPicks] = useState<FplPicksResponse | null>(null);
  const [transfers, setTransfers] = useState<FplTransferRecord[] | null>(null);
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
    setTransfers(null);
    setPlanningEventId(null);
    setAsOfEventId(null);
    setPlanningBankTenths(null);
    try {
      const [entryResponse, bootstrapResponse] = await Promise.all([
        fetch(`/api/fpl/entry/${cleanId}`),
        fetch('/api/fpl/bootstrap'),
      ]);
      const [entryPayload, bootstrapPayload] = await Promise.all([entryResponse.json(), bootstrapResponse.json()]);
      if (!entryResponse.ok) throw new Error(entryPayload.error || 'Could not load this public FPL team.');
      if (!bootstrapResponse.ok) throw new Error(bootstrapPayload.error || 'Could not load current FPL game data.');
      const entryData = entryPayload as FplEntry;
      const bootData = bootstrapPayload as FplBootstrap;
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
        const nextPicks = picksData.picks.slice();
        for (const transfer of interveningTransfers) {
          const outgoingIndex = nextPicks.findIndex((pick) => pick.element === transfer.element_out);
          if (outgoingIndex >= 0) {
            nextPicks[outgoingIndex] = { ...nextPicks[outgoingIndex], element: transfer.element_in };
            if (bankTenths !== null) bankTenths += transfer.element_out_cost - transfer.element_in_cost;
          }
        }
        picksData = { ...picksData, picks: nextPicks };
      }
      setEntry(entryData);
      setBootstrap(bootData);
      setPicks(picksData);
      setTransfers(transferData);
      setPlanningEventId(eventId ?? null);
      setAsOfEventId(picksEventId);
      setPlanningBankTenths(bankTenths);
      setEntryId(cleanId);
      if (save) window.localStorage.setItem(STORAGE_KEY, cleanId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load the FPL team. Check the Team ID and try again.');
    } finally {
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

  const recommendationList = useMemo<Recommendation[]>(() => {
    if (!bootstrap || !picks || !transfers) return [];
    const ownedIds = new Set(picks.picks.map((pick) => pick.element));
    const teamCounts = new Map<number, number>();
    for (const pick of picks.picks) {
      const player = playerById.get(pick.element);
      if (player) teamCounts.set(player.teamId, (teamCounts.get(player.teamId) ?? 0) + 1);
    }
    const overLimitTeams = new Set([...teamCounts].filter(([, count]) => count > 3).map(([teamId]) => teamId));
    const bank = (planningBankTenths ?? picks.entry_history.bank) / 10;
    const alternatives = bootstrap.players.filter((player) =>
      !ownedIds.has(player.id)
      && player.status !== 'i' && player.status !== 's' && player.status !== 'u'
      && (player.status !== 'd' || (player.chanceOfPlayingNext ?? 0) >= 50),
    );
    const moves: Recommendation[] = [];
    for (const pick of picks.picks) {
      const outgoing = playerById.get(pick.element);
      if (!outgoing) continue;
      if (overLimitTeams.size > 0 && !overLimitTeams.has(outgoing.teamId)) continue;
      const saleValueTenths = sellingValueTenths(outgoing, transfers, planningEventId);
      if (saleValueTenths === null) continue;
      const saleValue = saleValueTenths / 10;
      const budget = saleValue + bank;
      const needsReplacement = outgoing.status === 'i' || outgoing.status === 's' || outgoing.status === 'u'
        || (outgoing.status === 'd' && (outgoing.chanceOfPlayingNext ?? 0) < 50);
      for (const incoming of alternatives) {
        if (incoming.position !== outgoing.position || incoming.cost > budget) continue;
        const incomingClubCount = teamCounts.get(incoming.teamId) ?? 0;
        const resultingIncomingClubCount = incomingClubCount + (incoming.teamId === outgoing.teamId ? 0 : 1);
        if (resultingIncomingClubCount > 3) continue;
        const delta = incoming.expectedPointsNext - outgoing.expectedPointsNext;
        if (delta <= 0 && !needsReplacement) continue;
        const reasons: string[] = [];
        if (delta > 0) reasons.push(`${delta.toFixed(1)} more FPL projected points next gameweek`);
        if (incoming.form > outgoing.form) reasons.push(`stronger recent form (${incoming.form.toFixed(1)} vs ${outgoing.form.toFixed(1)})`);
        if (outgoing.status !== 'a') reasons.push(`${outgoing.webName} is ${(fplAvailability(outgoing) ?? 'unavailable').toLowerCase()}`);
        if (incoming.cost < budget) reasons.push(`leaves ${formatFplPrice(budget - incoming.cost)} in the bank`);
        moves.push({ outgoing, incoming, delta, saleValue, reasons });
      }
    }
    return moves.sort((a, b) => b.delta - a.delta || b.incoming.form - a.incoming.form).slice(0, 3);
  }, [bootstrap, playerById, picks, transfers, planningEventId, planningBankTenths]);
  const selectedEvent = bootstrap?.events.find((event) => event.id === planningEventId)
    ?? bootstrap?.events.find((event) => event.id === (bootstrap.currentEvent ?? bootstrap.nextEvent));

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadTeam(entryId, true);
  }

  return (
    <main className="mx-auto max-w-[1500px] space-y-6 p-4 pb-28 sm:p-6 lg:p-8">
      <header><div className="mb-1 text-xs font-mono text-[#00FF87]">MY FPL SQUAD · PERSONALIZED PLANNING</div><h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">MY TEAM</h1><p className="mt-1 text-sm text-slate-400">Import your public FPL team to see your actual squad, bank and position-matched transfer ideas.</p></header>

      <section className="rounded-xl border border-white/10 bg-[#0d1c2d] p-4 sm:p-5">
        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
          <label className="flex-1"><span className="mb-1.5 block text-xs font-semibold text-slate-300">FPL Team ID</span><input inputMode="numeric" value={entryId} onChange={(event) => setEntryId(event.target.value)} placeholder="For example: 1234567" className="w-full rounded-lg border border-white/10 bg-[#091726] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#00FF87]" /></label>
          <button type="submit" disabled={loading} className="self-end inline-flex items-center justify-center gap-2 rounded-lg bg-[#00FF87] px-5 py-2.5 text-sm font-bold text-[#051424] hover:bg-[#00e478] disabled:opacity-50"><Link2 className="h-4 w-4" />{loading ? 'Loading team…' : entry ? 'Refresh team' : 'Import team'}</button>
        </form>
        <p className="mt-2 text-xs text-slate-500">Find it in your FPL URL: fantasy.premierleague.com/entry/<strong>TEAM_ID</strong>/event/… Play XI reads public FPL data only and never asks for your FPL password.</p>
        {error && <p role="alert" className="mt-3 rounded-lg border border-rose-900 bg-rose-950/30 px-3 py-2 text-sm text-rose-200">{error}</p>}
      </section>

      {entry && bootstrap && <>
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-[#0d1c2d] p-4"><div className="text-xs text-slate-400">FPL manager</div><div className="mt-1 text-lg font-bold text-white">{entry.player_first_name} {entry.player_last_name}</div><div className="text-xs text-slate-400">{entry.name}</div></div>
          <div className="rounded-xl border border-white/10 bg-[#0d1c2d] p-4"><div className="text-xs text-slate-400">Overall points</div><div className="mt-1 text-2xl font-black text-white">{rank(entry.summary_overall_points)}</div><div className="text-xs text-slate-400">Overall rank #{rank(entry.summary_overall_rank)}</div></div>
          <div className="rounded-xl border border-white/10 bg-[#0d1c2d] p-4"><div className="text-xs text-slate-400">Gameweek points</div><div className="mt-1 text-2xl font-black text-[#00FF87]">{rank(entry.summary_event_points)}</div><div className="text-xs text-slate-400">GW rank #{rank(entry.summary_event_rank)}</div></div>
          <div className="rounded-xl border border-white/10 bg-[#0d1c2d] p-4"><div className="text-xs text-slate-400">Planning gameweek</div><div className="mt-1 text-lg font-bold text-white">{selectedEvent?.name ?? 'FPL season'}</div><div className="text-xs text-slate-400">{picks ? `${formatFplPrice((planningBankTenths ?? picks.entry_history.bank) / 10)} in the bank` : 'Picks are not available yet'}</div></div>
        </section>

        {picks && <>
          <section className="rounded-xl border border-white/10 bg-[#0d1c2d] p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-bold text-white">Your FPL squad</h2><p className="text-xs text-slate-400">{asOfEventId && planningEventId && asOfEventId !== planningEventId ? `Last saved picks from GW${asOfEventId}, updated with recorded transfers for GW${planningEventId}. Captain and bench positions may still change.` : 'Captaincy, bench order and player prices match your imported FPL picks.'}</p></div><span className="rounded bg-[#00FF87]/10 px-2 py-1 text-xs font-semibold text-[#00FF87]">{picks.picks.length} players</span></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[690px] border-collapse text-left text-sm"><thead className="text-[10px] font-mono uppercase tracking-wider text-slate-500"><tr><th className="px-2 py-2">Slot</th><th className="px-2 py-2">Player</th><th className="px-2 py-2">Team</th><th className="px-2 py-2">Pos</th><th className="px-2 py-2">Price</th><th className="px-2 py-2">xP</th><th className="px-2 py-2">Status</th></tr></thead><tbody className="divide-y divide-white/5">{picks.picks.slice().sort((a, b) => a.position - b.position).map((pick) => {
              const player = playerById.get(pick.element);
              if (!player) return null;
              const isBench = pick.position > 11;
              const issue = fplAvailability(player);
              return <tr key={pick.element} className="text-slate-200"><td className="px-2 py-2.5 text-slate-400">{isBench ? `Bench ${pick.position - 11}` : `XI ${pick.position}`}</td><td className="px-2 py-2.5 font-semibold text-white">{player.webName}{pick.is_captain && <span className="ml-2 rounded bg-[#00FF87]/10 px-1.5 py-0.5 text-[10px] text-[#00FF87]">C</span>}{pick.is_vice_captain && <span className="ml-2 rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-300">VC</span>}</td><td className="px-2 py-2.5">{player.teamName}</td><td className="px-2 py-2.5">{player.position}</td><td className="px-2 py-2.5 font-mono">{formatFplPrice(player.cost)}</td><td className="px-2 py-2.5 font-mono text-[#00FF87]">{player.expectedPointsNext.toFixed(1)}</td><td className="px-2 py-2.5">{issue ? <span className="inline-flex items-center gap-1 text-amber-300"><ShieldAlert className="h-3.5 w-3.5" />{issue}</span> : <span className="text-emerald-300">Available</span>}</td></tr>;
            })}</tbody></table></div>
          </section>

          <section className="rounded-xl border border-[#00FF87]/20 bg-gradient-to-br from-[#0d2238] to-[#0d1c2d] p-4 sm:p-5">
            <div className="mb-4 flex items-start gap-3"><div className="rounded-lg bg-[#00FF87]/10 p-2 text-[#00FF87]"><Sparkles className="h-5 w-5" /></div><div><h2 className="text-lg font-bold text-white">Transfer ideas for your squad</h2><p className="text-xs text-slate-400">Position-matched options within your FPL bank, ranked by next-gameweek expected points.</p></div></div>
            {recommendationList.length ? <div className="grid gap-3 lg:grid-cols-3">{recommendationList.map((move) => <article key={`${move.outgoing.id}-${move.incoming.id}`} className="rounded-lg border border-white/10 bg-[#091726]/80 p-4"><div className="mb-3 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider"><span className="text-rose-300">Sell {move.outgoing.webName}</span><ArrowRightLeft className="h-4 w-4 text-slate-500" /><span className="text-[#00FF87]">Buy {move.incoming.webName}</span></div><div className="grid grid-cols-2 gap-3"><div><div className="text-[10px] text-slate-500">Outgoing · {move.outgoing.teamName}</div><div className="font-semibold text-white">{formatFplPrice(move.saleValue)} sale value</div><div className="text-xs text-slate-400">{move.outgoing.expectedPointsNext.toFixed(1)} xP</div></div><div><div className="text-[10px] text-slate-500">Incoming · {move.incoming.teamName}</div><div className="font-semibold text-white">{formatFplPrice(move.incoming.cost)} price</div><div className="text-xs text-[#00FF87]">{move.incoming.expectedPointsNext.toFixed(1)} xP</div></div></div><div className={`mt-3 inline-flex items-center gap-1 text-sm font-bold ${move.delta >= 0 ? 'text-[#00FF87]' : 'text-amber-300'}`}>{move.delta >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}{move.delta > 0 ? '+' : ''}{move.delta.toFixed(1)} next-GW xP</div><ul className="mt-2 space-y-1 text-xs text-slate-400">{move.reasons.slice(0, 2).map((reason) => <li key={reason}>• {reason}</li>)}</ul></article>)}</div> : <p className="rounded-lg border border-white/10 bg-[#091726]/60 p-4 text-sm text-slate-300">{transfers ? 'No affordable same-position move improves FPL’s next-gameweek projection right now.' : 'Transfer history is unavailable, so Play XI cannot calculate the correct selling values and will not guess at affordable transfers.'}</p>}
            <p className="mt-4 text-xs text-slate-500">Suggestions compare FPL’s next-gameweek expected points and calculate selling values from your transfer history and FPL price-change rules. They do not deduct a transfer hit or account for chip strategy. Advice only; Play XI never submits transfers to FPL.</p>
          </section>
        </>}

        <div className="flex flex-wrap gap-2"><button onClick={onBrowsePlayers} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#0d1c2d] px-4 py-2 text-sm font-semibold text-slate-200 hover:border-[#00FF87]/40 hover:text-white"><Users className="h-4 w-4 text-[#00FF87]" />Explore player stats</button><button onClick={onBrowseFixtures} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#0d1c2d] px-4 py-2 text-sm font-semibold text-slate-200 hover:border-[#00FF87]/40 hover:text-white"><ArrowRightLeft className="h-4 w-4 text-[#00FF87]" />Plan with fixtures</button></div>
      </>}
      {!entry && !loading && !error && <div className="rounded-xl border border-dashed border-white/15 bg-[#0d1c2d]/70 p-8 text-center"><Users className="mx-auto mb-3 h-7 w-7 text-[#00FF87]" /><h2 className="font-bold text-white">Connect your FPL squad</h2><p className="mx-auto mt-1 max-w-lg text-sm text-slate-400">Enter your public Team ID above. Play XI will load your real squad and tailor transfer suggestions to your budget and positions.</p></div>}
    </main>
  );
}
