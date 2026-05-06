import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet } from "@/lib/redis";
import MarketDetailClient from "./market-detail-client";

const CACHE_TTL = 30;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const cacheKey = `market:meta:${id}`;

  let market = await cacheGet<{
    title: string;
    description: string;
    category: string;
    status: string;
  }>(cacheKey);

  if (!market) {
    const dbMarket = await prisma.market.findUnique({
      where: { id },
      select: { title: true, description: true, category: true, status: true },
    });
    if (dbMarket) {
      market = dbMarket;
      await cacheSet(cacheKey, market, CACHE_TTL);
    }
  }

  if (!market) {
    return {
      title: "Market Not Found | SaskPoly",
      description: "This market does not exist or has been removed.",
    };
  }

  const totalPool = 0; // We don't have pools in metadata fetch, but that's ok
  const yesProb = 50;

  return {
    title: `${market.title} | SaskPoly`,
    description: `${market.description.slice(0, 160)}${market.description.length > 160 ? "..." : ""}`,
    openGraph: {
      title: market.title,
      description: `${market.description.slice(0, 200)}${market.description.length > 200 ? "..." : ""}`,
      type: "website",
      url: `https://saskpoly.xyz/markets/${id}`,
      siteName: "SaskPoly",
      images: [{
        url: "https://saskpoly.xyz/og-image.png",
        width: 1200,
        height: 630,
        alt: market.title,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: market.title,
      description: market.description.slice(0, 200),
      images: ["https://saskpoly.xyz/og-image.png"],
    },
  };
}

export default async function MarketPage() {
  return <MarketDetailClient />;
}
