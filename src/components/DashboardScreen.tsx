import React from 'react';
import {
  TrendingUp,
  Award,
  Zap,
  DollarSign,
  Edit3,
  BarChart3,
  Layers,
  Sparkles,
  ArrowRight,
  Flame,
  ShieldCheck,
  Percent,
  CheckCircle2,
  RefreshCw,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import { Player, TacticalInsight, ActiveUser } from '../types/fpl';
import { PitchView } from './PitchView';

interface DashboardScreenProps {
  user: ActiveUser;
  onNavigate: (screen: string) => void;
  onOpenSimulation: () => void;
  onOpenCompare: (p1?: Player, p2?: Player) => void;
  onSelectPlayer: (player: Player) => void;
  startingXI: {
    gk: Player[];
    def: Player[];
    mid: Player[];
    fwd: Player[];
  };
  bench: Player[];
  insights: TacticalInsight[];
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  user,
  onNavigate,
  onOpenSimulation,
  onOpenCompare,
  onSelectPlayer,
  startingXI,
  bench,
  insights,
}) => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* 1. Header Greeting & Status Line */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1">
          <span className="text-[#00FF87] font-bold">FPL COCKPIT LIVE</span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF87] animate-pulse"></span>
            Sync: 18s ago
          </span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-sans tracking-tight flex items-center gap-2">
              Good evening, {user.name.split(' ')[0]} <span className="text-2xl">👋</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
              Gameweek 12 deadline is in <span className="text-white font-semibold">2 days, 14 hours</span>. Automated fixture models show <span className="text-[#00FF87] font-semibold">+8.2 pt ceiling</span> with one midfield rotation.
            </p>
          </div>

          {/* Top Badges */}
          <div className="flex items-center gap-3">
            {/* Active Strategy */}
            <div className="p-2.5 rounded-lg bg-[#0d1c2d] border border-white/10 flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#162638] flex items-center justify-center text-[#00FF87]">
                <Sliders className="w-4 h-4 text-[#00FF87]" />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  Active Strategy
                </div>
                <div className="text-sm font-bold text-white">Balanced</div>
              </div>
            </div>

            {/* Global Rank */}
            <div className="p-2.5 rounded-lg bg-[#0d1c2d] border border-white/10 flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#162638] flex items-center justify-center text-[#38BDF8]">
                <Award className="w-4 h-4 text-[#38BDF8]" />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  Global Rank
                </div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>14,204</span>
                  <span className="text-[10px] font-mono text-[#00FF87] font-semibold">
                    (Top 1.4%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Four KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Team Rating */}
        <div className="p-4 rounded-xl bg-[#0d1c2d] border border-white/10 hover:border-white/20 transition-all group">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span className="uppercase tracking-wider font-semibold">TEAM RATING</span>
            <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-[#00FF87] transition-colors">
              <Edit3 className="w-3 h-3" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-white font-sans tracking-tight">8.4</span>
            <span className="text-sm text-slate-400 font-mono">/10</span>
          </div>
          <div className="mt-3 pt-2 border-t border-white/8 flex items-center justify-between text-[11px] font-mono">
            <span className="text-[#00FF87] flex items-center gap-1 font-semibold">
              ↑ +0.3 vs GW11
            </span>
            <span className="text-slate-400">Model: Opta AI</span>
          </div>
        </div>

        {/* Card 2: Projected Points */}
        <div className="p-4 rounded-xl bg-[#0d1c2d] border border-white/10 hover:border-[#00FF87]/30 transition-all group">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span className="uppercase tracking-wider font-semibold">PROJECTED POINTS</span>
            <div className="w-6 h-6 rounded bg-[#00FF87]/10 flex items-center justify-center text-[#00FF87]">
              <BarChart3 className="w-3 h-3" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-[#00FF87] font-mono tracking-tight">61</span>
            <span className="text-sm text-slate-400 font-mono">pts</span>
          </div>
          <div className="mt-3 pt-2 border-t border-white/8 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">Ceiling: 69 pts</span>
            <span className="text-[#00FF87] font-bold">+8 pt gap</span>
          </div>
        </div>

        {/* Card 3: Squad Value */}
        <div className="p-4 rounded-xl bg-[#0d1c2d] border border-white/10 hover:border-white/20 transition-all group">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span className="uppercase tracking-wider font-semibold">SQUAD VALUE</span>
            <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-[#38BDF8] transition-colors">
              <TrendingUp className="w-3 h-3" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-white font-mono tracking-tight">£99.2m</span>
          </div>
          <div className="mt-3 pt-2 border-t border-white/8 flex items-center justify-between text-[11px] font-mono">
            <span className="text-[#00FF87] font-semibold">↗ +£1.4m this season</span>
            <span className="text-slate-400">6 risers pending</span>
          </div>
        </div>

        {/* Card 4: Remaining Budget */}
        <div className="p-4 rounded-xl bg-[#0d1c2d] border border-white/10 hover:border-white/20 transition-all group">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span className="uppercase tracking-wider font-semibold">REMAINING BUDGET</span>
            <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-amber-400 transition-colors">
              <DollarSign className="w-3 h-3" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-white font-mono tracking-tight">£0.8m</span>
            <span className="text-xs text-slate-400 font-mono">ITB</span>
          </div>
          <div className="mt-3 pt-2 border-t border-white/8 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-300 font-medium">1 Free Transfer</span>
            <span className="text-[#00FF87] font-bold bg-[#00FF87]/15 px-1.5 py-0.2 rounded border border-[#00FF87]/20">
              OPTIMAL
            </span>
          </div>
        </div>
      </div>

      {/* 3. Hero Feature Banner: AI Tactical Optimizer Engine */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#0d2238] via-[#0b1d30] to-[#081524] border border-[#00FF87]/30 p-5 sm:p-7 overflow-hidden shadow-2xl">
        {/* Subtle pitch watermark graphic on right */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none hidden md:block">
          <svg className="w-full h-full stroke-[#00FF87]" viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="60" strokeWidth="2" />
            <line x1="100" y1="0" x2="100" y2="200" strokeWidth="2" />
            <rect x="20" y="40" width="160" height="120" strokeWidth="2" rx="6" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-mono text-[#00FF87] font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#00FF87] animate-pulse"></span>
              AI Tactical Optimizer Engine
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white font-sans tracking-tight">
              Maximize Gameweek 12 points with automated fixture weighting.
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Simulate 10,000 game paths considering expected minutes, home penalty conversions, and set-piece share.
            </p>

            {/* Tactical Parameter Tags */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] font-mono">
              <span className="px-2.5 py-1 rounded bg-[#051424]/90 border border-white/10 text-slate-300">
                Budget: <strong className="text-white">£100.0m</strong>
              </span>
              <span className="px-2.5 py-1 rounded bg-[#051424]/90 border border-white/10 text-slate-300">
                Formation: <strong className="text-[#00FF87]">3-4-3</strong>
              </span>
              <span className="px-2.5 py-1 rounded bg-[#051424]/90 border border-white/10 text-slate-300">
                Strategy: <strong className="text-[#00FF87]">Balanced High-xG</strong>
              </span>
              <span className="px-2.5 py-1 rounded bg-[#051424]/90 border border-white/10 text-slate-300">
                Horizon: <strong className="text-white">GW12 - GW16</strong>
              </span>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => onNavigate('build')}
            className="px-6 py-4 rounded-xl bg-[#00FF87] hover:bg-[#00e478] text-[#051424] font-extrabold text-sm flex items-center justify-center gap-2.5 transition-all transform hover:scale-[1.02] shadow-xl shadow-[#00FF87]/25 cursor-pointer whitespace-nowrap shrink-0 group"
          >
            <span>BUILD MY XI</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      {/* 4. Split Section: Pitch Starting XI Preview (Left) + Quick Actions & Insights (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Starting XI Preview */}
        <div className="lg:col-span-7">
          <PitchView
            mode="dashboard"
            formation={user.squadFormation}
            startingXI={startingXI}
            bench={bench}
            captainId="halvorsen"
            viceCaptainId="palmer"
            onSelectPlayer={onSelectPlayer}
          />
        </div>

        {/* Right Column: Quick Actions & Recent Insights Feed */}
        <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
          {/* Quick Actions (4 shortcuts) */}
          <div className="rounded-xl bg-[#0d1c2d] border border-white/10 p-4">
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="font-bold text-white uppercase tracking-wider">Quick Actions</span>
              <span className="font-mono text-[11px] text-slate-400">4 shortcuts</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Action 1: Build XI */}
              <button
                onClick={() => onNavigate('build')}
                className="p-3 rounded-lg bg-[#122131] border border-white/8 hover:border-[#00FF87]/50 transition-all text-left group cursor-pointer"
              >
                <div className="w-7 h-7 rounded bg-[#00FF87]/15 text-[#00FF87] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs font-bold text-white group-hover:text-[#00FF87] transition-colors">
                  Build XI
                </div>
                <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                  Run custom AI squad generator
                </div>
              </button>

              {/* Action 2: Compare Players */}
              <button
                onClick={() => onOpenCompare()}
                className="p-3 rounded-lg bg-[#122131] border border-white/8 hover:border-[#38BDF8]/50 transition-all text-left group cursor-pointer"
              >
                <div className="w-7 h-7 rounded bg-[#38BDF8]/15 text-[#38BDF8] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs font-bold text-white group-hover:text-[#38BDF8] transition-colors">
                  Compare Players
                </div>
                <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                  Side-by-side xG/Points matrix
                </div>
              </button>

              {/* Action 3: Transfer Plan */}
              <button
                onClick={() => onNavigate('transfers')}
                className="p-3 rounded-lg bg-[#122131] border border-white/8 hover:border-[#00FF87]/50 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-7 h-7 rounded bg-[#00FF87]/15 text-[#00FF87] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-[#00FF87]/15 text-[#00FF87] font-bold">
                    1 FT
                  </span>
                </div>
                <div className="text-xs font-bold text-white group-hover:text-[#00FF87] transition-colors">
                  Transfer Plan
                </div>
                <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                  Free transfer bank ready
                </div>
              </button>

              {/* Action 4: Fixture Matrix */}
              <button
                onClick={() => onNavigate('fixtures')}
                className="p-3 rounded-lg bg-[#122131] border border-white/8 hover:border-amber-400/50 transition-all text-left group cursor-pointer"
              >
                <div className="w-7 h-7 rounded bg-amber-400/15 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                  Fixture Matrix
                </div>
                <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                  FDR tracker for next 6 GWs
                </div>
              </button>
            </div>
          </div>

          {/* Recent Insights Feed (Real-Time) */}
          <div className="rounded-xl bg-[#0d1c2d] border border-white/10 p-4 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white uppercase tracking-wider">
                    Recent Insights Feed
                  </span>
                </div>
                <span className="font-mono text-[10px] text-[#00FF87] bg-[#00FF87]/10 px-2 py-0.5 rounded font-bold border border-[#00FF87]/20">
                  Real-Time
                </span>
              </div>

              <div className="space-y-2.5">
                {insights.map((insight) => (
                  <div
                    key={insight.id}
                    onClick={() => onNavigate('insights')}
                    className="p-2.5 rounded-lg bg-[#122131] border border-white/8 hover:border-white/20 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-200 group-hover:text-white transition-colors truncate max-w-[240px]">
                        {insight.title}
                      </span>
                      <span
                        className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          insight.tagColor === 'green'
                            ? 'bg-[#00FF87]/15 text-[#00FF87]'
                            : insight.tagColor === 'cyan'
                            ? 'bg-[#38BDF8]/15 text-[#38BDF8]'
                            : insight.tagColor === 'amber'
                            ? 'bg-amber-400/15 text-amber-400'
                            : 'bg-rose-400/15 text-rose-400'
                        }`}
                      >
                        {insight.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {insight.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => onNavigate('insights')}
              className="mt-3 pt-2.5 border-t border-white/8 text-[11px] font-mono text-[#00FF87] hover:underline flex items-center justify-between cursor-pointer w-full"
            >
              <span>Explore All 24 Matchday Intel Reports</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Bottom Status / Live Operational Sync Bar */}
      <div className="rounded-xl bg-[#0d1c2d] border border-white/10 p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-[#00FF87]/15 text-[#00FF87] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-white">Live Operational Sync: </span>
            <span className="text-slate-400">
              FPL Official API, Fantasy Football Hub xG &amp; Premier League press briefings synced.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono shrink-0">
          <span className="text-slate-500 hidden md:inline">Server Cluster: EU-WEST-1</span>
          <button
            onClick={onOpenSimulation}
            className="text-[#00FF87] hover:text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Run Full Simulation</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
