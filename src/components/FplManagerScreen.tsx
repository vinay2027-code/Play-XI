import type { ReactNode } from 'react';
import { ArrowRight, CalendarDays, Globe2, Shield, Trophy, Users } from 'lucide-react';
import type { FplEntry } from '../types/football';

interface FplManagerScreenProps {
  entry: FplEntry | null;
  entryId: string;
  onOpenMyTeam: () => void;
}

function formatRank(value: number | null | undefined) {
  return value == null || value < 1 ? '—' : `#${value.toLocaleString()}`;
}

export function FplManagerScreen({ entry, entryId, onOpenMyTeam }: FplManagerScreenProps) {
  if (!entry) {
    return (
      <main className="mx-auto max-w-4xl p-5 pb-28 sm:p-8">
        <section className="rounded-3xl border border-white/10 bg-[#0d1c2d] p-6 sm:p-10">
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[#00FF87]/10 text-[#00FF87]"><Users className="h-6 w-6" /></div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#00FF87]">FPL manager</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Connect your public FPL team</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">Enter your FPL Team ID in My Team. Play XI will use the returned public profile, points, ranks and mini-league standings here.</p>
          <button type="button" onClick={onOpenMyTeam} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#00FF87] px-4 py-3 text-sm font-bold text-[#051424] hover:bg-[#00e478]">Open My Team <ArrowRight className="h-4 w-4" /></button>
        </section>
      </main>
    );
  }

  const privateLeagues = (entry.leagues?.classic ?? [])
    .filter((league) => league.league_type === 'x')
    .sort((a, b) => (a.entry_rank ?? Number.MAX_SAFE_INTEGER) - (b.entry_rank ?? Number.MAX_SAFE_INTEGER));

  return (
    <main className="mx-auto max-w-[1480px] space-y-5 p-4 pb-28 sm:space-y-6 sm:p-6 lg:p-8">
      <header className="rounded-3xl border border-white/8 bg-[radial-gradient(ellipse_at_top_right,_rgba(0,255,135,.10),_transparent_42%),linear-gradient(120deg,#0d1c2d,#091726)] p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#00FF87]"><span className="h-1.5 w-1.5 rounded-full bg-[#00FF87]" /> Public FPL profile · Team {entryId}</div>
            <h1 className="text-3xl font-black tracking-[-.04em] text-white sm:text-4xl">{entry.player_first_name} {entry.player_last_name}</h1>
            <p className="mt-2 text-sm text-slate-400">Manager of <span className="font-semibold text-slate-200">{entry.name}</span></p>
          </div>
          <button type="button" onClick={onOpenMyTeam} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#071521]/70 px-4 py-3 text-sm font-semibold text-slate-200 hover:border-[#00FF87]/40 hover:text-white"><ArrowRight className="h-4 w-4 rotate-180" /> My Team</button>
        </div>
      </header>

      <section aria-label="FPL season statistics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Overall points" value={entry.summary_overall_points.toLocaleString()} detail={`Overall rank ${formatRank(entry.summary_overall_rank)}`} icon={<Trophy className="h-5 w-5" />} />
        <StatCard label={`Gameweek ${entry.current_event}`} value={`${entry.summary_event_points.toLocaleString()} pts`} detail={`Gameweek rank ${formatRank(entry.summary_event_rank)}`} icon={<CalendarDays className="h-5 w-5" />} />
        <StatCard label="FPL seasons" value={entry.years_active == null ? '—' : String(entry.years_active)} detail={entry.started_event ? `Joined in Gameweek ${entry.started_event}` : 'Seasons active'} icon={<Shield className="h-5 w-5" />} />
        <StatCard label="Region" value={entry.player_region_name || '—'} detail={`${entry.last_deadline_total_transfers?.toLocaleString() ?? '—'} transfers by last deadline`} icon={<Globe2 className="h-5 w-5" />} />
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#0d1c2d] p-4 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/8 pb-4">
          <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#00FF87]">From Fantasy Premier League</p><h2 className="mt-1 text-xl font-black text-white">Your mini-leagues</h2></div>
          <span className="rounded-full border border-white/10 bg-[#162638] px-3 py-1.5 text-xs font-semibold text-slate-300">{privateLeagues.length} linked</span>
        </div>
        {privateLeagues.length ? (
          <ul className="mt-4 space-y-2.5">
            {privateLeagues.map((league) => <li key={league.id} className="flex flex-col justify-between gap-3 rounded-2xl bg-[#162638] p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-400/10 text-amber-300"><Trophy className="h-5 w-5" /></span><div className="min-w-0"><h3 className="truncate text-sm font-bold text-white">{league.name}</h3><p className="mt-1 text-xs text-slate-400">Classic league · {(league.rank_count ?? 0).toLocaleString()} managers</p></div></div>
              <div className="pl-[52px] text-left sm:pl-0 sm:text-right"><div className="font-mono text-lg font-bold text-[#00FF87]">{formatRank(league.entry_rank)}</div><div className="mt-0.5 text-xs text-slate-400">{league.entry_percentile_rank == null ? 'Current league position' : `FPL percentile ${league.entry_percentile_rank}`}</div></div>
            </li>)}
          </ul>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-[#091726]/60 p-5 text-sm leading-6 text-slate-400">FPL did not return any joined private classic leagues for this team. Your team is linked and the public profile data above is live.</div>
        )}
        <p className="mt-4 text-[11px] leading-5 text-slate-500">Profile and league positions come from the public FPL entry response. Ranks can change as gameweeks update. Play XI does not access your FPL password or private account data.</p>
      </section>
    </main>
  );
}

function StatCard({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: ReactNode }) {
  return <article className="rounded-2xl border border-white/8 bg-[#0d1c2d] p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</div><span className="rounded-lg bg-[#00FF87]/10 p-2 text-[#00FF87]">{icon}</span></div><div className="mt-3 text-2xl font-black tracking-tight text-white">{value}</div><div className="mt-1 text-xs text-slate-400">{detail}</div></article>;
}
