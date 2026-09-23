export type Position = 'GKP' | 'DEF' | 'MID' | 'FWD';
export type Formation = '3-4-3' | '3-5-2' | '4-3-3' | '4-4-2' | '4-5-1';
export type TargetProfile = 'Balanced' | 'High Upside' | 'Value Focused' | 'Differential';

export interface FixtureInfo {
  opponent: string;
  isHome: boolean;
  fdr: 1 | 2 | 3 | 4 | 5;
}

export interface Player {
  id: string;
  name: string;
  shortName: string;
  fullName: string;
  club: string;
  role: Position;
  cost: number;
  costDelta: number;
  form: number;
  formHistory: number[]; // Last 5 matches for sparkline
  points: number;
  projGW12: number;
  ceiling: number;
  ownership: number;
  nextFixtures: FixtureInfo[];
  valueScore: number;
  xGI: number;
  inForm: boolean;
  highXGI: boolean;
  cleanSheetProb?: number;
  isDifferential: boolean;
  priceRiseImminent: boolean;
  status: 'fit' | 'doubt' | 'injured' | 'suspended';
  statusChance?: number; // e.g. 75
}

export interface TacticalInsight {
  id: string;
  type: 'form' | 'fixture' | 'price' | 'differential';
  title: string;
  description: string;
  tag: string;
  tagColor: 'green' | 'cyan' | 'amber' | 'rose';
  time: string;
}

export interface DecisionVectors {
  fdrAvg: number; // e.g. 2.4 / 5
  capitalUtilization: number; // 94.2%
  squadVolatility: 'LOW' | 'LOW-MED' | 'MED' | 'HIGH';
  armbandConfidence: number; // 88%
  topRankPercentile: string; // 'Top 5%'
}

export interface ActiveUser {
  name: string;
  handle: string;
  email: string;
  phone?: string;
  globalRank: number;
  rankTier: string; // "Top 1.4% OR"
  avatarUrl: string;
  activeSquadName: string;
  squadFormation: Formation;
  budgetRemaining: number;
}
