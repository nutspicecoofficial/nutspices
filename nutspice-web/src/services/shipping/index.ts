/**
 * Shipping Service Adapter Entrypoint
 * Orchestrates calls between the mock shipping service and the real courier API integration (Xpressbees).
 * Controlled by the USE_MOCK_SHIPPING environment variable.
 */

import * as mockService from "./mock.service";
import * as xpressbeesService from "./xpressbees.service";

const USE_MOCK = process.env.USE_MOCK_SHIPPING === "true";

/**
 * Tracks a shipment via its Airway Bill (AWB) number.
 * Under mock mode, fetches structured dummy status history.
 * Under production mode, executes actual courier integration.
 */
export async function trackShipment(awbNumber: string) {
  if (USE_MOCK) {
    return mockService.trackShipment(awbNumber);
  }
  return xpressbeesService.trackShipmentXpressbees(awbNumber);
}

/**
 * Generates/registers a shipment with the courier and retrieves an AWB.
 */
export async function generateShipment(orderData: unknown) {
  if (USE_MOCK) {
    return mockService.generateShipment(orderData);
  }
  const data = orderData as {
    order?: unknown;
    items?: unknown[];
    packageDetails?: unknown;
  };
  return xpressbeesService.generateShipmentXpressbees(
    (data.order || data) as xpressbeesService.XpressbeesOrder,
    (data.items || []) as xpressbeesService.XpressbeesItem[],
    (data.packageDetails || {}) as xpressbeesService.XpressbeesPackageDetails
  );
}

/**
 * Requests/schedules shipment pickup from the warehouse.
 */
export async function requestPickup(pickupData: unknown) {
  if (USE_MOCK) {
    return mockService.requestPickup(pickupData);
  }
  const data = pickupData as { awbNumbers?: string[]; awbNumber?: string } | string | string[];
  const awbs = Array.isArray(data)
    ? data
    : typeof data === "object" && data !== null
    ? data.awbNumbers || [data.awbNumber || ""]
    : [String(data)];
  return xpressbeesService.requestPickupXpressbees(awbs);
}

/**
 * Retrieves a list of available couriers and calculated charges.
 */
export async function getCouriers(payload: unknown) {
  if (USE_MOCK) {
    return mockService.getCouriers(payload);
  }
  return xpressbeesService.getCouriersXpressbees();
}

/**
 * Cancels a scheduled shipment.
 */
export async function cancelShipment(awbNumber: string) {
  if (USE_MOCK) {
    return mockService.cancelShipment(awbNumber);
  }
  return xpressbeesService.cancelShipmentXpressbees(awbNumber);
}

/**
 * Retrieves lists of outstanding Non-Delivery Reports (NDRs).
 */
export async function getNDRList() {
  if (USE_MOCK) {
    return mockService.getNDRList();
  }
  return xpressbeesService.getXpressbeesNDRList();
}

/**
 * Creates or responds to a Non-Delivery Report (NDR) instructions/reattempts.
 */
export async function createNDR(ndrData: unknown) {
  if (USE_MOCK) {
    return mockService.createNDR(ndrData);
  }
  return xpressbeesService.createXpressbeesNDR(ndrData as xpressbeesService.XpressbeesNDRPayload);
}

/**
 * Calculates shipping rates.
 * Routes to either mock service or production Xpressbees API.
 */
export async function calculatePricing(params: any) {
  if (USE_MOCK) {
    return {
      status: true,
      message: [
        {
          name: "B2C Surface",
          courier_charges: 65.0,
          cod_charges: 0,
          total_price: 65.0
        },
        {
          name: "B2C AIR",
          courier_charges: 110.0,
          cod_charges: 0,
          total_price: 110.0
        }
      ]
    };
  }
  return xpressbeesService.calculatePricingXpressbees(params as xpressbeesService.XpressbeesPricingParams);
}

