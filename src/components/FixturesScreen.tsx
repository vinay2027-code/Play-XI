import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, RefreshCw, Search } from 'lucide-react';
import type { FplBootstrap, FplFixture, FplFixturesResponse } from '../types/football';
import { formatLocalDateTime } from '../utils/fpl';
import { TeamBadge } from './FplIdentity';

function fdrClass(difficulty: number) {
  if (difficulty <= 2) return 'bg-emerald-950 text-emerald-300 border-emerald-800';
  if (difficulty === 3) return 'bg-slate-800 text-slate-300 border-slate-700';
  return 'bg-rose-950 text-rose-300 border-rose-800';
}

type PlannedFixture = { opponent: string; opponentTeamId: number; home: boolean; difficulty: number };

export function FixturesScreen() {
  const [bootstrap, setBootstrap] = useState<FplBootstrap | null>(null);
  const [data, setData] = useState<FplFixturesResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'planner' | 'schedule'>('planner');
  const [eventFilter, setEventFilter] = useState('ALL');

  async function loadFixtures() {
    setLoading(true);
    setError('');
    try {
      const [fixturesResponse, bootstrapResponse] = await Promise.all([
        fetch('/api/fpl/fixtures'),
        fetch('/api/fpl/bootstrap'),
      ]);
      const [fixturesPayload, bootstrapPayload] = await Promise.all([fixturesResponse.json(), bootstrapResponse.json()]);
      if (!fixturesResponse.ok) throw new Error(fixturesPayload.error || 'Could not load FPL fixtures.');
      if (!bootstrapResponse.ok) throw new Error(bootstrapPayload.error || 'Could not load the FPL teams and gameweeks.');
      setData(fixturesPayload as FplFixturesResponse);
      setBootstrap(bootstrapPayload as FplBootstrap);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load FPL fixtures.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadFixtures(); }, []);

  const nextEvents = useMemo(() => {
    const events = bootstrap?.events ?? [];
    const current = events.find((event) => event.id === bootstrap?.currentEvent);
    const currentDeadlineIsOpen = Boolean(current && new Date(current.deadlineTime).getTime() > Date.now());
    const first = (currentDeadlineIsOpen ? current?.id : bootstrap?.nextEvent ?? current?.id) ?? 1;
    return events.filter((event) => event.id >= first).slice(0, 6);
  }, [bootstrap]);

  const fixturesByTeamEvent = useMemo(() => {
    const index = new Map<number, Map<number, PlannedFixture[]>>();
    const eventIds = new Set(nextEvents.map((event) => event.id));
    for (const fixture of data?.fixtures ?? []) {
      if (fixture.event === null || !eventIds.has(fixture.event)) continue;
      const add = (teamId: number, plannedFixture: PlannedFixture) => {
        const byEvent = index.get(teamId) ?? new Map<number, PlannedFixture[]>();
        const list = byEvent.get(fixture.event!) ?? [];
        list.push(plannedFixture);
        byEvent.set(fixture.event!, list);
        index.set(teamId, byEvent);
      };
      add(fixture.homeTeamId, { opponent: fixture.awayTeamShort, opponentTeamId: fixture.awayTeamId, home: true, difficulty: fixture.homeDifficulty });
      add(fixture.awayTeamId, { opponent: fixture.homeTeamShort, opponentTeamId: fixture.homeTeamId, home: false, difficulty: fixture.awayDifficulty });
    }
    return index;
  }, [data, nextEvents]);

  const fixtureMatrix = useMemo(() => {
    if (!bootstrap || !data) return [];
    const term = query.trim().toLocaleLowerCase();
    return bootstrap.teams
      .filter((team) => !term || team.name.toLocaleLowerCase().includes(term) || team.shortName.toLocaleLowerCase().includes(term))
      .map((team) => {
        const byEvent = fixturesByTeamEvent.get(team.id) ?? new Map<number, PlannedFixture[]>();
        const difficulties = nextEvents.flatMap((event) => (byEvent.get(event.id) ?? []).map((item) => item.difficulty));
        const average = difficulties.length ? difficulties.reduce((sum, value) => sum + value, 0) / difficulties.length : null;
        return { team, byEvent, average };
      })
      .sort((a, b) => (a.average ?? 6) - (b.average ?? 6) || a.team.name.localeCompare(b.team.name));
  }, [bootstrap, data, nextEvents, fixturesByTeamEvent, query]);

  const schedule = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return (data?.fixtures ?? []).filter((fixture) => {
      const matchesQuery = !term || `${fixture.homeTeam} ${fixture.awayTeam}`.toLocaleLowerCase().includes(term);
      const matchesEvent = eventFilter === 'ALL' || String(fixture.event) === eventFilter;
      return matchesQuery && matchesEvent;
    }).sort((a, b) => (a.kickoffTime ?? '').localeCompare(b.kickoffTime ?? ''));
  }, [data, query, eventFilter]);
  const teamCodeById = useMemo(() => new Map((bootstrap?.teams ?? []).map((team) => [team.id, team.code])), [bootstrap]);

  return (
    <main className="mx-auto max-w-[1600px] space-y-6 p-4 pb-28 sm:p-6 lg:p-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><div className="mb-1 text-xs font-mono text-[#00FF87]">OFFICIAL FPL FIXTURE DATA</div><h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">FIXTURE PLANNER</h1><p className="mt-1 text-sm text-slate-400">Compare the next six gameweeks using the FPL fixture difficulty ratings.</p></div>
        <button onClick={() => void loadFixtures()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#0d1c2d] px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-white/20 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
      </header>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <label className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search teams or fixtures" className="w-full rounded-lg border border-white/10 bg-[#0d1c2d] py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#00FF87]" /></label>
        <div className="flex rounded-lg border border-white/10 bg-[#0d1c2d] p-1"><button onClick={() => setView('planner')} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${view === 'planner' ? 'bg-[#00FF87] text-[#051424]' : 'text-slate-300'}`}>Difficulty planner</button><button onClick={() => setView('schedule')} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${view === 'schedule' ? 'bg-[#00FF87] text-[#051424]' : 'text-slate-300'}`}>Match schedule</button></div>
      </div>

      {view === 'schedule' && <label className="block w-fit"><span className="mr-2 text-xs text-slate-400">Gameweek</span><select value={eventFilter} onChange={(event) => setEventFilter(event.target.value)} className="rounded-lg border border-white/10 bg-[#0d1c2d] px-3 py-2 text-sm text-white outline-none focus:border-[#00FF87]"><option value="ALL">All gameweeks</option>{(bootstrap?.events ?? []).map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}</select></label>}

      {loading && <div className="rounded-xl border border-white/10 bg-[#0d1c2d] p-12 text-center text-slate-400"><RefreshCw className="mx-auto mb-3 h-5 w-5 animate-spin text-[#00FF87]" />Loading FPL fixtures and difficulty ratings…</div>}
      {!loading && error && <div className="rounded-xl border border-rose-900 bg-[#0d1c2d] p-8 text-center"><p className="text-sm text-rose-200">{error}</p><button onClick={() => void loadFixtures()} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#00FF87] px-4 py-2 text-sm font-bold text-[#051424]"><RefreshCw className="h-4 w-4" /> Try again</button></div>}

      {!loading && !error && data && bootstrap && view === 'planner' && <>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400"><span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#00FF87]" /> Next {nextEvents.length} gameweeks</span><span>FDR: 1 easiest · 5 hardest</span><span>H = home · A = away</span></div>
        <div className="space-y-3 md:hidden">{fixtureMatrix.map(({ team, byEvent, average }) => <article key={team.id} className="rounded-2xl border border-white/8 bg-[#0d1c2d] p-4">
          <div className="flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-bold text-white"><TeamBadge code={team.code} name={team.name} size={24} />{team.name}</h2><span className="rounded-full bg-white/[.05] px-2.5 py-1 text-[10px] font-mono font-bold text-slate-300">AVG {average === null ? '—' : average.toFixed(1)}</span></div>
          <div className="mt-3 grid grid-cols-2 gap-2">{nextEvents.map((event) => {
            const fixtures = byEvent.get(event.id) ?? [];
            return <div key={event.id} className="min-h-16 rounded-xl border border-white/5 bg-[#091726]/70 p-2.5"><div className="mb-2 text-[9px] font-bold uppercase tracking-widest text-slate-500">{event.name.replace('Gameweek ', 'GW')}</div>{fixtures.length ? <div className="flex flex-wrap gap-1">{fixtures.map((fixture, index) => <span key={`${event.id}-${index}`} title={`${fixture.home ? 'Home' : 'Away'} vs ${fixture.opponent} · FDR ${fixture.difficulty}`} className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-mono font-bold ${fdrClass(fixture.difficulty)}`}><TeamBadge code={teamCodeById.get(fixture.opponentTeamId)} name={fixture.opponent} size={13} />{fixture.opponent}<span className="opacity-75">{fixture.home ? 'H' : 'A'} · {fixture.difficulty}</span></span>)}</div> : <span className="text-[10px] text-slate-600">Blank</span>}</div>;
          })}</div>
        </article>)}</div>
        <div className="hidden overflow-hidden rounded-xl border border-white/10 bg-[#0d1c2d] md:block"><div className="max-h-[70vh] overflow-auto">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm"><thead className="sticky top-0 z-10 bg-[#091726] text-[10px] font-mono uppercase tracking-wider text-slate-400"><tr><th className="sticky left-0 bg-[#091726] px-4 py-3">Team</th>{nextEvents.map((event) => <th key={event.id} className="px-3 py-3 text-center">{event.name.replace('Gameweek ', 'GW')}</th>)}<th className="px-4 py-3 text-right">Avg FDR</th></tr></thead>
            <tbody className="divide-y divide-white/5 text-slate-200">{fixtureMatrix.map(({ team, byEvent, average }) => <tr key={team.id} className="hover:bg-[#122131]/80"><th className="sticky left-0 bg-[#0d1c2d] px-4 py-3 font-semibold text-white"><span className="flex items-center gap-2"><TeamBadge code={team.code} name={team.name} size={22} />{team.name}</span></th>{nextEvents.map((event) => {
              const fixtures = byEvent.get(event.id) ?? [];
              return <td key={event.id} className="px-3 py-3 text-center">{fixtures.length ? <div className="flex justify-center gap-1">{fixtures.map((fixture, index) => <span key={`${event.id}-${index}`} title={`${fixture.home ? 'Home' : 'Away'} vs ${fixture.opponent} · FDR ${fixture.difficulty}`} className={`inline-flex min-w-14 flex-col items-center rounded border px-2 py-1 text-[10px] font-mono font-bold ${fdrClass(fixture.difficulty)}`}><span>{fixture.opponent}</span><span>{fixture.home ? 'H' : 'A'} · {fixture.difficulty}</span></span>)}</div> : <span className="text-slate-600">Blank</span>}</td>;
            })}<td className="px-4 py-3 text-right font-mono font-bold text-white">{average === null ? '—' : `${average.toFixed(2)} / 5`}</td></tr>)}</tbody>
          </table>
        </div></div>
        <p className="text-xs text-slate-500">Fixtures and difficulty ratings are supplied by Fantasy Premier League. Blank gameweeks and double gameweeks are shown as provided.</p>
      </>}

      {!loading && !error && data && bootstrap && view === 'schedule' && <>
        <div className="flex items-center gap-2 text-xs text-slate-400"><CalendarDays className="h-4 w-4 text-[#00FF87]" /> {schedule.length} fixtures <span>·</span> Kick-offs use your device’s local time</div>
        <div className="space-y-2 md:hidden">{schedule.map((fixture: FplFixture) => <article key={fixture.id} className="rounded-2xl border border-white/8 bg-[#0d1c2d] p-4"><div className="flex items-center justify-between gap-3 text-[10px] font-semibold text-slate-500"><span>{formatLocalDateTime(fixture.kickoffTime, 'Kick-off TBC')}</span><span>GW {fixture.event ?? '—'}</span></div><div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2"><div className="flex items-center justify-end gap-1.5 text-right text-sm font-bold text-white"><span className="truncate">{fixture.homeTeam}</span><TeamBadge code={teamCodeById.get(fixture.homeTeamId)} name={fixture.homeTeam} size={22} /></div><div className="rounded-lg bg-[#091726] px-2.5 py-1.5 font-mono text-xs font-bold text-[#00FF87]">{fixture.homeScore === null || fixture.awayScore === null ? 'VS' : `${fixture.homeScore}–${fixture.awayScore}`}</div><div className="flex items-center gap-1.5 text-sm font-bold text-white"><TeamBadge code={teamCodeById.get(fixture.awayTeamId)} name={fixture.awayTeam} size={22} /><span className="truncate">{fixture.awayTeam}</span></div></div><div className="mt-3 flex justify-center gap-3 text-[10px] text-slate-400"><span>Home FDR <b className="font-mono text-slate-200">{fixture.homeDifficulty}</b></span><span>Away FDR <b className="font-mono text-slate-200">{fixture.awayDifficulty}</b></span></div></article>)}{schedule.length === 0 && <p className="rounded-2xl border border-white/8 bg-[#0d1c2d] p-8 text-center text-sm text-slate-400">No fixtures match these filters.</p>}</div>
        <div className="hidden overflow-hidden rounded-xl border border-white/10 bg-[#0d1c2d] md:block"><div className="max-h-[68vh] overflow-auto"><table className="w-full min-w-[760px] border-collapse text-left text-sm"><thead className="sticky top-0 z-10 bg-[#091726] text-[10px] font-mono uppercase tracking-wider text-slate-400"><tr><th className="px-4 py-3">Kick-off</th><th className="px-3 py-3">GW</th><th className="px-4 py-3 text-right">Home</th><th className="px-3 py-3 text-center">Score</th><th className="px-4 py-3">Away</th><th className="px-3 py-3 text-center">FDR H/A</th></tr></thead><tbody className="divide-y divide-white/5 text-slate-200">{schedule.map((fixture: FplFixture) => <tr key={fixture.id} className="hover:bg-[#122131]/80"><td className="whitespace-nowrap px-4 py-3 font-medium text-white">{formatLocalDateTime(fixture.kickoffTime, 'Kick-off TBC')}</td><td className="px-3 py-3 text-slate-400">{fixture.event ?? '—'}</td><td className="px-4 py-3 text-right font-semibold text-white"><span className="inline-flex items-center justify-end gap-2"><span>{fixture.homeTeam}</span><TeamBadge code={teamCodeById.get(fixture.homeTeamId)} name={fixture.homeTeam} size={22} /></span></td><td className="whitespace-nowrap px-3 py-3 text-center font-mono font-bold text-[#00FF87]">{fixture.homeScore === null || fixture.awayScore === null ? 'vs' : `${fixture.homeScore} – ${fixture.awayScore}`}</td><td className="px-4 py-3 font-semibold text-white"><span className="inline-flex items-center gap-2"><TeamBadge code={teamCodeById.get(fixture.awayTeamId)} name={fixture.awayTeam} size={22} />{fixture.awayTeam}</span></td><td className="px-3 py-3 text-center font-mono">{fixture.homeDifficulty} / {fixture.awayDifficulty}</td></tr>)}</tbody></table>{schedule.length === 0 && <p className="p-8 text-center text-sm text-slate-400">No fixtures match these filters.</p>}</div></div>
      </>}
    </main>
  );
}
