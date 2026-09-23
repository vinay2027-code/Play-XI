import React from 'react';
import { Shield, Sparkles, Shirt, ArrowRightLeft, Crown, ChevronUp, ChevronDown } from 'lucide-react';
import { Player } from '../types/fpl';

interface PitchViewProps {
  mode: 'dashboard' | 'build';
  formation: string;
  startingXI: {
    gk: Player[];
    def: Player[];
    mid: Player[];
    fwd: Player[];
  };
  bench: Player[];
  captainId: string;
  viceCaptainId: string;
  onSelectPlayer?: (player: Player) => void;
  onMakeCaptain?: (player: Player) => void;
  onMakeViceCaptain?: (player: Player) => void;
  onSwapPlayer?: (player: Player) => void;
  onReorderBench?: () => void;
}

export const PitchView: React.FC<PitchViewProps> = ({
  mode,
  formation,
  startingXI,
  bench,
  captainId,
  viceCaptainId,
  onSelectPlayer,
  onMakeCaptain,
  onMakeViceCaptain,
  onSwapPlayer,
  onReorderBench,
}) => {
  return (
    <div className="relative rounded-xl bg-[#091726] border border-white/10 overflow-hidden shadow-2xl flex flex-col">
      {/* Top Banner / Pitch Header */}
      <div className="px-4 py-3 border-b border-white/8 bg-[#0d1c2d]/80 flex items-center justify-between text-xs">
        {mode === 'dashboard' ? (
          <>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00FF87]"></span>
              <span className="font-bold text-white uppercase tracking-wider font-sans">
                My Starting XI Preview (GW12)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#162638] text-slate-300 border border-white/10 font-bold">
                {formation}
              </span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#00FF87]/15 text-[#00FF87] border border-[#00FF87]/30 font-extrabold">
                61 xPts
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  Active Pitch:
                </span>
                <span className="font-mono text-xs font-bold text-[#00FF87] bg-[#00FF87]/15 px-2 py-0.5 rounded border border-[#00FF87]/30">
                  {formation}
                </span>
              </div>
              <span className="text-slate-600 hidden sm:inline">|</span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Hover position chips to inspect tactical lane delta
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00FF87]"></span>
                <span>Home Fav</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#38BDF8]"></span>
                <span>Away</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Graphical Pitch Surface */}
      <div className="relative p-4 sm:p-6 min-h-[460px] sm:min-h-[500px] flex flex-col justify-between bg-gradient-to-b from-[#051829] via-[#072036] to-[#051829] pitch-stripes tactical-grid overflow-hidden">
        {/* SVG Pitch Markings */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none stroke-white/10"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Pitch Outer Line */}
          <rect x="16" y="16" width="calc(100% - 32px)" height="calc(100% - 32px)" fill="none" strokeWidth="1.5" rx="8" />
          {/* Halfway Line */}
          <line x1="16" y1="50%" x2="calc(100% - 16px)" y2="50%" strokeWidth="1.5" strokeDasharray="4 4" />
          {/* Center Circle */}
          <circle cx="50%" cy="50%" r="55" fill="none" strokeWidth="1.5" />
          <circle cx="50%" cy="50%" r="3" fill="rgba(255,255,255,0.2)" />
          {/* Penalty Box Top */}
          <rect x="calc(50% - 85px)" y="16" width="170" height="75" fill="none" strokeWidth="1.5" />
          {/* Goal Box Top */}
          <rect x="calc(50% - 45px)" y="16" width="90" height="28" fill="none" strokeWidth="1.5" />
          {/* Penalty Box Bottom */}
          <rect x="calc(50% - 85px)" y="calc(100% - 91px)" width="170" height="75" fill="none" strokeWidth="1.5" />
          {/* Goal Box Bottom */}
          <rect x="calc(50% - 45px)" y="calc(100% - 44px)" width="90" height="28" fill="none" strokeWidth="1.5" />
        </svg>

        {/* Tactical Coordinate Grid Marks */}
        <div className="absolute top-8 left-8 text-white/10 font-mono text-[9px] pointer-events-none">+ L-01</div>
        <div className="absolute top-8 right-8 text-white/10 font-mono text-[9px] pointer-events-none">+ R-01</div>
        <div className="absolute bottom-8 left-8 text-white/10 font-mono text-[9px] pointer-events-none">+ L-99</div>
        <div className="absolute bottom-8 right-8 text-white/10 font-mono text-[9px] pointer-events-none">+ R-99</div>

        {/* FORWARD ROW (or Goalkeeper if top-down, let's match Screenshot 1 and 2):
            Screenshot 1 (Dashboard) shows:
            Top: FWD (Isak, Halvorsen, Watkins)
            2nd: MID (Saka, Palmer, Salah, De Bruin)
            3rd: DEF (Gabriel, Gvardiol, Porro)
            Bottom: GK (Raya)
            Screenshot 2 (Build XI) shows:
            Top: GK (E. Vance)
            2nd: DEF (M. Avenel, T. Castille, Romero-Sv.)
            3rd: MID (De Bruin, L. Nordin, Saka-Bell., Kudus-Reid)
            Bottom: FWD (E. Halvorsen, Watkins-C., Isak-Larsson)
            We support both layouts gracefully based on mode!
        */}

        {mode === 'dashboard' ? (
          <>
            {/* Dashboard: FWDs at top */}
            <div className="flex justify-around items-center z-10 py-1">
              {startingXI.fwd.map((player) => (
                <PlayerPitchCard
                  key={player.id}
                  player={player}
                  isCaptain={player.id === captainId}
                  isViceCaptain={player.id === viceCaptainId}
                  mode={mode}
                  onSelect={() => onSelectPlayer?.(player)}
                  onSwap={() => onSwapPlayer?.(player)}
                />
              ))}
            </div>

            {/* Dashboard: MIDs */}
            <div className="flex justify-around items-center z-10 py-1">
              {startingXI.mid.map((player) => (
                <PlayerPitchCard
                  key={player.id}
                  player={player}
                  isCaptain={player.id === captainId}
                  isViceCaptain={player.id === viceCaptainId}
                  mode={mode}
                  onSelect={() => onSelectPlayer?.(player)}
                  onSwap={() => onSwapPlayer?.(player)}
                />
              ))}
            </div>

            {/* Dashboard: DEFs */}
            <div className="flex justify-around items-center z-10 py-1">
              {startingXI.def.map((player) => (
                <PlayerPitchCard
                  key={player.id}
                  player={player}
                  isCaptain={player.id === captainId}
                  isViceCaptain={player.id === viceCaptainId}
                  mode={mode}
                  onSelect={() => onSelectPlayer?.(player)}
                  onSwap={() => onSwapPlayer?.(player)}
                />
              ))}
            </div>

            {/* Dashboard: GK at bottom */}
            <div className="flex justify-center items-center z-10 py-1">
              {startingXI.gk.map((player) => (
                <PlayerPitchCard
                  key={player.id}
                  player={player}
                  isCaptain={player.id === captainId}
                  isViceCaptain={player.id === viceCaptainId}
                  mode={mode}
                  onSelect={() => onSelectPlayer?.(player)}
                  onSwap={() => onSwapPlayer?.(player)}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Build XI: GK at top */}
            <div className="flex justify-center items-center z-10 py-1">
              {startingXI.gk.map((player) => (
                <PlayerPitchCard
                  key={player.id}
                  player={player}
                  isCaptain={player.id === captainId}
                  isViceCaptain={player.id === viceCaptainId}
                  mode={mode}
                  onSelect={() => onSelectPlayer?.(player)}
                  onSwap={() => onSwapPlayer?.(player)}
                />
              ))}
            </div>

            {/* Build XI: DEFs */}
            <div className="flex justify-around items-center z-10 py-1">
              {startingXI.def.map((player) => (
                <PlayerPitchCard
                  key={player.id}
                  player={player}
                  isCaptain={player.id === captainId}
                  isViceCaptain={player.id === viceCaptainId}
                  mode={mode}
                  onSelect={() => onSelectPlayer?.(player)}
                  onSwap={() => onSwapPlayer?.(player)}
                />
              ))}
            </div>

            {/* Build XI: MIDs */}
            <div className="flex justify-around items-center z-10 py-1">
              {startingXI.mid.map((player) => (
                <PlayerPitchCard
                  key={player.id}
                  player={player}
                  isCaptain={player.id === captainId}
                  isViceCaptain={player.id === viceCaptainId}
                  mode={mode}
                  onSelect={() => onSelectPlayer?.(player)}
                  onSwap={() => onSwapPlayer?.(player)}
                />
              ))}
            </div>

            {/* Build XI: FWDs at bottom */}
            <div className="flex justify-around items-center z-10 py-1">
              {startingXI.fwd.map((player) => (
                <PlayerPitchCard
                  key={player.id}
                  player={player}
                  isCaptain={player.id === captainId}
                  isViceCaptain={player.id === viceCaptainId}
                  mode={mode}
                  onSelect={() => onSelectPlayer?.(player)}
                  onSwap={() => onSwapPlayer?.(player)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bench Section */}
      {mode === 'dashboard' ? (
        <div className="px-4 py-3 bg-[#0d1c2d] border-t border-white/8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-semibold tracking-wider uppercase text-[11px]">
              BENCH SUB RESERVE:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {bench.map((b, i) => (
                <span
                  key={b.id}
                  onClick={() => onSelectPlayer?.(b)}
                  className="px-2 py-1 rounded bg-[#162638] text-slate-200 border border-white/8 hover:border-[#00FF87]/40 cursor-pointer text-[11px]"
                >
                  {b.shortName} {b.role === 'GKP' ? '(GK)' : ''}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1 text-[#00FF87]">
              <span className="w-4 h-4 rounded-full bg-[#00FF87] text-[#051424] font-black flex items-center justify-center text-[10px]">
                C
              </span>
              <span>Halvorsen</span>
            </div>
            <div className="flex items-center gap-1 text-[#38BDF8]">
              <span className="w-4 h-4 rounded-full bg-[#38BDF8] text-[#051424] font-black flex items-center justify-center text-[10px]">
                V
              </span>
              <span>Palmer</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 py-3 bg-[#0d1c2d] border-t border-white/8">
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                TACTICAL BENCH
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                (Auto-substitution order: 1 -&gt; 2 -&gt; 3)
              </span>
            </div>
            <button
              onClick={onReorderBench}
              className="flex items-center gap-1.5 text-[11px] font-mono text-[#00FF87] hover:underline cursor-pointer"
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span>Reorder Sub Priority</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {bench.map((b, index) => {
              const label = index === 0 ? 'GK2' : index === 1 ? '1st' : index === 2 ? '2nd' : '3rd';
              return (
                <div
                  key={b.id}
                  onClick={() => onSelectPlayer?.(b)}
                  className="p-2 rounded-md bg-[#162638]/90 border border-white/8 hover:border-[#00FF87]/50 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/40 text-[#00FF87]">
                      {label}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-white truncate max-w-[90px]">
                        {b.shortName}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        £{b.cost.toFixed(1)}m • {b.nextFixtures[0]?.opponent} ({b.nextFixtures[0]?.isHome ? 'H' : 'A'})
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-[#00FF87]">
                      {b.projGW12}
                    </div>
                    <div className="text-[9px] font-mono text-slate-400">xP</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

interface PlayerPitchCardProps {
  player: Player;
  isCaptain: boolean;
  isViceCaptain: boolean;
  mode: 'dashboard' | 'build';
  onSelect: () => void;
  onSwap: () => void;
}

const PlayerPitchCard: React.FC<PlayerPitchCardProps> = ({
  player,
  isCaptain,
  isViceCaptain,
  mode,
  onSelect,
  onSwap,
}) => {
  const nextFixture = player.nextFixtures[0];
  const fixtureStr = nextFixture
    ? `${nextFixture.opponent} (${nextFixture.isHome ? 'H' : 'A'})`
    : 'BYE';

  // Role icon color
  const roleColor =
    player.role === 'GKP'
      ? 'text-amber-400 bg-amber-400/10 border-amber-400/30'
      : player.role === 'DEF'
      ? 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30'
      : player.role === 'MID'
      ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
      : 'text-rose-400 bg-rose-400/10 border-rose-400/30';

  const ptsDisplay = isCaptain ? (player.projGW12 * 2).toFixed(1) : player.projGW12.toFixed(1);

  return (
    <div
      onClick={onSelect}
      className={`relative group cursor-pointer transition-all duration-200 transform hover:scale-105 select-none ${
        isCaptain ? 'z-20' : 'z-10'
      }`}
    >
      {/* Captain / Vice Captain Floating Badge */}
      {isCaptain && (
        <div className="absolute -top-2.5 -right-2 w-5 h-5 rounded-full bg-[#00FF87] text-[#051424] font-black text-[10px] flex items-center justify-center shadow-lg shadow-[#00FF87]/50 ring-2 ring-[#051424] z-30">
          C
        </div>
      )}
      {isViceCaptain && !isCaptain && (
        <div className="absolute -top-2.5 -right-2 w-5 h-5 rounded-full bg-[#38BDF8] text-[#051424] font-black text-[10px] flex items-center justify-center shadow-lg shadow-[#38BDF8]/50 ring-2 ring-[#051424] z-30">
          V
        </div>
      )}

      {/* Card Body */}
      <div
        className={`w-24 sm:w-28 p-2 rounded-lg backdrop-blur-md transition-all ${
          isCaptain
            ? 'bg-[#0d2238]/95 border-2 border-[#00FF87] glow-green'
            : isViceCaptain
            ? 'bg-[#0d2238]/95 border-2 border-[#38BDF8] glow-cyan'
            : 'bg-[#0b1b2d]/85 border border-white/12 hover:border-white/30 hover:bg-[#10243d]'
        }`}
      >
        {/* Role & Jersey Icon Area */}
        <div className="flex items-center justify-between mb-1">
          <div className={`w-5 h-5 rounded flex items-center justify-center border ${roleColor}`}>
            {player.role === 'GKP' ? (
              <Shield className="w-3 h-3" />
            ) : (
              <Shirt className="w-3 h-3" />
            )}
          </div>
          <span className="font-mono text-[9px] font-bold text-slate-400">
            {player.club}
          </span>
        </div>

        {/* Player Name */}
        <div className="text-xs font-bold text-white truncate text-center font-sans tracking-tight">
          {player.shortName}
        </div>

        {/* Club & Fixture line */}
        <div className="text-[10px] font-mono text-slate-300 text-center truncate mt-0.5">
          {mode === 'dashboard' ? (
            <span>{fixtureStr}</span>
          ) : (
            <span>
              {fixtureStr} • £{player.cost.toFixed(1)}m
            </span>
          )}
        </div>

        {/* Points / xPts Indicator */}
        <div className="mt-1.5 pt-1 border-t border-white/8 flex items-center justify-between">
          <span className="font-mono text-[10px] text-slate-400">
            {isCaptain ? '2X CAP' : 'xP'}
          </span>
          <span
            className={`font-mono text-xs font-black ${
              isCaptain ? 'text-[#00FF87]' : 'text-slate-100'
            }`}
          >
            {ptsDisplay}
            {mode === 'dashboard' && !isCaptain && ' pts'}
          </span>
        </div>
      </div>
    </div>
  );
};
