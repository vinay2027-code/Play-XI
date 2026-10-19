import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRightLeft, CalendarDays, Link2, ShieldAlert, Users } from 'lucide-react';
import type { FplBootstrap, FplEntry, FplEventLiveResponse, FplFixture, FplFixturesResponse, FplPick, FplPicksResponse, FplRecommendationsResponse, FplTransferRecord } from '../types/football';
import { fplAvailability, formatFplPrice, formatLocalDateTime } from '../utils/fpl';
import { suggestLineup, type LineupPlan } from '../utils/lineupAdvisor';
import { saveFirstRecommendationSnapshot, type RecommendationSnapshot } from '../utils/recommendationHistory';
import { loadGameweekPlan, loadManagerAccount, saveGameweekPlan, saveManagerAccount } from '../utils/accountSync';
import { PlayerPortrait, TeamBadge } from './FplIdentity';
import { GameweekBrief } from './GameweekBrief';

const STORAGE_KEY = 'playxi-fpl-entry-id';
const ENTRY_OWNER_KEY = 'playxi-fpl-entry-owner';
const LINEUP_OWNER_KEY = 'playxi-lineup-owner';
const EMPTY_FIXTURES: FplFixture[] = [];
const FORMATIONS = [3, 4, 5].flatMap((defenders) => [2, 3, 4, 5].map((midfielders) => ({
  defenders,
  midfielders,
  forwards: 10 - defenders - midfielders,
}))).filter(({ forwards }) => forwards >= 1 && forwards <= 3);
function lineupPlanKey(entryId: string, eventId: number) { return `playxi-lineup:${entryId}:${eventId}`; }

function isValidPlan(plan: LineupPlan, picks: FplPick[], players: FplBootstrap['players']) {
  const rosterIds = new Set(picks.map((pick) => pick.element));
  if (plan.starters.length !== 11 || plan.bench.length !== 4 || new Set([...plan.starters, ...plan.bench]).size !== 15) return false;
  if ([...plan.starters, ...plan.bench].some((id) => !rosterIds.has(id))) return false;
  if (!plan.starters.includes(plan.captain) || !plan.starters.includes(plan.viceCaptain) || plan.captain === plan.viceCaptain) return false;
  const playerById = new Map(players.map((player) => [player.id, player]));
  const positions = plan.starters.map((id) => playerById.get(id)?.position);
  const gkCount = positions.filter((position) => position === 'GKP').length;
  const defCount = positions.filter((position) => position === 'DEF').length;
  const midCount = positions.filter((position) => position === 'MID').length;
  const fwdCount = positions.filter((position) => position === 'FWD').length;
  const clubCounts = new Map<number, number>();
  for (const id of plan.starters) {
    const player = playerById.get(id);
    if (!player) return false;
    clubCounts.set(player.teamId, (clubCounts.get(player.teamId) ?? 0) + 1);
  }
  return gkCount === 1 && defCount >= 3 && defCount <= 5 && midCount >= 2 && midCount <= 5 && fwdCount >= 1 && fwdCount <= 3
    && plan.bench.filter((id) => playerById.get(id)?.position === 'GKP').length === 1
    && [...clubCounts.values()].every((count) => count <= 3);
}

function rank(value?: number) { return value ? value.toLocaleString() : '—'; }

function picksWithAutomaticSubs(picks: FplPicksResponse | null) {
  const lineup = (picks?.picks ?? []).map((pick) => ({ ...pick }));
  for (const substitution of picks?.automatic_subs ?? []) {
    const starterIndex = lineup.findIndex((pick) => pick.position <= 11 && pick.element === substitution.element_out);
    const benchIndex = lineup.findIndex((pick) => pick.position > 11 && pick.element === substitution.element_in);
    if (starterIndex < 0 || benchIndex < 0) continue;

    const outgoing = lineup[starterIndex];
    const incoming = lineup[benchIndex];
    lineup[starterIndex] = { ...outgoing, element: incoming.element, is_captain: false, is_vice_captain: false };
    lineup[benchIndex] = { ...incoming, element: outgoing.element, is_captain: false, is_vice_captain: false };
  }
  return lineup;
}

export function MyTeamScreen({ userId, onBrowsePlayers, onBrowseFixtures, onEntryLoaded }: { userId: string | null; onBrowsePlayers: () => void; onBrowseFixtures: () => void; onEntryLoaded: (entry: FplEntry | null, entryId: string) => void }) {
  const [entryId, setEntryId] = useState('');
  const [entry, setEntry] = useState<FplEntry | null>(null);
  const [bootstrap, setBootstrap] = useState<FplBootstrap | null>(null);
  const [picks, setPicks] = useState<FplPicksResponse | null>(null);
  const [eventPoints, setEventPoints] = useState<FplEventLiveResponse | null>(null);
  const [recommendations, setRecommendations] = useState<FplRecommendationsResponse | null>(null);
  const [fixtures, setFixtures] = useState<FplFixturesResponse | null>(null);
  const [recommendationSnapshot, setRecommendationSnapshot] = useState<RecommendationSnapshot | null>(null);
  const [recommendationsError, setRecommendationsError] = useState('');
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [planningEventId, setPlanningEventId] = useState<number | null>(null);
  const [asOfEventId, setAsOfEventId] = useState<number | null>(null);
  const [planningBankTenths, setPlanningBankTenths] = useState<number | null>(null);
  const [manualPlan, setManualPlan] = useState<LineupPlan | null>(null);
  const [draftStarters, setDraftStarters] = useState<number[]>([]);
  const [draftBench, setDraftBench] = useState<number[]>([]);
  const [draftCaptain, setDraftCaptain] = useState<number | null>(null);
  const [draftViceCaptain, setDraftViceCaptain] = useState<number | null>(null);
  const [editingLineup, setEditingLineup] = useState(false);
  const [lineupMessage, setLineupMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [accountSyncForUser, setAccountSyncForUser] = useState<string | null>(null);
  const [accountSyncMessage, setAccountSyncMessage] = useState('');
  const loadRequestId = useRef(0);
  const accountSyncRequestId = useRef(0);

  async function loadTeam(id: string, save = false) {
    const requestId = ++loadRequestId.current;
    const cleanId = id.trim();
    if (!/^\d+$/.test(cleanId) || Number(cleanId) < 1) {
      setError('Enter the numeric Team ID from your Fantasy Premier League team URL.');
      setRecommendationsLoading(false);
      onEntryLoaded(null, '');
      return;
    }
    setLoading(true);
    setError('');
    setEntry(null);
    onEntryLoaded(null, '');
    setBootstrap(null);
    setPicks(null);
    setEventPoints(null);
    setRecommendations(null);
    setFixtures(null);
    setRecommendationSnapshot(null);
    setRecommendationsError('');
    setRecommendationsLoading(true);
    setPlanningEventId(null);
    setAsOfEventId(null);
    setPlanningBankTenths(null);
    setManualPlan(null);
    setEditingLineup(false);
    setLineupMessage('');
    try {
      void fetch(`/api/fpl/entry/${cleanId}/recommendations`)
        .then(async (response) => ({ response, payload: await response.json() }))
        .then(({ response, payload }) => {
          if (requestId !== loadRequestId.current) return;
          if (response.ok) {
            const data = payload as FplRecommendationsResponse;
            setRecommendations(data);
            setRecommendationSnapshot(saveFirstRecommendationSnapshot(cleanId, data));
          }
          else setRecommendationsError(payload.error || 'Transfer ideas are temporarily unavailable.');
        })
        .catch(() => {
          if (requestId === loadRequestId.current) setRecommendationsError('Transfer ideas are temporarily unavailable.');
        })
        .finally(() => {
          if (requestId === loadRequestId.current) setRecommendationsLoading(false);
        });

      void fetch('/api/fpl/fixtures')
        .then(async (response) => response.ok ? await response.json() as FplFixturesResponse : null)
        .then((data) => { if (requestId === loadRequestId.current) setFixtures(data); })
        .catch(() => { if (requestId === loadRequestId.current) setFixtures(null); });

      const [entryResponse, bootstrapResponse] = await Promise.all([
        fetch(`/api/fpl/entry/${cleanId}`),
        fetch('/api/fpl/bootstrap'),
      ]);
      const [entryPayload, bootstrapPayload] = await Promise.all([entryResponse.json(), bootstrapResponse.json()]);
      if (!entryResponse.ok) throw new Error(entryPayload.error || 'Could not load this public FPL team.');
      if (!bootstrapResponse.ok) throw new Error(bootstrapPayload.error || 'Could not load current FPL game data.');
      const entryData = entryPayload as FplEntry;
      const bootData = bootstrapPayload as FplBootstrap;
      const currentEvent = bootData.events.find((event) => event.id === bootData.currentEvent);
      const currentDeadlineIsOpen = Boolean(currentEvent && new Date(currentEvent.deadlineTime).getTime() > Date.now());
      const eventId = currentDeadlineIsOpen
        ? currentEvent?.id
        : bootData.nextEvent ?? currentEvent?.id ?? entryData.current_event;
      let picksData: FplPicksResponse | null = null;
      let transferData: FplTransferRecord[] | null = null;
      let picksEventId: number | null = null;
      if (eventId) {
        const [transfersResponse, picksResponse] = await Promise.all([
          fetch(`/api/fpl/entry/${cleanId}/transfers`),
          fetch(`/api/fpl/entry/${cleanId}/event/${eventId}/picks`),
        ]);
        const [transfersPayload, picksPayload] = await Promise.all([transfersResponse.json(), picksResponse.json()]);
        if (transfersResponse.ok && Array.isArray(transfersPayload)) transferData = transfersPayload as FplTransferRecord[];
        if (picksResponse.ok) {
          picksData = picksPayload as FplPicksResponse;
          picksEventId = eventId;
        } else {
          const fallbackEvents = bootData.events
            .filter((event) => event.id < eventId)
            .sort((a, b) => b.id - a.id);
          for (const fallbackEvent of fallbackEvents) {
            const fallbackResponse = await fetch(`/api/fpl/entry/${cleanId}/event/${fallbackEvent.id}/picks`);
            const fallbackPayload = await fallbackResponse.json();
            if (fallbackResponse.ok) {
              picksData = fallbackPayload as FplPicksResponse;
              picksEventId = fallbackEvent.id;
              break;
            }
            if (fallbackResponse.status !== 404) {
              throw new Error(fallbackPayload.error || `Could not load the team picks for ${fallbackEvent.name}.`);
            }
          }
          if (!picksData) throw new Error(picksPayload.error || `Could not load any published team picks before Gameweek ${eventId}.`);
        }
      }
      if (requestId !== loadRequestId.current) return;
      if (picksEventId !== null && eventId !== undefined && picksEventId < eventId && !transferData) {
        throw new Error('We could not verify recent transfers, so we cannot safely build this Gameweek plan. Refresh and try again shortly.');
      }
      let bankTenths = picksData?.entry_history.bank ?? null;
      if (picksData && transferData && picksEventId !== null && eventId !== undefined && eventId > picksEventId) {
        const targetGameweek = eventId;
        const interveningTransfers = transferData
          .filter((transfer) => transfer.event > picksEventId && transfer.event <= targetGameweek)
          .sort((a, b) => a.event - b.event || a.time.localeCompare(b.time));
        for (const transfer of interveningTransfers) {
          if (bankTenths !== null) bankTenths += transfer.element_out_cost - transfer.element_in_cost;
        }
        if (picksData.picks.length === 15) {
          const currentRoster = picksData.picks.map((pick) => ({ ...pick }));
          for (const transfer of interveningTransfers) {
            const outgoingIndex = currentRoster.findIndex((pick) => pick.element === transfer.element_out);
            if (outgoingIndex >= 0) currentRoster[outgoingIndex] = {
              ...currentRoster[outgoingIndex], element: transfer.element_in,
              is_captain: false, is_vice_captain: false, multiplier: currentRoster[outgoingIndex].position <= 11 ? 1 : 0,
            };
          }
          picksData = { ...picksData, automatic_subs: [], picks: currentRoster };
        }
      }
      setEntry(entryData);
      setBootstrap(bootData);
      setPicks(picksData);
      setEventPoints(null);
      setPlanningEventId(eventId ?? null);
      setAsOfEventId(picksEventId);
      setPlanningBankTenths(bankTenths);
      setEntryId(cleanId);
      onEntryLoaded(entryData, cleanId);
      if (save) window.localStorage.setItem(STORAGE_KEY, cleanId);
    } catch (cause) {
      if (requestId === loadRequestId.current) {
        onEntryLoaded(null, '');
        setError(cause instanceof Error ? cause.message : 'Could not load the FPL team. Check the Team ID and try again.');
      }
    } finally {
      if (requestId === loadRequestId.current) setLoading(false);
    }
  }

  useEffect(() => {
    const requestId = ++accountSyncRequestId.current;
    if (!userId) {
      setAccountSyncForUser(null);
      setAccountSyncMessage('');
      if (window.localStorage.getItem(ENTRY_OWNER_KEY) || window.localStorage.getItem(LINEUP_OWNER_KEY)) {
        loadRequestId.current += 1;
        setLoading(false);
        setEntry(null);
        setBootstrap(null);
        setPicks(null);
        setEventPoints(null);
        setAsOfEventId(null);
        setRecommendations(null);
        setFixtures(null);
        setRecommendationSnapshot(null);
        setManualPlan(null);
        setEntryId('');
        onEntryLoaded(null, '');
      }
      return;
    }
    setAccountSyncForUser(null);
    setAccountSyncMessage('Syncing your saved team…');
    // Ignore any local-team request started under the previous account.
    loadRequestId.current += 1;
    setLoading(false);
    setEntry(null);
    setBootstrap(null);
    setPicks(null);
    setEventPoints(null);
    setAsOfEventId(null);
    setRecommendations(null);
    setFixtures(null);
    setRecommendationSnapshot(null);
    setManualPlan(null);
    setEntryId('');
    onEntryLoaded(null, '');
    let active = true;
    let syncCompleted = false;
    void (async () => {
      try {
        const account = await loadManagerAccount(userId);
        if (!active || requestId !== accountSyncRequestId.current) return;
        const localEntryId = window.localStorage.getItem(STORAGE_KEY)?.trim() ?? '';
        const accountEntryId = account?.fpl_entry_id?.trim() ?? '';
        if (accountEntryId) {
          window.localStorage.setItem(STORAGE_KEY, accountEntryId);
          window.localStorage.setItem(ENTRY_OWNER_KEY, userId);
          setEntryId(accountEntryId);
          void loadTeam(accountEntryId);
          setAccountSyncMessage('Your team is saved to your Play XI account.');
        } else if (localEntryId && /^\d+$/.test(localEntryId)
          && (!window.localStorage.getItem(ENTRY_OWNER_KEY) || window.localStorage.getItem(ENTRY_OWNER_KEY) === userId)) {
          await saveManagerAccount(userId, localEntryId);
          if (active) {
            window.localStorage.setItem(ENTRY_OWNER_KEY, userId);
            setEntryId(localEntryId);
            void loadTeam(localEntryId);
            setAccountSyncMessage('Your saved FPL Team ID is now linked to your account.');
          }
        } else if (localEntryId && window.localStorage.getItem(ENTRY_OWNER_KEY) !== userId) {
          window.localStorage.removeItem(STORAGE_KEY);
          setEntryId('');
          setEntry(null);
          setPicks(null);
          setEventPoints(null);
          setAsOfEventId(null);
          setRecommendations(null);
          setFixtures(null);
          setRecommendationSnapshot(null);
          onEntryLoaded(null, '');
          setAccountSyncMessage('This account has no saved team yet. Import your FPL Team ID to link it.');
        } else {
          setAccountSyncMessage('Sign in complete. Import a Team ID to save it to your account.');
        }
        syncCompleted = true;
      } catch {
        if (active) setAccountSyncMessage('Cloud sync is unavailable. Your plan remains saved in this browser.');
      } finally {
        if (active && requestId === accountSyncRequestId.current && syncCompleted) setAccountSyncForUser(userId);
      }
    })();
    return () => { active = false; };
  // Sync once per signed-in account. Import/save actions are handled below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // `onEntryLoaded` is a parent callback recreated during renders; this sync runs only when the account changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const savedOwner = window.localStorage.getItem(ENTRY_OWNER_KEY);
    if (saved && (!savedOwner || (userId && savedOwner === userId))) {
      setEntryId(saved);
      void loadTeam(saved);
    }
  // The saved ID is read once when this screen opens.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!userId || accountSyncForUser !== userId || !entry || !/^\d+$/.test(entryId) || String(entry.id) !== entryId) return;
    void saveManagerAccount(userId, entryId).then(() => {
      window.localStorage.setItem(ENTRY_OWNER_KEY, userId);
      setAccountSyncMessage('Your FPL Team ID is saved to your Play XI account.');
    }).catch(() => {
      setAccountSyncMessage('Could not sync your Team ID. Your local planner still works.');
    });
  }, [userId, accountSyncForUser, entry, entryId]);

  const playerById = useMemo(() => new Map((bootstrap?.players ?? []).map((player) => [player.id, player])), [bootstrap]);
  const picksAreForPreviousEvent = asOfEventId !== null && planningEventId !== null && asOfEventId !== planningEventId;
  const picksEventLabel = bootstrap?.events.find((event) => event.id === asOfEventId)?.name ?? (asOfEventId ? `Gameweek ${asOfEventId}` : 'published Gameweek');
  const currentPlanKey = entryId && planningEventId !== null ? lineupPlanKey(entryId, planningEventId) : '';

  useEffect(() => {
    if (asOfEventId === null || !picks) return;
    let active = true;
    const refreshPoints = () => {
      void fetch(`/api/fpl/event/${asOfEventId}/live`)
        .then(async (response) => response.ok ? await response.json() as FplEventLiveResponse : null)
        .then((data) => { if (active && data?.eventId === asOfEventId) setEventPoints(data); })
        .catch(() => { if (active) setEventPoints(null); });
    };
    setEventPoints((current) => current?.eventId === asOfEventId ? current : null);
    refreshPoints();
    const refreshInterval = window.setInterval(refreshPoints, 30_000);
    return () => { active = false; };
  }, [asOfEventId, picks]);

  useEffect(() => {
    if (!picks || !bootstrap || !currentPlanKey || !picksAreForPreviousEvent) return;
    const lineupOwner = window.localStorage.getItem(LINEUP_OWNER_KEY);
    const mayUseLocalPlan = !userId || !lineupOwner || lineupOwner === userId;
    try {
      const saved = window.localStorage.getItem(currentPlanKey);
      const parsed = saved ? JSON.parse(saved) as LineupPlan : null;
      if (mayUseLocalPlan && parsed && parsed.key === currentPlanKey && isValidPlan(parsed, picks.picks, bootstrap.players)) setManualPlan(parsed);
      else setManualPlan(null);
    } catch {
      setManualPlan(null);
    }
    if (!userId || accountSyncForUser !== userId) return;
    let active = true;
    const localPlan = (() => {
      if (!mayUseLocalPlan) return null;
      try {
        const saved = window.localStorage.getItem(currentPlanKey);
        const parsed = saved ? JSON.parse(saved) as LineupPlan : null;
        return parsed?.key === currentPlanKey && isValidPlan(parsed, picks.picks, bootstrap.players) ? parsed : null;
      } catch { return null; }
    })();
    void loadGameweekPlan(userId, entryId, planningEventId ?? 0).then(async (cloudPlan) => {
      if (!active) return;
      if (cloudPlan?.key === currentPlanKey && isValidPlan(cloudPlan, picks.picks, bootstrap.players)) {
        window.localStorage.setItem(currentPlanKey, JSON.stringify(cloudPlan));
        window.localStorage.setItem(LINEUP_OWNER_KEY, userId);
        setManualPlan(cloudPlan);
        setAccountSyncMessage('Your Gameweek lineup is synced to your account.');
      } else if (localPlan) {
        await saveGameweekPlan(userId, entryId, planningEventId ?? 0, localPlan);
        if (active) {
          window.localStorage.setItem(LINEUP_OWNER_KEY, userId);
          setAccountSyncMessage('Your saved Gameweek lineup is now synced to your account.');
        }
      }
    }).catch(() => {
      if (active) setAccountSyncMessage('Could not sync this Gameweek plan. Your browser copy is still saved.');
    });
    return () => { active = false; };
  }, [picks, bootstrap, currentPlanKey, picksAreForPreviousEvent, userId, accountSyncForUser, entryId, planningEventId]);

  const baseLineup = useMemo(() => picksAreForPreviousEvent ? (picks?.picks ?? []) : picksWithAutomaticSubs(picks), [picks, picksAreForPreviousEvent]);
  const lineup = useMemo(() => {
    if (!picksAreForPreviousEvent || !picks || !bootstrap || !manualPlan || manualPlan.key !== currentPlanKey || !isValidPlan(manualPlan, picks.picks, bootstrap.players)) return baseLineup;
    const planOrder = [...manualPlan.starters, ...manualPlan.bench];
    return planOrder.map((id, index) => {
      const pick = baseLineup.find((candidate) => candidate.element === id);
      if (!pick) return null;
      return { ...pick, position: index + 1, is_captain: id === manualPlan.captain, is_vice_captain: id === manualPlan.viceCaptain, multiplier: id === manualPlan.captain ? 2 : 1 };
    }).filter((pick): pick is FplPick => pick !== null);
  }, [picks, bootstrap, manualPlan, currentPlanKey, baseLineup, picksAreForPreviousEvent]);
  const automaticSubIns = useMemo(() => new Set((picks?.automatic_subs ?? []).map((substitution) => substitution.element_in)), [picks]);
  const automaticSubOuts = useMemo(() => new Set((picks?.automatic_subs ?? []).map((substitution) => substitution.element_out)), [picks]);
  const { startingPicks, benchPicks, positionRows, formation, startingExpectedPoints } = useMemo(() => {
    const startingPicks = lineup.filter((pick) => pick.position <= 11).sort((a, b) => a.position - b.position);
    const benchPicks = lineup.filter((pick) => pick.position > 11).sort((a, b) => a.position - b.position);
    const positionRows = (['FWD', 'MID', 'DEF', 'GKP'] as const).map((position) => ({
      position,
      picks: startingPicks.filter((pick) => playerById.get(pick.element)?.position === position),
    })).filter((row) => row.picks.length > 0);
    const formation = (['DEF', 'MID', 'FWD'] as const).map((position) =>
      positionRows.find((row) => row.position === position)?.picks.length ?? 0,
    ).join('-');
    const startingExpectedPoints = startingPicks.reduce((total, pick) =>
      total + (playerById.get(pick.element)?.expectedPointsNext ?? 0), 0,
    );
    return { startingPicks, benchPicks, positionRows, formation, startingExpectedPoints };
  }, [lineup, playerById]);
  const scoredPoints = eventPoints?.eventId === asOfEventId ? eventPoints.points : null;
  const startingScoredPoints = scoredPoints
    ? startingPicks.reduce((total, pick) => total + (scoredPoints[pick.element] ?? 0) * (pick.multiplier || 1), 0)
    : null;
  const draftFormation = useMemo(() => (['DEF', 'MID', 'FWD'] as const).map((position) =>
    draftStarters.filter((id) => playerById.get(id)?.position === position).length,
  ).join('-'), [draftStarters, playerById]);

  const recommendationList = recommendations?.freeIdeas ?? [];
  const recommendationEmptyMessage = recommendationsError || (!recommendations
    ? 'Transfer ideas are temporarily unavailable. Try refreshing your team.'
    : 'No affordable same-position move improves FPL’s next-gameweek projection right now.');
  const selectedEvent = bootstrap?.events.find((event) => event.id === planningEventId)
    ?? bootstrap?.events.find((event) => event.id === (bootstrap.currentEvent ?? bootstrap.nextEvent));
  const suggestedPlan = useMemo(() => picks && bootstrap && currentPlanKey
    ? suggestLineup(currentPlanKey, picks.picks, bootstrap.players) : null, [picks, bootstrap, currentPlanKey]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadTeam(entryId, true);
  }

  function beginLineupEdit() {
    setDraftStarters(lineup.filter((pick) => pick.position <= 11).sort((a, b) => a.position - b.position).map((pick) => pick.element));
    setDraftBench(lineup.filter((pick) => pick.position > 11).sort((a, b) =>
      Number(playerById.get(b.element)?.position === 'GKP') - Number(playerById.get(a.element)?.position === 'GKP') || a.position - b.position,
    ).map((pick) => pick.element));
    const starters = lineup.filter((pick) => pick.position <= 11).sort((a, b) => a.position - b.position);
    setDraftCaptain(starters.find((pick) => pick.is_captain)?.element ?? starters[0]?.element ?? null);
    setDraftViceCaptain(starters.find((pick) => pick.is_vice_captain)?.element ?? starters[1]?.element ?? null);
    setLineupMessage('');
    setEditingLineup(true);
  }

  function toggleStarter(element: number) {
    if (draftStarters.includes(element)) {
      setDraftStarters((current) => current.filter((id) => id !== element));
      setDraftBench((current) => [...current.filter((id) => id !== element), element]);
      if (draftCaptain === element) setDraftCaptain(null);
      if (draftViceCaptain === element) setDraftViceCaptain(null);
    } else {
      if (draftStarters.length >= 11) return;
      setDraftStarters((current) => [...current, element]);
      setDraftBench((current) => current.filter((id) => id !== element));
    }
  }

  function applyFormation(defenders: number, midfielders: number, forwards: number) {
    const positions = [
      { position: 'DEF', count: defenders },
      { position: 'MID', count: midfielders },
      { position: 'FWD', count: forwards },
      { position: 'GKP', count: 1 },
    ] as const;
    const allIds = [...new Set([...draftStarters, ...draftBench])];
    const starters = positions.flatMap(({ position, count }) => {
      const available = allIds.filter((id) => playerById.get(id)?.position === position);
      const selected = available.filter((id) => draftStarters.includes(id));
      const remaining = available.filter((id) => !draftStarters.includes(id)).sort((a, b) =>
        (playerById.get(b)?.expectedPointsNext ?? 0) - (playerById.get(a)?.expectedPointsNext ?? 0),
      );
      return [...selected.slice(0, count), ...remaining.slice(0, Math.max(0, count - selected.length))];
    });
    const starterSet = new Set(starters);
    const displaced = draftStarters.filter((id) => !starterSet.has(id));
    const bench = [...draftBench.filter((id) => !starterSet.has(id)), ...displaced]
      .filter((id, index, ids) => ids.indexOf(id) === index)
      .sort((a, b) => Number(playerById.get(b)?.position === 'GKP') - Number(playerById.get(a)?.position === 'GKP'));
    const nextCaptain = draftCaptain !== null && starterSet.has(draftCaptain)
      ? draftCaptain
      : [...starters].sort((a, b) => (playerById.get(b)?.expectedPointsNext ?? 0) - (playerById.get(a)?.expectedPointsNext ?? 0))[0] ?? null;
    const nextViceCaptain = draftViceCaptain !== null && starterSet.has(draftViceCaptain) && draftViceCaptain !== nextCaptain
      ? draftViceCaptain
      : starters.find((id) => id !== nextCaptain) ?? null;

    setDraftStarters(starters);
    setDraftBench(bench);
    setDraftCaptain(nextCaptain);
    setDraftViceCaptain(nextViceCaptain);
    setLineupMessage(`Formation ${defenders}-${midfielders}-${forwards} selected. Save plan to apply it.`);
  }

  function restoreOfficialLineup() {
    if (!picksAreForPreviousEvent || !picks?.picks.length) return;
    const officialPicks = [...picks.picks].sort((a, b) => a.position - b.position);
    const starters = officialPicks.filter((pick) => pick.position <= 11).map((pick) => pick.element);
    const bench = officialPicks.filter((pick) => pick.position > 11).map((pick) => pick.element);
    const captain = officialPicks.find((pick) => pick.is_captain)?.element ?? starters[0] ?? null;
    const viceCaptain = officialPicks.find((pick) => pick.is_vice_captain)?.element ?? starters.find((id) => id !== captain) ?? null;
    setDraftStarters(starters);
    setDraftBench(bench);
    setDraftCaptain(captain);
    setDraftViceCaptain(viceCaptain);
    setLineupMessage('Latest official FPL lineup loaded. Save plan to restore it in Play XI.');
  }

  function saveLineup() {
    if (!picks || !bootstrap || !currentPlanKey || draftCaptain === null || draftViceCaptain === null) {
      setLineupMessage('Choose a captain and vice-captain from your starting XI.');
      return;
    }
    const orderedBench = [...draftBench].sort((a, b) => Number(playerById.get(b)?.position === 'GKP') - Number(playerById.get(a)?.position === 'GKP'));
    const plan: LineupPlan = { key: currentPlanKey, starters: draftStarters, bench: orderedBench, captain: draftCaptain, viceCaptain: draftViceCaptain };
    if (!isValidPlan(plan, picks.picks, bootstrap.players)) {
      setLineupMessage('Choose 11 starters with a legal FPL formation, one goalkeeper on the bench, and no more than three players from one club.');
      return;
    }
    window.localStorage.setItem(currentPlanKey, JSON.stringify(plan));
    if (userId) window.localStorage.setItem(LINEUP_OWNER_KEY, userId);
    setManualPlan(plan);
    setEditingLineup(false);
    setLineupMessage(`Saved your ${selectedEvent?.name ?? 'Gameweek'} plan on this device.`);
    if (userId && planningEventId !== null && accountSyncForUser === userId) {
      void saveGameweekPlan(userId, entryId, planningEventId, plan).then(() => {
        setAccountSyncMessage(`Your ${selectedEvent?.name ?? 'Gameweek'} lineup is synced to your account.`);
      }).catch(() => {
        setAccountSyncMessage('Cloud sync failed. Your plan is still saved in this browser.');
      });
    }
  }

  function applySuggestedLineup() {
    if (!suggestedPlan || !picks || !bootstrap || !picksAreForPreviousEvent
      || !selectedEvent || new Date(selectedEvent.deadlineTime).getTime() <= Date.now()
      || !isValidPlan(suggestedPlan, picks.picks, bootstrap.players)) return;
    try {
      window.localStorage.setItem(currentPlanKey, JSON.stringify(suggestedPlan));
      if (userId) window.localStorage.setItem(LINEUP_OWNER_KEY, userId);
      setManualPlan(suggestedPlan);
      setEditingLineup(false);
      setLineupMessage(`Suggested XI saved for ${selectedEvent?.name ?? 'this Gameweek'} on this device.`);
      if (userId && planningEventId !== null && accountSyncForUser === userId) {
        void saveGameweekPlan(userId, entryId, planningEventId, suggestedPlan).then(() => {
          setAccountSyncMessage(`Your ${selectedEvent?.name ?? 'Gameweek'} lineup is synced to your account.`);
        }).catch(() => {
          setAccountSyncMessage('Cloud sync failed. Your plan is still saved in this browser.');
        });
      }
    } catch {
      setLineupMessage('This browser could not save your lineup. Check storage settings and try again.');
    }
  }

  function moveBench(element: number, direction: -1 | 1) {
    setDraftBench((current) => {
      if (playerById.get(element)?.position === 'GKP') return current;
      const index = current.indexOf(element);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  return (
    <main className="mx-auto max-w-[1480px] space-y-5 p-4 pb-28 sm:space-y-6 sm:p-6 lg:p-8">
      <header className="rounded-3xl border border-white/8 bg-[radial-gradient(ellipse_at_top_right,_rgba(0,255,135,.10),_transparent_42%),linear-gradient(120deg,#0d1c2d,#091726)] p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#00FF87]"><span className="h-1.5 w-1.5 rounded-full bg-[#00FF87]" /> FPL DECISION DESK</div><h1 className="text-3xl font-black tracking-[-.04em] text-white sm:text-4xl">Your next Gameweek,<br className="sm:hidden" /> in focus.</h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Start with the decisions that matter. Your team, budget and transfer ideas in one place.</p></div>
          {entry && <div className="rounded-2xl border border-white/10 bg-[#071521]/70 px-4 py-3 sm:min-w-52"><div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Planning for</div><div className="mt-1 flex items-center gap-2 font-bold text-white"><CalendarDays className="h-4 w-4 text-[#00FF87]" />{selectedEvent?.name ?? 'FPL Gameweek'}</div><div className="mt-1 text-xs text-slate-400">Deadline · {formatLocalDateTime(selectedEvent?.deadlineTime ?? null, 'Not announced')}</div></div>}
        </div>
      </header>

      <section className="rounded-xl border border-white/10 bg-[#0d1c2d] p-4 sm:p-5">
        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
          <label className="flex-1"><span className="mb-1.5 block text-xs font-semibold text-slate-300">FPL Team ID</span><input inputMode="numeric" value={entryId} onChange={(event) => setEntryId(event.target.value)} placeholder="For example: 1234567" className="w-full rounded-lg border border-white/10 bg-[#091726] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#00FF87]" /></label>
          <button type="submit" disabled={loading} className="self-end inline-flex items-center justify-center gap-2 rounded-lg bg-[#00FF87] px-5 py-2.5 text-sm font-bold text-[#051424] hover:bg-[#00e478] disabled:opacity-50"><Link2 className="h-4 w-4" />{loading ? 'Loading team…' : entry ? 'Refresh team' : 'Import team'}</button>
        </form>
        <p className="mt-2 text-xs text-slate-500">Find it in your FPL URL: fantasy.premierleague.com/entry/<strong>TEAM_ID</strong>/event/… Play XI reads public FPL data only and never asks for your FPL password.</p>
        {error && <p role="alert" className="mt-3 rounded-lg border border-rose-900 bg-rose-950/30 px-3 py-2 text-sm text-rose-200">{error}</p>}
        {userId && accountSyncMessage && <p aria-live="polite" className="mt-3 text-xs text-[#b4ffd0]">{accountSyncMessage}</p>}
      </section>

      {entry && bootstrap && <>
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/8 bg-[#0d1c2d] p-4 sm:p-5"><div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Manager</div><div className="mt-2 text-lg font-extrabold text-white">{entry.player_first_name} {entry.player_last_name}</div><div className="mt-0.5 text-xs text-slate-400">{entry.name}</div></div>
          <div className="rounded-2xl border border-white/8 bg-[#0d1c2d] p-4 sm:p-5"><div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Overall points</div><div className="mt-2 text-3xl font-black tracking-tight text-white">{rank(entry.summary_overall_points)}</div><div className="mt-0.5 text-xs text-slate-400">Rank #{rank(entry.summary_overall_rank)}</div></div>
          <div className="rounded-2xl border border-white/8 bg-[#0d1c2d] p-4 sm:p-5"><div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Latest Gameweek</div><div className="mt-2 text-3xl font-black tracking-tight text-[#00FF87]">{rank(entry.summary_event_points)}<span className="ml-1 text-sm font-bold text-slate-400">pts</span></div><div className="mt-0.5 text-xs text-slate-400">GW rank #{rank(entry.summary_event_rank)}</div></div>
          <div className="rounded-2xl border border-[#00FF87]/20 bg-[#0d1c2d] p-4 sm:p-5"><div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Available bank</div><div className="mt-2 text-3xl font-black tracking-tight text-white">{picks ? formatFplPrice((planningBankTenths ?? picks.entry_history.bank) / 10) : '—'}</div><div className="mt-0.5 text-xs text-slate-400">For position-matched moves</div></div>
        </section>

        {picks && <>
          {planningEventId !== null && <GameweekBrief
            bootstrap={bootstrap}
            playerById={playerById}
            eventId={planningEventId}
            fixtures={fixtures?.fixtures ?? EMPTY_FIXTURES}
            lineup={lineup}
            suggestion={suggestedPlan}
            recommendations={recommendations}
            canApply={picksAreForPreviousEvent}
            onApply={applySuggestedLineup}
          />}
          <section aria-labelledby="starting-xi-title" className="overflow-hidden rounded-3xl border border-white/10 bg-[#0d1c2d] shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-4 py-4 sm:px-6">
              <div><div className="mb-1 text-[10px] font-bold uppercase tracking-[.18em] text-[#00FF87]">{picksAreForPreviousEvent ? `Planning · ${selectedEvent?.name ?? 'Next Gameweek'}` : selectedEvent?.name ?? 'Next Gameweek'}</div><h2 id="starting-xi-title" className="text-xl font-black tracking-tight text-white sm:text-2xl">{picksAreForPreviousEvent ? manualPlan?.key === currentPlanKey ? 'Your planned XI' : 'Plan your starting XI' : 'Your starting XI'}</h2><p className="mt-1 text-xs text-slate-400">{picksAreForPreviousEvent ? manualPlan?.key === currentPlanKey ? `Your ${selectedEvent?.name ?? 'Gameweek'} plan is saved on this device. Latest published official picks: ${picksEventLabel}.` : `FPL has not published ${selectedEvent?.name ?? 'the upcoming Gameweek'} picks yet. Latest published official picks: ${picksEventLabel}. Set your own XI below; the plan stays on this device.` : 'Your official FPL lineup, including any automatic substitutions.'}</p></div>
              {picksAreForPreviousEvent && <button type="button" onClick={beginLineupEdit} className="rounded-lg border border-[#00FF87]/30 bg-[#00FF87]/10 px-3 py-2 text-xs font-bold text-[#b4ffd0] hover:bg-[#00FF87]/15">{manualPlan?.key === currentPlanKey ? 'Edit lineup' : 'Set lineup'}</button>}
              <div className="flex flex-wrap items-center gap-2"><span className="rounded-lg border border-white/10 bg-[#091726] px-3 py-2 text-xs font-bold text-white">{formation}</span><span className="rounded-lg border border-white/10 bg-[#091726] px-3 py-2 text-xs font-bold text-slate-200">GW {asOfEventId ?? '—'} pts · {startingScoredPoints === null ? '—' : startingScoredPoints}</span><span className="rounded-lg border border-[#00FF87]/15 bg-[#00FF87]/[.07] px-3 py-2 text-xs font-bold text-[#adffd0]">Next GW · {startingExpectedPoints.toFixed(1)} xP</span></div>
            </div>

            {editingLineup && <div className="border-b border-white/8 bg-[#091726]/70 p-4 sm:p-6">
              <div className="mb-4"><h3 className="font-bold text-white">Set your {selectedEvent?.name ?? 'Gameweek'} lineup</h3><p className="mt-1 text-xs leading-5 text-slate-400">Select 11 starters. FPL keeps upcoming picks private, so this plan is saved only in this browser and is never sent to FPL.</p></div>
              <div className="mb-4 rounded-xl border border-white/8 bg-[#0d1c2d] p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><h4 className="text-xs font-bold text-white">Choose formation</h4><p className="mt-1 text-[10px] text-slate-400">All legal FPL shapes. Players stay selected where possible.</p></div>
                  <button type="button" onClick={restoreOfficialLineup} className="rounded-lg border border-[#00FF87]/30 px-3 py-2 text-xs font-bold text-[#b4ffd0] hover:bg-[#00FF87]/10">Restore official FPL</button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2" aria-label="Available formations">
                  {FORMATIONS.map(({ defenders, midfielders, forwards }) => {
                    const label = `${defenders}-${midfielders}-${forwards}`;
                    const selected = draftFormation === label;
                    return <button key={label} type="button" aria-pressed={selected} onClick={() => applyFormation(defenders, midfielders, forwards)} className={`rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${selected ? 'border-[#00FF87] bg-[#00FF87] text-[#051424]' : 'border-white/10 bg-[#091726] text-slate-300 hover:border-[#00FF87]/40 hover:text-white'}`}>{label}</button>;
                  })}
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
                <div className="grid gap-2 sm:grid-cols-2">
                  {lineup.map((pick) => {
                    const player = playerById.get(pick.element);
                    if (!player) return null;
                    const selected = draftStarters.includes(pick.element);
                    return <label key={pick.element} className={`flex min-w-0 cursor-pointer items-center gap-2 rounded-xl border p-2.5 ${selected ? 'border-[#00FF87]/35 bg-[#00FF87]/[.06]' : 'border-white/8 bg-[#0d1c2d]'}`}>
                      <input type="checkbox" checked={selected} onChange={() => toggleStarter(pick.element)} className="h-4 w-4 accent-[#00FF87]" />
                      <PlayerPortrait photo={player.photo} name={player.webName} size="sm" />
                      <span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-white">{player.webName}</span><span className="flex items-center gap-1 text-[10px] text-slate-400"><TeamBadge code={player.teamCode} name={player.teamName} size={12} />{player.teamName} · {player.position}</span></span>
                      <span className="text-[10px] font-semibold text-slate-500">{selected ? 'XI' : 'Bench'}</span>
                    </label>;
                  })}
                </div>
                <div className="space-y-3">
                  <div className="rounded-xl border border-white/8 bg-[#0d1c2d] p-3">
                    <h4 className="mb-2 text-xs font-bold text-white">Bench order</h4>
                    <div className="space-y-1.5">{[...draftBench].sort((a, b) => Number(playerById.get(b)?.position === 'GKP') - Number(playerById.get(a)?.position === 'GKP')).map((id, index) => {
                      const player = playerById.get(id);
                      if (!player) return null;
                      const outfieldBenchPosition = draftBench.filter((benchId) => playerById.get(benchId)?.position !== 'GKP').indexOf(id) + 1;
                      return <div key={id} className="flex items-center gap-2 text-xs text-slate-300"><span className="w-8 text-slate-500">{player.position === 'GKP' ? 'GK' : `Sub ${outfieldBenchPosition}`}</span><span className="min-w-0 flex-1 truncate">{player.webName}</span><button type="button" disabled={player.position === 'GKP' || outfieldBenchPosition === 1} onClick={() => moveBench(id, -1)} aria-label={`Move ${player.webName} up the bench`} className="rounded px-2 py-1 text-slate-300 hover:bg-white/10 disabled:opacity-30">↑</button><button type="button" disabled={player.position === 'GKP' || outfieldBenchPosition === 3} onClick={() => moveBench(id, 1)} aria-label={`Move ${player.webName} down the bench`} className="rounded px-2 py-1 text-slate-300 hover:bg-white/10 disabled:opacity-30">↓</button></div>;
                    })}</div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[['Captain', draftCaptain, setDraftCaptain], ['Vice-captain', draftViceCaptain, setDraftViceCaptain]].map(([label, value, setter]) => <label key={String(label)} className="text-[10px] font-semibold text-slate-400">{String(label)}<select value={value == null ? '' : String(value)} onChange={(event) => (setter as (id: number | null) => void)(event.target.value ? Number(event.target.value) : null)} className="mt-1 block w-full rounded-lg border border-white/10 bg-[#091726] px-2 py-2 text-xs text-white">{draftStarters.map((id) => <option key={id} value={id}>{playerById.get(id)?.webName ?? `Player ${id}`}</option>)}</select></label>)}
                  </div>
                  <div className="flex flex-wrap items-center gap-2"><button type="button" onClick={saveLineup} className="rounded-lg bg-[#00FF87] px-4 py-2 text-xs font-bold text-[#051424] hover:bg-[#00e478]">Save plan</button><button type="button" onClick={() => setEditingLineup(false)} className="rounded-lg border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5">Cancel</button><span className="text-xs text-slate-500">{draftStarters.length}/11 starters · {draftBench.length}/4 bench</span></div>
                  {lineupMessage && <p role="status" className="text-xs text-amber-200">{lineupMessage}</p>}
                </div>
              </div>
            </div>}
            {!editingLineup && lineupMessage && <p role="status" className="px-4 pt-3 text-xs text-[#adffd0] sm:px-6">{lineupMessage}</p>}

            <div className="sport-pitch relative isolate mx-3 my-3 flex min-h-[450px] flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-emerald-200/25 bg-[linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(180deg,#07864f,#087446)] bg-[size:50%_100%,100%_25%] p-4 py-6 sm:mx-5 sm:my-5 sm:min-h-[560px] sm:gap-5 sm:p-7">
              <div aria-hidden="true" className="pointer-events-none absolute inset-3 rounded-xl border border-white/35" />
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-3 top-1/2 border-t border-white/30" />
              <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30 sm:h-32 sm:w-32" />
              <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-3 h-10 w-36 -translate-x-1/2 rounded-b-full border border-t-0 border-white/25 sm:h-14 sm:w-48" />
              <div aria-hidden="true" className="pointer-events-none absolute bottom-3 left-1/2 h-10 w-36 -translate-x-1/2 rounded-t-full border border-b-0 border-white/25 sm:h-14 sm:w-48" />
              {positionRows.map(({ position, picks: row }) => {
                return <div key={position} className="relative z-10 flex w-full items-center justify-around gap-1">
                  {row.map((pick) => {
                    const player = playerById.get(pick.element);
                    if (!player) return null;
                    const issue = fplAvailability(player);
                    const wasAutomaticallySubbedIn = automaticSubIns.has(pick.element);
                    return <div key={pick.element} className="flex w-[68px] min-w-0 flex-col items-center text-center sm:w-[86px]" aria-label={`${player.webName}, ${player.position}${wasAutomaticallySubbedIn ? ', automatic substitute' : ''}${pick.is_captain ? ', captain' : ''}${pick.is_vice_captain ? ', vice captain' : ''}${issue ? `, ${issue}` : ''}`}>
                      <div className="relative mb-[-7px]">
                        <PlayerPortrait photo={player.photo} name={player.webName} size="md" />
                        <span className="absolute -right-1 bottom-1 rounded-full bg-white p-0.5 shadow"><TeamBadge code={player.teamCode} name={player.teamName} size={16} /></span>
                        {(pick.is_captain || pick.is_vice_captain) && <span className="absolute -left-1 top-0 rounded-full bg-[#d9ff68] px-1.5 py-0.5 text-[9px] font-black text-[#15220a]">{pick.is_captain ? 'C' : 'VC'}</span>}
                        {issue && <span title={issue} className="absolute -right-1 -top-1 rounded-full bg-amber-300 p-0.5 text-[#291d04]"><ShieldAlert className="h-3 w-3" /></span>}
                      </div>
                      <div className="relative z-10 w-full rounded-lg border border-white/15 bg-[#071521]/90 px-1.5 pb-1.5 pt-2 shadow-lg">
                        <div className="truncate text-[10px] font-extrabold text-white sm:text-xs">{player.webName}</div>
                        {wasAutomaticallySubbedIn && <div className="text-[8px] font-black uppercase tracking-wider text-[#8bffb8]">Auto-sub</div>}
                        <div className="mt-1 space-y-0.5 font-mono text-[9px] font-bold leading-tight"><div className="text-slate-200">GW {asOfEventId ?? '—'} · {scoredPoints ? scoredPoints[pick.element] ?? 0 : '—'} pts</div><div className="text-[#8bffb8]">Next · {player.expectedPointsNext.toFixed(1)} xP</div></div>
                      </div>
                    </div>;
                  })}
                </div>;
              })}
            </div>

            <div className="border-t border-white/8 bg-[#091726]/80 p-4 sm:px-6">
              <div className="mb-3 flex items-center justify-between gap-3"><div><h3 className="text-sm font-bold text-white">Bench</h3><p className="text-[11px] text-slate-500">{manualPlan?.key === currentPlanKey ? 'Your saved substitute order' : 'Substitution order from your FPL picks'}</p></div><span className="text-xs font-semibold text-slate-400">{benchPicks.length} reserves</span></div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {benchPicks.map((pick) => {
                  const player = playerById.get(pick.element);
                  if (!player) return null;
                  const issue = fplAvailability(player);
                  return <div key={pick.element} className="flex min-w-0 items-center gap-2 rounded-xl border border-white/8 bg-[#0d1c2d] p-2.5">
                    <PlayerPortrait photo={player.photo} name={player.webName} size="sm" />
                    <div className="min-w-0"><div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{automaticSubOuts.has(pick.element) ? 'Auto-subbed out' : player.position === 'GKP' ? 'Reserve GK' : `Sub ${benchPicks.filter((candidate) => playerById.get(candidate.element)?.position !== 'GKP').findIndex((candidate) => candidate.element === pick.element) + 1}`}</div><div className="truncate text-xs font-bold text-white">{player.webName}</div><div className="flex items-center gap-1 text-[10px] text-slate-400"><TeamBadge code={player.teamCode} name={player.teamName} size={13} />{player.position}</div><div className="mt-1 font-mono text-[9px] font-bold leading-tight text-slate-200">GW {asOfEventId ?? '—'} · {scoredPoints ? scoredPoints[pick.element] ?? 0 : '—'} pts</div><div className="font-mono text-[9px] font-bold leading-tight text-[#8bffb8]">Next · {player.expectedPointsNext.toFixed(1)} xP</div></div>
                    {issue && <span title={issue} className="ml-auto text-amber-300"><ShieldAlert className="h-3.5 w-3.5" /></span>}
                  </div>;
                })}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-[#00FF87]/20 bg-[radial-gradient(ellipse_at_top_right,_rgba(0,255,135,.08),_transparent_50%),#0b1a29] p-4 sm:p-6">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><div className="mb-1 text-[10px] font-bold uppercase tracking-[.18em] text-[#00FF87]">Your free shortlist</div><h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">Transfer ideas to consider</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">Compare the outgoing and incoming player, expected-points difference and bank left after the move.</p></div><span className="rounded-full border border-[#00FF87]/20 bg-[#00FF87]/[.07] px-3 py-1.5 text-xs font-bold text-[#c4ffb4]">{recommendationList.length} of 3 free ideas</span></div>
            {recommendationsLoading ? <p className="rounded-2xl border border-white/8 bg-[#091726]/70 p-5 text-sm text-slate-300">Checking your squad against current FPL data…</p> : recommendationList.length ? <div className="grid gap-3 xl:grid-cols-3">{recommendationList.map((move, index) => {
              const bankAfter = (planningBankTenths ?? picks.entry_history.bank) / 10 + move.saleValue - move.incoming.cost;
              return <article key={`${move.outgoing.id}-${move.incoming.id}`} className="rounded-2xl border border-white/8 bg-[#091726]/85 p-4 transition hover:border-[#00FF87]/25 sm:p-5">
                <div className="mb-4 flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">IDEA {String(index + 1).padStart(2, '0')}</span><span className={`rounded-full px-2.5 py-1 font-mono text-xs font-bold ${move.delta >= 0 ? 'bg-[#00FF87]/10 text-[#a9ffc9]' : 'bg-amber-300/10 text-amber-200'}`}>{move.delta > 0 ? '+' : ''}{move.delta.toFixed(1)} xP</span></div>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl border border-white/6 bg-[#0d1c2d]/70 p-3 sm:gap-3 sm:p-4">
                  <div className="min-w-0"><div className="mb-2 flex items-center gap-2"><PlayerPortrait photo={move.outgoing.photo} name={move.outgoing.webName} size="sm" /><div className="min-w-0"><div className="text-[9px] font-bold uppercase tracking-widest text-rose-300/75">OUT · {move.outgoing.position}</div><div className="mt-1 truncate text-sm font-extrabold text-white">{move.outgoing.webName}</div></div></div><div className="flex items-center gap-1 truncate text-[10px] text-slate-400"><TeamBadge code={move.outgoing.teamCode} name={move.outgoing.teamName} size={16} />{move.outgoing.teamName}</div><div className="mt-2 text-xs font-semibold text-slate-300">{formatFplPrice(move.saleValue)} <span className="font-normal text-slate-500">sale value</span></div></div>
                  <ArrowRightLeft className="h-4 w-4 text-slate-500" />
                  <div className="min-w-0"><div className="mb-2 flex items-center gap-2"><PlayerPortrait photo={move.incoming.photo} name={move.incoming.webName} size="sm" /><div className="min-w-0"><div className="text-[9px] font-bold uppercase tracking-widest text-[#00FF87]/75">IN · {move.incoming.position}</div><div className="mt-1 truncate text-sm font-extrabold text-white">{move.incoming.webName}</div></div></div><div className="flex items-center gap-1 truncate text-[10px] text-slate-400"><TeamBadge code={move.incoming.teamCode} name={move.incoming.teamName} size={16} />{move.incoming.teamName}</div><div className="mt-2 text-xs font-semibold text-slate-300">{formatFplPrice(move.incoming.cost)} <span className="font-normal text-slate-500">price</span></div></div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl bg-white/[.035] p-3"><div className="text-[10px] text-slate-500">Next GW xP</div><div className="mt-1 font-mono font-bold text-slate-200">{move.outgoing.expectedPointsNext.toFixed(1)} → <span className="text-[#00FF87]">{move.incoming.expectedPointsNext.toFixed(1)}</span></div></div><div className="rounded-xl bg-white/[.035] p-3"><div className="text-[10px] text-slate-500">Bank after move</div><div className="mt-1 font-mono font-bold text-white">{formatFplPrice(bankAfter)}</div></div></div>
                <div className="mt-4 border-t border-white/6 pt-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">Five reasons behind this idea</h3>
                  <ol className="mt-2 space-y-2">{move.reasons.map((reason, reasonIndex) => <li key={`${reasonIndex}-${reason}`} className="flex gap-2.5 rounded-lg bg-white/[.025] px-2.5 py-2 text-[11px] leading-5 text-slate-300"><span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#00FF87]/10 font-mono text-[9px] font-bold text-[#00FF87]">{reasonIndex + 1}</span><span>{reason}</span></li>)}</ol>
                </div>
              </article>;
            })}</div> : <p className="rounded-2xl border border-white/8 bg-[#091726]/70 p-5 text-sm leading-6 text-slate-300">{recommendationEmptyMessage}</p>}
            {recommendations && recommendations.lockedCount > 0 && <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/[.04] p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="font-semibold text-white">{recommendations.lockedCount} more transfer {recommendations.lockedCount === 1 ? 'idea' : 'ideas'} available</div><p className="mt-1 text-xs text-slate-400">One-time Gameweek unlock · ₹29 · no subscription</p></div><button type="button" disabled aria-describedby="unlock-payment-note" className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-400">Payments coming later <span aria-hidden="true">↗</span></button><span id="unlock-payment-note" className="sr-only">Payments are not available yet.</span></div>}
            {recommendationSnapshot && <p className="mt-3 text-[11px] text-slate-500">First {recommendationSnapshot.ideas.length} free {recommendationSnapshot.ideas.length === 1 ? 'idea' : 'ideas'} for Gameweek {recommendationSnapshot.eventId} saved on this device at {formatLocalDateTime(recommendationSnapshot.capturedAt, 'first visit')}. This keeps a dated record for a future advice scorecard; it is not a verified outcome yet.</p>}
            <p className="mt-4 text-[11px] leading-5 text-slate-500">Reasons use FPL expected points, form, fixture difficulty, season totals, availability and card data. FPL projections and difficulty ratings are estimates; red cards show season history, not a prediction. Sale values are estimated from transfer history and price-change rules. Hits and chip strategy are not included. Advice only; Play XI never submits transfers.</p>
          </section>

        </>}

        <div className="flex flex-wrap gap-2"><button onClick={onBrowsePlayers} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#0d1c2d] px-4 py-2 text-sm font-semibold text-slate-200 hover:border-[#00FF87]/40 hover:text-white"><Users className="h-4 w-4 text-[#00FF87]" />Explore player stats</button><button onClick={onBrowseFixtures} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#0d1c2d] px-4 py-2 text-sm font-semibold text-slate-200 hover:border-[#00FF87]/40 hover:text-white"><ArrowRightLeft className="h-4 w-4 text-[#00FF87]" />Plan with fixtures</button></div>
      </>}
      {!entry && !loading && !error && <div className="rounded-xl border border-dashed border-white/15 bg-[#0d1c2d]/70 p-8 text-center"><Users className="mx-auto mb-3 h-7 w-7 text-[#00FF87]" /><h2 className="font-bold text-white">Connect your FPL squad</h2><p className="mx-auto mt-1 max-w-lg text-sm text-slate-400">Enter your public Team ID above. Play XI will load your real squad and tailor transfer suggestions to your budget and positions.</p></div>}
    </main>
  );
}
