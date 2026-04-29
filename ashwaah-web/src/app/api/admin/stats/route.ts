import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, products, cartItems } from "@/db/schema";
import { count } from "drizzle-orm";
import { cookies } from "next/headers";

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  return session === "9999999999";
}

export async function GET() {
  if (!await isAuthenticated()) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userCountResult = await db.select({ value: count() }).from(users);
    const productCountResult = await db.select({ value: count() }).from(products);
    // For orders, we'll use cartItems as a placeholder count for now
    const orderCountResult = await db.select({ value: count() }).from(cartItems);

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: userCountResult[0].value,
        totalProducts: productCountResult[0].value,
        totalOrders: orderCountResult[0].value,
      }
    });
  } catch (error) {
    console.error("Stats Fetch Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 });
  }
}
