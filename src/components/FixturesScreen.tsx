import React, { useState } from 'react';
import { CalendarDays, Filter, ArrowUpDown } from 'lucide-react';
import { FIXTURE_MATRIX_DATA } from '../data/mockData';

export const FixturesScreen: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'fdr'>('name');

  const filtered = FIXTURE_MATRIX_DATA.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.club.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    if (sortBy === 'fdr') {
      const avgA = a.next6.reduce((acc, curr) => acc + curr, 0) / 6;
      const avgB = b.next6.reduce((acc, curr) => acc + curr, 0) / 6;
      return avgA - avgB;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1">
          <span className="text-[#00FF87] font-bold">OPERATIONAL SCHEDULE</span>
          <span>/</span>
          <span>GW12 - GW17 Horizon</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-sans tracking-tight">
              FIXTURE DIFFICULTY MATRIX
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Official FDR ratings calibrated against expected goals conceded, home advantage, and recovery schedules.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter club..."
              className="bg-[#0d1c2d] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00FF87]"
            />
            <button
              onClick={() => setSortBy(sortBy === 'name' ? 'fdr' : 'name')}
              className="px-3 py-1.5 rounded-lg bg-[#0d1c2d] border border-white/10 hover:border-white/20 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort: {sortBy === 'name' ? 'Alphabetical' : 'Easiest Run'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Fixture Matrix Table */}
      <div className="rounded-xl bg-[#0d1c2d] border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/8 bg-[#091726] text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                <th className="py-3 px-4">CLUB</th>
                <th className="py-3 px-3 text-center">GW12</th>
                <th className="py-3 px-3 text-center">GW13</th>
                <th className="py-3 px-3 text-center">GW14</th>
                <th className="py-3 px-3 text-center">GW15</th>
                <th className="py-3 px-3 text-center">GW16</th>
                <th className="py-3 px-3 text-center">GW17</th>
                <th className="py-3 px-4 text-right">AVG DIFFICULTY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filtered.map((item) => {
                const avg = (item.next6.reduce((acc, c) => acc + c, 0) / 6).toFixed(1);
                return (
                  <tr key={item.club} className="hover:bg-[#122131]/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                      <span className="font-mono text-xs text-[#00FF87]">{item.club}</span>
                      <span className="text-slate-200">{item.name}</span>
                    </td>
                    {item.next6.map((fdr, i) => {
                      const bg =
                        fdr <= 2
                          ? 'bg-emerald-950 text-[#00FF87] border-emerald-800'
                          : fdr === 3
                          ? 'bg-slate-800 text-slate-300 border-slate-700'
                          : 'bg-rose-950 text-rose-300 border-rose-800';
                      return (
                        <td key={i} className="py-3 px-3 text-center">
                          <span
                            className={`inline-block w-8 py-1 rounded border font-mono font-bold text-xs ${bg}`}
                          >
                            {fdr}
                          </span>
                        </td>
                      );
                    })}
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-300">
                      {avg} / 5.0
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
