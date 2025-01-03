/*
  Warnings:

  - You are about to drop the column `isRegistered` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "isRegistered",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'UNREGISTERED';
