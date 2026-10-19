import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, CalendarDays, Newspaper, RefreshCw, Shield, Sparkles, Trophy, Users } from 'lucide-react';

type League = { code: string; name: string; country: string };
type Match = {
  id: string; kickoff: string | null; status: string; round: number | null;
  home: string; away: string; homeId: string; awayId: string;
  homeScore: number | null; awayScore: number | null;
};
type Standing = {
  id: string; name: string; position: number | null; played: number | null;
  won: number | null; drawn: number | null; lost: number | null;
  goalsFor: number | null; goalsAgainst: number | null; goalDifference: number | null;
  points: number | null; form: string | null;
};
type Forecast = {
  home: number; draw: number; away: number; likelyScore: string;
  explanation: string; methodology: string;
};
type LeagueData = {
  league: League; provider: string; attribution: string; coverageNote: string;
  fetchedAt: string; matches: Match[]; standings: Standing[];
  predictions: { matchId: string; forecast: Forecast }[];
};
type NewsData = {
  available: boolean; articles: { title: string; url: string; source: string; published: string | null }[];
  message?: string; attribution?: string; fetchedAt?: string;
};
type Player = { id: string; name: string; position: string; nationality: string | null; number: string | null };

const leagues: League[] = [
  { code: 'PL', name: 'Premier League', country: 'England' },
  { code: 'PD', name: 'La Liga', country: 'Spain' },
  { code: 'BL1', name: 'Bundesliga', country: 'Germany' },
  { code: 'SA', name: 'Serie A', country: 'Italy' },
  { code: 'FL1', name: 'Ligue 1', country: 'France' },
  { code: 'CL', name: 'Champions League', country: 'Europe' },
];
type View = 'matches' | 'table' | 'players' | 'predictions' | 'news';
const views: { id: View; label: string; icon: typeof CalendarDays }[] = [
  { id: 'matches', label: 'Matches', icon: CalendarDays },
  { id: 'table', label: 'Table', icon: Trophy },
  { id: 'players', label: 'Players', icon: Users },
  { id: 'predictions', label: 'Predictions', icon: Sparkles },
  { id: 'news', label: 'News', icon: Newspaper },
];

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}
function dayLabel(value: string | null) {
  if (!value) return 'Date TBC';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date TBC' : date.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}
function statusLabel(match: Match) {
  if (match.status === 'FINISHED') return 'Full time';
  if (['IN_PLAY', 'PAUSED', 'LIVE'].includes(match.status)) return 'In play';
  if (match.status === 'POSTPONED') return 'Postponed';
  return dayLabel(match.kickoff);
}

export function MatchCentreScreen() {
  const [leagueCode, setLeagueCode] = useState('PL');
  const [view, setView] = useState<View>('matches');
  const [data, setData] = useState<LeagueData | null>(null);
  const [news, setNews] = useState<NewsData | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerNote, setPlayerNote] = useState('');
  const [teamId, setTeamId] = useState('');
  const [loading, setLoading] = useState(false);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setData(null);
    setPlayers([]);
    setTeamId('');
    fetch(`/api/football/leagues/${leagueCode}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Unable to load competition data.');
        return payload as LeagueData;
      })
      .then((payload) => { setData(payload); setTeamId(payload.standings[0]?.id ?? payload.matches[0]?.homeId ?? ''); })
      .catch((reason) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Unable to load competition data.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [leagueCode, refreshKey]);

  useEffect(() => {
    if (view !== 'news' || news) return;
    const controller = new AbortController();
    fetch('/api/football/news', { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'News is unavailable.');
        return payload as NewsData;
      })
      .then(setNews)
      .catch((reason) => { if (!controller.signal.aborted) setNews({ available: false, articles: [], message: reason instanceof Error ? reason.message : 'News is unavailable.' }); });
    return () => controller.abort();
  }, [view, news]);

  useEffect(() => {
    if (view !== 'players' || !teamId) return;
    const controller = new AbortController();
    setPlayersLoading(true);
    setPlayers([]);
    fetch(`/api/football/leagues/${leagueCode}/players?teamId=${encodeURIComponent(teamId)}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Player roster is unavailable.');
        return payload as { players: Player[]; coverageNote: string };
      })
      .then((payload) => { setPlayers(payload.players); setPlayerNote(payload.coverageNote); })
      .catch((reason) => { if (!controller.signal.aborted) setPlayerNote(reason instanceof Error ? reason.message : 'Player roster is unavailable.'); })
      .finally(() => { if (!controller.signal.aborted) setPlayersLoading(false); });
    return () => controller.abort();
  }, [view, leagueCode, teamId]);

  const selectedLeague = leagues.find((item) => item.code === leagueCode)!;
  const teamOptions = useMemo(() => {
    if (!data) return [];
    if (data.standings.length) return data.standings.map((team) => ({ id: team.id, name: team.name }));
    const teams = data.matches.flatMap((match) => [{ id: match.homeId, name: match.home }, { id: match.awayId, name: match.away }]);
    return [...new Map(teams.filter((team) => team.id).map((team) => [team.id, team])).values()]
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);
  const sortedMatches = useMemo(() => {
    const matches = data?.matches ?? [];
    const upcoming = matches.filter((match) => !['FINISHED', 'POSTPONED'].includes(match.status));
    const recent = matches.filter((match) => match.status === 'FINISHED').reverse();
    return [...upcoming, ...recent].slice(0, 16);
  }, [data]);
  const predictedMatches = useMemo(() => data?.matches.filter((match) => data.predictions.some((prediction) => prediction.matchId === match.id)).slice(0, 8) ?? [], [data]);

  return (
    <div className="sport-page sport-hub">
      <header className="sport-page-heading">
        <div>
          <span className="sport-eyebrow">FOOTBALL BEYOND FPL</span>
          <h1>Match Centre<span>.</span></h1>
          <p>Explore the leagues, scores, players and match outlooks in one place.</p>
        </div>
        <button className="sport-button" type="button" onClick={() => { setRefreshKey((key) => key + 1); setNews(null); }} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </header>

      <div className="sport-hub-leagues" role="group" aria-label="Choose competition">
        {leagues.map((league) => (
          <button key={league.code} type="button" aria-pressed={leagueCode === league.code} onClick={() => setLeagueCode(league.code)}>
            <span>{league.name}</span><small>{league.country}</small>
          </button>
        ))}
      </div>

      <section className="sport-hub-shell">
        <div className="sport-hub-toolbar">
          <div><span className="sport-eyebrow">{selectedLeague.country.toUpperCase()}</span><h2>{selectedLeague.name}</h2></div>
          <span className="sport-hub-source">{data ? `${data.provider} · Updated ${dayLabel(data.fetchedAt)}` : 'Checking latest data'}</span>
        </div>
        <div className="sport-hub-tabs" role="tablist" aria-label="Match Centre views">
          {views.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" role="tab" aria-selected={view === id} onClick={() => setView(id)}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {loading && <div className="sport-hub-empty" role="status">Loading {selectedLeague.name}…</div>}
        {!loading && error && <div className="sport-hub-empty" role="alert">{error}</div>}
        {!loading && !error && data && (
          <>
            {view === 'matches' && (
              <div className="sport-hub-matches">
                {sortedMatches.length ? sortedMatches.map((match) => (
                  <article className="sport-hub-match" key={match.id}>
                    <div className="sport-hub-match-meta"><span>{statusLabel(match)}</span><span>{match.round ? `Round ${match.round}` : selectedLeague.name}</span></div>
                    <div className="sport-hub-match-teams"><div><span className="sport-hub-crest">{initials(match.home)}</span><strong>{match.home}</strong></div><b>{match.homeScore ?? '–'} <span>:</span> {match.awayScore ?? '–'}</b><div><span className="sport-hub-crest">{initials(match.away)}</span><strong>{match.away}</strong></div></div>
                  </article>
                )) : <div className="sport-hub-empty">No recent or upcoming matches are available from this feed.</div>}
              </div>
            )}
            {view === 'table' && (
              data.standings.length ? <div className="sport-hub-table-wrap"><table className="sport-hub-table"><thead><tr><th>Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr></thead><tbody>{data.standings.map((team) => <tr key={team.id}><td><span className="sport-hub-rank">{team.position}</span><span className="sport-hub-crest small">{initials(team.name)}</span><strong>{team.name}</strong></td><td>{team.played ?? '–'}</td><td>{team.won ?? '–'}</td><td>{team.drawn ?? '–'}</td><td>{team.lost ?? '–'}</td><td>{team.goalDifference ?? '–'}</td><td><b>{team.points ?? '–'}</b></td></tr>)}</tbody></table></div> : <div className="sport-hub-empty">A league table is not available for this competition.</div>
            )}
            {view === 'players' && (
              <div className="sport-hub-players">
                <div className="sport-hub-controls"><label htmlFor="hub-team">Explore a club</label><select id="hub-team" value={teamId} onChange={(event) => setTeamId(event.target.value)}>{teamOptions.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></div>
                {playersLoading && <div className="sport-hub-empty" role="status">Loading player roster…</div>}
                {!playersLoading && players.length > 0 && <div className="sport-hub-player-grid">{players.map((player) => <article key={player.id} className="sport-hub-player"><span className="sport-hub-avatar">{initials(player.name)}</span><div><strong>{player.name}</strong><small>{player.position} · {player.nationality || 'Nationality unavailable'}</small></div><b>{player.number || '–'}</b></article>)}</div>}
                {!playersLoading && !players.length && <div className="sport-hub-empty">No verified roster returned for this club.</div>}
                {playerNote && <p className="sport-hub-note">{playerNote}</p>}
              </div>
            )}
            {view === 'predictions' && (
              <div className="sport-hub-predictions">
                <p className="sport-hub-note">Experimental match outlooks based on season goals scored and conceded. These estimates have not been calibrated or backtested and are not betting odds.</p>
                {predictedMatches.length ? predictedMatches.map((match) => {
                  const forecast = data.predictions.find((item) => item.matchId === match.id)?.forecast;
                  if (!forecast) return null;
                  return <article key={match.id} className="sport-hub-prediction"><div className="sport-hub-prediction-head"><div><small>{dayLabel(match.kickoff)}</small><h3>{match.home} <span>vs</span> {match.away}</h3></div><span>Most likely score · {forecast.likelyScore}</span></div><div className="sport-hub-probability" aria-label={`${match.home} ${forecast.home}%, draw ${forecast.draw}%, ${match.away} ${forecast.away}%`}><span style={{ width: `${forecast.home}%` }} /><span style={{ width: `${forecast.draw}%` }} /><span style={{ width: `${forecast.away}%` }} /></div><div className="sport-hub-probability-labels"><span>{match.home} <b>{forecast.home}%</b></span><span>Draw <b>{forecast.draw}%</b></span><span>{match.away} <b>{forecast.away}%</b></span></div><p>{forecast.explanation}</p></article>;
                }) : <div className="sport-hub-empty">There is not enough season data for a responsible forecast of the available upcoming matches.</div>}
              </div>
            )}
            {view === 'news' && (
              <div className="sport-hub-news">
                {!news && <div className="sport-hub-empty" role="status">Finding recent football headlines…</div>}
                {news?.articles.map((article) => <a className="sport-hub-story" href={article.url} key={article.url} target="_blank" rel="noopener noreferrer"><span><small>{article.source} {article.published ? `· ${article.published}` : ''}</small><strong>{article.title}</strong></span><ArrowUpRight size={18} /></a>)}
                {news && !news.articles.length && <div className="sport-hub-empty">{news.message || 'No recent headlines were returned.'}</div>}
                <p className="sport-hub-note">Headlines link to the original publisher. Articles and images are not republished here.</p>
              </div>
            )}
            <footer className="sport-hub-footer"><Shield size={15} /> <span>{data.coverageNote} {data.attribution}.</span></footer>
          </>
        )}
      </section>
    </div>
  );
}
