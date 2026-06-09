CREATE TABLE `cart_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`product_id` integer,
	`variation_id` integer,
	`quantity` integer DEFAULT 1 NOT NULL,
	`price` real NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`variation_id`) REFERENCES `product_variations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `home_category_banners` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`image_url` text NOT NULL,
	`link_href` text NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `home_tabs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`link_href` text,
	`image_url` text,
	`display_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `navigation_menu` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text NOT NULL,
	`href` text NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer,
	`product_id` integer,
	`variation_id` integer,
	`quantity` integer DEFAULT 1 NOT NULL,
	`price` real NOT NULL,
	`size` text NOT NULL,
	`color` text,
	`customizations` text,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`variation_id`) REFERENCES `product_variations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`total_amount` real NOT NULL,
	`status` text DEFAULT 'Order Placed',
	`shipping_address` text,
	`payment_id` text,
	`razorpay_order_id` text,
	`payment_mode` text,
	`payment_status` text,
	`amount_paid` real,
	`razorpay_payment_id` text,
	`order_status` text DEFAULT '0_PLACED',
	`shipping_status` text DEFAULT 'PENDING',
	`awb_number` text,
	`shipping_details` text,
	`cancel_reason` text,
	`created_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `otp_verifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`phone_number` text NOT NULL,
	`otp` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `package_tiers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`max_weight_grams` integer NOT NULL,
	`length_cm` integer NOT NULL,
	`breadth_cm` integer NOT NULL,
	`height_cm` integer NOT NULL,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE INDEX `max_weight_idx` ON `package_tiers` (`max_weight_grams`);--> statement-breakpoint
CREATE TABLE `page_sections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`menu_id` integer NOT NULL,
	`title` text NOT NULL,
	`product_ids` text NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`menu_id`) REFERENCES `navigation_menu`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `product_variations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer,
	`size` text NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`sku` text,
	`mrp` real,
	`sale_price` real,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`base_price` real NOT NULL,
	`sale_price` real,
	`images` text,
	`category` text,
	`tags` text,
	`is_featured` integer DEFAULT false,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`phone_number` text NOT NULL,
	`full_name` text,
	`role` text DEFAULT 'user',
	`address` text,
	`created_at` text,
	`last_login_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_phone_number_unique` ON `users` (`phone_number`);