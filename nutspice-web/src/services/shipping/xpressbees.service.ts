/**
 * Xpressbees Shipping API Service Utility for NutspiceCo
 * Handles real external REST requests to Xpressbees APIs.
 * Exclusively uses ES6 import and export statements, robust try/catch blocks,
 * and caches authentication tokens in-memory for 55 minutes.
 */

import {
  TrackingResponse,
  ShipmentResponse,
  PickupResponse,
  CancellationResponse,
  NDRItem,
  NDRResponse,
  CourierService
} from "./mock.service";

export interface XpressbeesOrder {
  customerName?: string;
  fullName?: string;
  name?: string;
  customerPhone?: string;
  phoneNumber?: string;
  phone?: string;
  shippingAddress?: string;
  address?: string;
  paymentMode?: string;
  payment_method?: string;
  totalAmount?: number;
  amount?: number;
  consigneeGst?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  shippingCharges?: number;
  codCharges?: number;
  discount?: number;
  id?: number;
  orderId?: string | number;
  shippingDetails?: string | Record<string, unknown> | null;
}

export interface XpressbeesItem {
  productName?: string;
  name?: string;
  quantity?: number;
  qty?: number;
  price?: number;
  sku?: string;
  productSku?: string;
}

export interface XpressbeesPackageDetails {
  weight?: number;
  length?: number;
  width?: number;
  breadth?: number;
  height?: number;
  courierId?: string | number;
}

export interface XpressbeesTrackingActivity {
  status?: string;
  ship_status?: string;
  location?: string;
  message?: string;
  event_time?: string;
}

export interface XpressbeesNDRPayload {
  awb?: string;
  awbNumber?: string;
  action?: string;
  actionData?: Record<string, unknown>;
  action_data?: Record<string, unknown>;
  reAttemptDate?: string;
  re_attempt_date?: string;
  remarks?: string;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

const getApiUrl = () => process.env.XPRESSBEES_API_URL || "https://ship.xpressbees.com/api";

export const CONSIGNER_DATA = {
  consigner_name: "Nutspice Co 9985088446",
  consigner_phone: "9985088446",
  consigner_pincode: "500035",
  consigner_city: "HYDERABAD",
  consigner_state: "Telangana",
  consigner_address: "H.No. 11-13-393, Ground Floor, Alkapur Colony, SRK Puram Kothapeta, Hyderabad",
  consigner_gst_number: ""
};

// In-memory token cache
let cachedToken: string | null = null;
let tokenExpiryTime: number = 0;

/**
 * Helper to extract Indian 6-digit pincode using regex from address string.
 */
export function extractPincode(address: string): string {
  const match = address.match(/\b\d{6}\b/);
  if (!match) {
    throw new Error(`Could not find a valid 6-digit Indian pincode in address: "${address}"`);
  }
  return match[0];
}

/**
 * Helper to attempt parsing city/state around the 6-digit pincode.
 */
export function extractAddressParts(address: string) {
  const pincode = extractPincode(address);
  const parts = address.split(/,+/).map(p => p.trim());

  let city = "Delhi";
  let state = "Delhi";

  if (parts.length > 2) {
    const pincodeIndex = parts.findIndex(p => p.includes(pincode));
    if (pincodeIndex !== -1) {
      if (pincodeIndex > 0) state = parts[pincodeIndex - 1];
      if (pincodeIndex > 1) city = parts[pincodeIndex - 2];
    } else {
      state = parts[parts.length - 1] || "Delhi";
      city = parts[parts.length - 2] || "Delhi";
    }
  }

  // Clean numbers and hyphens
  city = city.replace(/\d+/g, "").replace(/-+/g, "").trim() || "Delhi";
  state = state.replace(/\d+/g, "").replace(/-+/g, "").trim() || "Delhi";

  return { pincode, city, state };
}

/**
 * Retrieves the Xpressbees API authentication token.
 * Authenticates via /users/franchise_user_login using the username (NOT email) and password
 * from environment variables, caching the token for 55 minutes.
 */
export async function getXpressbeesToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiryTime) {
    return cachedToken;
  }

  const username = process.env.XPRESSBEES_USERNAME;
  const password = process.env.XPRESSBEES_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "Xpressbees credentials (XPRESSBEES_USERNAME, XPRESSBEES_PASSWORD) are not configured in environment variables."
    );
  }

  try {
    const response = await fetch(`${getApiUrl()}/users/franchise_user_login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    });

    if (!response.ok) {
      let errorMessage = `Authentication request failed with status ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson && typeof errorJson.message === "string") {
          errorMessage = errorJson.message;
        } else if (errorJson) {
          errorMessage = JSON.stringify(errorJson);
        }
      } catch {
        try {
          const errorText = await response.text();
          if (errorText) errorMessage = errorText;
        } catch {}
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (data.status !== true) {
      throw new Error(data.message || `Authentication failed: ${JSON.stringify(data)}`);
    }

    const token = data.data;
    if (!token) {
      throw new Error("Token missing from authentication response data.");
    }

    cachedToken = token;
    // Cache for 55 minutes
    tokenExpiryTime = Date.now() + 55 * 60 * 1000;
    return cachedToken as string;
  } catch (error: unknown) {
    console.error("Xpressbees authentication failed:", error);
    throw new Error(`Xpressbees Authentication Failure: ${getErrorMessage(error)}`);
  }
}

/**
 * Retrieves the list of available couriers from Xpressbees.
 */
export async function getCouriersXpressbees(): Promise<CourierService[]> {
  try {
    const token = await getXpressbeesToken();

    const response = await fetch(`${getApiUrl()}/franchise/shipments/courier`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      let errorMessage = `Courier list request failed with status ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson && typeof errorJson.message === "string") {
          errorMessage = errorJson.message;
        } else if (errorJson) {
          errorMessage = JSON.stringify(errorJson);
        }
      } catch {
        try {
          const errorText = await response.text();
          if (errorText) errorMessage = errorText;
        } catch {}
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (data.status !== true) {
      throw new Error(data.message || `Failed to fetch courier list: ${JSON.stringify(data)}`);
    }

    const rawCouriers = Array.isArray(data.data) ? data.data : [];

    // Map real Xpressbees courier array to the CourierService model expected by front-end
    return rawCouriers.map((item: { id?: string; name?: string }) => {
      const name = item.name || "Xpressbees Courier";
      const isExpress = name.toLowerCase().includes("air") || name.toLowerCase().includes("express");
      return {
        id: item.id || name.toLowerCase().replace(/\s+/g, "_"),
        name: name,
        charge: isExpress ? 110.0 : 65.0, // default fallback rates to keep checkout stable
        estimatedDays: isExpress ? 2 : 5,
        rating: isExpress ? 4.8 : 4.3
      };
    });
  } catch (error: unknown) {
    console.error("Xpressbees get couriers error:", error);
    throw new Error(`Xpressbees Get Couriers Failure: ${getErrorMessage(error)}`);
  }
}

/**
 * Generates/registers a shipment with the courier and retrieves an AWB.
 * Maps internal database data to the Xpressbees /franchise/shipments POST payload.
 */
export async function generateShipmentXpressbees(
  order: XpressbeesOrder,
  items: XpressbeesItem[],
  packageDetails: XpressbeesPackageDetails
): Promise<ShipmentResponse> {
  try {
    const token = await getXpressbeesToken();

    const addressStr = order.shippingAddress || order.address || "";
    const extract = (key: string) => {
      const regex = new RegExp(`${key}:\\s*([^,]+)`, 'i');
      const match = addressStr.match(regex);
      return match ? match[1].trim() : null;
    };

    const parsedName = extract('Name') || order.customerName || order.fullName || order.name || 'Valued Customer';
    const parsedPhone = extract('Contact') || order.customerPhone || order.phoneNumber || order.phone || '0000000000';
    const parsedPincode = extract('Pincode') || '000000';
    const parsedCity = extract('City') || 'Unknown';
    const parsedState = extract('State') || 'Unknown';
    const fullAddressWithoutPhone = addressStr.replace(/,?\s*Contact:\s*\d+/i, '').trim();

    const weight = packageDetails?.weight || 0.5;
    const length = packageDetails?.length || 10;
    const width = packageDetails?.width || packageDetails?.breadth || 10;
    const height = packageDetails?.height || 10;

    const orderId = order.id || order.orderId || Math.floor(1000 + Math.random() * 9000);
    const paymentMode = order.paymentMode || order.payment_method || "prepaid";
    const totalAmount = order.totalAmount || order.amount || 0;

    // Safely parse shippingDetails to determine if AWB was cancelled and calculate retryCount
    let retryCount = 0;
    if (order.shippingDetails) {
      try {
        const parsed = typeof order.shippingDetails === "string"
          ? JSON.parse(order.shippingDetails)
          : order.shippingDetails;
        if (parsed && Array.isArray(parsed.cancelledAwbs)) {
          retryCount = parsed.cancelledAwbs.length;
        }
      } catch (e) {
        console.error("Failed to parse shippingDetails inside generateShipmentXpressbees:", e);
      }
    }

    const uniqueShipmentId = retryCount > 0
      ? `NS-ODR-${orderId}-R${retryCount}`
      : `NS-ODR-${orderId}`;

    const payload = {
      id: uniqueShipmentId,
      unique_order_number: "yes",
      payment_method: paymentMode.toUpperCase() === "COD" ? "COD" : "prepaid",
      consigner_name: CONSIGNER_DATA.consigner_name,
      consigner_phone: CONSIGNER_DATA.consigner_phone,
      consigner_pincode: CONSIGNER_DATA.consigner_pincode,
      consigner_city: CONSIGNER_DATA.consigner_city,
      consigner_state: CONSIGNER_DATA.consigner_state,
      consigner_address: CONSIGNER_DATA.consigner_address,
      consigner_gst_number: CONSIGNER_DATA.consigner_gst_number || "",
      consignee_name: parsedName.substring(0, 100),
      consignee_phone: parsedPhone,
      consignee_pincode: parsedPincode,
      consignee_city: parsedCity.substring(0, 40),
      consignee_state: parsedState.substring(0, 40),
      consignee_address: fullAddressWithoutPhone.substring(0, 200),
      consignee_gst_number: order.consigneeGst || "",
      products: items.map((item: XpressbeesItem) => ({
        product_name: item.productName || item.name || "Nutspice Fit Product",
        product_qty: String(item.quantity || item.qty || 1),
        product_price: String(item.price || 0),
        product_sku: item.sku || item.productSku || "SKU001"
      })),
      invoice: [
        {
          invoice_number: order.invoiceNumber || `NS-INV-${orderId}`,
          invoice_date: order.invoiceDate || new Date().toISOString().split("T")[0]
        }
      ],
      weight: String(Math.round(weight * 1000)), // kg to grams as string
      length: String(length),
      breadth: String(width),
      height: String(height),
      courier_id: String(packageDetails?.courierId || "01"),
      pickup_location: "customer",
      shipping_charges: String(order.shippingCharges || 0),
      cod_charges: String(order.codCharges || 0),
      discount: String(order.discount || 0),
      order_amount: String(totalAmount),
      collectable_amount: paymentMode.toUpperCase() === "COD" ? String(totalAmount) : "0"
    };

    console.log("Xpressbees shipment payload:", payload);

    const response = await fetch(`${getApiUrl()}/franchise/shipments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMessage = `Shipment registration failed with status ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson && typeof errorJson.message === "string") {
          errorMessage = errorJson.message;
        } else if (errorJson) {
          errorMessage = JSON.stringify(errorJson);
        }
      } catch {
        try {
          const errorText = await response.text();
          if (errorText) errorMessage = errorText;
        } catch {}
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (data.response !== true) {
      throw new Error(data.message || `Shipment registration failed: ${JSON.stringify(data)}`);
    }

    return {
      success: true,
      awbNumber: data.awb_number,
      courierName: "Xpressbees",
      shippingStatus: "3_AWB_GENERATED",
      labelUrl: data.label,
      estimatedDelivery: data.estimated_delivery || new Date(Date.now() + 86400000 * 3).toISOString(),
      shippingId: data.shipping_id,
      courierId: data.courier_id
    };
  } catch (error: unknown) {
    console.error("Xpressbees generate shipment error:", error);
    throw new Error(`Xpressbees Generate Shipment Failure: ${getErrorMessage(error)}`);
  }
}

/**
 * Requests/schedules shipment pickup from the warehouse.
 */
export async function requestPickupXpressbees(awbNumbers: string[]): Promise<PickupResponse> {
  try {
    const token = await getXpressbeesToken();

    const response = await fetch(`${getApiUrl()}/franchise/shipments/pickup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        awb_numbers: awbNumbers.join(",")
      }),
    });

    if (!response.ok) {
      let errorMessage = `Pickup scheduling failed with status ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson && typeof errorJson.message === "string") {
          errorMessage = errorJson.message;
        } else if (errorJson) {
          errorMessage = JSON.stringify(errorJson);
        }
      } catch {
        try {
          const errorText = await response.text();
          if (errorText) errorMessage = errorText;
        } catch {}
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (data.response !== true) {
      throw new Error(data.message || `Pickup scheduling failed: ${JSON.stringify(data)}`);
    }

    const pickupToken = "PKUP" + Math.floor(100000 + Math.random() * 900000);

    return {
      success: true,
      pickupToken: pickupToken,
      scheduledDate: new Date().toISOString().split("T")[0],
      status: "4_PICKUP_REQUESTED",
      message: data.message || "Pickup manifest generated successfully.",
      manifestUrl: data.data
    };
  } catch (error: unknown) {
    console.error("Xpressbees request pickup error:", error);
    throw new Error(`Xpressbees Request Pickup Failure: ${getErrorMessage(error)}`);
  }
}

/**
 * Tracks a shipment via its Airway Bill (AWB) number and normalizes status activities.
 */
export async function trackShipmentXpressbees(awbNumber: string): Promise<TrackingResponse> {
  try {
    const token = await getXpressbeesToken();

    const response = await fetch(`${getApiUrl()}/franchise/shipments/track_shipment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        awb_number: awbNumber
      })
    });

    if (!response.ok) {
      let errorMessage = `Tracking request failed with status ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson && typeof errorJson.message === "string") {
          errorMessage = errorJson.message;
        } else if (errorJson) {
          errorMessage = JSON.stringify(errorJson);
        }
      } catch {
        try {
          const errorText = await response.text();
          if (errorText) errorMessage = errorText;
        } catch {}
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (data.response !== true) {
      throw new Error(data.message || `Tracking failed: ${JSON.stringify(data)}`);
    }

    const trackingData = (data.tracking_data || {}) as Record<string, unknown>;
    const rawActivities: XpressbeesTrackingActivity[] = [];
    const states = ["pending pickup", "in transit", "out for delivery", "delivered"];
    for (const state of states) {
      const stateList = trackingData[state];
      if (Array.isArray(stateList)) {
        rawActivities.push(...(stateList as XpressbeesTrackingActivity[]));
      }
    }

    rawActivities.sort((a: XpressbeesTrackingActivity, b: XpressbeesTrackingActivity) => {
      const timeA = parseInt(a.event_time || "0") || 0;
      const timeB = parseInt(b.event_time || "0") || 0;
      return timeA - timeB;
    });

    const history = rawActivities.map((item: XpressbeesTrackingActivity) => ({
      status: item.status || item.ship_status || "IN_TRANSIT",
      location: item.location || "Transit Hub",
      message: item.message || "Shipment activity recorded.",
      timestamp: item.event_time
        ? new Date(parseInt(item.event_time) * 1000).toISOString()
        : new Date().toISOString()
    }));

    const status = (data.status as string) || (data.data?.status as string) || (history.length > 0 ? history[history.length - 1].status : "IN_TRANSIT");

    return {
      awbNumber,
      status: status,
      carrier: "Xpressbees",
      history: history.length > 0 ? history : [
        {
          status: "IN_TRANSIT",
          location: "Transit Hub",
          message: "Shipment details fetched from courier.",
          timestamp: new Date().toISOString()
        }
      ],
      trackingData: trackingData
    };
  } catch (error: unknown) {
    console.error("Xpressbees tracking error:", error);
    throw new Error(`Xpressbees Tracking Failure: ${getErrorMessage(error)}`);
  }
}

/**
 * Cancels a scheduled shipment.
 */
export async function cancelShipmentXpressbees(awbNumber: string): Promise<CancellationResponse> {
  try {
    const token = await getXpressbeesToken();

    const response = await fetch(`${getApiUrl()}/franchise/shipments/cancel_shipment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        awb_number: awbNumber
      })
    });

    if (!response.ok) {
      let errorMessage = `Cancellation failed with status ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson && typeof errorJson.message === "string") {
          errorMessage = errorJson.message;
        } else if (errorJson) {
          errorMessage = JSON.stringify(errorJson);
        }
      } catch {
        try {
          const errorText = await response.text();
          if (errorText) errorMessage = errorText;
        } catch {}
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (data.response !== true) {
      throw new Error(data.message || `Cancellation failed: ${JSON.stringify(data)}`);
    }

    return {
      success: true,
      awbNumber,
      status: "SHIPMENT_CANCELLED",
      message: data.message || `Shipment for AWB ${awbNumber} has been successfully cancelled in Xpressbees.`
    };
  } catch (error: unknown) {
    console.error("Xpressbees cancellation error:", error);
    throw new Error(`Xpressbees Cancellation Failure: ${getErrorMessage(error)}`);
  }
}

/**
 * Retrieves outstanding Non-Delivery Reports (NDRs) from courier.
 */
export async function getXpressbeesNDRList(): Promise<NDRItem[]> {
  try {
    const token = await getXpressbeesToken();

    const response = await fetch(`${getApiUrl()}/franchise/ndr`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      let errorMessage = `NDR list retrieval failed with status ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson && typeof errorJson.message === "string") {
          errorMessage = errorJson.message;
        } else if (errorJson) {
          errorMessage = JSON.stringify(errorJson);
        }
      } catch {
        try {
          const errorText = await response.text();
          if (errorText) errorMessage = errorText;
        } catch {}
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (data.status !== true) {
      throw new Error(data.message || `Failed to fetch NDR list: ${JSON.stringify(data)}`);
    }

    const rawList = (data.data || []) as { awb_number?: string; courier_remarks?: string; total_attempts?: number | string; event_date?: string }[];
    return rawList.map((item) => ({
      awbNumber: item.awb_number || "",
      reason: item.courier_remarks || "NDR reported",
      attempts: typeof item.total_attempts === "number" ? item.total_attempts : parseInt(String(item.total_attempts || "1")),
      status: "NDR_ACTION_REQUIRED",
      reportedAt: item.event_date ? new Date(item.event_date).toISOString() : new Date().toISOString()
    }));
  } catch (error: unknown) {
    console.error("Xpressbees get NDR list error:", error);
    throw new Error(`Xpressbees NDR Retrieval Failure: ${getErrorMessage(error)}`);
  }
}

/**
 * Creates/submits an NDR instruction action back to Xpressbees.
 */
export async function createXpressbeesNDR(payload: XpressbeesNDRPayload): Promise<NDRResponse> {
  try {
    const token = await getXpressbeesToken();

    const awb = payload.awb || payload.awbNumber;
    const action = payload.action || "re-attempt";
    const actionData = payload.actionData || payload.action_data || {};
    const reAttemptDate = payload.reAttemptDate || payload.re_attempt_date || new Date().toISOString().split("T")[0];
    const remarks = payload.remarks || "";

    const ndrRequest: Record<string, unknown> = {
      awb: awb,
      action: action,
      re_attempt_date: reAttemptDate,
      remarks: remarks
    };

    if (action === "update-phone" || action === "update-address") {
      ndrRequest.action_data = actionData;
    }

    const response = await fetch(`${getApiUrl()}/franchise/ndr/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify([ndrRequest])
    });

    if (!response.ok) {
      let errorMessage = `NDR creation failed with status ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson && typeof errorJson.message === "string") {
          errorMessage = errorJson.message;
        } else if (errorJson) {
          errorMessage = JSON.stringify(errorJson);
        }
      } catch {
        try {
          const errorText = await response.text();
          if (errorText) errorMessage = errorText;
        } catch {}
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const result = (Array.isArray(data) ? data[0] : data) as { status?: boolean; message?: string } | undefined;

    if (!result || result.status !== true) {
      throw new Error(result?.message || `NDR submission failed: ${JSON.stringify(data)}`);
    }

    return {
      success: true,
      awbNumber: awb || "",
      action: action || "",
      message: result.message || "NDR resolution instruction submitted successfully."
    };
  } catch (error: unknown) {
    console.error("Xpressbees NDR submit error:", error);
    throw new Error(`Xpressbees NDR Submit Failure: ${getErrorMessage(error)}`);
  }
}
