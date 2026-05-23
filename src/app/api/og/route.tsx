import { ImageResponse } from "next/og";
import { findMarketByIdOrSlug } from "@/lib/market-lookup";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return new Response("Missing slug", { status: 400 });
    }

    const market = await findMarketByIdOrSlug(slug);

    if (!market) {
      return new Response("Market not found", { status: 404 });
    }

    const totalPool = market.yesPool + market.noPool;
    const yesProb = totalPool > 0 ? (market.yesPool / totalPool) * 100 : 50;
    const noProb = 100 - yesProb;

    const statusColor =
      market.status === "OPEN"
        ? "#10b981"
        : market.status === "RESOLVED"
        ? "#06b6d4"
        : "#ef4444";

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            background: "#09090b",
            padding: 60,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "#10b981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#000",
                  fontSize: 20,
                }}
              >
                S
              </div>
              <span style={{ color: "#fff", fontSize: 28 }}>SaskPoly</span>
            </div>
            <span style={{ color: statusColor, fontSize: 18 }}>
              {market.status}
            </span>
          </div>

          <div
            style={{
              color: "#fff",
              fontSize: 48,
              marginTop: 40,
              marginBottom: 24,
            }}
          >
            {market.title}
          </div>
          <div style={{ color: "#a1a1aa", fontSize: 22, marginBottom: 48 }}>
            {market.category}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "#d4d4d8",
              fontSize: 20,
              marginBottom: 12,
            }}
          >
            <span>Yes {yesProb.toFixed(1)}%</span>
            <span>No {noProb.toFixed(1)}%</span>
          </div>
          <div
            style={{
              display: "flex",
              width: "100%",
              height: 24,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${yesProb}%`,
                height: "100%",
                background: "#10b981",
              }}
            ></div>
            <div
              style={{
                width: `${noProb}%`,
                height: "100%",
                background: "#ef4444",
              }}
            ></div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "#71717a",
              fontSize: 16,
              marginTop: 12,
            }}
          >
            <span>Pool: ${market.yesPool.toLocaleString()}</span>
            <span>Pool: ${market.noPool.toLocaleString()}</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? `${error.message}\n${error.stack}`
        : String(error);
    return new Response(message, {
      status: 500,
      headers: { "content-type": "text/plain" },
    });
  }
}
