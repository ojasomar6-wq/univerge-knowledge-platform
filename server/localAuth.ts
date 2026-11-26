import crypto from "node:crypto";
import type { User } from "../drizzle/schema";
import { getUserByEmail, upsertLocalUser } from "./db";

const sessions = new Map<string, User>();
const fallbackUsers = new Map<string, User>();
let nextFallbackId = 1000;

export function hashPassword(password: string) {
  return crypto.scryptSync(password, "univerge-salt", 32).toString("hex");
}

export function verifyPassword(password: string, hash: string) {
  const actual = Buffer.from(hash, "hex");
  const expected = Buffer.from(hashPassword(password), "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export async function registerLocalUser(name: string, email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await getUserByEmail(normalizedEmail);
  if (existing) throw new Error("An account with this email already exists");
  const user: User = {
    id: nextFallbackId++,
    openId: `local:${crypto.randomUUID()}`,
    name: name.trim(),
    email: normalizedEmail,
    loginMethod: "local",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  fallbackUsers.set(normalizedEmail, { ...user, name: `${user.name}|${hashPassword(password)}` });
  await upsertLocalUser(user, hashPassword(password));
  return user;
}

export async function loginLocalUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const dbUser = await getUserByEmail(normalizedEmail);
  const fallback = fallbackUsers.get(normalizedEmail);
  const stored = fallback;
  if (!stored) throw new Error("Invalid email or password");
  const passwordHash = stored?.name?.includes("|") ? stored.name.split("|")[1] : undefined;
  if (!passwordHash || !verifyPassword(password, passwordHash)) throw new Error("Invalid email or password");
  const user = stored ? { ...stored, name: stored.name?.split("|")[0] } : dbUser;
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, user as User);
  return { token, user: user as User };
}

export function getSession(token?: string | null) {
  return token ? sessions.get(token) ?? null : null;
}

export function destroySession(token?: string | null) {
  if (token) sessions.delete(token);
}
