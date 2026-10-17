import type { FplPick, FplPlayer } from '../types/football';

export type LineupPlan = { key: string; starters: number[]; bench: number[]; captain: number; viceCaptain: number };

const positions = ['GKP', 'DEF', 'MID', 'FWD'] as const;
const unavailableStatuses = new Set(['i', 's', 'u']);

function projectedPoints(player: FplPlayer) {
  if (unavailableStatuses.has(player.status)) return 0;
  return Math.max(0, player.expectedPointsNext);
}

function comparePlayers(a: FplPlayer, b: FplPlayer) {
  return projectedPoints(b) - projectedPoints(a)
    || Number(unavailableStatuses.has(a.status)) - Number(unavailableStatuses.has(b.status))
    || (b.chanceOfPlayingNext ?? 100) - (a.chanceOfPlayingNext ?? 100)
    || a.id - b.id;
}

export function planProjectedPoints(starters: number[], captain: number, players: Map<number, FplPlayer>) {
  const captainPlayer = players.get(captain);
  return starters.reduce((total, id) => {
    const player = players.get(id);
    return total + (player ? projectedPoints(player) : 0);
  }, 0) + (captainPlayer ? projectedPoints(captainPlayer) : 0);
}

export function suggestLineup(key: string, picks: FplPick[], players: FplPlayer[]): LineupPlan | null {
  if (picks.length !== 15 || new Set(picks.map((pick) => pick.element)).size !== 15) return null;
  const playerById = new Map(players.map((player) => [player.id, player]));
  const roster = picks.map((pick) => playerById.get(pick.element));
  if (roster.some((player) => !player || !positions.includes(player.position as typeof positions[number]))) return null;
  if (!roster.some((player) => player && projectedPoints(player) > 0)) return null;
  const groups = Object.fromEntries(positions.map((position) => [position, (roster as FplPlayer[])
    .filter((player) => player.position === position).sort(comparePlayers)])) as Record<typeof positions[number], FplPlayer[]>;
  if (groups.GKP.length !== 2 || groups.DEF.length !== 5 || groups.MID.length !== 5 || groups.FWD.length !== 3) return null;

  let best: { starters: FplPlayer[]; score: number } | null = null;
  for (let defenders = 3; defenders <= 5; defenders++) {
    for (let midfielders = 2; midfielders <= 5; midfielders++) {
      const forwards = 10 - defenders - midfielders;
      if (forwards < 1 || forwards > 3) continue;
      const starters = [groups.GKP[0], ...groups.DEF.slice(0, defenders), ...groups.MID.slice(0, midfielders), ...groups.FWD.slice(0, forwards)];
      const score = starters.reduce((sum, player) => sum + projectedPoints(player), 0);
      if (!best || score > best.score) best = { starters, score };
    }
  }
  if (!best) return null;
  const chosen: FplPlayer[] = best.starters;
  const starters = chosen.map((player) => player.id);
  const captainCandidates = [...chosen].sort((a, b) => {
    const safeA = a.status === 'a' ? 1 : 0;
    const safeB = b.status === 'a' ? 1 : 0;
    return safeB - safeA || comparePlayers(a, b);
  });
  const reserveGoalkeeper = groups.GKP[1].id;
  const outfieldBench = (roster as FplPlayer[]).filter((player) => player.position !== 'GKP' && !starters.includes(player.id)).sort(comparePlayers);
  return {
    key,
    starters,
    bench: [reserveGoalkeeper, ...outfieldBench.map((player) => player.id)],
    captain: captainCandidates[0].id,
    viceCaptain: captainCandidates[1].id,
  };
}
