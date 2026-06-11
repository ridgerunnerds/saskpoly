// Fetch FIFA 2026 group stage games from ESPN and insert into Supabase predictions table

const SUPABASE_URL = "https://oqchsneqnlyazgqgcbsr.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xY2hzbmVxbmx5YXpncWdjYnNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ1NzA2MSwiZXhwIjoyMDk1MDMzMDYxfQ.GB4hqlUKL5euu-B7m2ODI0j2THKZbVg19D9EMA7ATZQ";

async function fetchESPNGames(dateStr) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${dateStr}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  const games = [];
  for (const event of data.events || []) {
    const comp = event.competitions?.[0];
    if (!comp) continue;
    const home = comp.competitors?.find((c) => c.homeAway === "home");
    const away = comp.competitors?.find((c) => c.homeAway === "away");
    if (!home || !away) continue;
    games.push({
      id: event.id,
      name: event.name,
      shortName: event.shortName,
      date: event.date,
      status: event.status?.type?.description || "Scheduled",
      homeTeam: home.team.displayName,
      awayTeam: away.team.displayName,
    });
  }
  return games;
}

async function getExistingIds() {
  const url = `${SUPABASE_URL}/rest/v1/predictions?event_type=eq.fifa2026&select=source_id`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });
  if (!res.ok) return new Set();
  const data = await res.json();
  return new Set(data.map((d) => d.source_id));
}

async function insertPredictions(games) {
  const url = `${SUPABASE_URL}/rest/v1/predictions`;
  const body = games.map((g) => ({
    title: `${g.awayTeam} @ ${g.homeTeam}`,
    description: `${g.name} — ${g.status}`,
    category: "sports",
    event_type: "fifa2026",
    source_api: "espn",
    source_id: g.id,
    event_date: g.date,
    options: [g.awayTeam, g.homeTeam, "Draw"],
    points: 10,
    status: "upcoming",
  }));

  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Insert failed: ${res.status} ${text}`);
  }
  return await res.json();
}

async function main() {
  const allGames = [];
  const dates = [];
  for (let d = 11; d <= 27; d++) {
    dates.push(`202606${String(d).padStart(2, "0")}`);
  }

  for (const date of dates) {
    const games = await fetchESPNGames(date);
    console.log(`${date}: ${games.length} games`);
    allGames.push(...games);
  }

  console.log(`\nTotal games fetched: ${allGames.length}`);

  const existingIds = await getExistingIds();
  console.log(`Existing predictions: ${existingIds.size}`);

  const toInsert = allGames.filter((g) => !existingIds.has(g.id));
  console.log(`New games to insert: ${toInsert.length}`);

  if (toInsert.length === 0) {
    console.log("No new games to insert.");
    return;
  }

  // Insert in batches of 20 to avoid request size limits
  const batchSize = 20;
  let totalInserted = 0;
  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize);
    const inserted = await insertPredictions(batch);
    totalInserted += inserted.length;
    console.log(`Inserted batch ${i / batchSize + 1}: ${inserted.length} games`);
  }

  console.log(`\nDone! Inserted ${totalInserted} FIFA 2026 predictions.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
