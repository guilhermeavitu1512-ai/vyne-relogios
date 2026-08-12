CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`brand` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`price_cents` integer NOT NULL,
	`promotional_price_cents` integer,
	`image_url` text NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`category` text NOT NULL,
	`tag` text DEFAULT '' NOT NULL,
	`specs_json` text DEFAULT '[]' NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`recommended` integer DEFAULT false NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "products_stock_nonnegative" CHECK("products"."stock" >= 0),
	CONSTRAINT "products_price_nonnegative" CHECK("products"."price_cents" >= 0),
	CONSTRAINT "products_promotional_price_nonnegative" CHECK("products"."promotional_price_cents" IS NULL OR "products"."promotional_price_cents" >= 0)
);
--> statement-breakpoint
CREATE INDEX `idx_products_brand` ON `products` (`brand`);--> statement-breakpoint
CREATE INDEX `idx_products_active_stock` ON `products` (`active`,`stock`);--> statement-breakpoint
CREATE TABLE `sale_items` (
	`id` text PRIMARY KEY NOT NULL,
	`sale_id` text NOT NULL,
	`product_id` text NOT NULL,
	`product_name` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price_cents` integer NOT NULL,
	`total_cents` integer NOT NULL,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "sale_items_quantity_positive" CHECK("sale_items"."quantity" > 0),
	CONSTRAINT "sale_items_unit_price_nonnegative" CHECK("sale_items"."unit_price_cents" >= 0)
);
--> statement-breakpoint
CREATE INDEX `idx_sale_items_sale_id` ON `sale_items` (`sale_id`);--> statement-breakpoint
CREATE INDEX `idx_sale_items_product_id` ON `sale_items` (`product_id`);--> statement-breakpoint
CREATE TABLE `sales` (
	`id` text PRIMARY KEY NOT NULL,
	`total_cents` integer NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`confirmed_at` text,
	CONSTRAINT "sales_total_nonnegative" CHECK("sales"."total_cents" >= 0),
	CONSTRAINT "sales_status_valid" CHECK("sales"."status" IN ('PENDING', 'CONFIRMED', 'CANCELED'))
);
--> statement-breakpoint
CREATE INDEX `idx_sales_status_confirmed_at` ON `sales` (`status`,`confirmed_at`);--> statement-breakpoint
CREATE TABLE `stock_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`sale_id` text,
	`type` text NOT NULL,
	`quantity` integer NOT NULL,
	`previous_stock` integer NOT NULL,
	`new_stock` integer NOT NULL,
	`responsible` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "stock_movements_type_valid" CHECK("stock_movements"."type" IN ('ENTRY', 'SALE', 'MANUAL_ADJUSTMENT', 'RETURN', 'CANCELLATION')),
	CONSTRAINT "stock_movements_new_stock_nonnegative" CHECK("stock_movements"."new_stock" >= 0)
);
--> statement-breakpoint
CREATE INDEX `idx_stock_movements_product_created` ON `stock_movements` (`product_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_stock_movements_created_at` ON `stock_movements` (`created_at`);