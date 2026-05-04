-- AlterTable
ALTER TABLE "User" ADD COLUMN     "addressCity" TEXT,
ADD COLUMN     "addressCountry" TEXT DEFAULT 'Canada',
ADD COLUMN     "addressPostalCode" TEXT,
ADD COLUMN     "addressProvince" TEXT,
ADD COLUMN     "addressStreet" TEXT,
ADD COLUMN     "dateOfBirth" TEXT,
ADD COLUMN     "fullLegalName" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "profileComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sin" TEXT,
ADD COLUMN     "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "termsAcceptedAt" TIMESTAMP(3);
