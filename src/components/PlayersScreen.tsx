import React, { useState, useMemo } from 'react';
import {
  Table,
  Grid,
  Network,
  Download,
  Search,
  X,
  Flame,
  Target,
  Shield,
  Lightbulb,
  AlertTriangle,
  ArrowUpDown,
  TrendingUp,
  Sparkles,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { Player, Position } from '../types/fpl';

interface PlayersScreenProps {
  players: Player[];
  onOpenCompare: (p1: Player, p2: Player) => void;
  onSelectPlayer: (player: Player) => void;
}

export const PlayersScreen: React.FC<PlayersScreenProps> = ({
  players,
  onOpenCompare,
  onSelectPlayer,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'matrix'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<'ALL' | Position>('ALL');
  const [priceFilter, setPriceFilter] = useState<'any' | 'sub6' | '6to9' | '9plus'>('any');
  const [sortBy, setSortBy] = useState<'proj' | 'form' | 'pts' | 'value' | 'cost'>('proj');
  const [activeSignals, setActiveSignals] = useState<{ [key: string]: boolean }>({
    inForm: false,
    highXGI: false,
    cleanSheet: false,
    differential: false,
    priceRise: false,
  });

  // Selected comparison players (default Halvorsen & Isak from Image 3)
  const [comparedPlayer1, setComparedPlayer1] = useState<Player>(
    players.find((p) => p.id === 'halvorsen') || players[0]
  );
  const [comparedPlayer2, setComparedPlayer2] = useState<Player>(
    players.find((p) => p.id === 'isak') || players[5]
  );
  const [drawerOpen, setDrawerOpen] = useState(true);

  // Filtered & Sorted players
  const filteredPlayers = useMemo(() => {
    return players
      .filter((p) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = p.name.toLowerCase().includes(q) || p.fullName.toLowerCase().includes(q);
          const matchesClub = p.club.toLowerCase().includes(q);
          if (!matchesName && !matchesClub) return false;
        }

        if (positionFilter !== 'ALL' && p.role !== positionFilter) return false;

        if (priceFilter === 'sub6' && p.cost >= 6.0) return false;
        if (priceFilter === '6to9' && (p.cost < 6.0 || p.cost > 9.0)) return false;
        if (priceFilter === '9plus' && p.cost <= 9.0) return false;

        if (activeSignals.inForm && !p.inForm) return false;
        if (activeSignals.highXGI && !p.highXGI) return false;
        if (activeSignals.cleanSheet && (!p.cleanSheetProb || p.cleanSheetProb < 45)) return false;
        if (activeSignals.differential && !p.isDifferential) return false;
        if (activeSignals.priceRise && !p.priceRiseImminent) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'proj') return b.projGW12 - a.projGW12;
        if (sortBy === 'form') return b.form - a.form;
        if (sortBy === 'pts') return b.points - a.points;
        if (sortBy === 'value') return b.valueScore - a.valueScore;
        if (sortBy === 'cost') return b.cost - a.cost;
        return 0;
      });
  }, [players, searchQuery, positionFilter, priceFilter, sortBy, activeSignals]);

  // Handle CSV Export
  const handleExportCSV = () => {
    const headers = ['Player', 'Club', 'Role', 'Cost', 'Points', 'Form', 'ProjGW12', 'ValueScore'];
    const rows = filteredPlayers.map((p) => [
      `"${p.fullName}"`,
      p.club,
      p.role,
      p.cost,
      p.points,
      p.form,
      p.projGW12,
      p.valueScore,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'PLAYXI_Player_Analytics.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSignal = (key: string) => {
    setActiveSignals((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCompareWith = (player: Player) => {
    if (player.id === comparedPlayer1.id) return;
    setComparedPlayer2(player);
    setDrawerOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 pb-28">
      {/* 1. Category Breadcrumb & Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1">
          <span className="text-[#00FF87] font-bold">SCOUTING &amp; STRATEGY</span>
          <span>/</span>
          <span>GW12 Matrix</span>
          <span>•</span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF87] animate-pulse"></span>
            Live Feed Connected
          </span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-sans tracking-tight">
              PLAYER EXPLORER &amp; ANALYTICS
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
              Search, filter, and compare 480+ Premier League assets with proprietary xG, xA, FDR projection vectors and tactical ROI indices.
            </p>
          </div>

          {/* View Switchers & Export Button */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0d1c2d] border border-white/10">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-[#00FF87] text-[#051424]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Table View</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#00FF87] text-[#051424] font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Grid View</span>
              </button>
              <button
                onClick={() => onOpenCompare(comparedPlayer1, comparedPlayer2)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <Network className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Matrix</span>
                <span className="w-2 h-2 rounded-full bg-[#38BDF8]"></span>
              </button>
            </div>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#0d1c2d] border border-white/10 hover:border-white/20 text-slate-200 hover:text-white text-xs font-semibold transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>CSV Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Four Stat Indicator Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Top Transfer Target */}
        <div className="p-4 rounded-xl bg-[#0d1c2d] border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2 font-semibold">
            <span>TOP TRANSFER TARGET</span>
            <span className="text-[#00FF87] flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              +28.4k IN
            </span>
          </div>
          <div className="text-xl font-bold text-white font-sans">M. Soler</div>
          <div className="text-xs font-mono text-slate-400 mt-1">ARS • MID • £8.6m</div>
        </div>

        {/* Card 2: Highest xGI Run */}
        <div className="p-4 rounded-xl bg-[#0d1c2d] border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2 font-semibold">
            <span>HIGHEST XGI RUN (GW12-14)</span>
            <span className="text-[#38BDF8] flex items-center gap-0.5 font-bold">
              3.42 xGI
            </span>
          </div>
          <div className="text-xl font-bold text-white font-sans">E. Halvorsen</div>
          <div className="text-xs font-mono text-slate-400 mt-1">MCI • FWD • £13.8m</div>
        </div>

        {/* Card 3: Form/Price Leader */}
        <div className="p-4 rounded-xl bg-[#0d1c2d] border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2 font-semibold">
            <span>FORM/PRICE VALUE LEADER</span>
            <span className="text-amber-400 font-bold">1.48 pts/£m</span>
          </div>
          <div className="text-xl font-bold text-white font-sans">B. Mbeu</div>
          <div className="text-xs font-mono text-slate-400 mt-1">BRE • MID • £6.2m</div>
        </div>

        {/* Card 4: Clean Sheet Probability */}
        <div className="p-4 rounded-xl bg-[#0d1c2d] border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2 font-semibold">
            <span>CLEAN SHEET PROBABILITY</span>
            <span className="text-[#00FF87] font-bold">58.2% GW12</span>
          </div>
          <div className="text-xl font-bold text-white font-sans">Arsenal DEF</div>
          <div className="text-xs font-mono text-slate-400 mt-1">vs NFO (H) FDR: 2</div>
        </div>
      </div>

      {/* 3. Filter Bar & Tactical Signals */}
      <div className="rounded-xl bg-[#0d1c2d] border border-white/10 p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by player surname, club code..."
              className="w-full bg-[#122131] border border-white/10 rounded-md pl-9 pr-8 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#00FF87]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Position Tabs & Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Positions */}
            <div className="flex items-center gap-1 p-1 rounded-md bg-[#122131] border border-white/8">
              {(['ALL', 'GKP', 'DEF', 'MID', 'FWD'] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() => setPositionFilter(pos)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                    positionFilter === pos
                      ? 'bg-[#00FF87] text-[#051424]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>

            {/* Price Cap Filter */}
            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value as any)}
              className="bg-[#122131] border border-white/10 rounded-md px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#00FF87] cursor-pointer"
            >
              <option value="any">Price: Any Cap</option>
              <option value="sub6">Under £6.0m</option>
              <option value="6to9">£6.0m - £9.0m</option>
              <option value="9plus">£9.0m+</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#122131] border border-white/10 rounded-md px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#00FF87] cursor-pointer"
            >
              <option value="proj">Sort: Projected GW12</option>
              <option value="form">Sort: Form (L5)</option>
              <option value="pts">Sort: Season Points</option>
              <option value="value">Sort: Value Score</option>
              <option value="cost">Sort: Cost</option>
            </select>
          </div>
        </div>

        {/* Tactical Signals Row */}
        <div className="pt-2 border-t border-white/8 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mr-1">
              TACTICAL SIGNALS:
            </span>

            <button
              onClick={() => toggleSignal('inForm')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all cursor-pointer ${
                activeSignals.inForm
                  ? 'bg-[#00FF87]/20 border-[#00FF87] text-[#00FF87] font-bold'
                  : 'bg-[#122131] border-white/8 text-slate-300 hover:border-white/20'
              }`}
            >
              <span>🔥</span>
              <span>In Form (≥ 7.0)</span>
            </button>

            <button
              onClick={() => toggleSignal('highXGI')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all cursor-pointer ${
                activeSignals.highXGI
                  ? 'bg-[#38BDF8]/20 border-[#38BDF8] text-[#38BDF8] font-bold'
                  : 'bg-[#122131] border-white/8 text-slate-300 hover:border-white/20'
              }`}
            >
              <span>🎯</span>
              <span>High xGI Overindex</span>
            </button>

            <button
              onClick={() => toggleSignal('cleanSheet')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all cursor-pointer ${
                activeSignals.cleanSheet
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold'
                  : 'bg-[#122131] border-white/8 text-slate-300 hover:border-white/20'
              }`}
            >
              <span>🛡️</span>
              <span>Clean Sheet ≥ 45%</span>
            </button>

            <button
              onClick={() => toggleSignal('differential')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all cursor-pointer ${
                activeSignals.differential
                  ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-bold'
                  : 'bg-[#122131] border-white/8 text-slate-300 hover:border-white/20'
              }`}
            >
              <span>💡</span>
              <span>Differential (&lt; 10% Owned)</span>
            </button>

            <button
              onClick={() => toggleSignal('priceRise')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all cursor-pointer ${
                activeSignals.priceRise
                  ? 'bg-rose-500/20 border-rose-500 text-rose-400 font-bold'
                  : 'bg-[#122131] border-white/8 text-slate-300 hover:border-white/20'
              }`}
            >
              <span>⚠️</span>
              <span>Price Rise Imminent</span>
            </button>
          </div>

          <div className="font-mono text-[11px] text-slate-400">
            Displaying <strong className="text-white">{filteredPlayers.length}</strong> / 482 Elite Assets
          </div>
        </div>
      </div>

      {/* 4. Main Data Table (or Grid) */}
      {viewMode === 'table' ? (
        <div className="rounded-xl bg-[#0d1c2d] border border-white/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/8 bg-[#091726] text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  <th className="py-3 px-4">PLAYER</th>
                  <th className="py-3 px-3">ROLE</th>
                  <th className="py-3 px-3">COST</th>
                  <th className="py-3 px-3">FORM (L5)</th>
                  <th className="py-3 px-3">PTS</th>
                  <th className="py-3 px-3">PROJ GW12</th>
                  <th className="py-3 px-4">NEXT 3 FIXTURES (FDR)</th>
                  <th className="py-3 px-3">VALUE SCORE</th>
                  <th className="py-3 px-4 text-right">TACTICAL ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filteredPlayers.map((player) => {
                  const roleBadge =
                    player.role === 'GKP'
                      ? 'text-amber-400 bg-amber-400/10 border-amber-400/30'
                      : player.role === 'DEF'
                      ? 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30'
                      : player.role === 'MID'
                      ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
                      : 'text-rose-400 bg-rose-400/10 border-rose-400/30';

                  const deltaColor =
                    player.costDelta > 0
                      ? 'text-[#00FF87]'
                      : player.costDelta < 0
                      ? 'text-rose-400'
                      : 'text-slate-400';

                  return (
                    <tr
                      key={player.id}
                      className="hover:bg-[#122131]/80 transition-colors group cursor-pointer"
                      onClick={() => onSelectPlayer(player)}
                    >
                      {/* Player column */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-8 h-8 rounded bg-[#162638] flex items-center justify-center font-bold text-white text-xs border border-white/10 shrink-0">
                            <span>{player.shortName.charAt(0)}</span>
                            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#00FF87]"></span>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-white group-hover:text-[#00FF87] transition-colors">
                              <span>{player.name}</span>
                              {player.status === 'doubt' && (
                                <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-amber-400/20 text-amber-400 border border-amber-400/30 font-bold">
                                  {player.statusChance}%
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">
                              {player.club} • {player.ownership}% Owned
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-3">
                        <span
                          className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${roleBadge}`}
                        >
                          {player.role}
                        </span>
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-3 font-mono">
                        <span className="font-bold text-white">£{player.cost.toFixed(1)}m</span>{' '}
                        <span className={`text-[10px] ${deltaColor}`}>
                          {player.costDelta > 0 ? `+${player.costDelta}` : player.costDelta}
                        </span>
                      </td>

                      {/* Form L5 Sparkline */}
                      <td className="py-3 px-3 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{player.form.toFixed(1)}</span>
                          {/* Mini SVG Sparkline */}
                          <svg className="w-12 h-5 overflow-visible" viewBox="0 0 50 20">
                            <polyline
                              fill="none"
                              stroke="#00FF87"
                              strokeWidth="2"
                              points={player.formHistory
                                .map((v, i) => `${i * 12 + 1},${20 - Math.min(18, v)}`)
                                .join(' ')}
                            />
                          </svg>
                        </div>
                      </td>

                      {/* Season Points */}
                      <td className="py-3 px-3 font-mono font-bold text-white">
                        {player.points}
                      </td>

                      {/* Projected GW12 with visual bar */}
                      <td className="py-3 px-3 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#00FF87]">{player.projGW12}</span>
                          <div className="w-12 h-1.5 rounded-full bg-[#162638] overflow-hidden">
                            <div
                              className="h-full bg-[#00FF87] rounded-full"
                              style={{ width: `${Math.min(100, (player.projGW12 / 10) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Next 3 Fixtures (FDR) */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 font-mono text-[10px]">
                          {player.nextFixtures.map((f, i) => {
                            const fdrBg =
                              f.fdr <= 2
                                ? 'bg-emerald-950 text-[#00FF87] border-emerald-800'
                                : f.fdr === 3
                                ? 'bg-slate-800 text-slate-300 border-slate-700'
                                : 'bg-rose-950 text-rose-300 border-rose-800';
                            return (
                              <span
                                key={i}
                                className={`px-1.5 py-0.5 rounded border font-semibold ${fdrBg}`}
                              >
                                {f.opponent} ({f.isHome ? 'H' : 'A'}) {f.fdr}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Value Score */}
                      <td className="py-3 px-3 font-mono text-slate-300">
                        <span className="font-semibold text-white">{player.valueScore.toFixed(2)}</span>{' '}
                        <span className="text-[10px] text-slate-400">pts/£m</span>
                      </td>

                      {/* Tactical Action Button */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompareWith(player);
                          }}
                          className="px-2.5 py-1 rounded bg-[#162638] hover:bg-[#38BDF8]/20 text-slate-200 hover:text-[#38BDF8] border border-white/10 hover:border-[#38BDF8]/40 font-mono text-[11px] font-bold transition-all cursor-pointer"
                        >
                          COMPARE
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPlayers.map((player) => (
            <div
              key={player.id}
              onClick={() => onSelectPlayer(player)}
              className="p-4 rounded-xl bg-[#0d1c2d] border border-white/10 hover:border-[#00FF87]/40 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-[#00FF87]">
                  {player.role} • {player.club}
                </span>
                <span className="font-mono text-xs font-bold text-white">
                  £{player.cost.toFixed(1)}m
                </span>
              </div>
              <div className="text-base font-bold text-white group-hover:text-[#00FF87] transition-colors">
                {player.name}
              </div>
              <div className="mt-3 pt-2 border-t border-white/8 grid grid-cols-3 gap-2 text-center font-mono">
                <div>
                  <div className="text-[10px] text-slate-400">PTS</div>
                  <div className="text-xs font-bold text-white">{player.points}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">FORM</div>
                  <div className="text-xs font-bold text-white">{player.form}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">PROJ</div>
                  <div className="text-xs font-bold text-[#00FF87]">{player.projGW12}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Floating Bottom Comparison Drawer (Matches Image 3) */}
      {drawerOpen && (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl rounded-xl bg-[#0d1c2d]/95 backdrop-blur-md border border-[#00FF87]/40 shadow-2xl p-3 sm:px-5 flex flex-col md:flex-row items-center justify-between gap-4 z-40 animate-in slide-in-from-bottom-3 duration-200">
          {/* Left: PLAYXI Recommendation */}
          <div className="hidden lg:flex items-center gap-3 border-r border-white/10 pr-5 max-w-[280px]">
            <div className="w-8 h-8 rounded bg-[#00FF87]/15 text-[#00FF87] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-[11px] leading-tight">
              <span className="font-bold text-white block font-sans">
                PLAYXI Tactical Matrix Recommendation
              </span>
              <span className="text-slate-400">
                Optimal GW12 Captaincy leverage points to median template 5.4.
              </span>
            </div>
          </div>

          {/* Center: Head to Head Delta Active */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-[#162638] text-[#38BDF8] flex items-center justify-center font-mono font-bold text-xs">
                ⇄
              </div>
              <div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                  <span className="font-bold uppercase tracking-wider text-slate-300">
                    TACTICAL MATCHUP HEAD-TO-HEAD
                  </span>
                  <span className="text-[#00FF87] font-semibold">Delta Active</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-white">
                  {comparedPlayer1.name} (£{comparedPlayer1.cost.toFixed(1)}m) <span className="text-slate-500 font-normal">vs</span> {comparedPlayer2.name} (£{comparedPlayer2.cost.toFixed(1)}m)
                </div>
              </div>
            </div>

            {/* Quick Metrics Comparison */}
            <div className="hidden sm:flex items-center gap-3 font-mono text-[11px] border-l border-white/10 pl-4">
              <div className="text-center">
                <div className="text-[9px] text-slate-400 uppercase">Total Pts</div>
                <div className="font-bold text-white">
                  <span className="text-[#00FF87]">{comparedPlayer1.points}</span> vs {comparedPlayer2.points}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[9px] text-slate-400 uppercase">PPG</div>
                <div className="font-bold text-white">
                  <span className="text-[#00FF87]">{(comparedPlayer1.points / 11).toFixed(1)}</span> vs {(comparedPlayer2.points / 10).toFixed(1)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[9px] text-slate-400 uppercase">Next 3 FDR</div>
                <div className="font-bold text-white">
                  <span className="text-[#00FF87]">2.3</span> vs 2.7
                </div>
              </div>
              <div className="text-center">
                <div className="text-[9px] text-slate-400 uppercase">xGI Run</div>
                <div className="font-bold text-white">
                  <span className="text-[#00FF87]">9.4</span> vs 7.1
                </div>
              </div>
            </div>
          </div>

          {/* Right Action & Close */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onOpenCompare(comparedPlayer1, comparedPlayer2)}
              className="px-4 py-2 rounded-lg bg-[#00FF87] hover:bg-[#00e478] text-[#051424] font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-[#00FF87]/20 cursor-pointer whitespace-nowrap"
            >
              <span>⚡ Full Matrix</span>
            </button>
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-2 rounded-lg bg-[#162638] text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
