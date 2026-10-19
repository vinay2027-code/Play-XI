const footballDataBase = 'https://api.football-data.org/v4';
const sportsDbBase = 'https://www.thesportsdb.com/api/v1/json/123';

const leagues = [
  { code: 'PL', name: 'Premier League', country: 'England', sportsDbId: '4328' },
  { code: 'PD', name: 'La Liga', country: 'Spain', sportsDbId: '4335' },
  { code: 'BL1', name: 'Bundesliga', country: 'Germany', sportsDbId: '4331' },
  { code: 'SA', name: 'Serie A', country: 'Italy', sportsDbId: '4332' },
  { code: 'FL1', name: 'Ligue 1', country: 'France', sportsDbId: '4334' },
  { code: 'CL', name: 'Champions League', country: 'Europe', sportsDbId: '4480' },
];

const responseCache = new Map();
async function cached(key, lifetime, loader) {
  const current = responseCache.get(key);
  if (current?.expires > Date.now()) return current.value;
  if (current?.pending) return current.pending;
  const pending = loader().then((value) => {
    responseCache.set(key, { value, expires: Date.now() + lifetime });
    return value;
  }).catch((error) => {
    responseCache.delete(key);
    throw error;
  });
  responseCache.set(key, { pending, expires: 0 });
  if (responseCache.size > 100) {
    for (const [oldKey, item] of responseCache) {
      if (!item.pending) responseCache.delete(oldKey);
      if (responseCache.size <= 100) break;
    }
  }
  return pending;
}

async function getJson(url, headers = {}) {
  const response = await fetch(url, {
    headers: { Accept: 'application/json', ...headers },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`Data provider returned ${response.status}`);
  return response.json();
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalMatch(match, provider) {
  if (provider === 'football-data.org') {
    return {
      id: String(match.id),
      kickoff: match.utcDate ?? null,
      status: match.status ?? 'SCHEDULED',
      round: match.matchday ?? null,
      home: match.homeTeam?.name ?? 'TBC',
      away: match.awayTeam?.name ?? 'TBC',
      homeId: String(match.homeTeam?.id ?? ''),
      awayId: String(match.awayTeam?.id ?? ''),
      homeScore: numberOrNull(match.score?.fullTime?.home),
      awayScore: numberOrNull(match.score?.fullTime?.away),
    };
  }
  return {
    id: String(match.idEvent),
    kickoff: match.strTimestamp ? `${match.strTimestamp.replace(' ', 'T').replace(/Z$/, '')}Z` : null,
    status: match.strStatus === 'NS' ? 'SCHEDULED' : match.strStatus === 'FT' ? 'FINISHED' : match.strStatus || 'SCHEDULED',
    round: numberOrNull(match.intRound),
    home: match.strHomeTeam || 'TBC',
    away: match.strAwayTeam || 'TBC',
    homeId: String(match.idHomeTeam ?? ''),
    awayId: String(match.idAwayTeam ?? ''),
    homeScore: numberOrNull(match.intHomeScore),
    awayScore: numberOrNull(match.intAwayScore),
  };
}

function normalStanding(row, provider) {
  const team = provider === 'football-data.org' ? row.team : row;
  return {
    id: String(provider === 'football-data.org' ? team.id : row.idTeam),
    name: provider === 'football-data.org' ? team.name : row.strTeam,
    position: numberOrNull(provider === 'football-data.org' ? row.position : row.intRank),
    played: numberOrNull(provider === 'football-data.org' ? row.playedGames : row.intPlayed),
    won: numberOrNull(provider === 'football-data.org' ? row.won : row.intWin),
    drawn: numberOrNull(provider === 'football-data.org' ? row.draw : row.intDraw),
    lost: numberOrNull(provider === 'football-data.org' ? row.lost : row.intLoss),
    goalsFor: numberOrNull(provider === 'football-data.org' ? row.goalsFor : row.intGoalsFor),
    goalsAgainst: numberOrNull(provider === 'football-data.org' ? row.goalsAgainst : row.intGoalsAgainst),
    goalDifference: numberOrNull(provider === 'football-data.org' ? row.goalDifference : row.intGoalDifference),
    points: numberOrNull(provider === 'football-data.org' ? row.points : row.intPoints),
    form: provider === 'football-data.org' ? row.form ?? null : row.strForm ?? null,
  };
}

async function footballDataLeague(league) {
  const headers = { 'X-Auth-Token': process.env.FOOTBALL_DATA_TOKEN };
  const [matchesData, standingsData] = await Promise.all([
    getJson(`${footballDataBase}/competitions/${league.code}/matches`, headers),
    league.code === 'CL' ? Promise.resolve({ standings: [] }) : getJson(`${footballDataBase}/competitions/${league.code}/standings`, headers),
  ]);
  const table = standingsData.standings?.find((item) => item.type === 'TOTAL')?.table ?? [];
  return {
    league: { code: league.code, name: league.name, country: league.country },
    provider: 'football-data.org',
    attribution: 'Football data provided by the Football-Data.org API',
    coverageNote: 'Free scores may be delayed. Player statistics are not included in this provider’s free tier.',
    fetchedAt: new Date().toISOString(),
    matches: (matchesData.matches ?? []).map((match) => normalMatch(match, 'football-data.org')),
    standings: table.map((row) => normalStanding(row, 'football-data.org')),
  };
}

async function sportsDbLeague(league) {
  if (!league.sportsDbId) throw new Error('This competition needs a football-data.org key.');
  const [nextData, previousData, tableData] = await Promise.all([
    getJson(`${sportsDbBase}/eventsnextleague.php?id=${league.sportsDbId}`),
    getJson(`${sportsDbBase}/eventspastleague.php?id=${league.sportsDbId}`),
    getJson(`${sportsDbBase}/lookuptable.php?l=${league.sportsDbId}`),
  ]);
  const matches = [...(nextData.events ?? []), ...(previousData.events ?? [])];
  return {
    league: { code: league.code, name: league.name, country: league.country },
    provider: 'TheSportsDB',
    attribution: 'Data from TheSportsDB',
    coverageNote: 'Free preview: only one upcoming match, one recent result and five table rows are supplied. Scores may be delayed.',
    fetchedAt: new Date().toISOString(),
    matches: [...new Map(matches.map((match) => [match.idEvent, normalMatch(match, 'TheSportsDB')])).values()],
    standings: (tableData.table ?? []).map((row) => normalStanding(row, 'TheSportsDB')),
  };
}

function poisson(lambda, goals) {
  let probability = Math.exp(-lambda);
  for (let index = 1; index <= goals; index += 1) probability *= lambda / index;
  return probability;
}

function forecast(match, standings) {
  const home = standings.find((team) => team.id === match.homeId);
  const away = standings.find((team) => team.id === match.awayId);
  if (!home || !away || (home.played ?? 0) < 4 || (away.played ?? 0) < 4) return null;
  const homeGoals = home.goalsFor / home.played;
  const awayGoals = away.goalsFor / away.played;
  const homeConceded = home.goalsAgainst / home.played;
  const awayConceded = away.goalsAgainst / away.played;
  const expectedHome = Math.min(3.5, Math.max(0.25, (homeGoals + awayConceded) / 2 * 1.12));
  const expectedAway = Math.min(3.5, Math.max(0.25, (awayGoals + homeConceded) / 2 / 1.12));
  const outcomes = [0, 0, 0];
  let bestScore = { home: 0, away: 0, probability: 0 };
  for (let h = 0; h <= 9; h += 1) {
    for (let a = 0; a <= 9; a += 1) {
      const probability = poisson(expectedHome, h) * poisson(expectedAway, a);
      outcomes[h > a ? 0 : h === a ? 1 : 2] += probability;
      if (probability > bestScore.probability) bestScore = { home: h, away: a, probability };
    }
  }
  const total = outcomes.reduce((sum, value) => sum + value, 0);
  return {
    home: Math.round(outcomes[0] / total * 100),
    draw: Math.round(outcomes[1] / total * 100),
    away: Math.round(outcomes[2] / total * 100),
    likelyScore: `${bestScore.home}–${bestScore.away}`,
    explanation: `Based on season goals scored and conceded after ${home.played} and ${away.played} matches, with a small home advantage.`,
    methodology: 'Experimental Poisson estimate; not a betting tip or calibrated odds.',
  };
}

async function loadLeague(league) {
  return cached(`league:${league.code}`, 5 * 60_000, async () => {
    let data;
    if (process.env.FOOTBALL_DATA_TOKEN) {
      try {
        data = await footballDataLeague(league);
      } catch (error) {
        if (!league.sportsDbId) throw error;
      }
    }
    data ??= await sportsDbLeague(league);
    const now = Date.now();
    data.matches = data.matches
      .sort((a, b) => String(a.kickoff).localeCompare(String(b.kickoff)))
      .filter((match) => {
        const kickoff = Date.parse(match.kickoff ?? '');
        return Number.isFinite(kickoff) && kickoff >= now - 14 * 86400_000 && kickoff <= now + 30 * 86400_000
          && !(match.status === 'SCHEDULED' && kickoff < now - 6 * 60 * 60_000);
      });
    data.predictions = data.matches.filter((match) => match.status === 'SCHEDULED' || match.status === 'TIMED')
      .map((match) => ({ matchId: match.id, forecast: forecast(match, data.standings) }))
      .filter((item) => item.forecast);
    return data;
  });
}

async function loadTeamPlayers(league, teamId) {
  const leagueData = await loadLeague(league);
  const knownTeam = leagueData.standings.some((team) => team.id === teamId)
    || leagueData.matches.some((match) => match.homeId === teamId || match.awayId === teamId);
  if (!knownTeam) return null;
  return cached(`players:${leagueData.provider}:${teamId}`, 24 * 60 * 60_000, async () => {
    if (leagueData.provider === 'football-data.org') {
      const team = await getJson(`${footballDataBase}/teams/${teamId}`, { 'X-Auth-Token': process.env.FOOTBALL_DATA_TOKEN });
      return {
        players: (team.squad ?? []).map((player) => ({
          id: String(player.id), name: player.name, position: player.position || 'Player',
          nationality: player.nationality || null, number: player.shirtNumber || null,
        })),
        coverageNote: 'Squad names come from football-data.org. Individual season statistics are not included in its free tier.',
      };
    }
    const roster = await getJson(`${sportsDbBase}/lookup_all_players.php?id=${teamId}`);
    return {
      players: (roster.player ?? [])
        .filter((player) => player.strStatus === 'Active' && !/coach|manager/i.test(player.strPosition ?? ''))
        .map((player) => ({
          id: player.idPlayer, name: player.strPlayer, position: player.strPosition || 'Player',
          nationality: player.strNationality || null, number: player.strNumber || null,
        })),
      coverageNote: 'TheSportsDB free tier returns up to 10 listed players per team. Rosters and individual statistics may be incomplete.',
    };
  });
}

let newsCallsToday = { day: '', count: 0 };
async function loadNews() {
  if (!process.env.APIFY_TOKEN) return { available: false, articles: [], message: 'News is awaiting a server-side Apify token.' };
  return cached('news', 6 * 60 * 60_000, async () => {
    const day = new Date().toISOString().slice(0, 10);
    if (newsCallsToday.day !== day) newsCallsToday = { day, count: 0 };
    if (newsCallsToday.count >= 4) return { available: false, articles: [], message: 'Today’s free news refresh limit has been reached.' };
    newsCallsToday.count += 1;
    const response = await fetch('https://api.apify.com/v2/acts/curly~news-scraper-api/run-sync-get-dataset-items?format=json&timeout=60', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.APIFY_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'football Premier League La Liga Bundesliga Serie A Champions League', time: 'day', pages: 1 }),
      signal: AbortSignal.timeout(65_000),
    });
    if (!response.ok) throw new Error('News provider is temporarily unavailable.');
    const payload = await response.json();
    const seen = new Set();
    const articles = (Array.isArray(payload) ? payload.flatMap((item) => item.results ?? []) : [])
      .filter((article) => {
        try {
          const url = new URL(article.url);
          if (!['https:', 'http:'].includes(url.protocol) || !article.title || seen.has(url.href)) return false;
          seen.add(url.href);
          return true;
        } catch { return false; }
      })
      .slice(0, 12)
      .map((article) => ({ title: String(article.title), url: article.url, source: article.source || 'News source', published: article.published || null }));
    return { available: true, articles, fetchedAt: new Date().toISOString(), attribution: 'Headlines via Apify; read full stories at the publisher.' };
  });
}

export function registerFootballHubRoutes(app) {
  app.get('/api/football/leagues', (_request, response) => {
    response.json({ leagues: leagues.map(({ code, name, country }) => ({ code, name, country })) });
  });
  app.get('/api/football/leagues/:code', async (request, response) => {
    const league = leagues.find((item) => item.code === request.params.code);
    if (!league) return response.status(404).json({ error: 'Unknown competition.' });
    try {
      response.set('Cache-Control', 'public, max-age=60');
      return response.json(await loadLeague(league));
    } catch {
      return response.status(502).json({ error: 'This competition’s data is unavailable right now.' });
    }
  });
  app.get('/api/football/leagues/:code/players', async (request, response) => {
    const league = leagues.find((item) => item.code === request.params.code);
    const teamId = typeof request.query.teamId === 'string' ? request.query.teamId.trim() : '';
    if (!league || !/^\d{1,10}$/.test(teamId)) return response.status(400).json({ error: 'Choose a valid competition and team.' });
    try {
      response.set('Cache-Control', 'public, max-age=300');
      const roster = await loadTeamPlayers(league, teamId);
      return roster ? response.json(roster) : response.status(404).json({ error: 'Team not found in this competition.' });
    } catch {
      return response.status(502).json({ error: 'Player roster is unavailable right now.' });
    }
  });
  app.get('/api/football/news', async (_request, response) => {
    try {
      response.set('Cache-Control', 'public, max-age=300');
      response.json(await loadNews());
    } catch {
      response.status(502).json({ error: 'Football headlines are unavailable right now.' });
    }
  });
}
