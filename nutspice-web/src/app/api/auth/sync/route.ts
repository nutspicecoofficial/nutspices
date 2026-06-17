import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { phone, uid } = await request.json();

    if (!phone || !uid) {
      return NextResponse.json({ success: false, error: "Invalid parameters" }, { status: 400 });
    }

    let user = null;
    let isNewUser = false;
    const { isAdminNumber } = await import("@/lib/admin");
    const isAuthAdmin = isAdminNumber(phone);

    const userResult = await db.select()
      .from(users)
      .where(eq(users.phoneNumber, phone))
      .limit(1);
    
    user = userResult[0];

    if (!user) {
      // Register new user automatically if not found
      await db.insert(users).values({
        phoneNumber: phone,
        role: isAuthAdmin ? "admin" : "user",
        lastLoginAt: new Date().toISOString(),
      });
      isNewUser = true;
    } else {
      // Update lastLoginAt
      await db.update(users)
        .set({ 
          lastLoginAt: new Date().toISOString(),
          ...(isAuthAdmin && user.role !== "admin" ? { role: "admin" } : {})
        })
        .where(eq(users.phoneNumber, phone));
      
      if (!user.fullName) {
        isNewUser = true;
      }
    }

    // Session Persistence: Set a secure cookie
    try {
      const cookieStore = await cookies();
      const cookieName = isAuthAdmin ? "admin_session" : "auth_session";
      // We use the phone number as the session value to maintain compatibility with existing middleware
      cookieStore.set(cookieName, phone, { 
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });
    } catch (cookieError) {
      console.error(`Cookie Error:`, cookieError);
    }

    return NextResponse.json({ 
      success: true, 
      isNewUser, 
      message: isNewUser ? "Welcome! Please tell us your name." : "Welcome back!" 
    });

  } catch (error: any) {
    console.error(`Sync API Error:`, error);
    
    return NextResponse.json({ 
      success: false, 
      error: "A server error occurred during sync." 
    }, { status: 500 });
  }
}
