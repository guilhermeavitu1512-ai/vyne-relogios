import { getRuntimeSecret } from "@/db/runtime";
import {
  bytesToBase64Url,
  constantTimeEqual,
  hmacSha256,
  verifyPassword,
} from "@/lib/server/security";

const COOKIE_NAME = "vyne_admin_session";
const SESSION_DURATION_SECONDS = 8 * 60 * 60;

export type AdminSession = {
  username: string;
  csrfToken: string;
  issuedAt: number;
  expiresAt: number;
};

function getCookie(request: Request, name: string) {
  const cookies = request.headers.get("cookie") ?? "";
  for (const cookie of cookies.split(";")) {
    const [key, ...valueParts] = cookie.trim().split("=");
    if (key === name) return decodeURIComponent(valueParts.join("="));
  }
  return null;
}

function encodePayload(session: AdminSession) {
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(session)));
}

function decodePayload(payload: string): AdminSession | null {
  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const binary = atob(normalized);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as Partial<AdminSession>;
    if (
      typeof parsed.username !== "string" ||
      typeof parsed.csrfToken !== "string" ||
      typeof parsed.issuedAt !== "number" ||
      typeof parsed.expiresAt !== "number"
    ) {
      return null;
    }
    return parsed as AdminSession;
  } catch {
    return null;
  }
}

export async function validateAdminCredentials(username: string, password: string) {
  const configuredUsername = getRuntimeSecret("ADMIN_USERNAME");
  const passwordHash = getRuntimeSecret("ADMIN_PASSWORD_HASH");
  if (!configuredUsername || !passwordHash) {
    throw new Error("As credenciais administrativas ainda não foram configuradas.");
  }

  const usernameMatches = constantTimeEqual(
    username.trim().toLowerCase(),
    configuredUsername.trim().toLowerCase(),
  );
  const passwordMatches = await verifyPassword(password, passwordHash);
  return usernameMatches && passwordMatches;
}

export async function createAdminSession(username: string) {
  const secret = getRuntimeSecret("ADMIN_SESSION_SECRET");
  if (!secret || secret.length < 32) {
    throw new Error("A chave de sessão administrativa não está configurada.");
  }

  const now = Math.floor(Date.now() / 1000);
  const session: AdminSession = {
    username,
    csrfToken: bytesToBase64Url(crypto.getRandomValues(new Uint8Array(24))),
    issuedAt: now,
    expiresAt: now + SESSION_DURATION_SECONDS,
  };
  const payload = encodePayload(session);
  const signature = bytesToBase64Url(await hmacSha256(secret, payload));
  return { token: `${payload}.${signature}`, session };
}

export async function getAdminSession(request: Request): Promise<AdminSession | null> {
  const secret = getRuntimeSecret("ADMIN_SESSION_SECRET");
  const token = getCookie(request, COOKIE_NAME);
  if (!secret || !token) return null;

  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;
  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = bytesToBase64Url(await hmacSha256(secret, payload));
  if (!constantTimeEqual(signature, expected)) return null;

  const session = decodePayload(payload);
  if (!session || session.expiresAt <= Math.floor(Date.now() / 1000)) return null;
  return session;
}

export async function requireAdmin(request: Request, requireCsrf = false) {
  const session = await getAdminSession(request);
  if (!session) {
    return { response: Response.json({ error: "Sessão administrativa inválida ou expirada." }, { status: 401 }) } as const;
  }
  if (requireCsrf && !constantTimeEqual(request.headers.get("x-csrf-token") ?? "", session.csrfToken)) {
    return { response: Response.json({ error: "Validação de segurança inválida." }, { status: 403 }) } as const;
  }
  return { session } as const;
}

export function adminSessionCookie(token: string, request: Request) {
  const secure = new URL(request.url).protocol === "https:";
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_DURATION_SECONDS}${secure ? "; Secure" : ""}`;
}

export function clearAdminSessionCookie(request: Request) {
  const secure = new URL(request.url).protocol === "https:";
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? "; Secure" : ""}`;
}
