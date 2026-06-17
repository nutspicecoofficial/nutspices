import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { desc } from "drizzle-orm";
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
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    return NextResponse.json({ success: true, data: allUsers });
  } catch (error) {
    console.error("Fetch Customers Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch customers" }, { status: 500 });
  }
}
