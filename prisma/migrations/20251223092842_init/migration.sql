-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskType" TEXT NOT NULL,
    "questionType" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "band9Model" TEXT,
    "keyVocabulary" TEXT,
    "source" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL DEFAULT 'default',
    "templateText" TEXT NOT NULL,
    "name" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PracticeLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL DEFAULT 'default',
    "questionId" TEXT,
    "drillType" TEXT NOT NULL,
    "userResponse" TEXT NOT NULL,
    "feedback" TEXT,
    "wordCount" INTEGER,
    "timeTaken" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PracticeLog_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
