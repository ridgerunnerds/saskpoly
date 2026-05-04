/*
  Warnings:

  - You are about to drop the column `walletAddress` on the `User` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "StripePayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paymentIntentId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "userId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "outcome" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StripePayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StripePayment_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "password" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "role") SELECT "createdAt", "email", "id", "name", "role" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "StripePayment_paymentIntentId_key" ON "StripePayment"("paymentIntentId");
