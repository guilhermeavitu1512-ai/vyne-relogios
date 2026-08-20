import { getRuntimeSecret } from "@/db/runtime";

type SupabaseError = {
  code?: string;
  details?: string;
  hint?: string;
  message?: string;
};

function config() {
  const url = getRuntimeSecret("SUPABASE_URL")?.replace(/\/$/, "");
  const secretKey = getRuntimeSecret("SUPABASE_SECRET_KEY");
  const bucket = getRuntimeSecret("SUPABASE_STORAGE_BUCKET") ?? "product-images";
  if (!url || !secretKey) {
    throw new Error("O Supabase administrativo não está configurado.");
  }
  return { url, secretKey, bucket };
}

function authorizationHeaders(secretKey: string) {
  const headers = new Headers({ apikey: secretKey });
  if (secretKey.startsWith("eyJ")) {
    headers.set("Authorization", `Bearer ${secretKey}`);
  }
  return headers;
}

function messageFromError(error: SupabaseError, status: number) {
  const message = error.message || error.details || `Supabase respondeu com status ${status}.`;
  if (/duplicate key/i.test(message)) return "Já existe um registro com estes dados.";
  return message;
}

export async function supabaseRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const { url, secretKey } = config();
  const headers = authorizationHeaders(secretKey);
  new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  headers.set("accept", "application/json");

  const response = await fetch(`${url}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as SupabaseError;
    throw new Error(messageFromError(error, response.status));
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function supabaseRpc<T>(name: string, payload: Record<string, unknown>) {
  return supabaseRequest<T>(`/rest/v1/rpc/${encodeURIComponent(name)}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

function objectPath(bucket: string, key: string) {
  return `${encodeURIComponent(bucket)}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export async function uploadProductImage(
  key: string,
  body: ArrayBuffer,
  contentType: string,
) {
  const { url, secretKey, bucket } = config();
  const headers = authorizationHeaders(secretKey);
  headers.set("content-type", contentType);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  headers.set("x-upsert", "false");

  const response = await fetch(`${url}/storage/v1/object/${objectPath(bucket, key)}`, {
    method: "POST",
    headers,
    body,
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as SupabaseError;
    throw new Error(messageFromError(error, response.status));
  }
  return `${url}/storage/v1/object/public/${objectPath(bucket, key)}`;
}

export function isSupabaseProductImageUrl(value: string) {
  const { url, bucket } = config();
  try {
    const candidate = new URL(value);
    const projectUrl = new URL(url);
    const publicProductsPath = `/storage/v1/object/public/${encodeURIComponent(bucket)}/products/`;
    return candidate.origin === projectUrl.origin && candidate.pathname.startsWith(publicProductsPath);
  } catch {
    return false;
  }
}
