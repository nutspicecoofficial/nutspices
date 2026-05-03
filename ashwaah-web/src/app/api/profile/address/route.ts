import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const phoneNumber = cookieStore.get("auth_session")?.value;

    if (!phoneNumber) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.phoneNumber, phoneNumber),
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    let addresses: string[] = [];
    if (user.address) {
      try {
        addresses = JSON.parse(user.address);
        if (!Array.isArray(addresses)) addresses = [user.address];
      } catch {
        addresses = [user.address];
      }
    }

    return NextResponse.json({ success: true, addresses });
  } catch (error) {
    console.error("Address GET Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { address } = await req.json();
    const cookieStore = await cookies();
    const phoneNumber = cookieStore.get("auth_session")?.value;

    if (!phoneNumber) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.phoneNumber, phoneNumber),
    });

    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    let addresses: string[] = [];
    if (user.address) {
      try {
        addresses = JSON.parse(user.address);
        if (!Array.isArray(addresses)) addresses = [user.address];
      } catch {
        addresses = [user.address];
      }
    }

    if (!addresses.includes(address)) {
      addresses.push(address);
    }

    await db.update(users)
      .set({ address: JSON.stringify(addresses) })
      .where(eq(users.phoneNumber, phoneNumber));

    return NextResponse.json({ success: true, addresses });
  } catch (error) {
    console.error("Address POST Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { address } = await req.json();
    const cookieStore = await cookies();
    const phoneNumber = cookieStore.get("auth_session")?.value;

    if (!phoneNumber) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.phoneNumber, phoneNumber),
    });

    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    let addresses: string[] = [];
    if (user.address) {
      try {
        addresses = JSON.parse(user.address);
        if (!Array.isArray(addresses)) addresses = [user.address];
      } catch {
        addresses = [user.address];
      }
    }

    addresses = addresses.filter(a => a !== address);

    await db.update(users)
      .set({ address: addresses.length > 0 ? JSON.stringify(addresses) : null })
      .where(eq(users.phoneNumber, phoneNumber));

    return NextResponse.json({ success: true, addresses });
  } catch (error) {
    console.error("Address DELETE Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
