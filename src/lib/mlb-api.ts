const MLB_BASE = "https://statsapi.mlb.com/api/v1";
const TEAM_ID = 141; // Toronto Blue Jays

async function apiGet(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function getSchedule(teamId: number = TEAM_ID, daysBack = 7, daysFwd = 7) {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - daysBack);
  const end = new Date(today);
  end.setDate(today.getDate() + daysFwd);

  const url =
    `${MLB_BASE}/schedule?teamId=${teamId}&season=${today.getFullYear()}&sportId=1&gameType=R` +
    `&startDate=${start.toISOString().split("T")[0]}&endDate=${end.toISOString().split("T")[0]}`;
  return apiGet(url);
}

export async function getGameDetails(gamePk: string | number) {
  return apiGet(`${MLB_BASE}.1/game/${gamePk}/feed/live`);
}

export async function getTeamRecord(teamId: number) {
  const data = await apiGet(`${MLB_BASE}/teams/${teamId}?season=${new Date().getFullYear()}&hydrate=record`);
  const record = data?.teams?.[0]?.record;
  if (!record) return { w: 0, l: 0, pct: 0.5 };
  const wins = record.wins || 0;
  const losses = record.losses || 0;
  return { w: wins, l: losses, pct: wins + losses > 0 ? wins / (wins + losses) : 0.5 };
}

export async function getLastNGames(n: number, teamId: number = TEAM_ID) {
  const schedule = await getSchedule(teamId, n + 2, 0);
  const games: any[] = [];
  for (const d of schedule?.dates || []) {
    for (const g of d.games || []) {
      if (g.status?.detailedState === "Final") games.push(g);
    }
  }
  return games.slice(-n);
}

export async function getHeadToHead(opponentId: number, teamId: number = TEAM_ID) {
  const year = new Date().getFullYear();
  const url = `${MLB_BASE}/schedule?teamId=${teamId}&opponentId=${opponentId}&season=${year}&sportId=1&gameType=R`;
  const data = await apiGet(url);
  const games: any[] = [];
  for (const d of data?.dates || []) {
    for (const g of d.games || []) {
      if (g.status?.detailedState === "Final") games.push(g);
    }
  }
  let wins = 0;
  for (const g of games) {
    const side = g.teams.away.team.id === teamId ? "away" : "home";
    if (g.teams[side].isWinner) wins++;
  }
  return { total: games.length, wins };
}

export async function getPitcherMetrics(pitcherId: number) {
  const data = await apiGet(`${MLB_BASE}/people/${pitcherId}?hydrate=stats(group=[pitching],type=[season])`);
  const stats = data?.people?.[0]?.stats?.[0]?.splits?.[0]?.stat;
  if (!stats) return null;
  return {
    era: parseFloat(stats.era) || 4.5,
    whip: parseFloat(stats.whip) || 1.35,
    k9: parseFloat(stats.strikeoutsPer9Inn) || 8.0,
    bb9: parseFloat(stats.walksPer9Inn) || 3.0,
    hr9: parseFloat(stats.homeRunsPer9) || 1.2,
    ip: parseFloat(stats.inningsPitched) || 0,
  };
}

export async function getBullpenStats(teamId: number) {
  const data = await apiGet(
    `${MLB_BASE}/teams/${teamId}/stats?group=pitching&season=${new Date().getFullYear()}&stats=season`
  );
  const stats = data?.stats?.[0]?.splits?.[0]?.stat;
  if (!stats) return null;
  return {
    era: parseFloat(stats.era) || 4.0,
    whip: parseFloat(stats.whip) || 1.35,
  };
}

export async function getWeatherForecast(lat: number, lon: number) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&windspeed_unit=mph&temperature_unit=fahrenheit`;
  const data = await apiGet(url);
  if (!data?.current_weather) return { temp: 70, wind_speed: 0, wind_dir: "" };
  return {
    temp: data.current_weather.temperature,
    wind_speed: data.current_weather.windspeed,
    wind_dir: data.current_weather.winddirection,
  };
}

export async function getVenueLocation(game: any) {
  const venue = game?.venue;
  if (!venue?.location) return null;
  return {
    lat: venue.location.defaultCoordinates?.latitude,
    lon: venue.location.defaultCoordinates?.longitude,
  };
}

export async function getNextGame(teamId: number = TEAM_ID) {
  const schedule = await getSchedule(teamId, 0, 7);
  for (const d of schedule?.dates || []) {
    for (const g of d.games || []) {
      if (g.status?.detailedState !== "Final" && g.status?.detailedState !== "Postponed") {
        return g;
      }
    }
  }
  return null;
}

export async function getAllGamesForDate(dateStr: string) {
  const url = `${MLB_BASE}/schedule?sportId=1&gameType=R&date=${dateStr}`;
  const data = await apiGet(url);
  return data?.dates?.[0]?.games || [];
}
