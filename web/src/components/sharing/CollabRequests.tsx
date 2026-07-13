import { getIncomingRequests } from "@/lib/sharing";
import { approveRequest, rejectRequest } from "@/lib/actions/sharing";
import { PixelCard } from "@/components/ui/PixelCard";
import { SubmitButton } from "@/components/ui/SubmitButton";

/**
 * Incoming list-join requests addressed to the current user, newest first. Each row
 * offers Reject / Approve; deciding revalidates the page so the row drops off (it's no
 * longer PENDING), which is what removes the buttons. Renders nothing when empty.
 */
export async function CollabRequests({ email }: { email: string }) {
  const requests = await getIncomingRequests(email);
  if (requests.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-pixel text-sm text-primary">
        Collab requests ({requests.length})
      </h2>
      <div className="flex flex-col gap-2">
        {requests.map((req) => (
          <PixelCard
            key={req.id}
            className="flex items-center justify-between gap-3"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span aria-hidden className="shrink-0 text-lg">
                {req.list.icon}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold">
                  {req.list.name}
                </span>
                <span className="text-muted truncate text-sm">
                  {req.list.description || "No description"}
                </span>
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <form action={rejectRequest.bind(null, req.id)}>
                <SubmitButton
                  label="Reject"
                  pendingLabel="…"
                  variant="secondary"
                  size="sm"
                />
              </form>
              <form action={approveRequest.bind(null, req.id)}>
                <SubmitButton label="Approve" pendingLabel="…" size="sm" />
              </form>
            </span>
          </PixelCard>
        ))}
      </div>
    </section>
  );
}
