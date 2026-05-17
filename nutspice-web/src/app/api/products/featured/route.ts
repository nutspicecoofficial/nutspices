import { db } from "@/db";
import { products, productVariations } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const results = await db.select({
      id: products.id,
      name: products.name,
      description: products.description,
      basePrice: products.basePrice,
      salePrice: products.salePrice,
      images: products.images,
      category: products.category,
      isFeatured: products.isFeatured,
      totalStock: sql<number>`SUM(${productVariations.stock})`.mapWith(Number)
    })
    .from(products)
    .leftJoin(productVariations, eq(products.id, productVariations.productId))
    .where(sql`${products.isFeatured} = 1`)
    .groupBy(products.id);

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
