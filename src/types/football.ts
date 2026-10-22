export type FplPosition = 'GKP' | 'DEF' | 'MID' | 'FWD' | '—';

export interface FplEvent {
  id: number;
  name: string;
  deadlineTime: string;
  finished: boolean;
  isCurrent: boolean;
  isNext: boolean;
}

export interface FplTeam {
  id: number;
  name: string;
  shortName: string;
  code: number;
}

export interface FplPlayer {
  id: number;
  code: number;
  photo: string;
  firstName: string;
  secondName: string;
  webName: string;
  teamId: number;
  teamCode: number | null;
  teamName: string;
  teamShortName: string;
  position: FplPosition;
  cost: number;
  costTenths: number;
  costChangeStart: number;
  form: number;
  totalPoints: number;
  pointsPerGame: number;
  selectedByPercent: number;
  expectedPointsNext: number;
  expectedPointsThis: number;
  minutes: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  expectedGoals: number;
  expectedAssists: number;
  bonus: number;
  ictIndex: number;
  status: string;
  chanceOfPlayingNext: number | null;
  news: string;
  newsAdded: string | null;
}

export interface FplBootstrap {
  fetchedAt: string;
  currentEvent: number | null;
  nextEvent: number | null;
  events: FplEvent[];
  teams: FplTeam[];
  players: FplPlayer[];
}

export interface FplFixture {
  id: number;
  event: number | null;
  kickoffTime: string | null;
  finished: boolean;
  started: boolean;
  homeTeam: string;
  homeTeamShort: string;
  homeTeamId: number;
  awayTeam: string;
  awayTeamShort: string;
  awayTeamId: number;
  homeScore: number | null;
  awayScore: number | null;
  homeDifficulty: number;
  awayDifficulty: number;
}

export interface FplFixturesResponse {
  fetchedAt: string;
  fixtures: FplFixture[];
}

export interface FplEntry {
  id: number;
  name: string;
  player_first_name: string;
  player_last_name: string;
  player_region_name?: string;
  player_region_iso_code_short?: string;
  player_region_iso_code_long?: string;
  favourite_team?: number | null;
  years_active?: number;
  started_event?: number;
  last_deadline_total_transfers?: number;
  summary_overall_points: number;
  summary_overall_rank: number;
  summary_event_points: number;
  summary_event_rank: number;
  current_event: number;
  leagues?: {
    classic?: Array<{
      id: number;
      name: string;
      league_type: string;
      rank: number | null;
      entry_rank: number | null;
      entry_last_rank: number | null;
      entry_percentile_rank: number | null;
      rank_count: number;
    }>;
  };
}

export interface FplPick {
  element: number;
  position: number;
  multiplier: number;
  is_captain: boolean;
  is_vice_captain: boolean;
}

export interface FplPicksResponse {
  active_chip: string | null;
  automatic_subs: Array<{ entry: number; element_in: number; element_out: number }>;
  entry_history: {
    event: number;
    points: number;
    total_points: number;
    overall_rank: number;
    bank: number;
    value: number;
    event_transfers: number;
    event_transfers_cost: number;
    points_on_bench: number;
  };
  picks: FplPick[];
}

export interface FplEventLiveResponse {
  eventId: number;
  points: Record<number, number>;
}

export interface FplTransferRecord {
  element_in: number;
  element_in_cost: number;
  element_out: number;
  element_out_cost: number;
  entry: number;
  event: number;
  time: string;
}

export interface FplTransferIdea {
  outgoing: {
    id: number;
    webName: string;
    teamName: string;
    teamCode: number | null;
    photo: string;
    position: FplPosition;
    cost: number;
    expectedPointsNext: number;
    status: string;
    chanceOfPlayingNext: number | null;
  };
  incoming: {
    id: number;
    webName: string;
    teamName: string;
    teamCode: number | null;
    photo: string;
    position: FplPosition;
    cost: number;
    expectedPointsNext: number;
    form: number;
  };
  delta: number;
  saleValue: number;
  reasons: string[];
}

export interface FplRecommendationsResponse {
  eventId: number;
  freeIdeas: FplTransferIdea[];
  paidIdeas?: FplTransferIdea[];
  unlocked?: boolean;
  checkoutAvailable?: boolean;
  lockedCount: number;
  availableCount: number;
}
