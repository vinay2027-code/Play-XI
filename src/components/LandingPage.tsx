import { ArrowDown, ArrowRight, ArrowRightLeft, BarChart3, CalendarDays, Check, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { BrandLockup } from './BrandMark';

interface LandingPageProps {
  onOpenPlanner: () => void;
}

export function LandingPage({ onOpenPlanner }: LandingPageProps) {
  return (
    <div className="min-h-screen overflow-hidden bg-[#07150f] text-white selection:bg-[#c7f36b] selection:text-[#102018]">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#07150f]/90 px-5 backdrop-blur-xl sm:px-10">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between">
          <a href="#home" className="flex items-center gap-2.5" aria-label="Play XI home">
            <BrandLockup size={38} />
          </a>
          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#how-it-works" className="transition hover:text-white">How it works</a>
            <a href="#tools" className="transition hover:text-white">Your tools</a>
            <a href="#pricing" className="transition hover:text-white">Pricing</a>
          </nav>
          <button onClick={onOpenPlanner} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#c7f36b] px-4 text-sm font-extrabold text-[#102018] transition hover:bg-[#d7ff84] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c7f36b]">
            Open planner <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main id="home">
        <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-14 sm:px-10 sm:pb-24 sm:pt-20 lg:grid-cols-[.9fr_1.1fr] lg:gap-14">
          <div className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-[#91d64f]/10 blur-[110px]" />
          <div className="relative">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#c7f36b]/25 bg-[#c7f36b]/[.07] px-3.5 py-2 text-xs font-semibold text-[#d9ffa1]">
              <span className="h-2 w-2 rounded-full bg-[#c7f36b] shadow-[0_0_12px_#c7f36b]" /> Your FPL team, in focus
            </div>
            <h1 className="max-w-2xl text-[2.7rem] font-black leading-[1.02] tracking-[-.055em] sm:text-6xl lg:text-[4.4rem]">Know what to consider before <span className="text-[#c7f36b]">the deadline.</span></h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">Bring your public FPL team into one clear workspace. Check your squad, understand transfer ideas and look ahead at the fixtures.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button onClick={onOpenPlanner} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#c7f36b] px-5 text-sm font-black text-[#102018] transition hover:bg-[#d7ff84] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c7f36b]">Plan my team free <ArrowRight className="h-4 w-4" /></button>
              <a href="#how-it-works" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 px-5 text-sm font-bold text-white transition hover:border-white/30 hover:bg-white/[.04]">How it works <ArrowDown className="h-4 w-4" /></a>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-[#c7f36b]" /> No FPL password</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-[#c7f36b]" /> 3 ideas free each Gameweek</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-[#c7f36b]" /> You make every transfer</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[600px] lg:ml-auto">
            <div className="absolute -inset-6 rounded-[32px] bg-[#c7f36b]/[.055] blur-2xl" />
            <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[#0c1d15] p-4 shadow-[0_30px_100px_rgba(0,0,0,.4)] sm:p-6">
              <div className="flex items-center justify-between border-b border-white/8 pb-4">
                <div><p className="text-[10px] font-bold uppercase tracking-[.19em] text-slate-500">Your Gameweek brief</p><h2 className="mt-1 text-xl font-extrabold tracking-tight sm:text-2xl">One clear place to start</h2></div>
                <span className="rounded-full border border-[#c7f36b]/20 bg-[#c7f36b]/[.08] px-3 py-1.5 font-mono text-xs font-bold text-[#d9ffa1]">MY TEAM</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2.5 sm:gap-3">
                {[['SQUAD', '15', 'players'], ['BANK', '£4.5m', 'available'], ['IDEAS', '03', 'free this GW']].map(([label, value, detail]) => <div key={label} className="rounded-2xl border border-white/8 bg-[#102319] p-3 sm:p-4"><div className="text-[9px] font-bold tracking-[.14em] text-slate-500 sm:text-[10px]">{label}</div><div className="mt-2 text-xl font-black tracking-tight text-white sm:text-2xl">{value}</div><div className="mt-1 text-[10px] text-slate-400 sm:text-xs">{detail}</div></div>)}
              </div>
              <div className="mt-4 rounded-2xl border border-[#c7f36b]/20 bg-gradient-to-br from-[#182d1c] to-[#102319] p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2 text-sm font-bold"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#c7f36b]/10 text-[#c7f36b]"><Sparkles className="h-4 w-4" /></span>Transfer idea</div><span className="rounded-full bg-[#c7f36b]/10 px-2.5 py-1 text-[10px] font-bold text-[#d9ffa1]">EXAMPLE VIEW</span></div>
                <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl border border-white/8 bg-[#07150f]/70 p-3 sm:gap-3 sm:p-4">
                  <div><div className="text-[9px] font-bold uppercase tracking-widest text-rose-300/80">Consider selling</div><div className="mt-1 font-bold">Your player</div><div className="text-xs text-slate-400">Sale value shown</div></div>
                  <ArrowRightLeft className="h-4 w-4 text-slate-500" />
                  <div><div className="text-[9px] font-bold uppercase tracking-widest text-[#c7f36b]/80">Possible replacement</div><div className="mt-1 font-bold">Same position</div><div className="text-xs text-slate-400">Fits available budget</div></div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs"><span className="text-slate-400">Expected points difference</span><span className="rounded-lg bg-[#c7f36b]/10 px-2.5 py-1.5 font-mono font-bold text-[#d9ffa1]">+ next-GW xP</span></div>
              </div>
              <p className="mt-3 text-center text-[10px] text-slate-500">Illustrative layout · your live team data appears after you connect</p>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-y border-white/8 bg-[#0a1911]">
          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-10 sm:py-16">
            <div className="max-w-xl"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#c7f36b]">Three simple steps</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">From Team ID to a better-informed plan</h2></div>
            <div className="mt-8 grid gap-3 md:grid-cols-3">
              {[
                ['01', 'Connect your team', 'Use your public FPL Team ID. Your password stays private.'],
                ['02', 'See your Gameweek', 'Review your real squad, budget and the players who need a closer look.'],
                ['03', 'Compare your options', 'Read the reasons and trade-offs, then make your own decision.'],
              ].map(([number, title, body]) => <article key={number} className="rounded-2xl border border-white/8 bg-[#0c1d15] p-5 sm:p-6"><span className="font-mono text-xs font-bold text-[#c7f36b]">STEP {number}</span><h3 className="mt-5 text-lg font-extrabold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{body}</p></article>)}
            </div>
          </div>
        </section>

        <section id="tools" className="mx-auto max-w-7xl px-5 py-14 sm:px-10 sm:py-16">
          <div className="grid gap-8 md:grid-cols-[.8fr_1.2fr] md:items-end"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#c7f36b]">Made for FPL decisions</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Your team. The context around it.</h2></div><p className="max-w-2xl text-sm leading-6 text-slate-400">Use current Fantasy Premier League data to explore your squad, player stats and upcoming fixtures. Projections are estimates, not promises.</p></div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[{ icon: Users, title: 'My Team', text: 'Your squad, points, bank and transfer ideas in a Gameweek-first view.' }, { icon: BarChart3, title: 'Players', text: 'Search, filter and compare the current FPL player catalogue.' }, { icon: CalendarDays, title: 'Fixtures', text: 'Look ahead at upcoming opponents and official fixture difficulty.' }].map(({ icon: Icon, title, text }) => <article key={title} className="rounded-2xl border border-white/8 bg-[#0c1d15] p-5 transition hover:-translate-y-0.5 hover:border-[#c7f36b]/25"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#c7f36b]/10 text-[#c7f36b]"><Icon className="h-5 w-5" /></span><h3 className="mt-4 font-extrabold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{text}</p></article>)}
          </div>
        </section>

        <section id="pricing" className="border-t border-white/8 bg-[#0a1911]">
          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-10 sm:py-16">
            <div className="mx-auto max-w-2xl text-center"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#c7f36b]">Free to start</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Three useful ideas, on us.</h2><p className="mt-3 text-sm leading-6 text-slate-400">Start with your team, player stats, fixtures and three transfer ideas each Gameweek.</p></div>
            <div className="mx-auto mt-8 grid max-w-3xl gap-3 md:grid-cols-2">
              <article className="rounded-2xl border border-[#c7f36b]/30 bg-[#102319] p-6"><p className="text-sm font-bold text-[#c7f36b]">Free planner</p><div className="mt-3 text-4xl font-black">₹0</div><p className="mt-2 text-sm text-slate-400">Every Gameweek</p><ul className="mt-5 space-y-3 text-sm text-slate-300"><li className="flex gap-2"><Check className="h-4 w-4 text-[#c7f36b]" /> My Team, Players and Fixtures</li><li className="flex gap-2"><Check className="h-4 w-4 text-[#c7f36b]" /> 3 transfer ideas per Gameweek</li></ul><button onClick={onOpenPlanner} className="mt-6 min-h-12 w-full rounded-xl bg-[#c7f36b] px-4 text-sm font-black text-[#102018] transition hover:bg-[#d7ff84]">Open the free planner</button></article>
              <article className="rounded-2xl border border-white/10 bg-[#0c1d15] p-6"><p className="text-sm font-bold text-slate-200">Gameweek unlock</p><div className="mt-3 text-4xl font-black">₹29 <span className="text-base font-semibold text-slate-400">/ GW</span></div><p className="mt-2 text-sm text-slate-400">One-time · no subscription</p><ul className="mt-5 space-y-3 text-sm text-slate-300"><li className="flex gap-2"><Check className="h-4 w-4 text-[#c7f36b]" /> Up to 5 more transfer ideas</li><li className="flex gap-2"><Check className="h-4 w-4 text-[#c7f36b]" /> Access for one Gameweek</li></ul><button type="button" disabled className="mt-6 min-h-12 w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm font-bold text-slate-500">Payments not available yet</button><p className="mt-3 text-center text-xs text-slate-500">Unlock will be enabled after payment setup.</p></article>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/8 px-5 py-6 text-center text-xs text-slate-500 sm:px-10">Play XI is an independent FPL planning tool. Recommendations are informational; every FPL transfer stays under your control.</footer>
    </div>
  );
}
