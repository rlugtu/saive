import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireOnboardedUser } from "@/lib/session";
import { getMessages } from "@/lib/dms";
import { atHandle } from "@/lib/handle";
import { DmThread } from "@/components/dms/DmThread";
import { PixelButton } from "@/components/ui/PixelButton";

export default async function DmThreadPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const user = await requireOnboardedUser();

  let page;
  try {
    page = await getMessages(user.id, conversationId);
  } catch {
    notFound();
  }
  if (!page.other) notFound();

  return (
    <main className="mx-auto flex h-[100dvh] w-full max-w-3xl flex-col gap-4 px-6 py-6">
      <header className="flex items-center gap-3">
        <Link href="/friends/dms">
          <PixelButton variant="secondary" size="sm">
            <ArrowLeft size={14} aria-hidden /> Back
          </PixelButton>
        </Link>
        <span aria-hidden className="text-lg">
          {page.other.icon ?? "🔖"}
        </span>
        <h1 className="text-primary truncate text-xl font-bold">
          {atHandle(page.other.handle)}
        </h1>
      </header>

      <DmThread myId={user.id} conversationId={conversationId} initial={page} />
    </main>
  );
}
