import { products as seedProducts, type Product } from "@/lib/products";
import { supabaseRequest, supabaseRpc } from "@/lib/server/supabase";

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
  model: string;
  brand: string;
  description: string;
  price_cents: number;
  promotional_price_cents: number | null;
  image_url: string;
  stock: number;
  category: string;
  tag: string;
  specs_json: unknown;
  featured: boolean;
  recommended: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
};

type SaleRow = {
  id: string;
  total_cents: number;
  status: SaleStatus;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
};

type SaleItemRow = {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
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

export type ProductUpdate = {
  name: string;
  model: string;
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

function formatPrice(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

function safeSpecs(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value !== "string") return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function productFromRow(row: ProductRow): AdminProduct {
  const currentPrice = row.promotional_price_cents ?? row.price_cents;
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    model: row.model,
    descriptor: row.description,
    price: formatPrice(currentPrice),
    priceValue: Number(row.price_cents) / 100,
    promotionalPriceValue:
      row.promotional_price_cents === null
        ? null
        : Number(row.promotional_price_cents) / 100,
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

function productPayload(input: ProductUpdate) {
  return {
    name: input.name,
    model: input.model,
    brand: input.brand,
    description: input.description,
    price_cents: input.priceCents,
    promotional_price_cents: input.promotionalPriceCents,
    image_url: input.imageUrl,
    stock: input.stock,
    category: input.category,
    tag: input.tag,
    specs_json: input.specs,
    featured: input.featured,
    recommended: input.recommended,
    active: input.active,
  };
}

function productIdFromName(brand: string, name: string) {
  const base = `${brand}-${name}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return `${base || "relogio"}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function ensureSeedProducts() {
  const current = await supabaseRequest<Array<{ id: string }>>(
    "/rest/v1/products?select=id&limit=1",
  );
  if (current.length > 0) return;

  const now = new Date().toISOString();
  const rows = seedProducts.map((product) => ({
    id: product.id,
    name: product.name,
    model: product.model,
    brand: product.brand,
    description: product.descriptor,
    price_cents: Math.round(product.priceValue * 100),
    promotional_price_cents: product.promotionalPriceValue === null
      ? null
      : Math.round(product.promotionalPriceValue * 100),
    image_url: product.image,
    stock: product.stock,
    category: product.category,
    tag: product.tag,
    specs_json: product.specs,
    featured: product.featured,
    recommended: product.recommended,
    active: product.active,
    created_at: now,
    updated_at: now,
  }));
  await supabaseRequest<void>("/rest/v1/products?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify(rows),
  });
}

export async function listProducts(includeInactive = true) {
  await ensureSeedProducts();
  const activeFilter = includeInactive ? "" : "&active=eq.true";
  const rows = await supabaseRequest<ProductRow[]>(
    `/rest/v1/products?select=*${activeFilter}&order=recommended.desc,featured.desc,brand.asc,model.asc`,
  );
  return rows.map(productFromRow);
}

export async function getProduct(id: string) {
  await ensureSeedProducts();
  const rows = await supabaseRequest<ProductRow[]>(
    `/rest/v1/products?select=*&id=eq.${encodeURIComponent(id)}&limit=1`,
  );
  return rows[0] ? productFromRow(rows[0]) : null;
}

export async function createProduct(input: ProductUpdate, responsible: string) {
  const id = productIdFromName(input.brand, input.model);
  const rows = await supabaseRpc<ProductRow[]>("vyne_create_product", {
    p_id: id,
    p_payload: productPayload(input),
    p_responsible: responsible,
  });
  return rows[0] ? productFromRow(rows[0]) : null;
}

export async function updateProduct(id: string, input: ProductUpdate, responsible: string) {
  const rows = await supabaseRpc<ProductRow[]>("vyne_update_product", {
    p_id: id,
    p_payload: productPayload(input),
    p_responsible: responsible,
  });
  return rows[0] ? productFromRow(rows[0]) : null;
}

export async function deleteProduct(id: string) {
  const result = await supabaseRpc<{
    mode: "archived" | "deleted";
    product: ProductRow;
  } | null>("vyne_delete_product", { p_id: id });
  if (!result) return null;
  return { mode: result.mode, product: productFromRow(result.product) };
}

export async function addStockMovement(input: {
  productId: string;
  type: Extract<StockMovementType, "ENTRY" | "MANUAL_ADJUSTMENT" | "RETURN">;
  quantity: number;
  responsible: string;
  note: string;
}) {
  const rows = await supabaseRpc<ProductRow[]>("vyne_adjust_stock", {
    p_product_id: input.productId,
    p_type: input.type,
    p_quantity: input.quantity,
    p_responsible: input.responsible,
    p_note: input.note,
  });
  return rows[0] ? productFromRow(rows[0]) : null;
}

export async function listStockMovements(limit = 100) {
  const safeLimit = Math.min(Math.max(limit, 1), 250);
  const rows = await supabaseRequest<Array<{
    id: string;
    product_id: string;
    sale_id: string | null;
    type: StockMovementType;
    quantity: number;
    previous_stock: number;
    new_stock: number;
    responsible: string;
    note: string;
    created_at: string;
    products: { name: string } | null;
  }>>(
    `/rest/v1/stock_movements?select=id,product_id,sale_id,type,quantity,previous_stock,new_stock,responsible,note,created_at,products!inner(name)&order=created_at.desc,id.desc&limit=${safeLimit}`,
  );
  return rows.map((row) => ({
    id: row.id,
    productId: row.product_id,
    productName: row.products?.name ?? "Produto",
    saleId: row.sale_id,
    type: row.type,
    quantity: row.quantity,
    previousStock: row.previous_stock,
    newStock: row.new_stock,
    responsible: row.responsible,
    note: row.note,
    createdAt: row.created_at,
  }));
}

function saleItemFromRow(row: SaleItemRow): SaleItemRecord {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    quantity: row.quantity,
    unitPriceCents: Number(row.unit_price_cents),
    totalCents: Number(row.total_cents),
  };
}

export async function createSale(items: Array<{ productId: string; quantity: number }>) {
  await ensureSeedProducts();
  const id = await supabaseRpc<string>("vyne_create_sale", {
    p_items: items.map((item) => ({ product_id: item.productId, quantity: item.quantity })),
  });
  return getSale(id);
}

export async function getSale(id: string) {
  const sales = await listSales(id);
  return sales[0] ?? null;
}

export async function listSales(id?: string) {
  const idFilter = id ? `&id=eq.${encodeURIComponent(id)}` : "";
  const limit = id ? 1 : 200;
  const saleRows = await supabaseRequest<SaleRow[]>(
    `/rest/v1/sales?select=*${idFilter}&order=created_at.desc,id.desc&limit=${limit}`,
  );
  if (saleRows.length === 0) return [];

  const saleIds = saleRows.map((sale) => sale.id).join(",");
  const itemRows = await supabaseRequest<SaleItemRow[]>(
    `/rest/v1/sale_items?select=*&sale_id=in.(${encodeURIComponent(saleIds)})&order=id.asc`,
  );

  return saleRows.map((sale): SaleRecord => ({
    id: sale.id,
    totalCents: Number(sale.total_cents),
    status: sale.status,
    createdAt: sale.created_at,
    updatedAt: sale.updated_at,
    confirmedAt: sale.confirmed_at,
    items: itemRows.filter((item) => item.sale_id === sale.id).map(saleItemFromRow),
  }));
}

export async function updateSaleStatus(
  saleId: string,
  requestedStatus: Extract<SaleStatus, "CONFIRMED" | "CANCELED">,
  responsible: string,
) {
  await supabaseRpc<SaleRow[]>("vyne_update_sale_status", {
    p_sale_id: saleId,
    p_requested_status: requestedStatus,
    p_responsible: responsible,
  });
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
  const [products, sales] = await Promise.all([listProducts(true), listSales()]);
  const start = periodStart(period);
  const confirmedSales = sales.filter(
    (sale) => sale.status === "CONFIRMED" && (!start || (sale.confirmedAt ?? "") >= start),
  );
  const activeProducts = products.filter((product) => product.active);
  const productById = new Map(products.map((product) => [product.id, product]));

  const rankingMap = new Map<string, {
    productId: string;
    name: string;
    image: string;
    unitsSold: number;
    revenueCents: number;
    stock: number;
  }>();
  let soldUnits = 0;
  for (const sale of confirmedSales) {
    for (const item of sale.items) {
      soldUnits += item.quantity;
      const product = productById.get(item.productId);
      const current = rankingMap.get(item.productId) ?? {
        productId: item.productId,
        name: product ? `${product.brand} ${product.name}` : item.productName,
        image: product?.image ?? "",
        unitsSold: 0,
        revenueCents: 0,
        stock: product?.stock ?? 0,
      };
      current.unitsSold += item.quantity;
      current.revenueCents += item.totalCents;
      rankingMap.set(item.productId, current);
    }
  }
  const ranking = [...rankingMap.values()]
    .sort((a, b) => b.unitsSold - a.unitsSold || b.revenueCents - a.revenueCents || a.name.localeCompare(b.name))
    .slice(0, 5);

  const timelineMap = new Map<string, { date: string; sales: number; revenueCents: number }>();
  for (const sale of confirmedSales) {
    const date = (sale.confirmedAt ?? sale.updatedAt).slice(0, 10);
    const current = timelineMap.get(date) ?? { date, sales: 0, revenueCents: 0 };
    current.sales += 1;
    current.revenueCents += sale.totalCents;
    timelineMap.set(date, current);
  }
  const timeline = [...timelineMap.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-60);

  return {
    period,
    metrics: {
      productsCount: activeProducts.length,
      stockUnits: activeProducts.reduce((sum, product) => sum + product.stock, 0),
      soldUnits,
      lowStockCount: activeProducts.filter((product) => product.stock >= 1 && product.stock <= 3).length,
      outOfStockCount: activeProducts.filter((product) => product.stock === 0).length,
      revenueCents: confirmedSales.reduce((sum, sale) => sum + sale.totalCents, 0),
    },
    bestSeller: ranking[0] ?? null,
    ranking,
    timeline,
  };
}
