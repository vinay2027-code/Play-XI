import React, { useState, useEffect } from 'react';
import {
  X,
  Zap,
  ArrowRightLeft,
  Check,
  Search,
  ChevronRight,
  TrendingUp,
  Shield,
  BarChart2,
  Sparkles,
} from 'lucide-react';
import { Player } from '../types/fpl';

// -------------------------------------------------------------
// 1. Full Player Compare Modal
// -------------------------------------------------------------
interface CompareModalProps {
  player1: Player;
  player2: Player;
  onClose: () => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  player1,
  player2,
  onClose,
}) => {
  const metrics = [
    { label: 'Market Cost', v1: `£${player1.cost.toFixed(1)}m`, v2: `£${player2.cost.toFixed(1)}m`, better: player1.cost < player2.cost ? 1 : 2 },
    { label: 'Season Points', v1: player1.points, v2: player2.points, better: player1.points > player2.points ? 1 : 2 },
    { label: 'Recent Form (L5)', v1: player1.form.toFixed(1), v2: player2.form.toFixed(1), better: player1.form > player2.form ? 1 : 2 },
    { label: 'Projected GW12', v1: `${player1.projGW12} xPts`, v2: `${player2.projGW12} xPts`, better: player1.projGW12 > player2.projGW12 ? 1 : 2 },
    { label: 'Expected Goal Inv (xGI)', v1: player1.xGI.toFixed(2), v2: player2.xGI.toFixed(2), better: player1.xGI > player2.xGI ? 1 : 2 },
    { label: 'Ownership', v1: `${player1.ownership}%`, v2: `${player2.ownership}%`, better: player1.ownership < player2.ownership ? 1 : 2 },
    { label: 'Value Score (pts/£m)', v1: player1.valueScore.toFixed(2), v2: player2.valueScore.toFixed(2), better: player1.valueScore > player2.valueScore ? 1 : 2 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-3xl rounded-2xl bg-[#0d1c2d] border border-white/12 shadow-2xl p-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/8 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00FF87]"></span>
            <h3 className="text-lg font-bold text-white font-sans">
              Head-to-Head Tactical Matrix
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md bg-[#162638] text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Players Top Headers */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Player 1 */}
          <div className="p-4 rounded-xl bg-[#122131] border border-white/8 text-center">
            <div className="text-xs font-mono text-[#00FF87] font-bold">
              {player1.role} • {player1.club}
            </div>
            <div className="text-xl font-bold text-white mt-1">{player1.name}</div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">{player1.fullName}</div>
          </div>

          {/* Player 2 */}
          <div className="p-4 rounded-xl bg-[#122131] border border-white/8 text-center">
            <div className="text-xs font-mono text-[#38BDF8] font-bold">
              {player2.role} • {player2.club}
            </div>
            <div className="text-xl font-bold text-white mt-1">{player2.name}</div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">{player2.fullName}</div>
          </div>
        </div>

        {/* Matrix Rows */}
        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {metrics.map((m, i) => (
            <div
              key={i}
              className="p-3 rounded-lg bg-[#162638]/70 border border-white/5 flex items-center justify-between text-xs"
            >
              <div
                className={`w-28 font-mono font-bold text-center ${
                  m.better === 1 ? 'text-[#00FF87]' : 'text-slate-300'
                }`}
              >
                {m.v1}
              </div>
              <div className="text-slate-400 font-medium text-center flex-1 px-2">
                {m.label}
              </div>
              <div
                className={`w-28 font-mono font-bold text-center ${
                  m.better === 2 ? 'text-[#38BDF8]' : 'text-slate-300'
                }`}
              >
                {m.v2}
              </div>
            </div>
          ))}
        </div>

        {/* Next Fixtures Comparison */}
        <div className="mt-5 pt-4 border-t border-white/8 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 font-mono text-[10px]">
            {player1.nextFixtures.map((f, i) => (
              <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-950 text-[#00FF87]">
                {f.opponent} ({f.isHome ? 'H' : 'A'}) {f.fdr}
              </span>
            ))}
          </div>

          <span className="text-slate-400 font-mono text-[11px]">Upcoming 3 FDR Run</span>

          <div className="flex items-center gap-1 font-mono text-[10px]">
            {player2.nextFixtures.map((f, i) => (
              <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-950 text-[#38BDF8]">
                {f.opponent} ({f.isHome ? 'H' : 'A'}) {f.fdr}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 2. Monte Carlo Full Simulation Modal
// -------------------------------------------------------------
interface SimulationModalProps {
  onClose: () => void;
  onApplyOptimization: () => void;
}

export const SimulationModal: React.FC<SimulationModalProps> = ({
  onClose,
  onApplyOptimization,
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    'Initializing Monte Carlo engine with 10,000 fixture paths...',
    'Factoring expected minutes & penalty/set-piece hierarchy...',
    'Running fixture difficulty weighting and defense volatility...',
    'Testing armband multiplier permutations (Halvorsen vs Palmer)...',
    'Solver complete: Converged on optimal 3-4-3 shape (+7.4 xPts ceiling).',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        const next = prev + 12;
        if (next > 20 && next < 40) setCurrentStep(1);
        if (next >= 40 && next < 65) setCurrentStep(2);
        if (next >= 65 && next < 90) setCurrentStep(3);
        if (next >= 90) setCurrentStep(4);
        return next > 100 ? 100 : next;
      });
    }, 280);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-[#0d1c2d] border border-[#00FF87]/30 shadow-2xl p-6">
        <div className="flex items-center justify-between border-b border-white/8 pb-3 mb-5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00FF87] animate-pulse"></span>
            <h3 className="text-base font-bold text-white font-sans">
              Tactical Monte Carlo Simulation
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-[#162638] text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Display */}
        <div className="space-y-4 my-4">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Simulation Status</span>
            <span className="text-[#00FF87] font-bold">{Math.min(100, progress)}%</span>
          </div>

          <div className="w-full h-2 rounded-full bg-[#162638] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00FF87] to-[#38BDF8] rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, progress)}%` }}
            ></div>
          </div>

          {/* Step Log Box */}
          <div className="p-3.5 rounded-lg bg-[#051424] border border-white/8 font-mono text-xs space-y-1.5 min-h-[90px]">
            <div className="text-slate-500 text-[10px] uppercase">Execution Log:</div>
            <div className="text-[#00FF87] font-medium leading-relaxed">
              &gt; {steps[currentStep]}
            </div>
          </div>
        </div>

        {progress >= 100 && (
          <div className="p-3 rounded-lg bg-[#00FF87]/15 border border-[#00FF87]/30 text-xs font-mono text-white mb-5 animate-in fade-in">
            <div className="font-bold text-[#00FF87] mb-1">
              ✓ Optimal Solution Found (GW12)
            </div>
            <div>Projected squad points boosted to <strong>68.4 xPts</strong> (+7.4 pts).</div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/8">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#162638] text-slate-300 hover:text-white text-xs font-medium cursor-pointer"
          >
            Cancel
          </button>
          <button
            disabled={progress < 100}
            onClick={() => {
              onApplyOptimization();
              onClose();
            }}
            className="px-5 py-2 rounded-lg bg-[#00FF87] hover:bg-[#00e478] text-[#051424] font-extrabold text-xs transition-all shadow-lg shadow-[#00FF87]/20 disabled:opacity-40 cursor-pointer"
          >
            Apply Optimal XI
          </button>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 3. Swap Asset / Player Replacement Modal
// -------------------------------------------------------------
interface SwapPlayerModalProps {
  playerToSwap?: Player;
  allPlayers: Player[];
  onSelectReplacement: (replacement: Player) => void;
  onClose: () => void;
}

export const SwapPlayerModal: React.FC<SwapPlayerModalProps> = ({
  playerToSwap,
  allPlayers,
  onSelectReplacement,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const candidates = allPlayers.filter((p) => {
    if (playerToSwap && p.role !== playerToSwap.role) return false;
    if (playerToSwap && p.id === playerToSwap.id) return false;
    if (!searchTerm) return true;
    return (
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.club.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-[#0d1c2d] border border-white/12 shadow-2xl p-6">
        <div className="flex items-center justify-between border-b border-white/8 pb-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-white font-sans">
              Swap Asset: {playerToSwap ? playerToSwap.name : 'Select Player'}
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Role: {playerToSwap?.role || 'ANY'} • Budget Cap: £{playerToSwap?.cost.toFixed(1)}m
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-[#162638] text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search replacement asset..."
            className="w-full bg-[#162638] border border-white/10 rounded-md pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#00FF87]"
          />
        </div>

        {/* Candidates list */}
        <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
          {candidates.map((c) => (
            <div
              key={c.id}
              onClick={() => {
                onSelectReplacement(c);
                onClose();
              }}
              className="p-2.5 rounded-lg bg-[#162638]/80 hover:bg-[#203750] border border-white/5 hover:border-[#00FF87]/40 flex items-center justify-between text-xs cursor-pointer transition-colors"
            >
              <div>
                <div className="font-bold text-white">{c.name}</div>
                <div className="text-[10px] font-mono text-slate-400">
                  {c.club} • {c.role} • Form: {c.form}
                </div>
              </div>
              <div className="text-right font-mono">
                <div className="font-bold text-[#00FF87]">£{c.cost.toFixed(1)}m</div>
                <div className="text-[10px] text-slate-400">{c.projGW12} xPts</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 4. Command Palette (Cmd + K)
// -------------------------------------------------------------
interface CommandPaletteProps {
  allPlayers: Player[];
  onSelectPlayer: (player: Player) => void;
  onNavigate: (screen: string) => void;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  allPlayers,
  onSelectPlayer,
  onNavigate,
  onClose,
}) => {
  const [query, setQuery] = useState('');

  const filtered = allPlayers
    .filter(
      (p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.club.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 6);

  const screens = [
    { id: 'dashboard', label: 'Operational Cockpit (Dashboard)' },
    { id: 'build', label: 'Build XI (Squad Optimizer AI)' },
    { id: 'players', label: 'Player Explorer & Analytics' },
    { id: 'fixtures', label: 'Fixture Difficulty Matrix' },
    { id: 'transfers', label: 'Transfer Planner' },
    { id: 'insights', label: 'Tactical Intel & Radar' },
  ].filter((s) => s.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl rounded-2xl bg-[#0d1c2d] border border-white/15 shadow-2xl overflow-hidden">
        {/* Search header */}
        <div className="p-3 border-b border-white/8 flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400 ml-2" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, screen, or player name..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none font-sans"
          />
          <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-3">
          {/* Screens */}
          {screens.length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-2 py-1">
                Navigation Screens
              </div>
              {screens.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    onNavigate(s.id);
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-xs text-slate-300 hover:bg-[#162638] hover:text-white flex items-center justify-between"
                >
                  <span>{s.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
              ))}
            </div>
          )}

          {/* Players */}
          {filtered.length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-2 py-1">
                Premier League Assets
              </div>
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelectPlayer(p);
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-xs text-slate-200 hover:bg-[#162638] hover:text-[#00FF87] flex items-center justify-between font-mono"
                >
                  <div>
                    <span className="font-bold text-white">{p.name}</span>
                    <span className="text-slate-400 ml-2">({p.club} • {p.role})</span>
                  </div>
                  <span className="font-bold text-[#00FF87]">£{p.cost.toFixed(1)}m</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
