/**
 * Cookie-based auth for Railway (replaces Supabase Auth)
 * Guest sessions stored in cookie
 */

import { cookies } from "next/headers";

const COOKIE_NAME = "ao_guest_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function getUserId(): Promise<string | null> {
  const store = await cookies();
  const cookie = store.get(COOKIE_NAME);
  return cookie?.value ?? null;
}

export async function requireUserId(): Promise<string> {
  const id = await getUserId();
  if (!id) throw new Error("UNAUTHORIZED");
  return id;
}

export function setGuestCookie(userId: string): { name: string; value: string; options: object }[] {
  return [
    {
      name: COOKIE_NAME,
      value: userId,
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        maxAge: COOKIE_MAX_AGE,
        path: "/",
      },
    },
  ];
}
