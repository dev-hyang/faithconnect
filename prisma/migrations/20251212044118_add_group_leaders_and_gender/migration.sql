-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FellowshipGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "scheduleType" TEXT NOT NULL DEFAULT 'ADHOC',
    "scheduleDetails" TEXT,
    "imageUrl" TEXT,
    "maxMembers" INTEGER NOT NULL DEFAULT 20,
    "maxLeaders" INTEGER NOT NULL DEFAULT 10,
    "gender" TEXT NOT NULL DEFAULT 'ALL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    CONSTRAINT "FellowshipGroup_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FellowshipGroup_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_FellowshipGroup" ("createdAt", "createdById", "description", "id", "imageUrl", "maxMembers", "name", "scheduleDetails", "scheduleType", "updatedAt", "updatedById", "visibility") SELECT "createdAt", "createdById", "description", "id", "imageUrl", "maxMembers", "name", "scheduleDetails", "scheduleType", "updatedAt", "updatedById", "visibility" FROM "FellowshipGroup";
DROP TABLE "FellowshipGroup";
ALTER TABLE "new_FellowshipGroup" RENAME TO "FellowshipGroup";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
