import { extractPincode, extractAddressParts, getXpressbeesToken, generateShipmentXpressbees, requestPickupXpressbees, trackShipmentXpressbees, cancelShipmentXpressbees, getXpressbeesNDRList, createXpressbeesNDR } from "../src/services/shipping/xpressbees.service";

async function runTests() {
  console.log("=== STARTING XPRESSBEES SERVICE TESTS ===\n");

  let assertionsFailed = 0;
  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`[PASS] ${message}`);
    } else {
      console.error(`[FAIL] ${message}`);
      assertionsFailed++;
    }
  }

  // 1. Test Pincode Extraction Regex
  console.log("--- 1. Testing Pincode Extraction Regex ---");
  try {
    const pin1 = extractPincode("123, MG Road, Bangalore, Karnataka - 560001");
    assert(pin1 === "560001", `Expected 560001, got ${pin1}`);

    const pin2 = extractPincode("Sector 62, Noida 201301, India");
    assert(pin2 === "201301", `Expected 201301, got ${pin2}`);

    let threw = false;
    try {
      extractPincode("No pincode here, Delhi, India");
    } catch {
      threw = true;
    }
    assert(threw, "Expected error when address has no pincode");
  } catch (err: any) {
    console.error("Pincode regex tests crashed:", err);
    assertionsFailed++;
  }

  // 2. Test Address Parsing Helper
  console.log("\n--- 2. Testing Address Parsing Helper ---");
  try {
    const parts1 = extractAddressParts("Suite 400, Connaught Place, New Delhi, Delhi, 110001");
    assert(parts1.pincode === "110001", `Expected pincode 110001, got ${parts1.pincode}`);
    assert(parts1.city === "New Delhi", `Expected city New Delhi, got ${parts1.city}`);
    assert(parts1.state === "Delhi", `Expected state Delhi, got ${parts1.state}`);

    const parts2 = extractAddressParts("45 Jayanagar, Bangalore, Karnataka, 560041");
    assert(parts2.pincode === "560041", `Expected pincode 560041, got ${parts2.pincode}`);
    assert(parts2.city === "Bangalore", `Expected city Bangalore, got ${parts2.city}`);
    assert(parts2.state === "Karnataka", `Expected state Karnataka, got ${parts2.state}`);
  } catch (err: any) {
    console.error("Address parsing tests crashed:", err);
    assertionsFailed++;
  }

  // Set test environment variables
  process.env.XPRESSBEES_USERNAME = "test_franchise_user";
  process.env.XPRESSBEES_PASSWORD = "secure_franchise_pwd";
  process.env.XPRESSBEES_API_URL = "https://mock-xpressbees.api";

  // Mock global fetch
  console.log("\n--- 3. Testing getXpressbeesToken with Caching ---");
  let fetchCallCount = 0;
  let fetchPayload: any = null;

  const originalFetch = globalThis.fetch;
  
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    fetchCallCount++;
    const path = url.replace("https://mock-xpressbees.api", "");
    
    if (path === "/users/franchise_user_login") {
      fetchPayload = JSON.parse(init?.body as string);
      return {
        ok: true,
        json: async () => ({
          status: true,
          data: "mock-jwt-token-12345"
        })
      } as Response;
    }
    
    if (path === "/franchise/shipments") {
      fetchPayload = JSON.parse(init?.body as string);
      return {
        ok: true,
        json: async () => ({
          success: true,
          awb_number: "XB9876543210",
          label_url: "https://ship.xpressbees.com/labels/XB9876543210.pdf"
        })
      } as Response;
    }

    if (path === "/franchise/pickups") {
      fetchPayload = JSON.parse(init?.body as string);
      return {
        ok: true,
        json: async () => ({
          success: true,
          pickup_token: "PKUP998877",
          scheduled_date: "2026-05-24"
        })
      } as Response;
    }

    if (path.startsWith("/franchise/track/")) {
      return {
        ok: true,
        json: async () => ({
          status: "IN_TRANSIT",
          history: [
            { activity: "AWB Generated", location: "Delhi", timestamp: "2026-05-23T10:00:00Z" },
            { activity: "In Transit", location: "Mumbai Hub", timestamp: "2026-05-23T18:00:00Z" }
          ]
        })
      } as Response;
    }

    if (path === "/franchise/shipments/cancel") {
      fetchPayload = JSON.parse(init?.body as string);
      return {
        ok: true,
        json: async () => ({
          success: true,
          message: "Shipment cancelled successfully"
        })
      } as Response;
    }

    if (path === "/franchise/ndr" && init?.method === "GET") {
      return {
        ok: true,
        json: async () => ({
          ndr_list: [
            { awb: "XB5584930291", reason: "Customer not available", attempts: 1 }
          ]
        })
      } as Response;
    }

    if (path === "/franchise/ndr" && init?.method === "POST") {
      fetchPayload = JSON.parse(init?.body as string);
      return {
        ok: true,
        json: async () => ({
          success: true,
          message: "NDR submitted"
        })
      } as Response;
    }

    return { ok: false, text: async () => "Not Found" } as Response;
  }) as any;

  try {
    // Call 1
    const token1 = await getXpressbeesToken();
    assert(token1 === "mock-jwt-token-12345", `Expected mock-jwt-token-12345, got ${token1}`);
    assert(fetchCallCount === 1, `Expected fetch to be called once, got ${fetchCallCount}`);
    assert(fetchPayload?.email === "test_franchise_user", "Expected username passed inside email payload property");
    assert(fetchPayload?.password === "secure_franchise_pwd", "Expected password passed in payload");

    // Call 2 (should be cached, no fetch call)
    fetchPayload = null;
    const token2 = await getXpressbeesToken();
    assert(token2 === "mock-jwt-token-12345", "Token 2 mismatch");
    assert(fetchCallCount === 1, `Fetch call count should still be 1 (cached), got ${fetchCallCount}`);
  } catch (err: any) {
    console.error("Token caching tests failed:", err);
    assertionsFailed++;
  }

  // 4. Test generateShipmentXpressbees mapping and endpoint
  console.log("\n--- 4. Testing generateShipmentXpressbees ---");
  try {
    fetchPayload = null;
    const order = {
      id: 88,
      customerName: "Jane Smith",
      customerPhone: "919876543210",
      shippingAddress: "Flat 202, Sector 15, Vashi, Navi Mumbai, Maharashtra - 400703",
      paymentMode: "Prepaid",
      totalAmount: 1250
    };
    const items = [
      { productName: "Almonds 500g", quantity: 2, price: 625 }
    ];
    const packageDetails = { weight: 1.2, length: 12, width: 12, height: 8 };

    const result = await generateShipmentXpressbees(order, items, packageDetails);
    
    assert(result.success === true, "Expected success to be true");
    assert(result.awbNumber === "XB9876543210", "Awb mismatch");
    assert(result.courierName === "Xpressbees", "Courier name mismatch");
    
    // Check mapped payload properties
    assert(fetchPayload?.order_number === "NS88", `Expected order_number NS88, got ${fetchPayload?.order_number}`);
    assert(fetchPayload?.payment_method === "Prepaid", "Prepaid payment mode mismatch");
    assert(fetchPayload?.consignee_name === "Jane Smith", "Name mismatch");
    assert(fetchPayload?.consignee_phone === "919876543210", "Phone mismatch");
    assert(fetchPayload?.consignee_pincode === "400703", "Pincode extraction failed inside generateShipmentXpressbees");
    assert(fetchPayload?.weight === 1.2, "Weight mapping failed");
    assert(fetchPayload?.products?.[0]?.name === "Almonds 500g", "Product mapping failed");
  } catch (err: any) {
    console.error("generateShipmentXpressbees tests failed:", err);
    assertionsFailed++;
  }

  // 5. Test requestPickupXpressbees
  console.log("\n--- 5. Testing requestPickupXpressbees ---");
  try {
    fetchPayload = null;
    const result = await requestPickupXpressbees(["XB9876543210"]);
    assert(result.success === true, "Pickup success mismatch");
    assert(result.pickupToken === "PKUP998877", "Pickup token mismatch");
    assert(fetchPayload?.awb_numbers?.[0] === "XB9876543210", "AWB mapping failed in pickup");
  } catch (err: any) {
    console.error("requestPickupXpressbees tests failed:", err);
    assertionsFailed++;
  }

  // 6. Test trackShipmentXpressbees
  console.log("\n--- 6. Testing trackShipmentXpressbees ---");
  try {
    const result = await trackShipmentXpressbees("XB9876543210");
    assert(result.awbNumber === "XB9876543210", "AWB mismatch");
    assert(result.status === "IN_TRANSIT", "Status mismatch");
    assert(result.history.length === 2, `Expected 2 history elements, got ${result.history.length}`);
    assert(result.history[1].status === "In Transit", "Activity status mapping failed");
    assert(result.history[1].location === "Mumbai Hub", "Location mapping failed");
  } catch (err: any) {
    console.error("trackShipmentXpressbees tests failed:", err);
    assertionsFailed++;
  }

  // 7. Test cancelShipmentXpressbees
  console.log("\n--- 7. Testing cancelShipmentXpressbees ---");
  try {
    fetchPayload = null;
    const result = await cancelShipmentXpressbees("XB9876543210");
    assert(result.success === true, "Cancel success mismatch");
    assert(fetchPayload?.awb_number === "XB9876543210", "AWB cancel payload mismatch");
  } catch (err: any) {
    console.error("cancelShipmentXpressbees tests failed:", err);
    assertionsFailed++;
  }

  // 8. Test NDR APIs
  console.log("\n--- 8. Testing NDR APIs ---");
  try {
    const ndrList = await getXpressbeesNDRList();
    assert(ndrList.length === 1, "Expected 1 NDR list item");
    assert(ndrList[0].awbNumber === "XB5584930291", "NDR AWB mismatch");
    assert(ndrList[0].reason === "Customer not available", "NDR reason mismatch");

    fetchPayload = null;
    const ndrResult = await createXpressbeesNDR({
      awbNumber: "XB5584930291",
      action: "REATTEMPT",
      reason: "Customer requested delivery today",
      remarks: "Urgent"
    });
    assert(ndrResult.success === true, "Create NDR success mismatch");
    assert(fetchPayload?.awb_number === "XB5584930291", "AWB in NDR post payload mismatch");
    assert(fetchPayload?.action === "REATTEMPT", "Action in NDR post payload mismatch");
  } catch (err: any) {
    console.error("NDR tests failed:", err);
    assertionsFailed++;
  }

  // Restore global fetch
  globalThis.fetch = originalFetch;

  console.log("\n=== TESTS COMPLETE ===");
  if (assertionsFailed > 0) {
    console.error(`\n[CRITICAL] ${assertionsFailed} assertions failed! Please inspect implementation.`);
    process.exit(1);
  } else {
    console.log("\n[SUCCESS] All Xpressbees Service assertions passed flawlessly!");
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error("Test execution crashed:", err);
  process.exit(1);
});
