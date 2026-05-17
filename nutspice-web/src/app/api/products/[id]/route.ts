import { db } from "@/db";
import { products, productVariations, orderItems, orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const productRows = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!productRows.length) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const variations = await db
      .select()
      .from(productVariations)
      .where(eq(productVariations.productId, productId));

    const productOrderItems = await db
      .select({
        variationId: orderItems.variationId,
        quantity: orderItems.quantity,
        size: orderItems.size,
        status: orders.status,
      })
      .from(orderItems)
      .leftJoin(orders, eq(orderItems.orderId, orders.id))
      .where(eq(orderItems.productId, productId));

    const variationsWithRealStock = variations.map(v => {
      const vOrders = productOrderItems.filter(item => 
        item.variationId === v.id || item.size === v.size
      );

      const itemsSoldOrPending = vOrders
        .filter(item => 
          item.status && 
          ["order placed", "processing", "shipped", "in transit", "out for delivery", "delivered"].includes(item.status.toLowerCase())
        )
        .reduce((sum, item) => sum + (item.quantity || 0), 0);

      return {
        ...v,
        stock: Math.max(0, v.stock - itemsSoldOrPending)
      };
    });

    return NextResponse.json({
      ...productRows[0],
      variations: variationsWithRealStock,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
