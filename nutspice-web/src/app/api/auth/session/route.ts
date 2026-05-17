import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("auth_session")?.value;

    if (!session) {
      return NextResponse.json({ authenticated: false });
    }

    const userResult = await db.select()
      .from(users)
      .where(eq(users.phoneNumber, session))
      .limit(1);

    const user = userResult[0];

    if (!user) {
      const response = NextResponse.json({ authenticated: false });
      response.cookies.delete("auth_session");
      return response;
    }

    return NextResponse.json({ 
      authenticated: true, 
      user: {
        phoneNumber: user.phoneNumber,
        fullName: user.fullName,
      } 
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
