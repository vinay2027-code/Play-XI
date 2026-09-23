import React from 'react';
import { Award, Shield, DollarSign, Users, CheckCircle, Trophy, Star } from 'lucide-react';
import { ActiveUser } from '../types/fpl';

interface ProfileScreenProps {
  user: ActiveUser;
  onNavigate: (screen: string) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onNavigate }) => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1">
          <span className="text-[#00FF87] font-bold">MANAGER PROFILE</span>
          <span>/</span>
          <span>FPL Verified ID</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-sans tracking-tight">
          MANAGER DOSSIER: {user.name.toUpperCase()}
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Tactical performance breakdown, percentile history, and mini-league standing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-[#0d1c2d] border border-white/10 text-center space-y-4">
          <div className="relative inline-block mx-auto">
            <img
              src={user.avatarUrl}
              alt={user.name}
              referrerPolicy="no-referrer"
              className="w-24 h-24 rounded-2xl object-cover border-2 border-[#00FF87] mx-auto shadow-xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=Alex+Sterling&background=00FF87&color=051424&bold=true';
              }}
            />
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#00FF87] flex items-center justify-center text-[#051424] font-black text-xs">
              ✓
            </span>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white font-sans">{user.name}</h2>
            <div className="text-xs font-mono text-slate-400">{user.handle} • {user.email}</div>
            <div className="inline-block mt-2 font-mono text-xs px-3 py-1 rounded-full bg-[#00FF87]/15 text-[#00FF87] border border-[#00FF87]/30 font-bold">
              {user.rankTier}
            </div>
          </div>

          <div className="pt-4 border-t border-white/8 grid grid-cols-2 gap-3 text-left text-xs font-mono">
            <div className="p-3 rounded-lg bg-[#162638]">
              <div className="text-slate-400 text-[10px]">GLOBAL OR</div>
              <div className="text-base font-bold text-white mt-0.5">#{user.globalRank.toLocaleString()}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#162638]">
              <div className="text-slate-400 text-[10px]">TOTAL POINTS</div>
              <div className="text-base font-bold text-[#00FF87] mt-0.5">742 pts</div>
            </div>
          </div>
        </div>

        {/* Mini Leagues & Season Trophies */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 rounded-2xl bg-[#0d1c2d] border border-white/10 space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-white border-b border-white/8 pb-3">
              <span className="uppercase tracking-wider">ACTIVE MINI-LEAGUES</span>
              <span className="font-mono text-[#00FF87]">Top 1% Dominance</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-lg bg-[#162638] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-bold text-white">Silicon Valley Tacticians League</div>
                    <div className="text-[10px] text-slate-400 font-mono">148 Members • Classic League</div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-sm font-bold text-[#00FF87]">Rank #1</div>
                  <div className="text-[10px] text-slate-400">+34 pts lead</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#162638] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy className="w-4 h-4 text-slate-300" />
                  <div>
                    <div className="font-bold text-white">London Data Engineers FPL</div>
                    <div className="text-[10px] text-slate-400 font-mono">512 Members • Classic League</div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-sm font-bold text-white">Rank #3</div>
                  <div className="text-[10px] text-slate-400">718 pts</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#162638] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy className="w-4 h-4 text-amber-700" />
                  <div>
                    <div className="font-bold text-white">Official Arsenal Supporters Global</div>
                    <div className="text-[10px] text-slate-400 font-mono">84,200 Members • Public League</div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-sm font-bold text-[#38BDF8]">Rank #214</div>
                  <div className="text-[10px] text-slate-400">Top 0.2%</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0d1c2d] border border-white/10 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              OPERATIONAL CREDENTIALS
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Signed in as <strong>{user.email}</strong>. Live synchronization to Premier League FPL ID <strong>#8420194</strong> is active and authorized.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-4 py-2 rounded-lg bg-[#00FF87] text-[#051424] font-bold text-xs cursor-pointer"
              >
                Back to Cockpit
              </button>
              <button
                onClick={() => onNavigate('landing')}
                className="px-4 py-2 rounded-lg bg-[#162638] text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Switch / Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
