import { NextResponse } from "next/server";
import { calculatePricingXpressbees } from "@/services/shipping/xpressbees.service";

/**
 * POST /api/shipping/calculate-rates
 * Accepts destinationPincode, weight, length, breadth, and height in the request body.
 * Calculates shipping rates from Xpressbees and returns the rates array to the client.
 */
export async function POST(req: Request) {
  try {
    let body;

    try {

      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload in request body." },
        { status: 400 }
      );
    }

    const { destinationPincode, weight, length, breadth, height } = body;

    // Check presence of required parameters
    if (destinationPincode === undefined || destinationPincode === null || String(destinationPincode).trim() === "") {
      return NextResponse.json(
        { success: false, error: "Destination pincode is required." },
        { status: 400 }
      );
    }

    if (weight === undefined || weight === null) {
      return NextResponse.json(
        { success: false, error: "Weight is required." },
        { status: 400 }
      );
    }

    if (length === undefined || length === null) {
      return NextResponse.json(
        { success: false, error: "Length is required." },
        { status: 400 }
      );
    }

    if (breadth === undefined || breadth === null) {
      return NextResponse.json(
        { success: false, error: "Breadth is required." },
        { status: 400 }
      );
    }

    if (height === undefined || height === null) {
      return NextResponse.json(
        { success: false, error: "Height is required." },
        { status: 400 }
      );
    }

    // Call the Xpressbees pricing calculation service
    const pricingRes = await calculatePricingXpressbees({
      destinationPincode,
      weight,
      length,
      breadth,
      height
    });

    const rates = pricingRes?.message;
    if (!rates || !Array.isArray(rates)) {
      return NextResponse.json(
        { success: false, error: "No rates available. Pincode may be invalid or unserviceable." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      rates: rates
    });
  } catch (error: any) {
    console.error("Error in calculate-rates API route:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check if error is related to invalid pincode or serviceability issues
    const isPincodeError =
      errorMessage.toLowerCase().includes("pincode") ||
      errorMessage.toLowerCase().includes("service") ||
      errorMessage.toLowerCase().includes("invalid") ||
      errorMessage.toLowerCase().includes("unserviceable") ||
      errorMessage.toLowerCase().includes("destination");

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: isPincodeError ? 400 : 500 }
    );
  }
}
