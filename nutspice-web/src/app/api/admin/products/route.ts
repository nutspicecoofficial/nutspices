import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, productVariations, orderItems, cartItems, orders } from "@/db/schema";
import { eq, like, or, sql, desc } from "drizzle-orm";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isAdminNumber } from "@/lib/admin";

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  return session ? isAdminNumber(session) : false;
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
      
      const productOrderItems = await db
        .select({
          variationId: orderItems.variationId,
          size: orderItems.size,
          quantity: orderItems.quantity,
          status: orders.status,
        })
        .from(orderItems)
        .leftJoin(orders, eq(orderItems.orderId, orders.id))
        .where(eq(orderItems.productId, parseInt(id)));

      // Map mrp to basePrice for the frontend and convert stock to Remaining Stock
      const mappedVariations = variations.map(v => {
        const vOrders = productOrderItems.filter(item => 
          item.variationId === v.id || item.size === v.size
        );
        const soldOrPending = vOrders
          .filter(item => item.status && ["order placed", "processing", "shipped", "in transit", "out for delivery", "delivered"].includes(item.status.toLowerCase()))
          .reduce((sum, item) => sum + (item.quantity || 0), 0);
          
        return {
          ...v,
          basePrice: v.mrp,
          stock: Math.max(0, v.stock - soldOrPending)
        };
      });
      return NextResponse.json({ success: true, data: { ...product[0], variations: mappedVariations } });
    }
    
    // Fetch products
    const allProducts = await db.select().from(products).where(
      search ? or(like(products.name, `%${search}%`), like(products.category, `%${search}%`)) : undefined
    ).orderBy(desc(products.id));
    
    // Fetch all variations for stock calculation
    const allVariations = await db.select().from(productVariations);

    // Fetch all order items and their associated order status
    const allOrderItems = await db
      .select({
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        status: orders.status,
      })
      .from(orderItems)
      .leftJoin(orders, eq(orderItems.orderId, orders.id));

    // Process data to calculate metrics
    const results = allProducts.map((product: any) => {
      const productOrderItems = allOrderItems.filter(item => item.productId === product.id);
      const productVariationsList = allVariations.filter(v => v.productId === product.id);

      const sold = productOrderItems
        .filter(item => item.status && item.status.toLowerCase() === "delivered")
        .reduce((sum, item) => sum + (item.quantity || 0), 0);

      const toDeliver = productOrderItems
        .filter(item => 
          item.status && 
          ["order placed", "processing", "shipped", "in transit", "out for delivery"].includes(item.status.toLowerCase())
        )
        .reduce((sum, item) => sum + (item.quantity || 0), 0);

      const initialStock = productVariationsList?.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) || 0;
      const totalStock = Math.max(0, initialStock - sold - toDeliver);

      return {
        ...product,
        totalStock
      };
    });

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
      name, description, images, variations,
      category, tags, isFeatured
    } = body;

    // Validation
    if (!name) return NextResponse.json({ success: false, error: "Product name is required" }, { status: 400 });
    
    // Pricing is now handled per variation. 
    // We will calculate a "base price" for the main product entry from the minimum variation price.
    const basePriceValue = variations && variations.length > 0 ? Math.min(...variations.map((v: any) => Number(v.basePrice) || 0)) : 0;
    const baseSalePrice = variations && variations.length > 0 ? Math.min(...variations.map((v: any) => Number(v.salePrice) || 0)) : 0;

    // 1 & 2. Insert Product and Variations in a Transaction
    const newProduct = await db.transaction(async (tx) => {
      const insertValues = {
        name,
        description: description || null,
        basePrice: basePriceValue,
        salePrice: baseSalePrice,
        images: JSON.stringify(images || []),
        category: category || null,
        tags: tags || null,
        isFeatured: !!isFeatured,
      };

      const productResult = await tx.insert(products).values(insertValues).returning();

      if (!productResult || productResult.length === 0) {
        throw new Error("Database failed to insert product.");
      }

      const insertedProduct = productResult[0];

      if (variations && variations.length > 0) {
        const variationValues = variations.map((v: any) => ({
          productId: Number(insertedProduct.id),
          size: v.size,
          stock: parseInt(v.stock) || 0,
          mrp: Number(v.basePrice) || 0,
          salePrice: Number(v.salePrice) || 0,
          sku: v.sku || `${insertedProduct.id}-${v.size}`
        }));
        await tx.insert(productVariations).values(variationValues);
      }
      return insertedProduct;
    });

    return NextResponse.json({ success: true, data: newProduct });
  } catch (error: any) {
    console.error("CRITICAL ERROR in POST /api/admin/products:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to create product",
      details: error.message 
    }, { status: 500 });
  } finally {
    revalidatePath("/", "layout");
  }
}

export async function PATCH(request: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { 
      id, name, description, images, variations,
      category, tags, isFeatured
    } = body;
    if (!id) return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });

    // Pricing from variations
    let basePriceValue: number | undefined;
    let baseSalePrice: number | undefined;
    if (variations) {
      basePriceValue = variations && variations.length > 0 ? Math.min(...variations.map((v: any) => Number(v.basePrice) || 0)) : 0;
      baseSalePrice = variations && variations.length > 0 ? Math.min(...variations.map((v: any) => Number(v.salePrice) || 0)) : 0;
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (variations) {
      updateData.basePrice = basePriceValue;
      updateData.salePrice = baseSalePrice;
    }
    if (images !== undefined) updateData.images = JSON.stringify(images);
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;
    if (isFeatured !== undefined) updateData.isFeatured = !!isFeatured;

    // Fetch order history to convert Remaining Stock input back to Initial Stock for DB
    const productOrderItems = await db
      .select({
        variationId: orderItems.variationId,
        size: orderItems.size,
        quantity: orderItems.quantity,
        status: orders.status,
      })
      .from(orderItems)
      .leftJoin(orders, eq(orderItems.orderId, orders.id))
      .where(eq(orderItems.productId, id));

    // 1 & 2. Update Product and Variations in a Transaction
    await db.transaction(async (tx) => {
      if (Object.keys(updateData).length > 0) {
        await tx.update(products).set(updateData).where(eq(products.id, id));
      }

      if (variations) {
        await tx.delete(productVariations).where(eq(productVariations.productId, id));
        if (variations.length > 0) {
          const variationValues = variations.map((v: any) => {
            const vOrders = productOrderItems.filter(item => item.size === v.size);
            const soldOrPending = vOrders
              .filter(item => item.status && ["order placed", "processing", "shipped", "in transit", "out for delivery", "delivered"].includes(item.status.toLowerCase()))
              .reduce((sum, item) => sum + (item.quantity || 0), 0);
            
            const inputRemaining = parseInt(v.stock) || 0;
            const actualDbStock = inputRemaining + soldOrPending;

            return {
              productId: id,
              size: v.size,
              stock: actualDbStock,
              mrp: Number(v.basePrice) || 0,
              salePrice: Number(v.salePrice) || 0,
              sku: v.sku || `${id}-${v.size}`
            };
          });
          await tx.insert(productVariations).values(variationValues);
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("CRITICAL ERROR in PATCH /api/admin/products:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to update product",
      details: error.message 
    }, { status: 500 });
  } finally {
    revalidatePath("/", "layout");
  }
}



export async function DELETE(request: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "0");

    if (!id) return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });

    // 1. Fetch all order items for this product along with their order status
    const relatedOrderItems = await db
      .select({ id: orderItems.id, status: orders.status })
      .from(orderItems)
      .leftJoin(orders, eq(orderItems.orderId, orders.id))
      .where(eq(orderItems.productId, id))
      .all();

    // 2. Block deletion only if there are ACTIVE (non-completed) orders
    const activeStatuses = ["order placed", "processing", "shipped", "in transit", "out for delivery"];
    const hasActiveOrders = relatedOrderItems.some(
      (item) => item.status && activeStatuses.includes(item.status.toLowerCase())
    );

    if (hasActiveOrders) {
      return NextResponse.json({ 
        success: false, 
        error: "Cannot delete: this product has active pending/shipped orders. Wait for them to complete first." 
      }, { status: 400 });
    }

    // 3. Perform deletion in a transaction
    await db.transaction(async (tx) => {
      // Nullify productId in completed order items to preserve order history
      if (relatedOrderItems.length > 0) {
        await tx.update(orderItems).set({ productId: null }).where(eq(orderItems.productId, id));
      }
      // Delete variations
      await tx.delete(productVariations).where(eq(productVariations.productId, id));
      // Remove from any active carts
      await tx.delete(cartItems).where(eq(cartItems.productId, id));
      // Finally delete the product itself
      await tx.delete(products).where(eq(products.id, id));
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete Product Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to delete product",
      details: error.message 
    }, { status: 500 });
  } finally {
    revalidatePath("/", "layout");
  }
}

