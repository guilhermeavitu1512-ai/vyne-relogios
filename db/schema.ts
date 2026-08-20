import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const products = sqliteTable(
  "products",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    model: text("model").notNull().default(""),
    brand: text("brand").notNull(),
    description: text("description").notNull().default(""),
    priceCents: integer("price_cents").notNull(),
    promotionalPriceCents: integer("promotional_price_cents"),
    imageUrl: text("image_url").notNull(),
    stock: integer("stock").notNull().default(0),
    category: text("category").notNull(),
    tag: text("tag").notNull().default(""),
    specsJson: text("specs_json").notNull().default("[]"),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    recommended: integer("recommended", { mode: "boolean" }).notNull().default(false),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    check("products_stock_nonnegative", sql`${table.stock} >= 0`),
    check("products_price_nonnegative", sql`${table.priceCents} >= 0`),
    check(
      "products_promotional_price_nonnegative",
      sql`${table.promotionalPriceCents} IS NULL OR ${table.promotionalPriceCents} >= 0`,
    ),
    index("idx_products_brand").on(table.brand),
    index("idx_products_active_stock").on(table.active, table.stock),
  ],
);

export const sales = sqliteTable(
  "sales",
  {
    id: text("id").primaryKey(),
    totalCents: integer("total_cents").notNull(),
    status: text("status").notNull().default("PENDING"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    confirmedAt: text("confirmed_at"),
  },
  (table) => [
    check("sales_total_nonnegative", sql`${table.totalCents} >= 0`),
    check(
      "sales_status_valid",
      sql`${table.status} IN ('PENDING', 'CONFIRMED', 'CANCELED')`,
    ),
    index("idx_sales_status_confirmed_at").on(table.status, table.confirmedAt),
  ],
);

export const saleItems = sqliteTable(
  "sale_items",
  {
    id: text("id").primaryKey(),
    saleId: text("sale_id")
      .notNull()
      .references(() => sales.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    productName: text("product_name").notNull(),
    quantity: integer("quantity").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
  },
  (table) => [
    check("sale_items_quantity_positive", sql`${table.quantity} > 0`),
    check("sale_items_unit_price_nonnegative", sql`${table.unitPriceCents} >= 0`),
    index("idx_sale_items_sale_id").on(table.saleId),
    index("idx_sale_items_product_id").on(table.productId),
  ],
);

export const stockMovements = sqliteTable(
  "stock_movements",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    saleId: text("sale_id").references(() => sales.id),
    type: text("type").notNull(),
    quantity: integer("quantity").notNull(),
    previousStock: integer("previous_stock").notNull(),
    newStock: integer("new_stock").notNull(),
    responsible: text("responsible").notNull(),
    note: text("note").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    check(
      "stock_movements_type_valid",
      sql`${table.type} IN ('ENTRY', 'SALE', 'MANUAL_ADJUSTMENT', 'RETURN', 'CANCELLATION')`,
    ),
    check("stock_movements_new_stock_nonnegative", sql`${table.newStock} >= 0`),
    index("idx_stock_movements_product_created").on(table.productId, table.createdAt),
    index("idx_stock_movements_created_at").on(table.createdAt),
  ],
);
