import { NextResponse } from "next/server";
import { db } from "@/db";
import { homeTabs } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isAdminNumber } from "@/lib/admin";

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  return session ? isAdminNumber(session) : false;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";

    let query = db.select().from(homeTabs).orderBy(asc(homeTabs.displayOrder));
    
    if (!all) {
      // @ts-ignore
      query = query.where(eq(homeTabs.isActive, true));
    }

    const data = await query;
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Failed to fetch home tabs:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch home tabs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, linkHref, imageUrl, displayOrder, isActive } = body;

    const result = await db.insert(homeTabs).values({
      title,
      linkHref,
      imageUrl,
      displayOrder: displayOrder || 0,
      isActive: isActive ?? true,
    }).returning();

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error("Failed to create home tab:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to create home tab: " + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  } finally {
    revalidatePath("/", "layout");
  }
}

export async function PUT(request: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (Array.isArray(body)) {
      // Handle reordering
      for (const item of body) {
        await db.update(homeTabs)
          .set({ displayOrder: item.displayOrder })
          .where(eq(homeTabs.id, item.id));
      }
      return NextResponse.json({ success: true });
    }

    const { id, title, linkHref, imageUrl, displayOrder, isActive } = body;
    const result = await db.update(homeTabs)
      .set({
        title,
        linkHref,
        imageUrl,
        displayOrder,
        isActive,
      })
      .where(eq(homeTabs.id, id))
      .returning();

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error("Failed to update home tab:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to update home tab: " + (error instanceof Error ? error.message : String(error))
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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
    }

    await db.delete(homeTabs).where(eq(homeTabs.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete home tab:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to delete home tab: " + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  } finally {
    revalidatePath("/", "layout");
  }
}
