import { NextResponse } from "next/server";
import { calculatePricingXpressbees } from "@/services/shipping/xpressbees.service";
import { db } from "@/db";
import { packageTiers } from "@/db/schema";
import { asc } from "drizzle-orm";

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

    const { destinationPincode, weight, length: clientLength, breadth: clientBreadth, height: clientHeight } = body;

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

    const parsedLength = Number(clientLength);
    const parsedBreadth = Number(clientBreadth);
    const parsedHeight = Number(clientHeight);

    let finalLength = 10;
    let finalBreadth = 10;
    let finalHeight = 10;

    // If dimensions are explicitly provided and valid (> 0), bypass database query
    if (
      !isNaN(parsedLength) && parsedLength > 0 &&
      !isNaN(parsedBreadth) && parsedBreadth > 0 &&
      !isNaN(parsedHeight) && parsedHeight > 0
    ) {
      finalLength = parsedLength;
      finalBreadth = parsedBreadth;
      finalHeight = parsedHeight;
    } else {
      // Perform database lookup for packaging dimensions based on weight
      const totalWeightGrams = (Number(weight) || 0.5) * 1000;

      try {
        const tiers = await db.select()
          .from(packageTiers)
          .orderBy(asc(packageTiers.maxWeightGrams));

        if (tiers && tiers.length > 0) {
          // Find the first tier where maxWeightGrams >= totalWeightGrams
          const matchedTier = tiers.find(t => t.maxWeightGrams >= totalWeightGrams);

          if (matchedTier) {
            finalLength = matchedTier.lengthCm;
            finalBreadth = matchedTier.breadthCm;
            finalHeight = matchedTier.heightCm;
          } else {
            // Oversized Fallback: select the largest tier and scale dimensions proportionally
            const largestTier = tiers[tiers.length - 1];
            const ratio = totalWeightGrams / largestTier.maxWeightGrams;
            finalLength = Math.ceil(largestTier.lengthCm * ratio);
            finalBreadth = Math.ceil(largestTier.breadthCm * ratio);
            finalHeight = Math.ceil(largestTier.heightCm * ratio);
          }
        } else {
          console.warn("package_tiers table is empty. Falling back to client or default dimensions.");
          finalLength = parsedLength || 10;
          finalBreadth = parsedBreadth || 10;
          finalHeight = parsedHeight || 10;
        }
      } catch (dbError) {
        console.error("Failed to query package_tiers database table:", dbError);
        finalLength = parsedLength || 10;
        finalBreadth = parsedBreadth || 10;
        finalHeight = parsedHeight || 10;
      }
    }

    // Call the Xpressbees pricing calculation service
    const pricingRes = await calculatePricingXpressbees({
      destinationPincode,
      weight,
      length: finalLength,
      breadth: finalBreadth,
      height: finalHeight
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
