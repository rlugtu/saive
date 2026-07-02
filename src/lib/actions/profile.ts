"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

type ProfileInput = {
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  birthday: Date | null;
  icon: string | null;
  theme: "LIGHT" | "DARK";
};

function parseProfile(formData: FormData): ProfileInput {
  const str = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v.length ? v : null;
  };
  const displayName = str("displayName");
  if (!displayName) throw new Error("Display name is required.");

  const birthdayRaw = str("birthday");
  const birthday = birthdayRaw ? new Date(birthdayRaw) : null;

  const themeRaw = str("theme");
  const theme: "LIGHT" | "DARK" = themeRaw === "DARK" ? "DARK" : "LIGHT";

  return {
    firstName: str("firstName"),
    lastName: str("lastName"),
    displayName,
    birthday,
    icon: str("icon"),
    theme,
  };
}

/** First-run onboarding: save profile, then land on the home page. */
export async function completeOnboarding(formData: FormData) {
  const user = await requireUser();
  const data = parseProfile(formData);
  await prisma.user.update({ where: { id: user.id }, data });
  redirect("/");
}

/** Settings: save profile changes in place. */
export async function updateProfile(formData: FormData) {
  const user = await requireUser();
  const data = parseProfile(formData);
  await prisma.user.update({ where: { id: user.id }, data });
  revalidatePath("/settings");
  revalidatePath("/");
}
