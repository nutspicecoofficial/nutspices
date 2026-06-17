import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, otpVerifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[Auth Request ${requestId}] Received OTP request`);

  try {
    const body = await request.json();
    const { action, phone, otp, portal } = body;

    console.log(`[Auth Request ${requestId}] Action: ${action}, Phone: ${phone}`);

    if (!phone) {
      return NextResponse.json({ success: false, error: "Please enter a valid phone number" }, { status: 400 });
    }

    // Action 1: Send OTP
    if (action === "send") {
      if (portal === "admin") {
        const { isAdminNumber } = await import("@/lib/admin");
        if (!isAdminNumber(phone)) {
          return NextResponse.json(
            { success: false, error: "Unauthorized phone number. This portal is for administrators only." },
            { status: 403 }
          );
        }
      }

      if (body.checkOnly) {
        return NextResponse.json({ success: true, message: "Authorized admin number" });
      }

      console.log(`[Auth Request ${requestId}] MOCK Sending OTP to ${phone}`);
      
      // Always use 123456 for everyone during development
      const generatedOtp = "123456";
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Clear existing OTPs for this number
      await db.delete(otpVerifications).where(eq(otpVerifications.phoneNumber, phone));

      // Insert new OTP
      await db.insert(otpVerifications).values({
        phoneNumber: phone,
        otp: generatedOtp,
        expiresAt: expiresAt.toISOString(),
      });

      console.log(`[DEVELOPMENT MOCK] OTP for ${phone} is ${generatedOtp}`);

      return NextResponse.json({ success: true, message: "OTP sent successfully (Dev Mode: 123456)" });
    }

    // Action 2: Verify OTP
    if (action === "verify") {
      const { idToken, otp } = body;
      console.log(`[Auth Request ${requestId}] Verifying for ${phone}, ID Token received: ${!!idToken}`);
      
      let validRecord = false;
      let firebaseUser = null;

      // If idToken is provided, verify it securely with Firebase Admin
      if (idToken) {
        try {
          firebaseUser = await adminAuth.verifyIdToken(idToken);
          // Check if the phone number in the token matches the one provided
          if (firebaseUser.phone_number?.includes(phone.replace(/\s+/g, ''))) {
            validRecord = true;
          } else {
            console.warn(`[Auth Request ${requestId}] Phone mismatch: Token(${firebaseUser.phone_number}) vs Request(${phone})`);
            return NextResponse.json({ success: false, error: "Phone number mismatch. Please try again." }, { status: 403 });
          }
        } catch (tokenError) {
          console.error(`[Auth Request ${requestId}] Firebase Token Verification Failed:`, tokenError);
          return NextResponse.json({ success: false, error: "Authentication failed. Please try again." }, { status: 401 });
        }
      } else {
        // Fallback to mock/legacy check
        const isDevOtp = otp === "123456";
        if (isDevOtp) {
          validRecord = true;
        } else {
          const otpRecords = await db.select()
            .from(otpVerifications)
            .where(
              and(
                eq(otpVerifications.phoneNumber, phone),
                eq(otpVerifications.otp, otp)
              )
            );
          validRecord = otpRecords.some(record => new Date(record.expiresAt) > new Date());
        }
      }

      if (!validRecord) {
        return NextResponse.json({ success: false, error: "Invalid verification. Please try again." }, { status: 400 });
      }

      // Delete the OTP as it's been used
      await db.delete(otpVerifications).where(eq(otpVerifications.phoneNumber, phone));

      if (portal === "admin") {
        const { isAdminNumber } = await import("@/lib/admin");
        if (!isAdminNumber(phone)) {
          return NextResponse.json(
            { success: false, error: "Unauthorized phone number. This portal is for administrators only." },
            { status: 403 }
          );
        }
      }

      let user = null;
      let isNewUser = false;
      const { isAdminNumber } = await import("@/lib/admin");
      const isAuthAdmin = isAdminNumber(phone);

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
            role: isAuthAdmin ? "admin" : "user",
            lastLoginAt: new Date().toISOString(),
          });
          isNewUser = true;
          console.log(`[Auth Request ${requestId}] New user created`);
        } else {
          // Update lastLoginAt
          await db.update(users)
            .set({ 
              lastLoginAt: new Date().toISOString(),
              ...(isAuthAdmin && user.role !== "admin" ? { role: "admin" } : {})
            })
            .where(eq(users.phoneNumber, phone));
          
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
        const cookieName = portal === "admin" ? "admin_session" : "auth_session";
        const isSecure = request.url.startsWith("https");

        cookieStore.set(cookieName, phone, {
          httpOnly: true,
          secure: isSecure,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: "/",
        });
        console.log(`[Auth Request ${requestId}] ${cookieName} set for ${phone} (Secure: ${isSecure})`);
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



