export type RuntimeBindings = {
  DB?: D1Database;
  PRODUCT_IMAGES?: R2Bucket;
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD_HASH?: string;
  ADMIN_SESSION_SECRET?: string;
};

function bindings(): RuntimeBindings {
  return (globalThis as typeof globalThis & { __VYNE_RUNTIME_ENV__?: RuntimeBindings })
    .__VYNE_RUNTIME_ENV__ ?? {};
}

export function getD1(): D1Database {
  const database = bindings().DB;
  if (!database) throw new Error("O banco administrativo não está configurado.");
  return database;
}

export function getProductImagesBucket(): R2Bucket {
  const bucket = bindings().PRODUCT_IMAGES;
  if (!bucket) throw new Error("O armazenamento de imagens não está configurado.");
  return bucket;
}

export function getRuntimeSecret(name: keyof Pick<RuntimeBindings, "ADMIN_USERNAME" | "ADMIN_PASSWORD_HASH" | "ADMIN_SESSION_SECRET">) {
  const fromWorker = bindings()[name];
  if (typeof fromWorker === "string" && fromWorker.length > 0) return fromWorker;
  const fromNode = process.env[name];
  return typeof fromNode === "string" && fromNode.length > 0 ? fromNode : null;
}
