-- AlterTable
ALTER TABLE "users" ADD COLUMN     "authUserId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "users_authUserId_key" ON "users"("authUserId");

