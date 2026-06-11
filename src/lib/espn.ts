export interface ESPNGame {
  id: string;
  name: string;
  shortName: string;
  date: string;
  status: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  winner?: string;
}

const ESPN_SPORTS: Record<string, string> = {
  nba: "basketball/nba",
  nfl: "football/nfl",
  nhl: "hockey/nhl",
  mlb: "baseball/mlb",
  mls: "soccer/usa.1",
  epl: "soccer/eng.1",
  fifa2026: "soccer/fifa.world",
};

export async function fetchESPNSchedule(
  sport: string,
  days: number = 7
): Promise<ESPNGame[]> {
  const path = ESPN_SPORTS[sport.toLowerCase()];
  if (!path) throw new Error(`Unknown sport: ${sport}`);

  const dates = getDateRange(days);
  const allGames: ESPNGame[] = [];

  for (const date of dates) {
    try {
      const res = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/${path}/scoreboard?dates=${date}`,
        { next: { revalidate: 300 } }
      );
      if (!res.ok) continue;
      const data = await res.json();

      for (const event of data.events || []) {
        const home = event.competitions?.[0]?.competitors?.find(
          (c: any) => c.homeAway === "home"
        );
        const away = event.competitions?.[0]?.competitors?.find(
          (c: any) => c.homeAway === "away"
        );

        let winner: string | undefined;
        if (home?.winner) winner = home.team.displayName;
        if (away?.winner) winner = away.team.displayName;

        const isPre = event.status?.type?.state === "pre";

        allGames.push({
          id: event.id,
          name: event.name,
          shortName: event.shortName,
          date: event.date,
          status: event.status?.type?.description || "Scheduled",
          homeTeam: home?.team?.displayName || "TBD",
          awayTeam: away?.team?.displayName || "TBD",
          homeScore: !isPre && home?.score !== undefined ? parseInt(home.score) : undefined,
          awayScore: !isPre && away?.score !== undefined ? parseInt(away.score) : undefined,
          winner,
        });
      }
    } catch {
      // Skip failed dates
    }
  }

  return allGames;
}

function getDateRange(days: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(formatDate(d));
  }
  return dates;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export async function fetchESPNGameResult(
  sport: string,
  gameId: string
): Promise<ESPNGame | null> {
  const path = ESPN_SPORTS[sport.toLowerCase()];
  if (!path) throw new Error(`Unknown sport: ${sport}`);

  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/${path}/summary?event=${gameId}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    const data = await res.json();

    const event = data.header?.competitions?.[0];
    if (!event) return null;

    const home = event.competitors?.find((c: any) => c.homeAway === "home");
    const away = event.competitors?.find((c: any) => c.homeAway === "away");

    let winner: string | undefined;
    if (home?.winner) winner = home.team.displayName;
    if (away?.winner) winner = away.team.displayName;

    const isPre = data.header?.status?.type?.state === "pre";

    return {
      id: gameId,
      name: data.header?.name || "",
      shortName: data.header?.shortName || "",
      date: data.header?.date || "",
      status: data.header?.status?.type?.description || "Scheduled",
      homeTeam: home?.team?.displayName || "TBD",
      awayTeam: away?.team?.displayName || "TBD",
      homeScore: !isPre && home?.score !== undefined ? parseInt(home.score) : undefined,
      awayScore: !isPre && away?.score !== undefined ? parseInt(away.score) : undefined,
      winner,
    };
  } catch {
    return null;
  }
}
