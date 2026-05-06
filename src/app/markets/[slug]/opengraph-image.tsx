import { ImageResponse } from "next/og";
import { findMarketByIdOrSlug } from "@/lib/market-lookup";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { slug: string } }) {
  const market = await findMarketByIdOrSlug(params.slug);

  if (!market) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#09090b",
            color: "#71717a",
            fontSize: 48,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Market Not Found
        </div>
      ),
      size
    );
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
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 40,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
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
                fontWeight: 800,
              }}
            >
              S
            </div>
            <span style={{ color: "#fff", fontSize: 28, fontWeight: 700 }}>
              SaskPoly
            </span>
          </div>
          <span
            style={{
              color: statusColor,
              fontSize: 18,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 1,
              border: `2px solid ${statusColor}`,
              padding: "8px 16px",
              borderRadius: 999,
            }}
          >
            {market.status}
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            color: "#fff",
            fontSize: 52,
            fontWeight: 800,
            lineHeight: 1.2,
            marginBottom: 24,
            maxHeight: 200,
            overflow: "hidden",
          }}
        >
          {market.title}
        </div>

        {/* Category */}
        <div
          style={{
            color: "#a1a1aa",
            fontSize: 22,
            marginBottom: 48,
          }}
        >
          {market.category}
        </div>

        {/* Odds Bar */}
        <div style={{ marginTop: "auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "#d4d4d8",
              fontSize: 20,
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            <span>Yes {yesProb.toFixed(1)}%</span>
            <span>No {noProb.toFixed(1)}%</span>
          </div>
          <div
            style={{
              width: "100%",
              height: 24,
              borderRadius: 12,
              background: "#27272a",
              display: "flex",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${yesProb}%`,
                height: "100%",
                background: "#10b981",
              }}
            />
            <div
              style={{
                width: `${noProb}%`,
                height: "100%",
                background: "#ef4444",
              }}
            />
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
      </div>
    ),
    size
  );
}
