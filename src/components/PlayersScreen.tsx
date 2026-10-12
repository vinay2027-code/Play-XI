import { useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw, Search, Users, X } from 'lucide-react';
import type { FplBootstrap, FplPlayer, FplPosition } from '../types/football';
import { fplAvailability, formatFplPrice } from '../utils/fpl';
import { PlayerPortrait, TeamBadge } from './FplIdentity';

const positions: Array<'ALL' | FplPosition> = ['ALL', 'GKP', 'DEF', 'MID', 'FWD'];
type SortKey = 'totalPoints' | 'expectedPointsNext' | 'form' | 'cost';

function exportCsv(players: FplPlayer[]) {
  const rows = [
    ['Player', 'Team', 'Position', 'Price (£m)', 'FPL points', 'Form', 'Next GW expected points', 'Ownership (%)', 'Minutes', 'Goals', 'Assists', 'Expected goals', 'Expected assists', 'Availability', 'News'],
    ...players.map((player) => [player.webName, player.teamName, player.position, player.cost, player.totalPoints, player.form,
      player.expectedPointsNext, player.selectedByPercent, player.minutes, player.goals, player.assists, player.expectedGoals,
      player.expectedAssists, fplAvailability(player) || 'Available', player.news]),
  ];
  const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'play-xi-fpl-player-stats.csv';
  link.click();
  URL.revokeObjectURL(url);
}

export function PlayersScreen() {
  const [data, setData] = useState<FplBootstrap | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [team, setTeam] = useState('ALL');
  const [position, setPosition] = useState<'ALL' | FplPosition>('ALL');
  const [sortBy, setSortBy] = useState<SortKey>('totalPoints');
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [visiblePlayerCount, setVisiblePlayerCount] = useState(24);

  async function loadPlayers() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/fpl/bootstrap');
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not load the FPL player list.');
      setData(payload as FplBootstrap);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load FPL data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadPlayers(); }, []);

  const teams = useMemo(() => data?.teams.slice().sort((a, b) => a.name.localeCompare(b.name)) ?? [], [data]);
  const players = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return (data?.players ?? []).filter((player) => {
      const matchesQuery = !term || `${player.webName} ${player.firstName} ${player.secondName} ${player.teamName}`.toLocaleLowerCase().includes(term);
      return matchesQuery && (team === 'ALL' || String(player.teamId) === team) && (position === 'ALL' || player.position === position);
    }).sort((a, b) => b[sortBy] - a[sortBy] || a.webName.localeCompare(b.webName));
  }, [data, query, team, position, sortBy]);

  const compared = (data?.players ?? []).filter((player) => compareIds.includes(player.id));
  const toggleCompare = (id: number) => setCompareIds((current) => current.includes(id)
    ? current.filter((item) => item !== id)
    : current.length < 2 ? [...current, id] : [current[1], id]);

  return (
    <main className="mx-auto max-w-[1600px] space-y-6 p-4 pb-28 sm:p-6 lg:p-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-1 text-xs font-mono text-[#00FF87]">OFFICIAL FPL PLAYER CATALOGUE</div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">PLAYER STATS &amp; COMPARISON</h1>
          <p className="mt-1 text-sm text-slate-400">Current FPL names, clubs, prices, points, form, expected points and availability.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => data && exportCsv(players)} disabled={!data || loading} className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#0d1c2d] px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-white/20 disabled:opacity-50"><Download className="h-4 w-4" /> Export CSV</button>
          <button onClick={() => void loadPlayers()} disabled={loading} className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#0d1c2d] px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-white/20 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
        </div>
      </header>

      <section className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#0d1c2d] p-4 md:flex-row">
        <label className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search FPL players or teams" className="w-full rounded-lg border border-white/10 bg-[#091726] py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#00FF87]" /></label>
        <select value={team} onChange={(event) => setTeam(event.target.value)} className="rounded-lg border border-white/10 bg-[#091726] px-3 py-2 text-sm text-white outline-none focus:border-[#00FF87]"><option value="ALL">All teams</option>{teams.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select value={position} onChange={(event) => setPosition(event.target.value as 'ALL' | FplPosition)} className="rounded-lg border border-white/10 bg-[#091726] px-3 py-2 text-sm text-white outline-none focus:border-[#00FF87]">{positions.map((item) => <option key={item} value={item}>{item === 'ALL' ? 'All positions' : item}</option>)}</select>
        <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortKey)} className="rounded-lg border border-white/10 bg-[#091726] px-3 py-2 text-sm text-white outline-none focus:border-[#00FF87]"><option value="totalPoints">Sort: FPL points</option><option value="expectedPointsNext">Sort: next GW xP</option><option value="form">Sort: form</option><option value="cost">Sort: price</option></select>
      </section>

      {compared.length === 2 && <section className="rounded-xl border border-[#00FF87]/25 bg-[#0d1c2d] p-4">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-bold text-white">Side-by-side comparison</h2><button onClick={() => setCompareIds([])} className="rounded p-1 text-slate-400 hover:text-white" aria-label="Clear comparison"><X className="h-4 w-4" /></button></div>
        <div className="grid grid-cols-3 gap-3 text-xs sm:text-sm"><div className="text-slate-500">Metric</div>{compared.map((player) => <div key={player.id} className="font-semibold text-white">{player.webName}<span className="block text-xs font-normal text-slate-400">{player.teamName} · {player.position}</span></div>)}
          {([
            ['Price', (p: FplPlayer) => formatFplPrice(p.cost)], ['FPL points', (p: FplPlayer) => p.totalPoints],
            ['Next GW expected points', (p: FplPlayer) => p.expectedPointsNext.toFixed(1)], ['Form', (p: FplPlayer) => p.form.toFixed(1)],
            ['Ownership', (p: FplPlayer) => `${p.selectedByPercent.toFixed(1)}%`], ['Goals / assists', (p: FplPlayer) => `${p.goals} / ${p.assists}`],
            ['Expected goals / assists', (p: FplPlayer) => `${p.expectedGoals.toFixed(2)} / ${p.expectedAssists.toFixed(2)}`],
          ] as Array<[string, (player: FplPlayer) => string | number]>).map(([label, value]) => <div key={label} className="contents"><div className="border-t border-white/5 py-2 text-slate-400">{label}</div>{compared.map((player) => <div key={`${player.id}-${label}`} className="border-t border-white/5 py-2 font-mono text-slate-200">{value(player)}</div>)}</div>)}
        </div>
      </section>}
      {compareIds.length === 1 && <p className="text-xs text-[#00FF87]">Select one more player to compare. The newest two selections are shown.</p>}

      {loading && <div className="rounded-xl border border-white/10 bg-[#0d1c2d] p-12 text-center text-slate-400"><RefreshCw className="mx-auto mb-3 h-5 w-5 animate-spin text-[#00FF87]" />Loading the current FPL player catalogue…</div>}
      {!loading && error && <div className="rounded-xl border border-rose-900 bg-[#0d1c2d] p-8 text-center"><p className="text-sm text-rose-200">{error}</p><button onClick={() => void loadPlayers()} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#00FF87] px-4 py-2 text-sm font-bold text-[#051424]"><RefreshCw className="h-4 w-4" /> Try again</button></div>}
      {!loading && !error && data && <>
        <div className="flex items-center gap-2 text-xs text-slate-400"><Users className="h-4 w-4 text-[#00FF87]" /> {players.length} players <span>·</span> Data refreshed {new Date(data.fetchedAt).toLocaleString()}</div>
        <div className="space-y-2.5 xl:hidden">{players.slice(0, visiblePlayerCount).map((player) => {
          const status = fplAvailability(player);
          const isCompared = compareIds.includes(player.id);
          return <article key={player.id} className="rounded-2xl border border-white/8 bg-[#0d1c2d] p-4">
            <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><PlayerPortrait photo={player.photo} name={player.webName} /><div className="min-w-0"><div className="flex items-center gap-2"><h2 className="truncate font-bold text-white">{player.webName}</h2><span className="shrink-0 rounded-md bg-white/[.06] px-2 py-0.5 text-[10px] font-bold text-slate-300">{player.position}</span></div><p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-400"><TeamBadge code={player.teamCode} name={player.teamName} size={16} />{player.teamName}</p></div></div><button onClick={() => toggleCompare(player.id)} className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold ${isCompared ? 'border-[#00FF87]/40 bg-[#00FF87]/10 text-[#00FF87]' : 'border-white/10 text-slate-300'}`}>{isCompared ? 'Selected' : 'Compare'}</button></div>
            <div className="mt-4 grid grid-cols-4 gap-2 border-y border-white/6 py-3"><div><div className="text-[9px] uppercase tracking-wider text-slate-500">Price</div><div className="mt-1 font-mono text-xs font-semibold text-slate-200">{formatFplPrice(player.cost)}</div></div><div><div className="text-[9px] uppercase tracking-wider text-slate-500">Points</div><div className="mt-1 font-mono text-xs font-semibold text-slate-200">{player.totalPoints}</div></div><div><div className="text-[9px] uppercase tracking-wider text-slate-500">Form</div><div className="mt-1 font-mono text-xs font-semibold text-slate-200">{player.form.toFixed(1)}</div></div><div><div className="text-[9px] uppercase tracking-wider text-slate-500">Next xP</div><div className="mt-1 font-mono text-xs font-bold text-[#00FF87]">{player.expectedPointsNext.toFixed(1)}</div></div></div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px]"><span className="text-slate-400">Owned {player.selectedByPercent.toFixed(1)}% · {player.goals} goals / {player.assists} assists</span>{status ? <span className="rounded-full bg-amber-300/10 px-2 py-1 font-semibold text-amber-200">{status}</span> : <span className="rounded-full bg-emerald-300/10 px-2 py-1 font-semibold text-emerald-200">Available</span>}</div>
            {status && player.news && <p className="mt-2 line-clamp-2 text-xs text-slate-500">{player.news}</p>}
          </article>;
        })}{players.length > visiblePlayerCount && <button onClick={() => setVisiblePlayerCount((count) => count + 24)} className="w-full rounded-xl border border-white/10 bg-[#0d1c2d] px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-[#00FF87]/30 hover:text-white">Show more players ({players.length - visiblePlayerCount} remaining)</button>}</div>
        <div className="hidden overflow-hidden rounded-xl border border-white/10 bg-[#0d1c2d] xl:block"><div className="max-h-[68vh] overflow-auto">
          <table className="w-full min-w-[1050px] border-collapse text-left text-sm"><thead className="sticky top-0 z-10 bg-[#091726] text-[10px] font-mono uppercase tracking-wider text-slate-400"><tr>
            <th className="px-3 py-3">Compare</th><th className="px-4 py-3">Player</th><th className="px-4 py-3">Team</th><th className="px-3 py-3">Pos</th><th className="px-3 py-3">Price</th><th className="px-3 py-3">Pts</th><th className="px-3 py-3">Form</th><th className="px-3 py-3">Next GW xP</th><th className="px-3 py-3">Owned</th><th className="px-3 py-3">G / A</th><th className="px-4 py-3">Availability</th>
          </tr></thead><tbody className="divide-y divide-white/5 text-slate-200">{players.map((player) => {
            const status = fplAvailability(player);
            return <tr key={player.id} className="hover:bg-[#122131]/80">
              <td className="px-3 py-3"><button onClick={() => toggleCompare(player.id)} className={`rounded border px-2 py-1 text-[10px] font-semibold ${compareIds.includes(player.id) ? 'border-[#00FF87]/50 bg-[#00FF87]/10 text-[#00FF87]' : 'border-white/10 text-slate-400 hover:border-white/30 hover:text-white'}`}>{compareIds.includes(player.id) ? 'Selected' : 'Compare'}</button></td>
              <td className="whitespace-nowrap px-4 py-3 font-semibold text-white">{player.webName}<span className="block text-[10px] font-normal text-slate-500">{player.firstName} {player.secondName}</span></td><td className="px-4 py-3">{player.teamName}</td><td className="px-3 py-3">{player.position}</td><td className="px-3 py-3 font-mono">{formatFplPrice(player.cost)}</td><td className="px-3 py-3 font-mono font-bold text-white">{player.totalPoints}</td><td className="px-3 py-3 font-mono">{player.form.toFixed(1)}</td><td className="px-3 py-3 font-mono text-[#00FF87]">{player.expectedPointsNext.toFixed(1)}</td><td className="px-3 py-3">{player.selectedByPercent.toFixed(1)}%</td><td className="px-3 py-3">{player.goals} / {player.assists}</td><td className="max-w-64 px-4 py-3">{status ? <span className="text-amber-300">{status}{player.news && <span className="block truncate text-xs text-slate-400" title={player.news}>{player.news}</span>}</span> : <span className="text-emerald-300">Available</span>}</td>
            </tr>;
          })}</tbody></table>
          {players.length === 0 && <p className="p-8 text-center text-sm text-slate-400">No FPL players match these filters.</p>}
        </div></div>
        <p className="text-xs text-slate-500">Names, clubs, prices, status and FPL statistics come from Fantasy Premier League. Expected points are FPL’s published projections.</p>
      </>}
    </main>
  );
}
