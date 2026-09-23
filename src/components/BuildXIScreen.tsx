import React, { useState } from 'react';
import {
  Wand2,
  RotateCcw,
  Wallet,
  PieChart,
  CheckCircle,
  TrendingUp,
  Zap,
  ArrowRightLeft,
  RotateCw,
  BookmarkCheck,
  ShieldAlert,
  Percent,
  Activity,
  Sliders,
} from 'lucide-react';
import { Player, Formation, TargetProfile } from '../types/fpl';
import { PitchView } from './PitchView';

interface BuildXIScreenProps {
  onOpenSimulation: () => void;
  onOpenSwapModal: (player?: Player) => void;
  onSelectPlayer: (player: Player) => void;
  startingXI: {
    gk: Player[];
    def: Player[];
    mid: Player[];
    fwd: Player[];
  };
  bench: Player[];
  onAutoPick: () => void;
  onReset: () => void;
  onSave: () => void;
}

export const BuildXIScreen: React.FC<BuildXIScreenProps> = ({
  onOpenSimulation,
  onOpenSwapModal,
  onSelectPlayer,
  startingXI,
  bench,
  onAutoPick,
  onReset,
  onSave,
}) => {
  const [formation, setFormation] = useState<Formation>('3-4-3');
  const [profile, setProfile] = useState<TargetProfile>('Balanced');
  const [captainId, setCaptainId] = useState('halvorsen');
  const [viceCaptainId, setViceCaptainId] = useState('watkins');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  const shapes: Formation[] = ['3-4-3', '3-5-2', '4-3-3', '4-4-2', '4-5-1'];
  const profiles: TargetProfile[] = ['Balanced', 'High Upside', 'Value Focused', 'Differential'];

  const handleOptimizeClick = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
      onOpenSimulation();
    }, 400);
  };

  const handleSaveClick = () => {
    onSave();
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-5">
      {/* 1. Sub-Header Filter Controls: SHAPE & TARGET PROFILE */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* SHAPE Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
            SHAPE
          </span>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0d1c2d] border border-white/8">
            {shapes.map((s) => (
              <button
                key={s}
                onClick={() => setFormation(s)}
                className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                  formation === s
                    ? 'bg-[#00FF87] text-[#051424] shadow-md shadow-[#00FF87]/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* TARGET PROFILE Selector & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              TARGET PROFILE
            </span>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0d1c2d] border border-white/8">
              {profiles.map((p) => (
                <button
                  key={p}
                  onClick={() => setProfile(p)}
                  className={`px-3 py-1 rounded text-xs font-sans font-medium transition-all cursor-pointer ${
                    profile === p
                      ? 'bg-[#162638] text-white font-bold border border-white/10'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onAutoPick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0d1c2d] border border-white/10 hover:border-[#00FF87]/40 text-[#00FF87] text-xs font-semibold transition-all cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Auto-Pick</span>
            </button>
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0d1c2d] border border-white/10 hover:border-white/20 text-slate-300 text-xs font-medium transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Four Stat Indicator Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Cap */}
        <div className="p-3.5 rounded-xl bg-[#0d1c2d] border border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#162638] text-slate-300 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              TOTAL CAP
            </div>
            <div className="text-sm sm:text-base font-mono font-bold text-white">£100.0m</div>
          </div>
        </div>

        {/* Active Squad Value */}
        <div className="p-3.5 rounded-xl bg-[#0d1c2d] border border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#162638] text-[#38BDF8] flex items-center justify-center">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              ACTIVE SQUAD VALUE
            </div>
            <div className="text-sm sm:text-base font-mono font-bold text-white">£99.2m</div>
          </div>
        </div>

        {/* In The Bank (ITB) */}
        <div className="p-3.5 rounded-xl bg-[#0d1c2d] border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#00FF87]/15 text-[#00FF87] flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                IN THE BANK (ITB)
              </div>
              <div className="text-sm sm:text-base font-mono font-bold text-[#00FF87]">£0.8m</div>
            </div>
          </div>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#00FF87]/15 text-[#00FF87] font-bold border border-[#00FF87]/30">
            COMPLIANT
          </span>
        </div>

        {/* Projected GW12 */}
        <div className="p-3.5 rounded-xl bg-[#0d1c2d] border border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#00FF87]/15 text-[#00FF87] flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              PROJECTED GW12
            </div>
            <div className="text-sm sm:text-base font-mono font-black text-white flex items-baseline gap-1">
              <span className="text-[#00FF87]">68.4</span>
              <span className="text-xs text-slate-400">xPts</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Workspace: Tactical Pitch (Left 8 Cols) + Right Inspector Drawer (Right 4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Pitch */}
        <div className="lg:col-span-8">
          <PitchView
            mode="build"
            formation={formation}
            startingXI={startingXI}
            bench={bench}
            captainId={captainId}
            viceCaptainId={viceCaptainId}
            onSelectPlayer={onSelectPlayer}
            onSwapPlayer={(p) => onOpenSwapModal(p)}
          />
        </div>

        {/* Right Column: Tactical Inspector Panel */}
        <div className="lg:col-span-4 space-y-5">
          {/* Squad Optimizer AI Action Card */}
          <div className="rounded-xl bg-[#0d1c2d] border border-white/10 p-5 space-y-4">
            <div className="flex items-center justify-between text-xs border-b border-white/8 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00FF87] animate-pulse"></span>
                <span className="font-mono text-[11px] font-bold text-white uppercase tracking-wider">
                  TACTICAL ENGINE V2.4
                </span>
              </div>
              <span className="font-mono text-[11px] text-slate-400 bg-[#162638] px-2 py-0.5 rounded">
                GW12 Calibration
              </span>
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-white font-sans tracking-tight">
                SQUAD OPTIMIZER AI
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Monte Carlo simulation running against 480 Premier League assets. Solves for maximum fixture swing advantage through Gameweek 15.
              </p>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={handleOptimizeClick}
              disabled={isOptimizing}
              className="w-full py-3.5 px-4 rounded-xl bg-[#00FF87] hover:bg-[#00e478] text-[#051424] font-extrabold text-sm flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] shadow-xl shadow-[#00FF87]/20 cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-[#051424]" />
              <span className="tracking-wide">
                {isOptimizing ? 'RUNNING SIMULATION...' : '⚡⚡ OPTIMIZE XI'}
              </span>
            </button>

            {/* Sub Actions Row */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onOpenSwapModal()}
                className="py-2 px-2 rounded-lg bg-[#162638] hover:bg-[#1f334a] text-slate-200 hover:text-white border border-white/8 text-xs font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">Swap Asset</span>
              </button>
              <button
                onClick={onAutoPick}
                className="py-2 px-2 rounded-lg bg-[#162638] hover:bg-[#1f334a] text-slate-200 hover:text-white border border-white/8 text-xs font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">Rebuild</span>
              </button>
              <button
                onClick={handleSaveClick}
                className="py-2 px-2 rounded-lg bg-[#162638] hover:bg-[#1f334a] text-[#00FF87] border border-[#00FF87]/20 text-xs font-bold flex flex-col items-center gap-1 transition-colors cursor-pointer"
              >
                <BookmarkCheck className="w-3.5 h-3.5 text-[#00FF87]" />
                <span className="truncate">Save XI</span>
              </button>
            </div>

            {saveToast && (
              <div className="p-2 rounded bg-[#00FF87]/20 border border-[#00FF87]/40 text-[#00FF87] text-xs font-mono text-center animate-in fade-in">
                ✓ Squad saved to active profile!
              </div>
            )}
          </div>

          {/* Decision Vector Matrix */}
          <div className="rounded-xl bg-[#0d1c2d] border border-white/10 p-5 space-y-4">
            <div className="flex items-center justify-between text-xs border-b border-white/8 pb-3">
              <span className="font-bold text-white uppercase tracking-wider font-sans">
                DECISION VECTOR MATRIX
              </span>
              <span className="font-mono text-[10px] text-[#00FF87] bg-[#00FF87]/10 px-2 py-0.5 rounded font-bold">
                Rank: Top 5%
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Metric 1: Fixture Difficulty Rating */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-slate-200 font-semibold">Fixture Difficulty Rating</div>
                  <div className="text-[10px] text-slate-400">Average schedule resistance</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    <span className="w-3 h-3 rounded-xs bg-[#00FF87] text-[8px] font-mono font-bold text-[#051424] flex items-center justify-center">
                      1
                    </span>
                    <span className="w-3 h-3 rounded-xs bg-[#00FF87] text-[8px] font-mono font-bold text-[#051424] flex items-center justify-center">
                      2
                    </span>
                    <span className="w-3 h-3 rounded-xs bg-slate-600 text-[8px] font-mono font-bold text-white flex items-center justify-center">
                      3
                    </span>
                  </div>
                  <span className="font-mono font-bold text-white">2.4 / 5</span>
                </div>
              </div>

              {/* Metric 2: Capital Utilization */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-slate-200 font-semibold">Capital Utilization</div>
                  <div className="text-[10px] text-slate-400">Points generated per £1.0m invested</div>
                </div>
                <span className="font-mono font-bold text-white">94.2%</span>
              </div>

              {/* Metric 3: Squad Volatility */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-slate-200 font-semibold">Squad Volatility</div>
                  <div className="text-[10px] text-slate-400">Minutes rotation &amp; injury liability</div>
                </div>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-amber-400/15 text-amber-400 font-bold border border-amber-400/30">
                  LOW-MED
                </span>
              </div>

              {/* Metric 4: Armband Model Confidence */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <div className="text-slate-200 font-semibold">Armband Model Confidence</div>
                    <div className="text-[10px] text-slate-400">E. Halvorsen vs NWC (H)</div>
                  </div>
                  <span className="font-mono font-bold text-[#00FF87]">88%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#162638] overflow-hidden">
                  <div className="h-full bg-[#00FF87] rounded-full w-[88%]"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Run Ticker (GW12 - GW14) */}
          <div className="rounded-xl bg-[#0d1c2d] border border-white/10 p-5 space-y-3">
            <div className="flex items-center justify-between text-xs border-b border-white/8 pb-2">
              <span className="font-bold text-white uppercase tracking-wider font-sans">
                UPCOMING RUN TICKER
              </span>
              <span className="font-mono text-[10px] text-slate-400">GW12 - GW14</span>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* Halvorsen run */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00FF87]"></span>
                  <span className="font-semibold text-white">E. Halvo...</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-[10px]">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-[#00FF87] border border-emerald-800">
                    NWC (H) 2
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    TOT (A) 3
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-[#00FF87] border border-emerald-800">
                    IPS (H) 1
                  </span>
                </div>
              </div>

              {/* Saka run */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                  <span className="font-semibold text-white">Saka-Bel...</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-[10px]">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-[#00FF87] border border-emerald-800">
                    NFO (H) 2
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    WHU (A) 3
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                    MUN (H) 4
                  </span>
                </div>
              </div>

              {/* Romero run */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span className="font-semibold text-white">Romero-...</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-[10px]">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-[#00FF87] border border-emerald-800">
                    FUL (H) 2
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-[#00FF87] border border-emerald-800">
                    BOU (A) 2
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    CHE (H) 3
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
