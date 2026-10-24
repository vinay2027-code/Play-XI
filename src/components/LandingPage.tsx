import { useState, type ReactNode } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowRightLeft,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import { BrandLockup } from './BrandMark';

interface LandingPageProps {
  onOpenPlanner: () => void;
  onOpenOverview: () => void;
  onOpenMatchCentre: () => void;
  onSignIn: () => void;
  authUserEmail: string | null;
}

type DemoTab = 'team' | 'ideas' | 'fixtures';

const transferReasons = [
  ['01', 'Expected points', 'Compare the FPL projection for the player leaving and the player coming in.'],
  ['02', 'Recent form', 'See how recent returns and current form compare.'],
  ['03', 'Upcoming fixtures', 'Look at the next three opponents and their official difficulty ratings.'],
  ['04', 'Season performance', 'Compare points, minutes, starts, goals and assists this season.'],
  ['05', 'Availability & cards', 'Check injury news, playing chance and yellow or red card history.'],
];

export function LandingPage({ onOpenPlanner, onOpenOverview, onOpenMatchCentre, onSignIn, authUserEmail }: LandingPageProps) {
  const [activeDemo, setActiveDemo] = useState<DemoTab>('team');

  return (
    <div className="landing-page min-h-screen overflow-hidden bg-[#f6f6f2] text-[#171a20] selection:bg-[#c7f36b] selection:text-[#102018]">
      <header className="sticky top-0 z-30 border-b border-black/10 bg-[#f6f6f2]/95 px-4 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between">
          <a href="#home" className="flex items-center gap-2.5" aria-label="Play XI home"><BrandLockup size={38} dark /></a>
          <nav aria-label="Main navigation" className="hidden items-center gap-8 text-sm text-[#525866] md:flex">
            <a href="#how-it-works" className="transition hover:text-[#171a20]">How it works</a>
            <a href="#why-playxi" className="transition hover:text-[#171a20]">Why Play XI</a>
            <a href="#pricing" className="transition hover:text-[#171a20]">Pricing</a>
            <button type="button" onClick={onOpenMatchCentre} className="transition hover:text-[#171a20]">Match Centre</button>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={onSignIn} className="inline-flex min-h-10 max-w-36 items-center gap-2 truncate rounded-xl border border-black/15 px-3 text-xs font-bold text-[#343843] transition hover:border-[#c7f36b]/40 hover:text-[#171a20]" title={authUserEmail ?? 'Sign in to save your team across devices'}>
              {authUserEmail ? 'Account' : 'Sign in'}
            </button>
            <button onClick={onOpenOverview} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#c7f36b] px-4 text-sm font-extrabold text-[#102018] transition hover:bg-[#d7ff84] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c7f36b]">
              Open planner <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main id="home">
        <section className="landing-hero">
          <div className="landing-hero-copy relative z-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#c7f36b]/25 bg-[#c7f36b]/[.07] px-3.5 py-2 text-xs font-semibold text-[#4b397f]">
              <span className="landing-live-dot h-2 w-2 rounded-full bg-[#00ff87] shadow-[0_0_12px_#00ff87]" /> Built for Fantasy Premier League
            </div>
            <h1 className="max-w-2xl text-[2.65rem] font-black leading-[1.01] tracking-[-.06em] sm:text-6xl lg:text-[4.25rem]">Your team.<br />Your next <span className="text-[#6040b5]">winning move.</span></h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#525866] sm:text-lg">Your squad, player stats and smarter transfer ideas. Connect your FPL team and see the reasons behind every move.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button onClick={onOpenPlanner} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#c7f36b] px-5 text-sm font-black text-[#102018] transition hover:bg-[#d7ff84] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c7f36b]">Connect your FPL team <ArrowRight className="h-4 w-4" /></button>
              <a href="#sample" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-black/15 px-5 text-sm font-bold text-[#171a20] transition hover:border-black/30 hover:bg-white/[.04]">Explore the preview <ArrowDown className="h-4 w-4" /></a>
              <button type="button" onClick={onOpenMatchCentre} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-black/15 px-5 text-sm font-bold text-[#171a20] transition hover:border-black/30 hover:bg-white">Explore football leagues <Trophy className="h-4 w-4" /></button>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#626976]">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-[#6040b5]" /> Public FPL data only</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-[#6040b5]" /> 3 transfer ideas free each Gameweek</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-[#6040b5]" /> You stay in control</span>
            </div>
          </div>

          <section id="sample" aria-label="Interactive Play XI preview" className="landing-preview relative w-full min-w-0 scroll-mt-24">
            <div className="relative overflow-hidden rounded-[26px] border border-black/10 bg-white p-3 shadow-[0_30px_100px_rgba(0,0,0,.5)] sm:p-5">
              <div className="flex items-start justify-between gap-3 border-b border-black/8 pb-4">
                <div><p className="text-[10px] font-bold uppercase tracking-[.19em] text-[#6040b5]">THE GAMEWEEK, AT A GLANCE</p><h2 className="mt-1 text-xl font-extrabold tracking-tight sm:text-2xl">One place. Every decision.</h2></div>
                <span className="rounded-full border border-black/10 bg-white/[.04] px-3 py-1.5 font-mono text-[10px] font-bold text-[#525866]">PLAY XI PREVIEW</span>
              </div>

              <div role="group" aria-label="Preview Play XI tools" className="mt-4 grid grid-cols-3 gap-1 rounded-xl border border-black/8 bg-[#eeeee8] p-1">
                {([
                  ['team', 'My Team'],
                  ['ideas', 'Transfer ideas'],
                  ['fixtures', 'Fixtures'],
                ] as const).map(([tab, label]) => <button key={tab} type="button" aria-pressed={activeDemo === tab} onClick={() => setActiveDemo(tab)} className={`min-h-10 rounded-lg px-2 text-[11px] font-bold transition sm:text-xs ${activeDemo === tab ? 'bg-[#c7f36b] text-[#102018]' : 'text-[#626976] hover:bg-white/[.05] hover:text-[#171a20]'}`}>{label}</button>)}
              </div>

              <div key={activeDemo} aria-live="polite" className="landing-demo-panel mt-3 min-h-[315px] rounded-2xl border border-black/8 bg-[#f4f4ee] p-3 sm:min-h-[330px] sm:p-4">
                {activeDemo === 'team' && <TeamPreview />}
                {activeDemo === 'ideas' && <TransferPreview />}
                {activeDemo === 'fixtures' && <FixturesPreview />}
              </div>
              <div className="mt-3 flex flex-col items-center justify-between gap-2 px-1 text-center sm:flex-row sm:text-left">
                <p className="text-[10px] leading-4 text-[#626976]">Illustrative preview · connect your ID to load your live FPL data</p>
                <button onClick={onOpenPlanner} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-[#4b397f] transition hover:bg-[#c7f36b]/10">Try the free planner <ArrowRight className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </section>
        </section>

        <section aria-label="Play XI features" className="border-y border-black/8 bg-[#eeeee8]">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:grid-cols-3 sm:px-8 sm:py-7">
            <RibbonItem icon={<Users className="h-4 w-4" />} title="Your official FPL squad" detail="Real team, picks and budget" />
            <RibbonItem icon={<Sparkles className="h-4 w-4" />} title="Recommendations with reasons" detail="Five factors for each idea" />
            <RibbonItem icon={<CalendarDays className="h-4 w-4" />} title="Fixtures in context" detail="Look ahead before deadline" />
          </div>
        </section>

        <section id="why-playxi" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-14 sm:px-8 sm:py-20">
          <div className="grid gap-8 md:grid-cols-[.78fr_1.22fr] md:items-end">
            <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#6040b5]">No black-box transfers</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">See why a move is suggested.</h2></div>
            <p className="max-w-2xl text-sm leading-6 text-[#626976]">A points projection is only part of the decision. Play XI lays out the form, fixtures, season returns and availability behind each transfer idea so you can judge the trade-off yourself.</p>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {transferReasons.map(([number, title, text]) => <article key={number} className="group rounded-2xl border border-black/8 bg-white p-4 transition hover:-translate-y-1 hover:border-[#c7f36b]/30 sm:p-5"><div className="flex items-center justify-between"><span className="font-mono text-xs font-bold text-[#6040b5]">{number}</span><span className="h-px w-10 bg-white/15 transition group-hover:bg-[#c7f36b]/50" /></div><h3 className="mt-5 text-sm font-extrabold text-[#171a20]">{title}</h3><p className="mt-2 text-xs leading-5 text-[#626976]">{text}</p></article>)}
          </div>
        </section>

        <section id="how-it-works" className="border-y border-black/8 bg-[#eeeee8]">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-8 sm:py-18">
            <div className="max-w-xl"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#6040b5]">Three quick steps</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">From your FPL ID to your next decision.</h2></div>
            <div className="mt-8 grid gap-3 md:grid-cols-3">
              {[
                ['01', 'Connect your team', 'Enter the public Team ID from your FPL URL. No password or FPL login needed.'],
                ['02', 'Review your Gameweek', 'See your squad, captain, bench, budget and available transfer ideas.'],
                ['03', 'Choose with confidence', 'Compare the evidence, then make any transfer yourself in the official FPL app.'],
              ].map(([number, title, body]) => <article key={number} className="rounded-2xl border border-black/8 bg-white p-5 sm:p-6"><span className="font-mono text-xs font-bold text-[#6040b5]">STEP {number}</span><h3 className="mt-5 text-lg font-extrabold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#626976]">{body}</p></article>)}
            </div>
          </div>
        </section>

        <section id="tools" className="mx-auto max-w-7xl px-4 py-14 sm:px-8 sm:py-20">
          <div className="grid gap-8 md:grid-cols-[.8fr_1.2fr] md:items-end"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#6040b5]">Your FPL toolkit</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Everything starts with your team.</h2></div><p className="max-w-2xl text-sm leading-6 text-[#626976]">Play XI brings the useful parts of planning together: your actual squad, player performance and the fixtures ahead.</p></div>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {[{ icon: Users, title: 'My Team', text: 'Your real picks, formation, captain, bench and transfer ideas for the next Gameweek.' }, { icon: BarChart3, title: 'Players', text: 'Search and compare current FPL players using official season stats.' }, { icon: CalendarDays, title: 'Fixtures', text: 'Review upcoming opponents and official fixture difficulty ratings.' }].map(({ icon: Icon, title, text }) => <article key={title} className="rounded-2xl border border-black/8 bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#c7f36b]/25 sm:p-6"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#c7f36b]/10 text-[#6040b5]"><Icon className="h-5 w-5" /></span><h3 className="mt-4 font-extrabold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#626976]">{text}</p></article>)}
          </div>
        </section>

        <section id="pricing" className="border-t border-black/8 bg-[#eeeee8]">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-8 sm:py-20">
            <div className="mx-auto max-w-2xl text-center"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#6040b5]">Free to start</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Get useful ideas before you pay.</h2><p className="mt-3 text-sm leading-6 text-[#626976]">Your team, player stats and fixtures are free. Start with three transfer ideas every Gameweek.</p></div>
            <div className="mx-auto mt-8 grid max-w-3xl gap-3 md:grid-cols-2">
              <article className="rounded-2xl border border-[#c7f36b]/30 bg-white p-6"><p className="text-sm font-bold text-[#6040b5]">Free planner</p><div className="mt-3 text-4xl font-black">₹0</div><p className="mt-2 text-sm text-[#626976]">Every Gameweek</p><ul className="mt-5 space-y-3 text-sm text-[#525866]"><li className="flex gap-2"><Check className="h-4 w-4 text-[#6040b5]" /> My Team, Players and Fixtures</li><li className="flex gap-2"><Check className="h-4 w-4 text-[#6040b5]" /> 3 transfer ideas with explanations</li></ul><button onClick={onOpenPlanner} className="mt-6 min-h-12 w-full rounded-xl bg-[#c7f36b] px-4 text-sm font-black text-[#102018] transition hover:bg-[#d7ff84]">Open the free planner</button></article>
              <article className="rounded-2xl border border-black/10 bg-white p-6"><p className="text-sm font-bold text-[#343843]">Gameweek unlock</p><div className="mt-3 text-4xl font-black">₹29 <span className="text-base font-semibold text-[#626976]">/ GW</span></div><p className="mt-2 text-sm text-[#626976]">One-time · no subscription</p><ul className="mt-5 space-y-3 text-sm text-[#525866]"><li className="flex gap-2"><Check className="h-4 w-4 text-[#6040b5]" /> Up to 5 additional ideas</li><li className="flex gap-2"><Check className="h-4 w-4 text-[#6040b5]" /> Unlock one Gameweek</li></ul><button type="button" disabled className="mt-6 min-h-12 w-full cursor-not-allowed rounded-xl border border-black/10 bg-white/[.04] px-4 text-sm font-bold text-[#626976]">Payments coming soon</button><p className="mt-3 text-center text-xs text-[#626976]">Unlock will be enabled after payment setup.</p></article>
            </div>
          </div>
        </section>

        <section aria-labelledby="faq-title" className="mx-auto max-w-4xl px-4 py-14 sm:px-8 sm:py-18">
          <div className="mb-6 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#c7f36b]/10 text-[#6040b5]"><CircleHelp className="h-5 w-5" /></span><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#6040b5]">Good to know</p><h2 id="faq-title" className="mt-1 text-2xl font-black">Before you connect</h2></div></div>
          <div className="space-y-2">
            <Faq question="Does Play XI need my FPL password?">No. It reads your public FPL team using the Team ID in your FPL URL. It never asks for your password or submits transfers.</Faq>
            <Faq question="Are transfer points guaranteed?">No. Expected points and fixture difficulty are estimates. Play XI shows the evidence and trade-offs so you can decide for yourself.</Faq>
            <Faq question="What do I get for free?">Your team view, player stats, fixtures and three transfer ideas each Gameweek are free to use.</Faq>
          </div>
        </section>

        <section className="px-4 pb-14 sm:px-8 sm:pb-20">
          <div className="landing-final relative mx-auto max-w-7xl overflow-hidden rounded-[28px] border border-[#c7f36b]/20 bg-[radial-gradient(ellipse_at_top_right,_rgba(0,255,135,.16),_transparent_45%),linear-gradient(120deg,#102319,#0b1d16)] p-6 text-center sm:p-10 lg:p-14">
            <div aria-hidden="true" className="absolute -right-10 -top-24 h-64 w-64 rounded-full border border-[#c7f36b]/10" />
            <p className="relative text-xs font-bold uppercase tracking-[.18em] text-[#6040b5]">Your next deadline is coming</p>
            <h2 className="relative mx-auto mt-3 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">Bring your team in. Make the call with context.</h2>
            <p className="relative mx-auto mt-3 max-w-xl text-sm leading-6 text-[#525866]">Start free with your public FPL Team ID. No account or payment is needed to explore your team.</p>
            <button onClick={onOpenPlanner} className="relative mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#c7f36b] px-6 text-sm font-black text-[#102018] transition hover:bg-[#d7ff84]">Open Play XI <ArrowRight className="h-4 w-4" /></button>
            <p className="relative mt-3 inline-flex items-center gap-1.5 text-xs text-[#626976]"><Clock3 className="h-3.5 w-3.5" /> Takes less than a minute to connect</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/8 px-4 py-6 text-center text-xs leading-5 text-[#626976] sm:px-8">
        <p>Play XI is an independent FPL planning tool. Recommendations are informational, projections are estimates, and every transfer stays under your control.</p>
        <nav aria-label="Legal and support" className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
          <a href="/terms.html" className="text-[#626976] underline decoration-white/20 underline-offset-4 transition hover:text-[#171a20]">Terms of service</a>
          <a href="/privacy.html" className="text-[#626976] underline decoration-white/20 underline-offset-4 transition hover:text-[#171a20]">Privacy policy</a>
          <a href="/refunds.html" className="text-[#626976] underline decoration-white/20 underline-offset-4 transition hover:text-[#171a20]">Refunds and cancellation</a>
          <a href="mailto:vinay2027@mastersunion.org" className="text-[#626976] underline decoration-white/20 underline-offset-4 transition hover:text-[#171a20]">Contact support</a>
        </nav>
      </footer>
    </div>
  );
}

function TeamPreview() {
  return <div>
    <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-widest text-[#626976]">Your FPL squad</p><p className="mt-1 text-sm font-extrabold text-[#171a20]">Plan the full 15-player team</p></div><span className="rounded-lg border border-[#c7f36b]/20 bg-[#c7f36b]/[.07] px-2.5 py-1.5 text-[10px] font-bold text-[#4b397f]">LIVE AFTER CONNECT</span></div>
    <div className="landing-pitch-motion relative overflow-hidden rounded-xl border border-emerald-100/15 bg-[linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(180deg,#08784a,#095f3c)] bg-[size:50%_100%,100%_25%] p-3 sm:p-4">
      <div aria-hidden="true" className="absolute inset-2 rounded-lg border border-white/25" /><div aria-hidden="true" className="absolute inset-x-2 top-1/2 border-t border-white/20" /><div aria-hidden="true" className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20" />
      <div className="relative flex min-h-[204px] flex-col justify-around gap-2 py-1">
        <PositionRow count={3} label="FWD" accessibleLabel="Forwards" />
        <PositionRow count={4} label="MID" accessibleLabel="Midfielders" />
        <PositionRow count={3} label="DEF" accessibleLabel="Defenders" />
        <PositionRow count={1} label="GK" accessibleLabel="Goalkeeper" />
      </div>
    </div>
    <div className="mt-2 flex justify-between px-1 text-[9px] font-bold tracking-wide text-[#171a20]/60"><span>STARTING XI · 3–4–3</span><span>BENCH · 4 RESERVES</span></div>
    <div className="mt-3 grid grid-cols-3 gap-2 text-center"><MiniStat label="SQUAD" value="15 players" /><MiniStat label="CAPTAIN" value="Your pick" /><MiniStat label="BANK" value="Live balance" /></div>
  </div>;
}

function PositionRow({ count, label, accessibleLabel }: { count: number; label: string; accessibleLabel: string }) {
  return <div className="flex items-center justify-center gap-2 sm:gap-3" aria-label={accessibleLabel}>
    {Array.from({ length: count }, (_, index) => <div key={index} style={{ animationDelay: `${index * 130}ms` }} className="landing-player-token flex w-14 flex-col items-center gap-1 sm:w-16"><span className="landing-player-orb grid h-8 w-8 place-items-center rounded-full border border-black/15 bg-[#0b2330] text-[10px] font-black text-[#6040b5] shadow-lg">{index + 1}</span><span className="max-w-full truncate rounded-md border border-black/10 bg-[#eeeee8]/90 px-1.5 py-1 text-[8px] font-bold tracking-wide text-[#171a20]/90 sm:text-[9px]">{label}</span></div>)}
  </div>;
}

function TransferPreview() {
  return <div className="flex h-full flex-col">
    <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-widest text-[#626976]">Transfer shortlist</p><p className="mt-1 text-sm font-extrabold text-[#171a20]">Understand the move, not just the number</p></div><span className="rounded-full bg-[#c7f36b]/10 px-2.5 py-1 text-[10px] font-bold text-[#4b397f]">3 FREE IDEAS</span></div>
    <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl border border-black/8 bg-[#eeeee8]/70 p-3 sm:p-4"><div><p className="text-[9px] font-bold uppercase tracking-widest text-rose-700">Consider selling</p><p className="mt-1 text-sm font-bold">Your player</p><p className="text-[10px] text-[#626976]">Sale value</p></div><ArrowRightLeft className="h-4 w-4 text-[#626976]" /><div><p className="text-[9px] font-bold uppercase tracking-widest text-[#6040b5]/80">Possible replacement</p><p className="mt-1 text-sm font-bold">Same position</p><p className="text-[10px] text-[#626976]">Fits your budget</p></div></div>
    <div className="mt-3 flex-1 space-y-1.5">{transferReasons.map(([number, title]) => <div key={number} className="flex items-center gap-2.5 rounded-lg bg-white/[.025] px-2.5 py-1.5"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#c7f36b]/10 font-mono text-[9px] font-bold text-[#6040b5]">{number}</span><span className="text-[11px] font-semibold text-[#343843]">{title}</span><Check className="ml-auto h-3.5 w-3.5 text-[#6040b5]" /></div>)}</div>
  </div>;
}

function FixturesPreview() {
  return <div>
    <div><p className="text-[10px] font-bold uppercase tracking-widest text-[#626976]">Fixture planner</p><p className="mt-1 text-sm font-extrabold text-[#171a20]">Look at the run ahead</p></div>
    <div className="mt-4 space-y-2">
      {[
        ['NEXT FIXTURE', 'Home', 'Official FDR'],
        ['FOLLOWING', 'Away', 'Official FDR'],
        ['THIRD FIXTURE', 'Home', 'Official FDR'],
      ].map(([round, location, rating], index) => <div key={round} className="flex items-center gap-3 rounded-xl border border-black/8 bg-[#eeeee8]/70 p-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#c7f36b]/10 font-mono text-[10px] font-black text-[#4b397f]">{index === 0 ? 'NEXT' : `+${index + 1}`}</span><div className="min-w-0 flex-1"><p className="text-[9px] font-bold tracking-widest text-[#626976]">{round}</p><p className="mt-0.5 text-xs font-bold text-[#171a20]">Your team <span className="font-normal text-[#626976]">· {location}</span></p></div><div className="text-right"><div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10"><span className={`block h-full rounded-full bg-[#c7f36b] ${index === 1 ? 'w-3/4' : index === 2 ? 'w-1/3' : 'w-1/2'}`} /></div><p className="mt-1 text-[9px] text-[#626976]">{rating}</p></div></div>)}
    </div>
    <p className="mt-3 rounded-lg border border-black/6 bg-white/[.025] p-2.5 text-[10px] leading-4 text-[#626976]">See upcoming opponents and official difficulty ratings together, so a transfer fits the schedule as well as the budget.</p>
  </div>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-black/8 bg-[#eeeee8]/70 px-2 py-2"><div className="text-[8px] font-bold tracking-widest text-[#626976]">{label}</div><div className="mt-1 text-[10px] font-bold text-[#343843]">{value}</div></div>;
}

function RibbonItem({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) {
  return <div className="flex items-center gap-3 sm:justify-center"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#c7f36b]/10 text-[#6040b5]">{icon}</span><div><div className="text-xs font-bold text-[#171a20]">{title}</div><div className="mt-0.5 text-[11px] text-[#626976]">{detail}</div></div></div>;
}

function Faq({ question, children }: { question: string; children: string }) {
  return <details className="group rounded-xl border border-black/8 bg-white px-4 py-3.5 open:border-[#c7f36b]/20"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-[#171a20]"><span>{question}</span><ChevronDown className="h-4 w-4 shrink-0 text-[#626976] transition group-open:rotate-180" /></summary><p className="mt-3 max-w-3xl text-sm leading-6 text-[#626976]">{children}</p></details>;
}
