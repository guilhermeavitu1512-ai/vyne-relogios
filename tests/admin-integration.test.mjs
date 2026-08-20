import assert from "node:assert/strict";
import test from "node:test";

const baseUrl = process.env.VYNE_INTEGRATION_BASE_URL;
const username = process.env.VYNE_INTEGRATION_USERNAME;
const password = process.env.VYNE_INTEGRATION_PASSWORD;

const configured = Boolean(baseUrl && username && password);
const origin = baseUrl ? new URL(baseUrl).origin : "";

async function json(response) {
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

test("fluxo administrativo completo de produtos e estoque", { timeout: 30_000, skip: !configured }, async () => {
  const anonymous = await fetch(`${baseUrl}/api/admin/products`);
  assert.equal(anonymous.status, 401, "rotas administrativas rejeitam visitantes sem sessão");

  const login = await fetch(`${baseUrl}/api/admin/login`, {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({ username, password }),
  });
  const loginPayload = await login.json();
  assert.equal(login.status, 200, "login administrativo funciona");
  assert.ok(loginPayload.csrfToken, "login fornece proteção CSRF");
  const cookie = login.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie, "login cria cookie de sessão HttpOnly");

  const adminFetch = async (path, init = {}) => {
    const headers = new Headers(init.headers);
    headers.set("cookie", cookie);
    headers.set("origin", origin);
    if ((init.method ?? "GET").toUpperCase() !== "GET") {
      headers.set("x-csrf-token", loginPayload.csrfToken);
    }
    if (init.body && !(init.body instanceof FormData)) headers.set("content-type", "application/json");
    return fetch(`${baseUrl}${path}`, { ...init, headers });
  };

  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );
  const uploadBody = new FormData();
  uploadBody.set("file", new Blob([png], { type: "image/png" }), "relogio-teste.png");
  const uploadResult = await json(await adminFetch("/api/admin/uploads", { method: "POST", body: uploadBody }));
  assert.equal(uploadResult.response.status, 201, "upload de imagem funciona");
  assert.match(uploadResult.payload.url, /^\/api\/product-images\/products\//);
  const imageResponse = await fetch(`${baseUrl}${uploadResult.payload.url}`);
  assert.equal(imageResponse.status, 200, "imagem enviada fica disponível no Storage");

  const draft = {
    name: "Relógio de teste administrativo",
    model: "QA-2026",
    brand: "VYNE TEST",
    description: "Descrição inicial para validação do painel.",
    price: 1299,
    promotionalPrice: null,
    imageUrl: uploadResult.payload.url,
    stock: 5,
    category: "Integração",
    tag: "Teste",
    specs: ["Teste automatizado"],
    featured: false,
    recommended: false,
    active: true,
  };

  const createdResult = await json(await adminFetch("/api/admin/products", { method: "POST", body: JSON.stringify(draft) }));
  assert.equal(createdResult.response.status, 201, "novo relógio é cadastrado");
  const productId = createdResult.payload.product.id;
  assert.equal(createdResult.payload.product.stock, 5);

  const updatedDraft = {
    ...draft,
    name: "Relógio de teste atualizado",
    description: "Descrição atualizada e persistida no banco.",
    price: 1099,
    promotionalPrice: 999,
    featured: true,
    recommended: true,
  };
  const updatedResult = await json(await adminFetch(`/api/admin/products/${encodeURIComponent(productId)}`, { method: "PATCH", body: JSON.stringify(updatedDraft) }));
  assert.equal(updatedResult.response.status, 200, "nome, preço, descrição e marcadores são editados");
  assert.equal(updatedResult.payload.product.name, updatedDraft.name);
  assert.equal(updatedResult.payload.product.priceValue, 1099);
  assert.equal(updatedResult.payload.product.recommended, true);
  assert.equal(updatedResult.payload.product.featured, true);

  let publicProducts = await (await fetch(`${baseUrl}/api/products`)).json();
  let publicProduct = publicProducts.products.find((product) => product.id === productId);
  assert.equal(publicProduct.name, updatedDraft.name, "catálogo público recebe alterações do banco");
  assert.equal(publicProduct.promotionalPriceValue, 999);

  const move = async (quantity, type = "MANUAL_ADJUSTMENT") =>
    json(await adminFetch("/api/admin/stock-movements", {
      method: "POST",
      body: JSON.stringify({ productId, type, quantity, note: "Teste automatizado isolado" }),
    }));

  assert.equal((await move(3, "ENTRY")).payload.product.stock, 8, "entrada soma estoque");
  assert.equal((await move(-2)).payload.product.stock, 6, "saída reduz estoque");
  const excessive = await move(-7);
  assert.equal(excessive.response.status, 400, "estoque negativo é bloqueado");
  assert.equal((await move(-6)).payload.product.stock, 0, "estoque pode chegar exatamente a zero");

  publicProducts = await (await fetch(`${baseUrl}/api/products`)).json();
  publicProduct = publicProducts.products.find((product) => product.id === productId);
  assert.equal(publicProduct.stock, 0, "catálogo informa produto esgotado");
  assert.equal((await move(5, "ENTRY")).payload.product.stock, 5, "produto pode ser reabastecido");

  const deactivatedResult = await json(await adminFetch(`/api/admin/products/${encodeURIComponent(productId)}`, {
    method: "PATCH",
    body: JSON.stringify({ ...updatedDraft, stock: 5, active: false }),
  }));
  assert.equal(deactivatedResult.payload.product.active, false, "produto pode ser desativado");
  publicProducts = await (await fetch(`${baseUrl}/api/products`)).json();
  assert.equal(publicProducts.products.some((product) => product.id === productId), false, "produto inativo sai da loja pública");

  const persisted = await (await adminFetch("/api/admin/products")).json();
  assert.ok(persisted.products.some((product) => product.id === productId && product.name === updatedDraft.name), "alterações persistem após nova leitura");

  const movementHistory = await (await adminFetch("/api/admin/stock-movements")).json();
  const productMovements = movementHistory.movements.filter((movement) => movement.productId === productId);
  assert.ok(productMovements.length >= 5, "histórico registra estoque inicial, entradas, saídas e ajustes");
  assert.ok(productMovements.every((movement) => Number.isInteger(movement.previousStock) && Number.isInteger(movement.newStock)), "histórico preserva saldos anterior e novo");

  const deletionResult = await json(await adminFetch(`/api/admin/products/${encodeURIComponent(productId)}`, { method: "DELETE" }));
  assert.equal(deletionResult.response.status, 200, "exclusão administrativa funciona");
  assert.equal(deletionResult.payload.mode, "archived", "produto com histórico usa soft delete");
  assert.equal(deletionResult.payload.product.active, false);
});
