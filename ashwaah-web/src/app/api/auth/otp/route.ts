import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[Auth Request ${requestId}] Received OTP request`);

  try {
    const body = await request.json();
    const { action, phone, otp } = body;

    console.log(`[Auth Request ${requestId}] Action: ${action}, Phone: ${phone}`);

    if (!phone) {
      return NextResponse.json({ success: false, error: "Please enter a valid phone number" }, { status: 400 });
    }

    // Action 1: Send OTP
    if (action === "send") {
      console.log(`[Auth Request ${requestId}] Sending OTP to ${phone}`);
      // Success is mocked for development
      return NextResponse.json({ success: true, message: "OTP sent successfully" });
    }

    // Action 2: Verify OTP
    if (action === "verify") {
      console.log(`[Auth Request ${requestId}] Verifying OTP for ${phone}`);
      
      // Static OTP logic for development/testing
      if (otp !== "123456") {
        return NextResponse.json({ success: false, error: "Invalid verification code. Please enter 123456 for testing." }, { status: 400 });
      }

      let user = null;
      let isNewUser = false;
      const adminPhone = "9876543210";

      try {
        console.log(`[Auth Request ${requestId}] Querying database for phone: ${phone}`);
        const userResult = await db.select()
          .from(users)
          .where(eq(users.phoneNumber, phone))
          .limit(1);
        
        user = userResult[0];

        if (!user) {
          console.log(`[Auth Request ${requestId}] User not found, creating new entry`);
          // Register new user automatically if not found
          await db.insert(users).values({
            phoneNumber: phone,
            role: phone === adminPhone ? "admin" : "user",
          });
          isNewUser = true;
          console.log(`[Auth Request ${requestId}] New user created`);
        } else {
          // If existing user is the designated admin, ensure their role is updated
          if (phone === adminPhone && user.role !== "admin") {
            await db.update(users).set({ role: "admin" }).where(eq(users.phoneNumber, phone));
          }
          
          if (!user.fullName) {
            console.log(`[Auth Request ${requestId}] User exists but profile incomplete`);
            isNewUser = true;
          } else {
            console.log(`[Auth Request ${requestId}] Existing user found: ${user.fullName}`);
          }
        }
      } catch (dbError: any) {

        console.error(`[Auth Request ${requestId}] Database Error:`, dbError.message);
        
        // Handle ECONNREFUSED specifically
        if (dbError.code === 'ECONNREFUSED' || dbError.message.includes('ECONNREFUSED')) {
          return NextResponse.json({ 
            success: false, 
            error: "Database Connection Refused. Please ensure your MySQL server is running on localhost:3306." 
          }, { status: 503 });
        }

        // Handle Table Not Found
        if (dbError.code === 'ER_NO_SUCH_TABLE') {
          return NextResponse.json({ 
            success: false, 
            error: "Database tables are missing. Please run the migration or setup the users table." 
          }, { status: 500 });
        }

        throw dbError; // Rethrow to be caught by outer catch
      }

      // Session Persistence: Set a secure cookie
      try {
        const cookieStore = await cookies();
        cookieStore.set("auth_session", phone, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: "/",
        });
        console.log(`[Auth Request ${requestId}] Session cookie set for ${phone}`);
      } catch (cookieError) {
        console.error(`[Auth Request ${requestId}] Cookie Error:`, cookieError);
      }

      return NextResponse.json({ 
        success: true, 
        isNewUser, 
        message: isNewUser ? "Welcome! Please tell us your name." : "Welcome back!" 
      });
    }

    return NextResponse.json({ success: false, error: "Invalid request action" }, { status: 400 });

  } catch (error: any) {
    console.error(`[Auth Request ${requestId}] Critical Server Error:`, error);
    
    return NextResponse.json({ 
      success: false, 
      error: "A critical server error occurred. Please check server logs for details." 
    }, { status: 500 });
  }
}



