import "server-only";
import { prisma } from "@/lib/db";
import { assertRole } from "@/lib/permissions";
import { areFriends } from "@/lib/friends";
import { sendFriendRequestById } from "@/lib/core/friends";

export type InviteRole = "VIEWER" | "COLLABORATOR";
export type InviteState = {
  error?: string;
  success?: string;
  // Set when the invitee is an existing user who isn't a friend yet, so the UI can
  // offer to send them a friend request too (see the "Add as friend?" prompt).
  offerFriend?: { email: string };
};

/** Give a member the next position at the end of their personal ordering. */
function nextPosition(userId: string) {
  return prisma.listMembership.count({ where: { userId } });
}

/**
 * Create or refresh a PENDING join request for `email` on `listId`. Resets a prior
 * REJECTED request so an owner can re-send. Returns the matched user (if any) and
 * whether they're already a member (so callers can skip / message appropriately).
 */
async function requestListJoin(
  listId: string,
  email: string,
  role: InviteRole,
  invitedById: string,
) {
  const invitee = await prisma.user.findUnique({ where: { email } });
  if (invitee) {
    const existing = await prisma.listMembership.findUnique({
      where: { listId_userId: { listId, userId: invitee.id } },
    });
    if (existing) return { invitee, status: "member" as const };
  }
  await prisma.listInvite.upsert({
    where: { listId_email: { listId, email } },
    update: { role, status: "PENDING" },
    create: { listId, email, role, invitedById },
  });
  return { invitee, status: "requested" as const };
}

/**
 * Owner sends someone a list-join **request** by email. Nobody is added until the
 * invitee approves it on their home page (see `approveRequest`); non-users get a
 * pending invite that surfaces as a request once they sign up. `actorEmail` powers
 * the self-invite guard. When `alsoFriend` is set and the invitee is an existing
 * non-friend, a friend request is sent too; otherwise `offerFriend` lets the UI ask.
 */
export async function inviteToList(
  userId: string,
  actorEmail: string,
  listId: string,
  input: { email: string; role: InviteRole; alsoFriend?: boolean },
): Promise<InviteState> {
  await assertRole(userId, listId, "OWNER");

  const email = input.email.trim().toLowerCase();
  if (!email) return { error: "Email is required." };
  if (email === actorEmail.toLowerCase()) {
    return { error: "You already own this list." };
  }

  const { invitee, status } = await requestListJoin(
    listId,
    email,
    input.role,
    userId,
  );
  if (status === "member") {
    return { success: `${email} is already a member.` };
  }

  const isFriend = invitee ? await areFriends(userId, invitee.id) : false;

  let friended = false;
  if (invitee && input.alsoFriend && !isFriend) {
    friended = await sendFriendRequestById(userId, invitee.id);
  }

  const base = invitee
    ? `Request sent to ${email}.`
    : `Invite sent to ${email}. They'll join on signup.`;

  return {
    success: friended ? `${base} Friend request sent too.` : base,
    offerFriend: invitee && !isFriend && !friended ? { email } : undefined,
  };
}

/**
 * Send list-join requests to a friend for several lists at once (Friends page "add"
 * panel). Skips lists the friend already belongs to; `role` applies to all of them.
 */
export async function addFriendToLists(
  userId: string,
  friendId: string,
  listIds: string[],
  role: InviteRole,
): Promise<InviteState> {
  const friend = await prisma.user.findUnique({
    where: { id: friendId },
    select: { email: true },
  });
  if (!friend) return { error: "Friend not found." };
  if (!(await areFriends(userId, friendId))) {
    return { error: "You can only add friends to lists." };
  }

  const email = friend.email.toLowerCase();
  let sent = 0;
  for (const listId of listIds) {
    await assertRole(userId, listId, "OWNER");
    const { status } = await requestListJoin(listId, email, role, userId);
    if (status === "requested") sent += 1;
  }
  return {
    success:
      sent === 0
        ? "No new requests — already a member of the selected lists."
        : `Sent ${sent} list request${sent === 1 ? "" : "s"}.`,
  };
}

/** The invited user approves a pending request, joining the list with its role. */
export async function approveRequest(
  userId: string,
  userEmail: string,
  inviteId: string,
) {
  const invite = await prisma.listInvite.findUnique({ where: { id: inviteId } });
  if (!invite || invite.email !== userEmail.toLowerCase()) {
    throw new Error("Request not found.");
  }
  const existing = await prisma.listMembership.findUnique({
    where: { listId_userId: { listId: invite.listId, userId } },
  });
  if (!existing) {
    await prisma.listMembership.create({
      data: {
        listId: invite.listId,
        userId,
        role: invite.role,
        position: await nextPosition(userId),
      },
    });
  }
  await prisma.listInvite.update({
    where: { id: invite.id },
    data: { status: "ACCEPTED" },
  });
  return { listId: invite.listId };
}

/** The invited user rejects a pending request (marks it REJECTED). */
export async function rejectRequest(userEmail: string, inviteId: string) {
  const invite = await prisma.listInvite.findUnique({ where: { id: inviteId } });
  if (!invite || invite.email !== userEmail.toLowerCase()) {
    throw new Error("Request not found.");
  }
  await prisma.listInvite.update({
    where: { id: invite.id },
    data: { status: "REJECTED" },
  });
}

/** Owner changes a member's role (viewer <-> collaborator). */
export async function changeMemberRole(
  userId: string,
  listId: string,
  targetUserId: string,
  role: InviteRole,
) {
  await assertRole(userId, listId, "OWNER");

  const target = await prisma.listMembership.findUnique({
    where: { listId_userId: { listId, userId: targetUserId } },
  });
  if (!target) throw new Error("Member not found.");
  if (target.role === "OWNER") throw new Error("Can't change the owner's role.");

  await prisma.listMembership.update({
    where: { listId_userId: { listId, userId: targetUserId } },
    data: { role },
  });
}

/** Owner removes a member from the list. */
export async function removeMember(
  userId: string,
  listId: string,
  targetUserId: string,
) {
  await assertRole(userId, listId, "OWNER");

  const target = await prisma.listMembership.findUnique({
    where: { listId_userId: { listId, userId: targetUserId } },
  });
  if (!target) return;
  if (target.role === "OWNER") throw new Error("Can't remove the owner.");

  await prisma.listMembership.delete({
    where: { listId_userId: { listId, userId: targetUserId } },
  });
}

/** Owner revokes a pending invite. Returns the affected list, or null. */
export async function revokeInvite(userId: string, inviteId: string) {
  const invite = await prisma.listInvite.findUnique({
    where: { id: inviteId },
    select: { listId: true },
  });
  if (!invite) return null;
  await assertRole(userId, invite.listId, "OWNER");

  await prisma.listInvite.delete({ where: { id: inviteId } });
  return { listId: invite.listId };
}

/**
 * A non-owner member leaves a shared list. No-op if they're not a member;
 * throws if they own it (owners delete instead).
 */
export async function leaveList(userId: string, listId: string) {
  const membership = await prisma.listMembership.findUnique({
    where: { listId_userId: { listId, userId } },
  });
  if (!membership) return;
  if (membership.role === "OWNER") {
    throw new Error("Owners can't leave — delete the list instead.");
  }

  await prisma.listMembership.delete({
    where: { listId_userId: { listId, userId } },
  });
}

/**
 * Accept an invite via its token link (any logged-in user with the link).
 * Returns the joined list, or null if the token is invalid.
 */
export async function acceptInvite(userId: string, token: string) {
  const invite = await prisma.listInvite.findUnique({ where: { token } });
  if (!invite) return null;

  const existing = await prisma.listMembership.findUnique({
    where: { listId_userId: { listId: invite.listId, userId } },
  });
  if (!existing) {
    await prisma.listMembership.create({
      data: {
        listId: invite.listId,
        userId,
        role: invite.role,
        position: await nextPosition(userId),
      },
    });
  }
  await prisma.listInvite.update({
    where: { id: invite.id },
    data: { status: "ACCEPTED" },
  });

  return { listId: invite.listId };
}
