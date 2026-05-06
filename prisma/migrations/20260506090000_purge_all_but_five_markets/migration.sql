-- Keep only the 5 most recent markets. Delete everything else and their related data.

-- Step 1: Delete bets for markets that are NOT in the 5 most recent
DELETE FROM "Bet" WHERE "marketId" NOT IN (
  SELECT "id" FROM "Market" ORDER BY "createdAt" DESC LIMIT 5
);

-- Step 2: Delete resolutions for markets that are NOT in the 5 most recent
DELETE FROM "Resolution" WHERE "marketId" NOT IN (
  SELECT "id" FROM "Market" ORDER BY "createdAt" DESC LIMIT 5
);

-- Step 3: Delete stripe payments for markets that are NOT in the 5 most recent
DELETE FROM "StripePayment" WHERE "marketId" NOT IN (
  SELECT "id" FROM "Market" ORDER BY "createdAt" DESC LIMIT 5
);

-- Step 4: Delete comments for markets that are NOT in the 5 most recent
-- (Comment has onDelete: Cascade, but we delete explicitly to be safe)
DELETE FROM "Comment" WHERE "marketId" NOT IN (
  SELECT "id" FROM "Market" ORDER BY "createdAt" DESC LIMIT 5
);

-- Step 5: Delete all markets except the 5 most recent
DELETE FROM "Market" WHERE "id" NOT IN (
  SELECT "id" FROM "Market" ORDER BY "createdAt" DESC LIMIT 5
);
