import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const fplApi = 'https://fantasy.premierleague.com/api';
const app = express();

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function fetchFpl(pathname) {
  let response;
  try {
    response = await fetch(`${fplApi}/${pathname}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'PlayXI/1.0 (+https://play-xi.onrender.com)',
      },
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new ApiError(502, 'Could not reach Fantasy Premier League. Please try again shortly.');
  }

  if (response.status === 404) throw new ApiError(404, 'That FPL team or gameweek could not be found.');
  if (response.status === 429) throw new ApiError(503, 'FPL is receiving too many requests. Please try again shortly.');
  if (!response.ok) throw new ApiError(502, `Fantasy Premier League returned an error (${response.status}).`);
  return response.json();
}

function cacheFor(durationMs, load) {
  let entry;
  let pending;
  return async () => {
    if (entry && entry.expiresAt > Date.now()) return entry.value;
    if (pending) return pending;
    pending = load()
      .then((value) => {
        entry = { value, expiresAt: Date.now() + durationMs };
        return value;
      })
      .finally(() => { pending = undefined; });
    return pending;
  };
}

const fplResponseCache = new Map();
async function fetchFplCached(pathname, durationMs = 30_000) {
  const cached = fplResponseCache.get(pathname);
  if (cached?.expiresAt > Date.now()) return cached.value;
  if (cached?.pending) return cached.pending;

  const pending = fetchFpl(pathname)
    .then((value) => {
      fplResponseCache.set(pathname, { value, expiresAt: Date.now() + durationMs });
      return value;
    })
    .catch((error) => {
      fplResponseCache.delete(pathname);
      throw error;
    });
  fplResponseCache.set(pathname, { pending, expiresAt: 0 });
  if (fplResponseCache.size > 500) {
    for (const [key, value] of fplResponseCache) {
      if (!value.pending) fplResponseCache.delete(key);
      if (fplResponseCache.size <= 500) break;
    }
  }
  return pending;
}

const loadBootstrap = cacheFor(5 * 60 * 1000, async () => {
  const payload = await fetchFplCached('bootstrap-static/', 5 * 60 * 1000);
  const teams = new Map((payload.teams || []).map((team) => [team.id, team]));
  const positions = new Map((payload.element_types || []).map((position) => [position.id, position.singular_name_short]));
  return {
    fetchedAt: new Date().toISOString(),
    currentEvent: (payload.events || []).find((event) => event.is_current)?.id ?? null,
    nextEvent: (payload.events || []).find((event) => event.is_next)?.id ?? null,
    events: (payload.events || []).map((event) => ({
      id: event.id,
      name: event.name,
      deadlineTime: event.deadline_time,
      finished: event.finished,
      isCurrent: event.is_current,
      isNext: event.is_next,
    })),
    teams: (payload.teams || []).map((team) => ({
      id: team.id,
      name: team.name,
      shortName: team.short_name,
      code: team.code,
    })),
    players: (payload.elements || []).map((player) => {
      const team = teams.get(player.team);
      return {
        id: player.id,
        code: player.code,
        photo: player.photo,
        firstName: player.first_name,
        secondName: player.second_name,
        webName: player.web_name,
        teamId: player.team,
        teamCode: team?.code ?? null,
        teamName: team?.name || 'Unknown team',
        teamShortName: team?.short_name || '—',
        position: positions.get(player.element_type) || '—',
        cost: Number(player.now_cost) / 10,
        costTenths: player.now_cost,
        costChangeStart: Number(player.cost_change_start) || 0,
        form: Number(player.form) || 0,
        totalPoints: Number(player.total_points) || 0,
        pointsPerGame: Number(player.points_per_game) || 0,
        selectedByPercent: Number(player.selected_by_percent) || 0,
        expectedPointsNext: Number(player.ep_next) || 0,
        expectedPointsThis: Number(player.ep_this) || 0,
        minutes: Number(player.minutes) || 0,
        goals: Number(player.goals_scored) || 0,
        assists: Number(player.assists) || 0,
        cleanSheets: Number(player.clean_sheets) || 0,
        expectedGoals: Number(player.expected_goals) || 0,
        expectedAssists: Number(player.expected_assists) || 0,
        bonus: Number(player.bonus) || 0,
        ictIndex: Number(player.ict_index) || 0,
        status: player.status,
        chanceOfPlayingNext: player.chance_of_playing_next_round,
        news: player.news || '',
        newsAdded: player.news_added,
      };
    }),
  };
});

const loadFixtures = cacheFor(5 * 60 * 1000, async () => {
  const [payload, bootstrap] = await Promise.all([
    fetchFpl('fixtures/'),
    loadBootstrap(),
  ]);
  const teams = new Map(bootstrap.teams.map((team) => [team.id, team]));
  return {
    fetchedAt: new Date().toISOString(),
    fixtures: (payload || []).map((fixture) => ({
      id: fixture.id,
      event: fixture.event,
      kickoffTime: fixture.kickoff_time,
      finished: fixture.finished,
      started: fixture.started,
      homeTeam: teams.get(fixture.team_h)?.name || 'Unknown team',
      homeTeamShort: teams.get(fixture.team_h)?.shortName || '—',
      homeTeamId: fixture.team_h,
      awayTeam: teams.get(fixture.team_a)?.name || 'Unknown team',
      awayTeamShort: teams.get(fixture.team_a)?.shortName || '—',
      awayTeamId: fixture.team_a,
      homeScore: fixture.team_h_score,
      awayScore: fixture.team_a_score,
      homeDifficulty: fixture.team_h_difficulty,
      awayDifficulty: fixture.team_a_difficulty,
    })),
  };
});

function getSellingValueTenths(player, transfers, targetEventId) {
  const latestBuy = transfers
    .filter((transfer) => transfer.element_in === player.id && transfer.event <= targetEventId)
    .sort((a, b) => a.event - b.event || a.time.localeCompare(b.time))
    .at(-1);
  const purchaseCost = latestBuy?.element_in_cost ?? player.now_cost - (Number(player.cost_change_start) || 0);
  if (!Number.isFinite(purchaseCost) || purchaseCost < 0) return null;
  return player.now_cost > purchaseCost
    ? purchaseCost + Math.floor((player.now_cost - purchaseCost) / 2)
    : player.now_cost;
}

function getUpcomingFixtures(player, fixtures, targetEventId) {
  return fixtures
    .filter((fixture) => fixture.event !== null && fixture.event >= targetEventId && fixture.event < targetEventId + 3
      && (fixture.homeTeamId === player.team || fixture.awayTeamId === player.team))
    .sort((a, b) => (a.event - b.event) || String(a.kickoffTime || '').localeCompare(String(b.kickoffTime || '')))
    .map((fixture) => {
      const isHome = fixture.homeTeamId === player.team;
      return {
        label: `${isHome ? fixture.awayTeamShort : fixture.homeTeamShort} (${isHome ? 'H' : 'A'})`,
        difficulty: isHome ? fixture.homeDifficulty : fixture.awayDifficulty,
        event: fixture.event,
      };
    });
}

function fixtureOutlook(player, fixtures, targetEventId, teamNames) {
  const upcoming = getUpcomingFixtures(player, fixtures, targetEventId);
  if (!upcoming.length) return `${teamNames.get(player.team) || player.web_name}: no published fixtures in the next 3 GWs`;
  const average = upcoming.reduce((total, fixture) => total + fixture.difficulty, 0) / upcoming.length;
  const list = upcoming.map((fixture) => `${fixture.label} ${fixture.difficulty}`).join(', ');
  return `${teamNames.get(player.team) || player.web_name}: avg FDR ${average.toFixed(1)} (${list})`;
}

function availabilityAndDiscipline(player) {
  const statusLabels = { a: 'available', d: 'doubtful', i: 'injured', s: 'suspended', u: 'unavailable', n: 'not in squad' };
  const availability = statusLabels[player.status] || 'status not supplied';
  const chance = player.chance_of_playing_next_round === null || player.chance_of_playing_next_round === undefined
    ? ''
    : `, ${player.chance_of_playing_next_round}% chance`;
  const reds = Number.isFinite(Number(player.red_cards)) ? Number(player.red_cards) : null;
  const yellows = Number.isFinite(Number(player.yellow_cards)) ? Number(player.yellow_cards) : null;
  const cards = `${reds === null ? 'cards n/a' : `${reds} red`}${yellows === null ? '' : `, ${yellows} yellow`}`;
  return `${player.web_name}: ${availability}${chance}; ${cards}`;
}

function transferInsights(outgoing, incoming, fixtures, targetEventId, teamNames, delta) {
  const fixtureText = `Fixtures · next 3 GWs — ${fixtureOutlook(incoming, fixtures, targetEventId, teamNames)} vs ${fixtureOutlook(outgoing, fixtures, targetEventId, teamNames)}`;
  const points = (player) => `${Number(player.ep_next || 0).toFixed(1)} xP`;
  const form = (player) => Number(player.form || 0).toFixed(1);
  const production = (player) => `${Number(player.total_points || 0)} pts, ${Number(player.points_per_game || 0).toFixed(1)} PPG, ${Number(player.starts || 0)} starts, ${Number(player.goals_scored || 0)} goals, ${Number(player.assists || 0)} assists`;
  return [
    `Expected points · ${outgoing.web_name} ${points(outgoing)} → ${incoming.web_name} ${points(incoming)} (${delta > 0 ? '+' : ''}${delta.toFixed(1)} projected next-GW points)`,
    `Recent form · ${outgoing.web_name} ${form(outgoing)} → ${incoming.web_name} ${form(incoming)} (FPL form)`,
    fixtureText,
    `Season performance · ${outgoing.web_name}: ${production(outgoing)} → ${incoming.web_name}: ${production(incoming)}`,
    `Availability & cards · ${outgoing.web_name}: ${availabilityAndDiscipline(outgoing)} → ${incoming.web_name}: ${availabilityAndDiscipline(incoming)}`,
  ];
}

function buildTransferIdeas(bootstrap, picksData, transfers, bankTenths, targetEventId, fixtures = []) {
  const playerById = new Map(bootstrap.elements.map((player) => [player.id, player]));
  const teamById = new Map(bootstrap.teams.map((team) => [team.id, team]));
  const teamNames = new Map(bootstrap.teams.map((team) => [team.id, team.name]));
  const positions = new Map(bootstrap.element_types.map((position) => [position.id, position.singular_name_short]));
  const ownedIds = new Set(picksData.picks.map((pick) => pick.element));
  const teamCounts = new Map();
  for (const pick of picksData.picks) {
    const player = playerById.get(pick.element);
    if (player) teamCounts.set(player.team, (teamCounts.get(player.team) || 0) + 1);
  }
  const overLimitTeams = new Set([...teamCounts].filter(([, count]) => count > 3).map(([teamId]) => teamId));
  const alternatives = bootstrap.elements.filter((player) =>
    !ownedIds.has(player.id)
    && !['i', 's', 'u'].includes(player.status)
    && (player.status !== 'd' || (player.chance_of_playing_next_round ?? 0) >= 50),
  );
  const bestByOutgoing = new Map();

  for (const pick of picksData.picks) {
    const outgoing = playerById.get(pick.element);
    if (!outgoing || (overLimitTeams.size && !overLimitTeams.has(outgoing.team))) continue;
    const saleValueTenths = getSellingValueTenths(outgoing, transfers, targetEventId);
    if (saleValueTenths === null) continue;
    const saleValue = saleValueTenths / 10;
    const budget = saleValueTenths + bankTenths;
    const needsReplacement = ['i', 's', 'u'].includes(outgoing.status)
      || (outgoing.status === 'd' && (outgoing.chance_of_playing_next_round ?? 0) < 50);

    for (const incoming of alternatives) {
      if (incoming.element_type !== outgoing.element_type || incoming.now_cost > budget) continue;
      const clubCount = teamCounts.get(incoming.team) || 0;
      if (clubCount + (incoming.team === outgoing.team ? 0 : 1) > 3) continue;
      const delta = Number(incoming.ep_next || 0) - Number(outgoing.ep_next || 0);
      if (delta <= 0 && !needsReplacement) continue;
      const move = {
        outgoing: {
          id: outgoing.id, webName: outgoing.web_name, teamName: teamNames.get(outgoing.team) || 'Unknown team',
          photo: outgoing.photo, teamCode: teamById.get(outgoing.team)?.code ?? null,
          position: positions.get(outgoing.element_type) || '—', cost: outgoing.now_cost / 10,
          expectedPointsNext: Number(outgoing.ep_next || 0), status: outgoing.status,
          chanceOfPlayingNext: outgoing.chance_of_playing_next_round ?? null,
        },
        incoming: {
          id: incoming.id, webName: incoming.web_name, teamName: teamNames.get(incoming.team) || 'Unknown team',
          photo: incoming.photo, teamCode: teamById.get(incoming.team)?.code ?? null,
          position: positions.get(incoming.element_type) || '—', cost: incoming.now_cost / 10,
          expectedPointsNext: Number(incoming.ep_next || 0), form: Number(incoming.form || 0),
        },
        delta,
        saleValue,
        incomingForm: Number(incoming.form || 0),
        incomingPlayer: incoming,
        outgoingPlayer: outgoing,
      };

      const currentBest = bestByOutgoing.get(outgoing.id);
      if (!currentBest || move.delta > currentBest.delta || (move.delta === currentBest.delta && move.incomingForm > currentBest.incomingForm)) {
        bestByOutgoing.set(outgoing.id, move);
      }
    }
  }

  return [...bestByOutgoing.values()]
    .sort((a, b) => b.delta - a.delta || b.incomingForm - a.incomingForm || a.outgoing.webName.localeCompare(b.outgoing.webName))
    .slice(0, 8)
    .map(({ incomingForm, incomingPlayer, outgoingPlayer, ...move }) => ({
      ...move,
      reasons: transferInsights(outgoingPlayer, incomingPlayer, fixtures, targetEventId, teamNames, move.delta),
    }));
}

async function loadTransferPreview(entryId) {
  const [bootstrap, entry, transferPayload, fixturePayload] = await Promise.all([
    fetchFplCached('bootstrap-static/', 5 * 60 * 1000),
    fetchFplCached(`entry/${entryId}/`),
    fetchFplCached(`entry/${entryId}/transfers/`, 60_000),
    loadFixtures().catch(() => ({ fixtures: [] })),
  ]);
  const currentEvent = (bootstrap.events || []).find((event) => event.is_current);
  const currentDeadlineIsOpen = Boolean(currentEvent && new Date(currentEvent.deadline_time).getTime() > Date.now());
  const targetEventId = currentDeadlineIsOpen
    ? currentEvent.id
    : (bootstrap.events || []).find((event) => event.is_next)?.id ?? currentEvent?.id ?? entry.current_event;
  if (!targetEventId) throw new ApiError(503, 'FPL has not published a gameweek to plan yet.');

  let picksData;
  let picksEventId = targetEventId;
  try {
    picksData = await fetchFplCached(`entry/${entryId}/event/${targetEventId}/picks/`);
  } catch (error) {
    const fallbackEvent = (bootstrap.events || [])
      .filter((event) => event.finished && event.id < targetEventId)
      .sort((a, b) => b.id - a.id)[0]?.id;
    if (!fallbackEvent) throw error;
    picksData = await fetchFplCached(`entry/${entryId}/event/${fallbackEvent}/picks/`);
    picksEventId = fallbackEvent;
  }

  let bankTenths = picksData.entry_history.bank;
  if (picksEventId < targetEventId) {
    const intervening = transferPayload
      .filter((transfer) => transfer.event > picksEventId && transfer.event <= targetEventId)
      .sort((a, b) => a.event - b.event || a.time.localeCompare(b.time));
    const updatedPicks = picksData.picks.slice();
    for (const transfer of intervening) {
      const outgoingIndex = updatedPicks.findIndex((pick) => pick.element === transfer.element_out);
      if (outgoingIndex >= 0) {
        updatedPicks[outgoingIndex] = { ...updatedPicks[outgoingIndex], element: transfer.element_in };
        bankTenths += transfer.element_out_cost - transfer.element_in_cost;
      }
    }
    picksData = { ...picksData, picks: updatedPicks };
  }

  const ideas = buildTransferIdeas(bootstrap, picksData, transferPayload, bankTenths, targetEventId, fixturePayload.fixtures);
  return {
    eventId: targetEventId,
    freeIdeas: ideas.slice(0, 3),
    lockedCount: Math.min(5, Math.max(0, ideas.length - 3)),
    availableCount: ideas.length,
  };
}

app.get('/api/fpl/bootstrap', async (_request, response) => {
  try {
    response.set('Cache-Control', 'public, max-age=60');
    response.json(await loadBootstrap());
  } catch (error) {
    response.status(error instanceof ApiError ? error.status : 502).json({
      error: error instanceof Error ? error.message : 'Unable to load FPL data.',
    });
  }
});

app.get('/api/fpl/fixtures', async (_request, response) => {
  try {
    response.set('Cache-Control', 'public, max-age=60');
    response.json(await loadFixtures());
  } catch (error) {
    response.status(error instanceof ApiError ? error.status : 502).json({
      error: error instanceof Error ? error.message : 'Unable to load FPL fixtures.',
    });
  }
});

app.get('/api/fpl/entry/:entryId/recommendations', async (request, response) => {
  const entryId = Number(request.params.entryId);
  if (!Number.isSafeInteger(entryId) || entryId < 1) {
    response.status(400).json({ error: 'Enter a valid FPL Team ID.' });
    return;
  }
  try {
    response.set('Cache-Control', 'private, max-age=30');
    response.json(await loadTransferPreview(entryId));
  } catch (error) {
    response.status(error instanceof ApiError ? error.status : 502).json({
      error: error instanceof Error ? error.message : 'Unable to calculate transfer ideas for this team.',
    });
  }
});

app.get('/api/fpl/entry/:entryId', async (request, response) => {
  const entryId = Number(request.params.entryId);
  if (!Number.isSafeInteger(entryId) || entryId < 1) {
    response.status(400).json({ error: 'Enter a valid FPL Team ID.' });
    return;
  }
  try {
    response.set('Cache-Control', 'private, max-age=30');
    response.json(await fetchFplCached(`entry/${entryId}/`));
  } catch (error) {
    response.status(error instanceof ApiError ? error.status : 502).json({
      error: error instanceof Error ? error.message : 'Unable to load that FPL team.',
    });
  }
});

app.get('/api/fpl/entry/:entryId/event/:eventId/picks', async (request, response) => {
  const entryId = Number(request.params.entryId);
  const eventId = Number(request.params.eventId);
  if (!Number.isSafeInteger(entryId) || entryId < 1 || !Number.isSafeInteger(eventId) || eventId < 1) {
    response.status(400).json({ error: 'Enter a valid FPL Team ID and gameweek.' });
    return;
  }
  try {
    response.set('Cache-Control', 'private, max-age=30');
    response.json(await fetchFplCached(`entry/${entryId}/event/${eventId}/picks/`));
  } catch (error) {
    response.status(error instanceof ApiError ? error.status : 502).json({
      error: error instanceof Error ? error.message : 'Unable to load this FPL team’s picks.',
    });
  }
});

app.get('/api/fpl/entry/:entryId/transfers', async (request, response) => {
  const entryId = Number(request.params.entryId);
  if (!Number.isSafeInteger(entryId) || entryId < 1) {
    response.status(400).json({ error: 'Enter a valid FPL Team ID.' });
    return;
  }
  try {
    response.set('Cache-Control', 'private, max-age=60');
    response.json(await fetchFplCached(`entry/${entryId}/transfers/`, 60_000));
  } catch (error) {
    response.status(error instanceof ApiError ? error.status : 502).json({
      error: error instanceof Error ? error.message : 'Unable to load this FPL team’s transfer history.',
    });
  }
});

if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(root, 'dist');
  app.use(express.static(distPath));
  app.get('*', (_request, response) => response.sendFile(path.join(distPath, 'index.html')));
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({
    configFile: path.join(root, 'vite.config.ts'),
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Play XI server listening on port ${port}`);
});
