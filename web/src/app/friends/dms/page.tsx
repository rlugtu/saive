import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireOnboardedUser } from "@/lib/session";
import { getConversations } from "@/lib/dms";
import { FriendsTabs } from "@/components/friends/FriendsTabs";
import { DmInbox } from "@/components/dms/DmInbox";
import { PixelButton } from "@/components/ui/PixelButton";

export default async function DmInboxPage() {
  const user = await requireOnboardedUser();
  const conversations = await getConversations(user.id);
  const unread = conversations.filter((c) => c.unread).length;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header className="flex items-center gap-3">
        <Link href="/">
          <PixelButton variant="secondary" size="sm">
            <ArrowLeft size={14} aria-hidden /> Back
          </PixelButton>
        </Link>
        <h1 className="text-primary text-xl font-bold">Messages</h1>
      </header>

      <FriendsTabs active="dms" myId={user.id} initialUnread={unread} />

      <DmInbox myId={user.id} initial={conversations} />
    </main>
  );
}
