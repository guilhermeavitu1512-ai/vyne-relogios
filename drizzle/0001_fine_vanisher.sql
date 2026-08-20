ALTER TABLE `products` ADD `model` text DEFAULT '' NOT NULL;
--> statement-breakpoint
UPDATE `products` SET `model` = `name`;
--> statement-breakpoint
UPDATE `products`
SET `name` = CASE
  WHEN upper(substr(`name`, 1, length(`brand`))) = upper(`brand`) THEN `name`
  ELSE trim(`brand` || ' ' || `name`)
END;
