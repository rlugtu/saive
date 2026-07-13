import {
  acceptFriendRequest,
  declineFriendRequest,
} from "@/lib/actions/friends";
import { PixelCard } from "@/components/ui/PixelCard";
import { SubmitButton } from "@/components/ui/SubmitButton";

type Requester = {
  id: string;
  displayName: string | null;
  name: string | null;
  email: string;
  icon: string | null;
};

/** Incoming friend requests the current user can accept or decline. */
export function FriendRequests({
  requests,
}: {
  requests: { id: string; requester: Requester }[];
}) {
  if (requests.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-pixel text-sm text-primary">
        Friend requests ({requests.length})
      </h2>
      <div className="flex flex-col gap-2">
        {requests.map((r) => (
          <PixelCard
            key={r.id}
            className="flex items-center justify-between gap-3"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span aria-hidden className="text-lg">
                {r.requester.icon ?? "🔖"}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold">
                  {r.requester.displayName ?? r.requester.name ?? r.requester.email}
                </span>
                <span className="text-muted truncate text-sm">
                  {r.requester.email}
                </span>
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <form action={declineFriendRequest.bind(null, r.id)}>
                <SubmitButton
                  label="Decline"
                  pendingLabel="…"
                  variant="secondary"
                  size="sm"
                />
              </form>
              <form action={acceptFriendRequest.bind(null, r.id)}>
                <SubmitButton label="Accept" pendingLabel="…" size="sm" />
              </form>
            </span>
          </PixelCard>
        ))}
      </div>
    </section>
  );
}
