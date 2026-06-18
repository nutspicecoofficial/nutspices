import { NextResponse } from "next/server";
import { db } from "@/db";
import { packageTiers } from "@/db/schema";
import { asc, eq, inArray } from "drizzle-orm";
import { cookies } from "next/headers";
import { isAdminNumber } from "@/lib/admin";

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  return session ? isAdminNumber(session) : false;
}

export async function GET() {
  if (!await isAdmin()) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await db.select()
      .from(packageTiers)
      .orderBy(asc(packageTiers.maxWeightGrams));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Fetch Package Tiers Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch package tiers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tiersList = await request.json();
    if (!Array.isArray(tiersList)) {
      return NextResponse.json({ success: false, error: "Payload must be an array of package tiers." }, { status: 400 });
    }

    await db.transaction(async (tx) => {
      // 1. Fetch existing tier IDs from the database
      const existingTiers = await tx.select({ id: packageTiers.id }).from(packageTiers);
      
      // 2. Extract IDs from the incoming request payload
      const incomingIds = tiersList.map((t: any) => t.id).filter(Boolean);
      
      // 3. Determine which IDs to delete
      const idsToDelete = existingTiers.map(t => t.id).filter(id => !incomingIds.includes(id));
      
      // 4. Delete the missing tiers
      if (idsToDelete.length > 0) {
        await tx.delete(packageTiers).where(inArray(packageTiers.id, idsToDelete));
      }

      // 5. Update or insert current tiers
      for (const tier of tiersList) {
        const { id, name, maxWeightGrams, lengthCm, breadthCm, heightCm } = tier;

        if (id) {
          await tx.update(packageTiers)
            .set({
              name,
              maxWeightGrams: Number(maxWeightGrams),
              lengthCm: Number(lengthCm),
              breadthCm: Number(breadthCm),
              heightCm: Number(heightCm),
              updatedAt: new Date().toISOString(),
            })
            .where(eq(packageTiers.id, id));
        } else {
          await tx.insert(packageTiers).values({
            name,
            maxWeightGrams: Number(maxWeightGrams),
            lengthCm: Number(lengthCm),
            breadthCm: Number(breadthCm),
            heightCm: Number(heightCm),
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Save Package Tiers Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to save package tiers" }, { status: 500 });
  }
}
