import { Metadata } from "next";
import { cacheGet, cacheSet } from "@/lib/redis";
import { findMarketByIdOrSlug } from "@/lib/market-lookup";
import MarketDetailClient from "./market-detail-client";

const CACHE_TTL = 30;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cacheKey = `market:meta:${slug}`;

  let market = await cacheGet<{
    title: string;
    description: string;
    category: string;
    status: string;
  }>(cacheKey);

  if (!market) {
    const dbMarket = await findMarketByIdOrSlug(slug, undefined);
    if (dbMarket) {
      market = {
        title: dbMarket.title,
        description: dbMarket.description,
        category: dbMarket.category,
        status: dbMarket.status,
      };
      await cacheSet(cacheKey, market, CACHE_TTL);
    }
  }

  if (!market) {
    return {
      title: "Market Not Found | SaskPoly",
      description: "This market does not exist or has been removed.",
    };
  }

  return {
    title: `${market.title} | SaskPoly`,
    description: `${market.description.slice(0, 160)}${market.description.length > 160 ? "..." : ""}`,
    openGraph: {
      title: market.title,
      description: `${market.description.slice(0, 200)}${market.description.length > 200 ? "..." : ""}`,
      type: "website",
      url: `https://saskpoly.xyz/markets/${slug}`,
      siteName: "SaskPoly",
    },
    twitter: {
      card: "summary_large_image",
      title: market.title,
      description: market.description.slice(0, 200),
    },
  };
}

export default async function MarketPage() {
  return <MarketDetailClient />;
}
