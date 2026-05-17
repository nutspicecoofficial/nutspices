import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, productVariations, orderItems, orders } from "@/db/schema";
import { eq, sql, ne, and, inArray } from "drizzle-orm";

export async function GET() {
  try {
    // Fetch all products
    const allProducts = await db.select().from(products);
    
    // Fetch all variations for stock calculation
    const allVariations = await db.select().from(productVariations);

    // Fetch all order items and their associated order status
    const allOrderItems = await db
      .select({
        productId: orderItems.productId,
        variationId: orderItems.variationId,
        quantity: orderItems.quantity,
        size: orderItems.size,
        status: orders.status,
      })
      .from(orderItems)
      .leftJoin(orders, eq(orderItems.orderId, orders.id));

    // Process data to calculate metrics
    const inventoryData = allProducts.map((product: any) => {
      const productOrderItems = allOrderItems.filter(item => item.productId === product.id);
      const productVariationsList = allVariations.filter(v => v.productId === product.id);

      const variations = productVariationsList.map((v: any) => {
        const variationOrderItems = productOrderItems.filter(item => 
          item.variationId === v.id || (item.size === v.size && item.productId === v.productId)
        );

        const vSold = variationOrderItems
          .filter(item => item.status && item.status.toLowerCase() === "delivered")
          .reduce((sum, item) => sum + (item.quantity || 0), 0);

        const vToDeliver = variationOrderItems
          .filter(item => 
            item.status && 
            ["order placed", "processing", "shipped", "in transit", "out for delivery"].includes(item.status.toLowerCase())
          )
          .reduce((sum, item) => sum + (item.quantity || 0), 0);

        return {
          id: v.id,
          size: v.size,
          stock: v.stock,
          sold: vSold,
          toBeDelivered: vToDeliver,
          remaining: Math.max(0, v.stock - vSold - vToDeliver)
        };
      });

      const totalSold = variations.reduce((sum, v) => sum + v.sold, 0);
      const totalToDeliver = variations.reduce((sum, v) => sum + v.toBeDelivered, 0);
      const totalRemaining = variations.reduce((sum, v) => sum + v.remaining, 0);

      return {
        id: product.id,
        name: product.name,
        category: product.category || "Uncategorized",
        basePrice: product.basePrice,
        sold: totalSold,
        remaining: totalRemaining,
        toBeDelivered: totalToDeliver,
        variations,
        image: product.images ? JSON.parse(product.images)[0] : null,
      };
    });

    // Group by category
    const groupedData = inventoryData.reduce((acc: any, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});

    return NextResponse.json({ success: true, data: groupedData });
  } catch (error: any) {
    console.error("Inventory API Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
