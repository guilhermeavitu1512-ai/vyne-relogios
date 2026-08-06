import assert from "node:assert/strict";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("renders the finished VYNE home page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /VYNE/);
  assert.match(html, /Sofistica(?:ç|&#xE7;|&ccedil;)ão real/i);
  assert.match(html, /Explorar cole(?:ç|&#xE7;|&ccedil;)ão/i);
  assert.match(html, /Frete gr(?:á|&#xE1;|&aacute;)tis na compra de qualquer item/i);
  assert.match(html, /Quem somos/i);
  assert.match(html, /Rel(?:ó|&#xF3;|&oacute;)gios recomendados/i);
  assert.match(html, /Arraste horizontalmente ou use as setas do teclado/i);
  assert.doesNotMatch(html, /id=["']confianca["']/i);
  assert.match(html, /Ir para o conte(?:ú|&#xFA;|&uacute;)do/i);
  assert.doesNotMatch(html, developmentPreviewMeta);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/i);
});

test("renders the searchable catalog route", async () => {
  const response = await render("/catalogo");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Rel(?:ó|&#xF3;|&oacute;)gios escolhidos com inten(?:ç|&#xE7;|&ccedil;)ão/i);
  assert.match(html, /Buscar por marca ou modelo/i);
  assert.match(html, /SEIKO/);
  assert.match(html, /CASIO/);
  assert.match(html, /Adicionar.+favoritos/i);
  assert.match(html, /Ver detalhes e comprar SEIKO 5 Sports/i);
});
