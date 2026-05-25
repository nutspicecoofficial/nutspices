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
export async function generateShipment(orderData: any) {
  if (USE_MOCK) {
    return mockService.generateShipment(orderData);
  }
  return xpressbeesService.generateShipmentXpressbees(
    orderData.order || orderData,
    orderData.items || [],
    orderData.packageDetails || {}
  );
}

/**
 * Requests/schedules shipment pickup from the warehouse.
 */
export async function requestPickup(pickupData: any) {
  if (USE_MOCK) {
    return mockService.requestPickup(pickupData);
  }
  const awbs = Array.isArray(pickupData)
    ? pickupData
    : pickupData.awbNumbers || [pickupData.awbNumber || pickupData];
  return xpressbeesService.requestPickupXpressbees(awbs);
}

/**
 * Retrieves a list of available couriers and calculated charges.
 */
export async function getCouriers(payload: any) {
  if (USE_MOCK) {
    return mockService.getCouriers(payload);
  }
  return xpressbeesService.getCouriersXpressbees(payload);
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
export async function createNDR(ndrData: any) {
  if (USE_MOCK) {
    return mockService.createNDR(ndrData);
  }
  return xpressbeesService.createXpressbeesNDR(ndrData);
}
