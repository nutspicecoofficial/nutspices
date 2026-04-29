import fs from "fs";
import path from "path";

const schemaPath = "src/db/schema.ts";
const contentToAdd = `
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
`;

fs.appendFileSync(schemaPath, contentToAdd);
console.log("Successfully appended orders tables to schema.ts");
