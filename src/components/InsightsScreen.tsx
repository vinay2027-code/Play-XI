import React from 'react';
import { TrendingUp, AlertCircle, Bell, ArrowUpRight, ShieldCheck, Zap } from 'lucide-react';
import { TacticalInsight, Player } from '../types/fpl';

interface InsightsScreenProps {
  insights: TacticalInsight[];
  players: Player[];
}

export const InsightsScreen: React.FC<InsightsScreenProps> = ({ insights, players }) => {
  const risers = players.filter((p) => p.costDelta > 0);
  const differentials = players.filter((p) => p.isDifferential);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1">
          <span className="text-[#00FF87] font-bold">TACTICAL RADAR &amp; INTEL</span>
          <span>/</span>
          <span>Live Algorithmic Signals</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-sans tracking-tight">
          MATCHDAY INTEL &amp; PREDICTIVE SIGNALS
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Machine-learning NLP models scraping Premier League press briefings, Opta xG matrices, and transfer market volume.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tactical Feed Cards */}
        <div className="rounded-xl bg-[#0d1c2d] border border-white/10 p-5 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-white border-b border-white/8 pb-3">
            <span className="uppercase tracking-wider">LIVE OPERATIONAL INTEL STREAM</span>
            <span className="font-mono text-[#00FF87] bg-[#00FF87]/10 px-2 py-0.5 rounded">REAL-TIME</span>
          </div>

          <div className="space-y-3">
            {insights.map((ins) => (
              <div key={ins.id} className="p-3.5 rounded-lg bg-[#162638] border border-white/8 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{ins.title}</span>
                  <span className="font-mono text-[10px] text-slate-400">{ins.time}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{ins.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Market Momentum & Price Risers */}
        <div className="rounded-xl bg-[#0d1c2d] border border-white/10 p-5 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-white border-b border-white/8 pb-3">
            <span className="uppercase tracking-wider">PRICE RISE MOMENTUM (TONIGHT 01:30 GMT)</span>
            <span className="font-mono text-emerald-400 text-[11px] font-semibold">Over 95% Threshold</span>
          </div>

          <div className="space-y-2">
            {risers.map((r) => (
              <div
                key={r.id}
                className="p-3 rounded-lg bg-[#162638] border border-white/5 flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <span className="font-bold text-white font-sans">{r.name}</span>
                  <span className="text-slate-400 ml-2">({r.club} • {r.role})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">£{r.cost.toFixed(1)}m</span>
                  <span className="px-2 py-0.5 rounded bg-[#00FF87]/15 text-[#00FF87] font-bold">
                    +£0.1m Expected
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-white/8">
            <div className="text-xs font-bold text-white uppercase tracking-wider mb-2">
              DIFFERENTIAL RADAR (&lt; 10% OWNERSHIP)
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {differentials.slice(0, 4).map((d) => (
                <div key={d.id} className="p-2.5 rounded bg-[#122131] border border-white/5">
                  <div className="font-bold text-white">{d.name}</div>
                  <div className="text-[10px] font-mono text-[#38BDF8]">
                    {d.ownership}% Owned • {d.projGW12} xPts
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
