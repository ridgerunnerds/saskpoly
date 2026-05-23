import { prisma } from "../src/lib/prisma";
import { generateSlug } from "../src/lib/slug";

async function main() {
  // Step 1: Ensure slug column exists using raw SQL (don't reference slug in Prisma queries yet)
  const columnExists = await prisma.$queryRawUnsafe<{ exists: boolean }[]>(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'Market' AND column_name = 'slug'
    ) AS exists
  `);

  if (!columnExists[0].exists) {
    console.log("Adding slug column to Market table...");
    await prisma.$executeRawUnsafe(`ALTER TABLE "Market" ADD COLUMN "slug" TEXT;`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "Market_slug_key" ON "Market"("slug");`);
    console.log("Slug column added.");
  } else {
    console.log("Slug column already exists.");
  }

  // Step 2: Backfill slugs for markets that don't have one
  const markets = await prisma.market.findMany({
    where: { slug: null },
    orderBy: { createdAt: "asc" },
  });

  if (markets.length === 0) {
    console.log("No markets need slug backfill.");
    return;
  }

  const usedSlugs = new Set(
    (await prisma.market.findMany({ where: { slug: { not: null } }, select: { slug: true } }))
      .map((m) => m.slug!)
  );

  for (const market of markets) {
    let slug = generateSlug(market.title);
    let finalSlug = slug;
    let counter = 1;
    while (usedSlugs.has(finalSlug)) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }
    usedSlugs.add(finalSlug);
    await prisma.market.update({ where: { id: market.id }, data: { slug: finalSlug } });
    console.log(`Backfilled slug for ${market.id}: ${finalSlug}`);
  }

  console.log(`Backfilled ${markets.length} market slugs.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
