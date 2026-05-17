import { NextResponse } from "next/server";
import { db } from "@/db";
import { homeCategoryBanners } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const items = await db.select()
      .from(homeCategoryBanners)
      .where(eq(homeCategoryBanners.isActive, true))
      .orderBy(asc(homeCategoryBanners.displayOrder));
      
    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error("Fetch Banners Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch banners" }, { status: 500 });
  }
}
