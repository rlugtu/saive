-- AlterTable
ALTER TABLE "ListMembership" ADD COLUMN     "chatLastReadAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ListChatMessage" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ListChatMessage_listId_createdAt_idx" ON "ListChatMessage"("listId", "createdAt");

-- AddForeignKey
ALTER TABLE "ListChatMessage" ADD CONSTRAINT "ListChatMessage_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListChatMessage" ADD CONSTRAINT "ListChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
