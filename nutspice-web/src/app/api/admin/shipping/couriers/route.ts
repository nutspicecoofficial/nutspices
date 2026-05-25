/**
 * API route to retrieve available couriers and rates.
 * Endpoint: GET /api/admin/shipping/couriers
 * Checks admin authorization and returns service lines.
 */

import { NextResponse } from "next/server";
import { getCouriers } from "@/services/shipping";
import { cookies } from "next/headers";

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  return session === "9999999999";
}

export async function GET(req: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const weight = parseFloat(searchParams.get("weight") || "0.5");
    const length = parseFloat(searchParams.get("length") || "10");
    const width = parseFloat(searchParams.get("width") || "10");
    const height = parseFloat(searchParams.get("height") || "10");
    const destination = searchParams.get("destination") || "110001";
    const cod = searchParams.get("cod") || "no";
    const cod_amount = searchParams.get("cod_amount") || "0";

    const couriers = await getCouriers({
      weight,
      length,
      width,
      height,
      destination,
      cod,
      cod_amount
    });

    return NextResponse.json({ success: true, data: couriers });
  } catch (error: any) {
    console.error("Fetch couriers route error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
