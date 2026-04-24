import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, productVariations } from "@/db/schema";
import { eq, like, or, sql } from "drizzle-orm";
import { cookies } from "next/headers";

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("auth_session")?.value;
  return session === "9876543210";
}

export async function GET(request: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const id = searchParams.get("id");

    if (id) {
      const product = await db.select().from(products).where(eq(products.id, parseInt(id))).limit(1);
      if (!product.length) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
      
      const variations = await db.select().from(productVariations).where(eq(productVariations.productId, parseInt(id)));
      return NextResponse.json({ success: true, data: { ...product[0], variations } });
    }
    
    // Fetch products with their total stock
    const results = await db.select({
      id: products.id,
      name: products.name,
      description: products.description,
      mrp: products.mrp,
      salePrice: products.salePrice,
      images: products.images,
      avgRating: products.avgRating,
      numReviews: products.numReviews,
      category: products.category,
      gender: products.gender,
      isFeatured: products.isFeatured,
      tags: products.tags,
      colors: products.colors,
      totalStock: sql<number>`(SELECT SUM(stock) FROM ${productVariations} WHERE product_id = ${products.id})`.mapWith(Number)
    })
    .from(products)
    .where(
      search ? or(like(products.name, `%${search}%`), like(products.category, `%${search}%`)) : undefined
    );

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { 
      name, description, mrp, salePrice, images, variations,
      avgRating, numReviews, category, gender, colors, tags, isFeatured
    } = body;

    // Validation
    if (!name) return NextResponse.json({ success: false, error: "Product name is required" }, { status: 400 });
    
    // Pricing is now handled per variation. 
    // We will calculate a "base price" for the main product entry from the minimum variation price.
    const baseMrp = variations && variations.length > 0 ? Math.min(...variations.map((v: any) => parseFloat(v.mrp) || 0)) : 0;
    const baseSalePrice = variations && variations.length > 0 ? Math.min(...variations.map((v: any) => parseFloat(v.salePrice) || 0)) : 0;

    // 1. Insert Product
    const productResult = await db.insert(products).values({
      name,
      description: description || null,
      mrp: baseMrp,
      salePrice: baseSalePrice,
      images: JSON.stringify(images || []),
      colors: JSON.stringify(colors || []),
      avgRating: parseFloat(avgRating && avgRating.toString().trim() !== "" ? avgRating : "4.3"),
      numReviews: parseInt(numReviews && numReviews.toString().trim() !== "" ? numReviews : "1"),
      category: category || null,
      gender: (gender as "men" | "women" | "unisex") || "unisex",
      tags: tags || null,
      isFeatured: !!isFeatured,
    }).returning();

    if (!productResult || productResult.length === 0) {
      throw new Error("Database failed to return the new product ID.");
    }

    const newProduct = productResult[0];

    // 2. Insert Variations
    if (variations && variations.length > 0) {
      const variationValues = variations.map((v: any) => ({
        productId: newProduct.id,
        size: v.size,
        color: v.color || "Default",
        stock: parseInt(v.stock) || 0,
        mrp: parseFloat(v.mrp) || 0,
        salePrice: parseFloat(v.salePrice) || 0,
        sku: v.sku || `${newProduct.id}-${v.size}${v.color && v.color !== "Default" ? `-${v.color}` : ""}`
      }));
      await db.insert(productVariations).values(variationValues);
    }

    return NextResponse.json({ success: true, data: newProduct });

  } catch (error: any) {
    console.error("CRITICAL ERROR in POST /api/admin/products:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to create product",
      details: error.message 
    }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { 
      id, name, description, mrp, salePrice, images, variations,
      avgRating, numReviews, category, gender, colors, tags, isFeatured
    } = body;

    if (!id) return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });

    // Pricing from variations
    const baseMrp = variations && variations.length > 0 ? Math.min(...variations.map((v: any) => parseFloat(v.mrp) || 0)) : 0;
    const baseSalePrice = variations && variations.length > 0 ? Math.min(...variations.map((v: any) => parseFloat(v.salePrice) || 0)) : 0;

    // 1. Update Product
    await db.update(products).set({
      name,
      description: description || null,
      mrp: baseMrp,
      salePrice: baseSalePrice,
      images: JSON.stringify(images || []),
      colors: JSON.stringify(colors || []),
      avgRating: parseFloat(avgRating && avgRating.toString().trim() !== "" ? avgRating : "4.3"),
      numReviews: parseInt(numReviews && numReviews.toString().trim() !== "" ? numReviews : "1"),
      category: category || null,
      gender: gender || "unisex",
      tags: tags || null,
      isFeatured: !!isFeatured,
    }).where(eq(products.id, id));

    // 2. Update Variations
    if (variations) {
      await db.delete(productVariations).where(eq(productVariations.productId, id));
      if (variations.length > 0) {
        const variationValues = variations.map((v: any) => ({
          productId: id,
          size: v.size,
          color: v.color || "Default",
          stock: parseInt(v.stock) || 0,
          mrp: parseFloat(v.mrp) || 0,
          salePrice: parseFloat(v.salePrice) || 0,
          sku: v.sku || `${id}-${v.size}${v.color && v.color !== "Default" ? `-${v.color}` : ""}`
        }));
        await db.insert(productVariations).values(variationValues);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("CRITICAL ERROR in PATCH /api/admin/products:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to update product",
      details: error.message 
    }, { status: 500 });
  }
}



export async function DELETE(request: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "0");
    
    // Cascading delete is handled by schema (onDelete: "cascade")
    await db.delete(products).where(eq(products.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to delete product" }, { status: 500 });
  }
}

