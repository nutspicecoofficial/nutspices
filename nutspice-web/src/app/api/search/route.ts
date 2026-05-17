import { NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { like, or, sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    if (!q || q.trim() === "") {
      return NextResponse.json({ success: true, data: [] });
    }

    const searchQuery = `%${q.trim()}%`;

    const results = await db.select().from(products).where(
      or(
        like(products.name, searchQuery),
        like(products.category, searchQuery),
        like(products.tags, searchQuery)
      )
    ).limit(20);

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to search products" },
      { status: 500 }
    );
  }
}
