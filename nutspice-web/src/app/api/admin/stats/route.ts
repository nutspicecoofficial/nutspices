import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, products, orders } from "@/db/schema";
import { count, sql } from "drizzle-orm";
import { cookies } from "next/headers";

import { isAdminNumber } from "@/lib/admin";

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  return session ? isAdminNumber(session) : false;
}

export async function GET() {
  if (!await isAuthenticated()) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch Total Counts (Lifetime)
    const userCountResult = await db.select({ value: count() }).from(users);
    const productCountResult = await db.select({ value: count() }).from(products);
    const orderCountResult = await db.select({ value: count() }).from(orders);
    
    // Fetch Total Revenue (Lifetime)
    const revenueResult = await db.select({ 
      value: sql<number>`SUM(${orders.totalAmount})`.mapWith(Number) 
    }).from(orders);

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: userCountResult[0].value,
        totalProducts: productCountResult[0].value,
        totalOrders: orderCountResult[0].value,
        totalRevenue: revenueResult[0].value || 0,
      }
    });
  } catch (error) {
    console.error("Stats Fetch Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 });
  }
}
