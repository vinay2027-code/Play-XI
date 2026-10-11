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

const loadBootstrap = cacheFor(5 * 60 * 1000, async () => {
  const payload = await fetchFpl('bootstrap-static/');
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
        firstName: player.first_name,
        secondName: player.second_name,
        webName: player.web_name,
        teamId: player.team,
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

app.get('/api/fpl/entry/:entryId', async (request, response) => {
  const entryId = Number(request.params.entryId);
  if (!Number.isSafeInteger(entryId) || entryId < 1) {
    response.status(400).json({ error: 'Enter a valid FPL Team ID.' });
    return;
  }
  try {
    response.set('Cache-Control', 'private, max-age=30');
    response.json(await fetchFpl(`entry/${entryId}/`));
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
    response.json(await fetchFpl(`entry/${entryId}/event/${eventId}/picks/`));
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
    response.json(await fetchFpl(`entry/${entryId}/transfers/`));
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
