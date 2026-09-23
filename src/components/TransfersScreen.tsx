import React, { useState } from 'react';
import { ArrowLeftRight, TrendingUp, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { Player } from '../types/fpl';

interface TransfersScreenProps {
  players: Player[];
  budgetRemaining: number;
}

export const TransfersScreen: React.FC<TransfersScreenProps> = ({
  players,
  budgetRemaining,
}) => {
  const [playerOut, setPlayerOut] = useState<Player | null>(players.find((p) => p.id === 'trent') || null);
  const [playerIn, setPlayerIn] = useState<Player | null>(players.find((p) => p.id === 'gabriel') || null);
  const [transfersCount, setTransfersCount] = useState(1);
  const freeTransfers = 1;

  const costDifference = (playerOut ? playerOut.cost : 0) - (playerIn ? playerIn.cost : 0);
  const newBudget = budgetRemaining + costDifference;
  const pointHit = Math.max(0, (transfersCount - freeTransfers) * 4);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1">
          <span className="text-[#00FF87] font-bold">FINANCIAL &amp; SQUAD ENGINE</span>
          <span>/</span>
          <span>GW12 Deadline</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-sans tracking-tight">
          TRANSFER PLANNER &amp; BUDGET SOLVER
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Model asset replacements, project immediate GW12 point swing, and prevent price drop losses.
        </p>
      </div>

      {/* Transfer Swap Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Outgoing Asset (Sell) */}
        <div className="lg:col-span-5 p-5 rounded-xl bg-[#0d1c2d] border border-white/10 space-y-4">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-rose-400 font-bold uppercase tracking-wider">OUTGOING ASSET (SELL)</span>
            <span className="text-slate-400">Current Squad</span>
          </div>

          <div className="p-4 rounded-lg bg-[#162638] border border-rose-500/30">
            {playerOut ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">{playerOut.name}</div>
                  <div className="text-xs font-mono text-slate-400">
                    {playerOut.club} • {playerOut.role} • £{playerOut.cost.toFixed(1)}m
                  </div>
                  {playerOut.status === 'doubt' && (
                    <div className="text-[10px] text-amber-400 font-mono mt-1">
                      ⚠️ 75% Doubt (Hamstring stiffness)
                    </div>
                  )}
                </div>
                <div className="text-right font-mono">
                  <div className="text-base font-bold text-rose-400">-£{playerOut.cost.toFixed(1)}m</div>
                  <div className="text-[10px] text-slate-400">Sales value</div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400">Select player to transfer out</div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-400">Change outgoing player:</label>
            <select
              value={playerOut?.id || ''}
              onChange={(e) => setPlayerOut(players.find((p) => p.id === e.target.value) || null)}
              className="w-full bg-[#122131] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#00FF87]"
            >
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.club} • £{p.cost.toFixed(1)}m)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center Transfer Arrow / Delta */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center gap-3 p-4 rounded-xl bg-[#0d1c2d] border border-white/8 text-center font-mono">
          <div className="w-10 h-10 rounded-full bg-[#00FF87]/15 text-[#00FF87] flex items-center justify-center">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <div className="text-slate-400 text-[10px]">BUDGET IMPACT</div>
            <div className={`text-base font-bold ${costDifference >= 0 ? 'text-[#00FF87]' : 'text-rose-400'}`}>
              {costDifference >= 0 ? `+£${costDifference.toFixed(1)}m` : `-£${Math.abs(costDifference).toFixed(1)}m`}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 border-t border-white/10 pt-2 w-full">
            Hit: <strong className={pointHit > 0 ? 'text-rose-400' : 'text-[#00FF87]'}>-{pointHit} pts</strong>
          </div>
        </div>

        {/* Incoming Asset (Buy) */}
        <div className="lg:col-span-5 p-5 rounded-xl bg-[#0d1c2d] border border-white/10 space-y-4">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#00FF87] font-bold uppercase tracking-wider">INCOMING ASSET (BUY)</span>
            <span className="text-slate-400">Target Market</span>
          </div>

          <div className="p-4 rounded-lg bg-[#162638] border border-[#00FF87]/30">
            {playerIn ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">{playerIn.name}</div>
                  <div className="text-xs font-mono text-slate-400">
                    {playerIn.club} • {playerIn.role} • £{playerIn.cost.toFixed(1)}m
                  </div>
                  <div className="text-[10px] text-[#00FF87] font-mono mt-1">
                    🎯 Proj GW12: {playerIn.projGW12} xPts
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-base font-bold text-[#00FF87]">+£{playerIn.cost.toFixed(1)}m</div>
                  <div className="text-[10px] text-slate-400">Purchase cost</div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400">Select player to transfer in</div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-400">Select replacement target:</label>
            <select
              value={playerIn?.id || ''}
              onChange={(e) => setPlayerIn(players.find((p) => p.id === e.target.value) || null)}
              className="w-full bg-[#122131] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#00FF87]"
            >
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.club} • £{p.cost.toFixed(1)}m • {p.projGW12} xP)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Confirmation & Bank Status */}
      <div className="p-5 rounded-xl bg-[#0d1c2d] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-400 block text-[10px]">NEW BANK BALANCE:</span>
            <span className={`text-base font-bold ${newBudget >= 0 ? 'text-[#00FF87]' : 'text-rose-400'}`}>
              £{newBudget.toFixed(1)}m ITB {newBudget >= 0 ? '(Valid)' : '(INSUFFICIENT FUNDS)'}
            </span>
          </div>
          <div className="border-l border-white/10 pl-4">
            <span className="text-slate-400 block text-[10px]">FREE TRANSFERS REMAINING:</span>
            <span className="text-base font-bold text-white">0 FT</span>
          </div>
        </div>

        <button
          disabled={newBudget < 0}
          className="px-6 py-3 rounded-lg bg-[#00FF87] hover:bg-[#00e478] text-[#051424] font-extrabold text-xs transition-all shadow-lg shadow-[#00FF87]/20 disabled:opacity-40 cursor-pointer"
        >
          CONFIRM TRANSFER (EXECUTE)
        </button>
      </div>
    </div>
  );
};
