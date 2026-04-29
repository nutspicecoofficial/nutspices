import { sqliteTable, text, integer, blob, real } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  phoneNumber: text("phone_number").notNull().unique(),
  fullName: text("full_name"),
  role: text("role").default("user"), // user, admin
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
});


export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  basePrice: real("base_price").notNull(),
  salePrice: real("sale_price"),
  avgRating: real("avg_rating").default(4.3),
  numReviews: integer("num_reviews").default(1),
  images: text("images"), // JSON string array of URLs
  colors: text("colors"),  // JSON string array of colour names
  gender: text("gender", { enum: ["men", "women", "unisex"] }),
  category: text("category"),
  tags: text("tags"),       // comma-separated tags
  isFeatured: integer("is_featured", { mode: "boolean" }).default(false),
  enabledMeasurements: text("enabled_measurements"), // JSON string array
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

export const productVariations = sqliteTable("product_variations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }),
  size: text("size").notNull(),
  stock: integer("stock").notNull().default(0),
  sku: text("sku"),
  color: text("color"),
  mrp: real("mrp"),
  salePrice: real("sale_price"),
});

export const productCustomisationRules = sqliteTable("product_customisation_rules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").references(() => products.id),
  attributeName: text("attribute_name"), 
  minAdjustment: real("min_adjustment"), 
  maxAdjustment: real("max_adjustment"), 
  step: real("step"), 
});

export const cartItems = sqliteTable("cart_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id), 
  productId: integer("product_id").references(() => products.id),
  baseSize: text("base_size").notNull(), 
  customSpecifications: blob("custom_specifications", { mode: "json" }), 
  itemHash: text("item_hash").notNull(), 
  quantity: integer("quantity").notNull().default(1),
  price: real("price").notNull(),
});


export const navigationMenu = sqliteTable("navigation_menu", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull(),
  href: text("href").notNull(),
  order: integer("order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

export const pageSections = sqliteTable("page_sections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  menuId: integer("menu_id").notNull().references(() => navigationMenu.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  productIds: text("product_ids").notNull(), // Comma-separated or JSON string of product IDs
  displayOrder: integer("display_order").notNull().default(0),
});



export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  totalAmount: real("total_amount").notNull(),
  status: text("status").default("pending"), // pending, processing, shipped, delivered, cancelled
  shippingAddress: text("shipping_address"),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id),
  variationId: integer("variation_id").references(() => productVariations.id),
  quantity: integer("quantity").notNull().default(1),
  price: real("price").notNull(),
  size: text("size").notNull(),
  color: text("color"),
  customizations: text("customizations"), // JSON string of bespoke measurements
});
