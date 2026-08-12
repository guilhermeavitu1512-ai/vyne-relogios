import { getD1 } from "@/db/runtime";
import { products as seedProducts, type Product } from "@/lib/products";

export type SaleStatus = "PENDING" | "CONFIRMED" | "CANCELED";
export type StockMovementType =
  | "ENTRY"
  | "SALE"
  | "MANUAL_ADJUSTMENT"
  | "RETURN"
  | "CANCELLATION";

type ProductRow = {
  id: string;
  name: string;
  brand: string;
  description: string;
  price_cents: number;
  promotional_price_cents: number | null;
  image_url: string;
  stock: number;
  category: string;
  tag: string;
  specs_json: string;
  featured: number;
  recommended: number;
  active: number;
  created_at: string;
  updated_at: string;
};

export type AdminProduct = Product & {
  createdAt: string;
  updatedAt: string;
};

export type SaleItemRecord = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
};

export type SaleRecord = {
  id: string;
  totalCents: number;
  status: SaleStatus;
  createdAt: string;
  updatedAt: string;
  confirmedAt: string | null;
  items: SaleItemRecord[];
};

function formatPrice(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

function safeSpecs(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function productFromRow(row: ProductRow): AdminProduct {
  const currentPrice = row.promotional_price_cents ?? row.price_cents;
  return {
    id: row.id,
    brand: row.brand,
    model: row.name,
    descriptor: row.description,
    price: formatPrice(currentPrice),
    priceValue: row.price_cents / 100,
    promotionalPriceValue:
      row.promotional_price_cents === null ? null : row.promotional_price_cents / 100,
    image: row.image_url,
    tag: row.tag,
    category: row.category,
    specs: safeSpecs(row.specs_json),
    stock: row.stock,
    featured: Boolean(row.featured),
    recommended: Boolean(row.recommended),
    active: Boolean(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function all<T>(statement: D1PreparedStatement) {
  const result = await statement.all<T>();
  return result.results ?? [];
}

async function first<T>(statement: D1PreparedStatement) {
  return statement.first<T>();
}

export async function ensureSeedProducts() {
  const database = getD1();
  const count = await first<{ count: number }>(
    database.prepare("SELECT COUNT(*) AS count FROM products"),
  );
  if ((count?.count ?? 0) > 0) return;

  const now = new Date().toISOString();
  await database.batch(
    seedProducts.map((product) =>
      database
        .prepare(
          `INSERT OR IGNORE INTO products
          (id, name, brand, description, price_cents, promotional_price_cents, image_url, stock, category, tag, specs_json, featured, recommended, active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, NULL, ?, 0, ?, ?, ?, ?, ?, 1, ?, ?)`,
        )
        .bind(
          product.id,
          product.model,
          product.brand,
          product.descriptor,
          Math.round(product.priceValue * 100),
          product.image,
          product.category,
          product.tag,
          JSON.stringify(product.specs),
          product.featured ? 1 : 0,
          product.recommended ? 1 : 0,
          now,
          now,
        ),
    ),
  );
}

export async function listProducts(includeInactive = true) {
  await ensureSeedProducts();
  const database = getD1();
  const rows = await all<ProductRow>(
    database.prepare(
      `SELECT * FROM products ${includeInactive ? "" : "WHERE active = 1"}
       ORDER BY recommended DESC, featured DESC, brand ASC, name ASC`,
    ),
  );
  return rows.map(productFromRow);
}

export async function getProduct(id: string) {
  await ensureSeedProducts();
  const row = await first<ProductRow>(
    getD1().prepare("SELECT * FROM products WHERE id = ?").bind(id),
  );
  return row ? productFromRow(row) : null;
}

export type ProductUpdate = {
  name: string;
  brand: string;
  description: string;
  priceCents: number;
  promotionalPriceCents: number | null;
  imageUrl: string;
  stock: number;
  category: string;
  tag: string;
  specs: string[];
  featured: boolean;
  recommended: boolean;
  active: boolean;
};

export async function updateProduct(id: string, input: ProductUpdate, responsible: string) {
  const database = getD1();
  const existing = await first<ProductRow>(
    database.prepare("SELECT * FROM products WHERE id = ?").bind(id),
  );
  if (!existing) return null;

  const now = new Date().toISOString();
  const statements: D1PreparedStatement[] = [
    database
      .prepare(
        `UPDATE products SET
          name = ?, brand = ?, description = ?, price_cents = ?, promotional_price_cents = ?,
          image_url = ?, stock = ?, category = ?, tag = ?, specs_json = ?, featured = ?,
          recommended = ?, active = ?, updated_at = ?
         WHERE id = ?`,
      )
      .bind(
        input.name,
        input.brand,
        input.description,
        input.priceCents,
        input.promotionalPriceCents,
        input.imageUrl,
        input.stock,
        input.category,
        input.tag,
        JSON.stringify(input.specs),
        input.featured ? 1 : 0,
        input.recommended ? 1 : 0,
        input.active ? 1 : 0,
        now,
        id,
      ),
  ];

  if (input.stock !== existing.stock) {
    statements.push(
      database
        .prepare(
          `INSERT INTO stock_movements
          (id, product_id, sale_id, type, quantity, previous_stock, new_stock, responsible, note, created_at)
          VALUES (?, ?, NULL, 'MANUAL_ADJUSTMENT', ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          crypto.randomUUID(),
          id,
          input.stock - existing.stock,
          existing.stock,
          input.stock,
          responsible,
          "Ajuste realizado na edição do produto",
          now,
        ),
    );
  }

  await database.batch(statements);
  return getProduct(id);
}

export async function addStockMovement(input: {
  productId: string;
  type: Extract<StockMovementType, "ENTRY" | "MANUAL_ADJUSTMENT" | "RETURN">;
  quantity: number;
  responsible: string;
  note: string;
}) {
  const database = getD1();
  const product = await first<ProductRow>(
    database.prepare("SELECT * FROM products WHERE id = ?").bind(input.productId),
  );
  if (!product) throw new Error("Produto não encontrado.");
  const newStock = product.stock + input.quantity;
  if (newStock < 0) throw new Error("A movimentação deixaria o estoque negativo.");

  const now = new Date().toISOString();
  await database.batch([
    database
      .prepare("UPDATE products SET stock = ?, updated_at = ? WHERE id = ?")
      .bind(newStock, now, input.productId),
    database
      .prepare(
        `INSERT INTO stock_movements
        (id, product_id, sale_id, type, quantity, previous_stock, new_stock, responsible, note, created_at)
        VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        input.productId,
        input.type,
        input.quantity,
        product.stock,
        newStock,
        input.responsible,
        input.note,
        now,
      ),
  ]);
  return getProduct(input.productId);
}

export async function listStockMovements(limit = 100) {
  return all<{
    id: string;
    productId: string;
    productName: string;
    saleId: string | null;
    type: StockMovementType;
    quantity: number;
    previousStock: number;
    newStock: number;
    responsible: string;
    note: string;
    createdAt: string;
  }>(
    getD1()
      .prepare(
        `SELECT m.id, m.product_id AS productId, p.name AS productName,
          m.sale_id AS saleId, m.type, m.quantity, m.previous_stock AS previousStock,
          m.new_stock AS newStock, m.responsible, m.note, m.created_at AS createdAt
         FROM stock_movements m
         JOIN products p ON p.id = m.product_id
         ORDER BY m.created_at DESC, m.id DESC LIMIT ?`,
      )
      .bind(Math.min(Math.max(limit, 1), 250)),
  );
}

export async function createSale(items: Array<{ productId: string; quantity: number }>) {
  await ensureSeedProducts();
  const database = getD1();
  const uniqueItems = new Map<string, number>();
  for (const item of items) {
    uniqueItems.set(item.productId, (uniqueItems.get(item.productId) ?? 0) + item.quantity);
  }

  const resolved: Array<{ product: ProductRow; quantity: number; unitPriceCents: number }> = [];
  for (const [productId, quantity] of uniqueItems) {
    const product = await first<ProductRow>(
      database.prepare("SELECT * FROM products WHERE id = ? AND active = 1").bind(productId),
    );
    if (!product) throw new Error("Um dos produtos não está disponível.");
    resolved.push({
      product,
      quantity,
      unitPriceCents: product.promotional_price_cents ?? product.price_cents,
    });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const totalCents = resolved.reduce(
    (total, item) => total + item.unitPriceCents * item.quantity,
    0,
  );
  await database.batch([
    database
      .prepare(
        "INSERT INTO sales (id, total_cents, status, created_at, updated_at, confirmed_at) VALUES (?, ?, 'PENDING', ?, ?, NULL)",
      )
      .bind(id, totalCents, now, now),
    ...resolved.map(({ product, quantity, unitPriceCents }) =>
      database
        .prepare(
          `INSERT INTO sale_items
          (id, sale_id, product_id, product_name, quantity, unit_price_cents, total_cents)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          crypto.randomUUID(),
          id,
          product.id,
          `${product.brand} ${product.name}`,
          quantity,
          unitPriceCents,
          unitPriceCents * quantity,
        ),
    ),
  ]);
  return getSale(id);
}

export async function getSale(id: string) {
  const sales = await listSales(id);
  return sales[0] ?? null;
}

export async function listSales(id?: string) {
  const database = getD1();
  const saleRows = await all<{
    id: string;
    totalCents: number;
    status: SaleStatus;
    createdAt: string;
    updatedAt: string;
    confirmedAt: string | null;
  }>(
    database
      .prepare(
        `SELECT id, total_cents AS totalCents, status, created_at AS createdAt,
          updated_at AS updatedAt, confirmed_at AS confirmedAt
         FROM sales ${id ? "WHERE id = ?" : ""}
         ORDER BY created_at DESC, id DESC ${id ? "" : "LIMIT 200"}`,
      )
      .bind(...(id ? [id] : [])),
  );
  if (saleRows.length === 0) return [];

  const placeholders = saleRows.map(() => "?").join(",");
  const itemRows = await all<{
    id: string;
    saleId: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPriceCents: number;
    totalCents: number;
  }>(
    database
      .prepare(
        `SELECT id, sale_id AS saleId, product_id AS productId, product_name AS productName,
          quantity, unit_price_cents AS unitPriceCents, total_cents AS totalCents
         FROM sale_items WHERE sale_id IN (${placeholders}) ORDER BY id`,
      )
      .bind(...saleRows.map((sale) => sale.id)),
  );

  return saleRows.map((sale): SaleRecord => ({
    ...sale,
    items: itemRows.filter((item) => item.saleId === sale.id),
  }));
}

export async function updateSaleStatus(
  saleId: string,
  requestedStatus: Extract<SaleStatus, "CONFIRMED" | "CANCELED">,
  responsible: string,
) {
  const database = getD1();
  const sale = await getSale(saleId);
  if (!sale) throw new Error("Venda não encontrada.");
  if (sale.status === requestedStatus) return sale;
  const now = new Date().toISOString();

  if (requestedStatus === "CONFIRMED") {
    if (sale.status !== "PENDING") throw new Error("Somente vendas pendentes podem ser confirmadas.");
    const statements: D1PreparedStatement[] = [];
    for (const item of sale.items) {
      statements.push(
        database
          .prepare(
            `UPDATE products SET stock = stock - ?, updated_at = ?
             WHERE id = ? AND EXISTS (SELECT 1 FROM sales WHERE id = ? AND status = 'PENDING')`,
          )
          .bind(item.quantity, now, item.productId, saleId),
        database
          .prepare(
            `INSERT INTO stock_movements
            (id, product_id, sale_id, type, quantity, previous_stock, new_stock, responsible, note, created_at)
            SELECT ?, p.id, ?, 'SALE', ?, p.stock + ?, p.stock, ?, 'Venda confirmada', ?
            FROM products p
            WHERE p.id = ? AND EXISTS (SELECT 1 FROM sales WHERE id = ? AND status = 'PENDING')`,
          )
          .bind(
            crypto.randomUUID(),
            saleId,
            -item.quantity,
            item.quantity,
            responsible,
            now,
            item.productId,
            saleId,
          ),
      );
    }
    statements.push(
      database
        .prepare(
          "UPDATE sales SET status = 'CONFIRMED', confirmed_at = ?, updated_at = ? WHERE id = ? AND status = 'PENDING'",
        )
        .bind(now, now, saleId),
    );
    try {
      await database.batch(statements);
    } catch {
      throw new Error("Estoque insuficiente para confirmar esta venda.");
    }
  } else if (sale.status === "CONFIRMED") {
    const statements: D1PreparedStatement[] = [];
    for (const item of sale.items) {
      statements.push(
        database
          .prepare(
            `UPDATE products SET stock = stock + ?, updated_at = ?
             WHERE id = ? AND EXISTS (SELECT 1 FROM sales WHERE id = ? AND status = 'CONFIRMED')`,
          )
          .bind(item.quantity, now, item.productId, saleId),
        database
          .prepare(
            `INSERT INTO stock_movements
            (id, product_id, sale_id, type, quantity, previous_stock, new_stock, responsible, note, created_at)
            SELECT ?, p.id, ?, 'CANCELLATION', ?, p.stock - ?, p.stock, ?, 'Venda cancelada', ?
            FROM products p
            WHERE p.id = ? AND EXISTS (SELECT 1 FROM sales WHERE id = ? AND status = 'CONFIRMED')`,
          )
          .bind(
            crypto.randomUUID(),
            saleId,
            item.quantity,
            item.quantity,
            responsible,
            now,
            item.productId,
            saleId,
          ),
      );
    }
    statements.push(
      database
        .prepare("UPDATE sales SET status = 'CANCELED', updated_at = ? WHERE id = ? AND status = 'CONFIRMED'")
        .bind(now, saleId),
    );
    await database.batch(statements);
  } else if (sale.status === "PENDING") {
    await database
      .prepare("UPDATE sales SET status = 'CANCELED', updated_at = ? WHERE id = ? AND status = 'PENDING'")
      .bind(now, saleId)
      .run();
  } else {
    throw new Error("Esta venda já foi cancelada.");
  }

  return getSale(saleId);
}

function periodStart(period: string) {
  const now = new Date();
  if (period === "today") {
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
  }
  if (period === "7d" || period === "30d") {
    now.setDate(now.getDate() - (period === "7d" ? 7 : 30));
    return now.toISOString();
  }
  return null;
}

export async function getDashboard(period: string) {
  await ensureSeedProducts();
  const database = getD1();
  const start = periodStart(period);
  const dateClause = start ? "AND s.confirmed_at >= ?" : "";
  const dateArgs = start ? [start] : [];

  const inventory = await first<{
    productsCount: number;
    stockUnits: number;
    lowStockCount: number;
    outOfStockCount: number;
  }>(
    database.prepare(
      `SELECT COUNT(*) AS productsCount, COALESCE(SUM(stock), 0) AS stockUnits,
        SUM(CASE WHEN stock BETWEEN 1 AND 3 THEN 1 ELSE 0 END) AS lowStockCount,
        SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) AS outOfStockCount
       FROM products WHERE active = 1`,
    ),
  );

  const salesMetrics = await first<{ soldUnits: number; revenueCents: number }>(
    database
      .prepare(
        `SELECT COALESCE(SUM(i.quantity), 0) AS soldUnits,
          COALESCE(SUM(i.total_cents), 0) AS revenueCents
         FROM sale_items i JOIN sales s ON s.id = i.sale_id
         WHERE s.status = 'CONFIRMED' ${dateClause}`,
      )
      .bind(...dateArgs),
  );

  const ranking = await all<{
    productId: string;
    name: string;
    image: string;
    unitsSold: number;
    revenueCents: number;
    stock: number;
  }>(
    database
      .prepare(
        `SELECT p.id AS productId, p.brand || ' ' || p.name AS name, p.image_url AS image,
          SUM(i.quantity) AS unitsSold, SUM(i.total_cents) AS revenueCents, p.stock
         FROM sale_items i
         JOIN sales s ON s.id = i.sale_id
         JOIN products p ON p.id = i.product_id
         WHERE s.status = 'CONFIRMED' ${dateClause}
         GROUP BY p.id, p.brand, p.name, p.image_url, p.stock
         ORDER BY unitsSold DESC, revenueCents DESC, name ASC LIMIT 5`,
      )
      .bind(...dateArgs),
  );

  const timeline = await all<{ date: string; sales: number; revenueCents: number }>(
    database
      .prepare(
        `SELECT substr(s.confirmed_at, 1, 10) AS date, COUNT(DISTINCT s.id) AS sales,
          SUM(i.total_cents) AS revenueCents
         FROM sales s JOIN sale_items i ON i.sale_id = s.id
         WHERE s.status = 'CONFIRMED' ${dateClause}
         GROUP BY substr(s.confirmed_at, 1, 10)
         ORDER BY date ASC LIMIT 60`,
      )
      .bind(...dateArgs),
  );

  return {
    period,
    metrics: {
      productsCount: inventory?.productsCount ?? 0,
      stockUnits: inventory?.stockUnits ?? 0,
      soldUnits: salesMetrics?.soldUnits ?? 0,
      lowStockCount: inventory?.lowStockCount ?? 0,
      outOfStockCount: inventory?.outOfStockCount ?? 0,
      revenueCents: salesMetrics?.revenueCents ?? 0,
    },
    bestSeller: ranking[0] ?? null,
    ranking,
    timeline,
  };
}
