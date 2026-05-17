import { NextResponse } from "next/server";
import { db } from "@/db";
import { eq, asc } from "drizzle-orm";
import { navigationMenu, pageSections } from "@/db/schema";

export async function GET() {
  try {
    // 1. Fetch main categories from navigationMenu
    const menuItems = await db.select({
      label: navigationMenu.label,
      href: navigationMenu.href
    })
    .from(navigationMenu)
    .where(eq(navigationMenu.isActive, true))
    .orderBy(asc(navigationMenu.order));

    // 2. Fetch unique titles from pageSections (home sections)
    const sectionItems = await db.select({
      title: pageSections.title
    })
    .from(pageSections)
    .groupBy(pageSections.title);
    
    // 3. Merge and deduplicate
    const collectionsMap = new Map<string, { name: string; slug: string }>();

    // Add menu items first
    menuItems.forEach(item => {
      const slug = item.href.startsWith("/category/") 
        ? item.href.replace("/category/", "") 
        : item.label.toLowerCase().replace(/\s+/g, '-');
      
      collectionsMap.set(item.label.toLowerCase(), {
        name: item.label,
        slug: slug
      });
    });

    // Add section items if not already present
    sectionItems.forEach(item => {
      const key = item.title.toLowerCase();
      if (!collectionsMap.has(key)) {
        collectionsMap.set(key, {
          name: item.title,
          slug: item.title.toLowerCase().replace(/\s+/g, '-')
        });
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: Array.from(collectionsMap.values()) 
    });
  } catch (error) {
    console.error("Fetch Collections Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch collections" }, { status: 500 });
  }
}
