// Set connection URL before importing db module to avoid SQLite cantopen errors
process.env.TURSO_CONNECTION_URL = "file::memory:";
process.env.TURSO_AUTH_TOKEN = "";

// 1. Setup mock states
let mockSessionValue: string | undefined = undefined;
let mockSelectResult: any[] = [];
let mockOrderItemsResult: any[] = [];
let lastUpdatedValues: any = null;

let generateShipmentCalled = false;
let requestPickupCalled = false;
let cancelShipmentCalled = false;

// 2. Mock next/headers in require.cache
const nextHeadersPath = require.resolve("next/headers");
const originalHeaders = require(nextHeadersPath);
const mockedHeaders = { ...originalHeaders };
mockedHeaders.cookies = async () => {
  return {
    get: (name: string) => {
      return {
        value: name === "admin_session" ? mockSessionValue : undefined
      };
    }
  };
};
require.cache[nextHeadersPath] = {
  id: nextHeadersPath,
  filename: nextHeadersPath,
  loaded: true,
  exports: mockedHeaders
} as any;

// 3. Mock src/db in require.cache
const dbPath = require.resolve("../src/db");
const mockedDb = {
  db: {
    select: (fields?: any) => ({
      from: (table: any) => ({
        where: (cond: any) => ({
          limit: (lim: number) => Promise.resolve(mockSelectResult),
          leftJoin: (joinedTable: any, joinCond: any) => ({
            where: (joinCond2: any) => Promise.resolve(mockOrderItemsResult)
          })
        }),
        leftJoin: (joinedTable: any, joinCond: any) => ({
          where: (joinCond2: any) => Promise.resolve(mockOrderItemsResult)
        })
      })
    }),
    update: (table: any) => ({
      set: (values: any) => {
        lastUpdatedValues = values;
        return {
          where: (cond: any) => Promise.resolve({ changes: 1 })
        };
      }
    })
  }
};
require.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  exports: mockedDb
} as any;

// 4. Mock src/services/shipping in require.cache
const shippingPath = require.resolve("../src/services/shipping");
const mockedShipping = {
  generateShipment: async (data: any) => {
    generateShipmentCalled = true;
    return { success: true, awbNumber: "XB_MOCK_AWB_100", courierName: "Xpressbees", labelUrl: "https://mock.pdf", estimatedDelivery: "2026-05-27" };
  },
  requestPickup: async (data: any) => {
    requestPickupCalled = true;
    return { success: true, pickupToken: "PKUP_TEST_111", scheduledDate: "2026-05-24", message: "Success" };
  },
  cancelShipment: async (awb: string) => {
    cancelShipmentCalled = true;
    return { success: true };
  }
};
require.cache[shippingPath] = {
  id: shippingPath,
  filename: shippingPath,
  loaded: true,
  exports: mockedShipping
} as any;

async function runTests() {
  console.log("=== STARTING ORDER STATUS API ROUTE TESTS ===\n");

  // Dynamically import PATCH after require.cache is modified to avoid import hoisting issues
  const { PATCH } = await import("../src/app/api/orders/[id]/status/route");

  let assertionsFailed = 0;
  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`[PASS] ${message}`);
    } else {
      console.error(`[FAIL] ${message}`);
      assertionsFailed++;
    }
  }

  // 2. Test 1: Unauthorized Access
  console.log("--- Test 1: Unauthorized Access (No Session) ---");
  try {
    mockSessionValue = undefined;
    const req = new Request("http://localhost/api/orders/42/status", {
      method: "PATCH",
      body: JSON.stringify({ orderStatus: "1_CONFIRMED" })
    });
    const params = Promise.resolve({ id: "42" });
    const response = await PATCH(req, { params });
    assert(response.status === 401, `Expected status 401, got ${response.status}`);
    const data = await response.json();
    assert(data.success === false, "Expected success to be false");
    assert(data.error === "Unauthorized", "Expected error 'Unauthorized'");
  } catch (err: any) {
    console.error("Test 1 crashed:", err);
    assertionsFailed++;
  }

  // 3. Test 2: Order Cancellation and Stock Restoration Check
  console.log("\n--- Test 2: Order Cancellation & Stock Restoration Check ---");
  try {
    mockSessionValue = "9999999999"; // Admin session
    mockSelectResult = [{ id: 42, awbNumber: null, status: "Order Placed", orderStatus: "0_PLACED" }];
    lastUpdatedValues = null;
    cancelShipmentCalled = false;

    const req = new Request("http://localhost/api/orders/42/status", {
      method: "PATCH",
      body: JSON.stringify({ orderStatus: "CANCELLED", cancelReason: "Customer requested" })
    });
    const params = Promise.resolve({ id: "42" });
    const response = await PATCH(req, { params });
    
    assert(response.status === 200, `Expected status 200, got ${response.status}`);
    const data = await response.json();
    assert(data.success === true, "Expected success to be true");
    
    // Check that status was updated to "Cancelled" and orderStatus to "CANCELLED"
    assert(lastUpdatedValues !== null, "Expected DB update to be called");
    assert(lastUpdatedValues.status === "Cancelled", `Expected status Cancelled, got ${lastUpdatedValues.status}`);
    assert(lastUpdatedValues.orderStatus === "CANCELLED", `Expected orderStatus CANCELLED, got ${lastUpdatedValues.orderStatus}`);
    assert(lastUpdatedValues.cancelReason === "Customer requested", "Expected cancelReason to match");
    assert(cancelShipmentCalled === false, "Should not cancel courier shipment if AWB is null");
  } catch (err: any) {
    console.error("Test 2 crashed:", err);
    assertionsFailed++;
  }

  // 4. Test 3: Order Cancellation with Active Courier AWB
  console.log("\n--- Test 3: Order Cancellation with Active Courier AWB ---");
  try {
    mockSessionValue = "9999999999";
    mockSelectResult = [{ id: 42, awbNumber: "XB_MOCK_AWB_100", status: "Shipped", orderStatus: "1_CONFIRMED" }];
    lastUpdatedValues = null;
    cancelShipmentCalled = false;

    const req = new Request("http://localhost/api/orders/42/status", {
      method: "PATCH",
      body: JSON.stringify({ orderStatus: "CANCELLED" })
    });
    const params = Promise.resolve({ id: "42" });
    const response = await PATCH(req, { params });

    assert(response.status === 200, "Expected status 200");
    assert(cancelShipmentCalled === true, "Expected courier cancellation adapter to be called");
    assert(lastUpdatedValues.shippingStatus === "SHIPMENT_CANCELLED", "Expected shipping status SHIPMENT_CANCELLED");
  } catch (err: any) {
    console.error("Test 3 crashed:", err);
    assertionsFailed++;
  }

  // 5. Test 4: Trigger AWB Booking (3_AWB_GENERATED)
  console.log("\n--- Test 4: Trigger AWB Booking (3_AWB_GENERATED) ---");
  try {
    mockSessionValue = "9999999999";
    mockSelectResult = [{ id: 42, awbNumber: null, status: "Processing", orderStatus: "1_CONFIRMED" }];
    mockOrderItemsResult = [{ id: 1, productId: 10, quantity: 2, price: 500, size: "500g", productName: "Cashews" }];
    lastUpdatedValues = null;
    generateShipmentCalled = false;

    const req = new Request("http://localhost/api/orders/42/status", {
      method: "PATCH",
      body: JSON.stringify({
        shippingStatus: "3_AWB_GENERATED",
        packageDetails: { weight: 1.0, length: 10, width: 10, height: 10 }
      })
    });
    const params = Promise.resolve({ id: "42" });
    const response = await PATCH(req, { params });

    assert(response.status === 200, `Expected status 200, got ${response.status}`);
    const data = await response.json();
    assert(data.success === true, "Expected success true");
    assert(generateShipmentCalled === true, "Expected generateShipment adapter to be called");
    
    assert(lastUpdatedValues.awbNumber === "XB_MOCK_AWB_100", `Expected AWB XB_MOCK_AWB_100, got ${lastUpdatedValues.awbNumber}`);
    assert(lastUpdatedValues.shippingStatus === "3_AWB_GENERATED", "Expected shippingStatus update");
    assert(lastUpdatedValues.status === "Shipped", "Expected order status updated to Shipped");
    
    const details = JSON.parse(lastUpdatedValues.shippingDetails);
    assert(details.labelUrl === "https://mock.pdf", "Expected label url matched");
  } catch (err: any) {
    console.error("Test 4 crashed:", err);
    assertionsFailed++;
  }

  // 6. Test 5: Trigger Pickup Booking (4_PICKUP_REQUESTED)
  console.log("\n--- Test 5: Trigger Pickup Booking (4_PICKUP_REQUESTED) ---");
  try {
    mockSessionValue = "9999999999";
    mockSelectResult = [
      {
        id: 42,
        awbNumber: "XB_MOCK_AWB_100",
        status: "Shipped",
        shippingStatus: "3_AWB_GENERATED",
        shippingDetails: JSON.stringify({ courierName: "Xpressbees", labelUrl: "https://mock.pdf" })
      }
    ];
    lastUpdatedValues = null;
    requestPickupCalled = false;

    const req = new Request("http://localhost/api/orders/42/status", {
      method: "PATCH",
      body: JSON.stringify({ shippingStatus: "4_PICKUP_REQUESTED" })
    });
    const params = Promise.resolve({ id: "42" });
    const response = await PATCH(req, { params });

    assert(response.status === 200, "Expected status 200");
    assert(requestPickupCalled === true, "Expected requestPickup adapter to be called");
    
    assert(lastUpdatedValues.shippingStatus === "4_PICKUP_REQUESTED", "Expected shippingStatus 4_PICKUP_REQUESTED");
    const mergedDetails = JSON.parse(lastUpdatedValues.shippingDetails);
    assert(mergedDetails.pickupToken === "PKUP_TEST_111", "Expected pickup token merged in shippingDetails");
    assert(mergedDetails.labelUrl === "https://mock.pdf", "Expected labelUrl kept intact after merge");
  } catch (err: any) {
    console.error("Test 5 crashed:", err);
    assertionsFailed++;
  }

  console.log("\n=== TESTS COMPLETE ===");
  if (assertionsFailed > 0) {
    console.error(`\n[CRITICAL] ${assertionsFailed} assertions failed! Please inspect implementation.`);
    process.exit(1);
  } else {
    console.log("\n[SUCCESS] All Order Status API Route assertions passed flawlessly!");
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error("Test suite execution crashed:", err);
  process.exit(1);
});
