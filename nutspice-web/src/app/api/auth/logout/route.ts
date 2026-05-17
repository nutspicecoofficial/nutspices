import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("auth_session");
    cookieStore.delete("admin_session");
    
    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to logout" }, { status: 500 });
  }
}
