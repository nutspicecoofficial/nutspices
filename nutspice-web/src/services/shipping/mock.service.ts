/**
 * Mock Shipping Service for NutspiceCo
 * Provides realistic dummy data to simulate shipping workflows (Xpressbees adapter)
 * during local development and testing.
 */

export interface TrackingActivity {
  status: string;
  location: string;
  message: string;
  timestamp: string;
}

export interface TrackingResponse {
  awbNumber: string;
  status: string;
  carrier: string;
  history: TrackingActivity[];
  trackingData?: any;
}

export interface ShipmentResponse {
  success: boolean;
  awbNumber: string;
  courierName: string;
  shippingStatus: string;
  labelUrl: string;
  estimatedDelivery: string;
  shippingId?: number;
  courierId?: string;
}

export interface PickupResponse {
  success: boolean;
  pickupToken: string;
  scheduledDate: string;
  status: string;
  message: string;
}

export interface CourierService {
  id: string;
  name: string;
  charge: number;
  estimatedDays: number;
  rating: number;
}

export interface CancellationResponse {
  success: boolean;
  awbNumber: string;
  status: string;
  message: string;
}

export interface NDRItem {
  awbNumber: string;
  reason: string;
  attempts: number;
  status: string;
  reportedAt: string;
}

export interface NDRResponse {
  success: boolean;
  awbNumber: string;
  action: string;
  message: string;
}

/**
 * Track a shipment by AWB number.
 */
export async function trackShipment(awbNumber: string): Promise<TrackingResponse> {
  return {
    awbNumber,
    status: "IN_TRANSIT",
    carrier: "Xpressbees Mock Courier",
    history: [
      {
        status: "PENDING",
        location: "NutspiceCo Warehouse, Delhi",
        message: "Order received and AWB registration initiated.",
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
      },
      {
        status: "3_AWB_GENERATED",
        location: "NutspiceCo Warehouse, Delhi",
        message: "Airway Bill (AWB) generated.",
        timestamp: new Date(Date.now() - 86400000 * 1.8).toISOString(),
      },
      {
        status: "4_PICKUP_REQUESTED",
        location: "NutspiceCo Warehouse, Delhi",
        message: "Pickup scheduled for consignment.",
        timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString(),
      },
      {
        status: "PICKED",
        location: "Delhi Hub",
        message: "Shipment picked up by courier associate.",
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      },
      {
        status: "IN_TRANSIT",
        location: "Transit Hub, Mumbai",
        message: "In transit to delivery destination hub.",
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

/**
 * Generate a new shipment and allocate AWB.
 */
export async function generateShipment(orderData: any): Promise<ShipmentResponse> {
  const mockAwb = "XB" + Math.floor(1000000000 + Math.random() * 9000000000);
  return {
    success: true,
    awbNumber: mockAwb,
    courierName: "Xpressbees",
    shippingStatus: "3_AWB_GENERATED",
    labelUrl: `https://xpressbees.mock/labels/download/${mockAwb}.pdf`,
    estimatedDelivery: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days from now
  };
}

/**
 * Schedule/Request a shipment pickup.
 */
export async function requestPickup(pickupData: any): Promise<PickupResponse> {
  const token = "PKUP" + Math.floor(100000 + Math.random() * 900000);
  return {
    success: true,
    pickupToken: token,
    scheduledDate: pickupData?.pickupDate || new Date(Date.now() + 86400000).toISOString().split("T")[0],
    status: "4_PICKUP_REQUESTED",
    message: "Pickup scheduled successfully under token " + token,
  };
}

/**
 * Retrieve a list of available couriers and rates.
 */
export async function getCouriers(payload: any): Promise<CourierService[]> {
  return [
    {
      id: "xb_surface",
      name: "Xpressbees Surface",
      charge: 65.0,
      estimatedDays: 5,
      rating: 4.3,
    },
    {
      id: "xb_express",
      name: "Xpressbees Express (Air)",
      charge: 110.0,
      estimatedDays: 2,
      rating: 4.8,
    },
    {
      id: "nut_local",
      name: "NutSpice Local Delivery",
      charge: 45.0,
      estimatedDays: 1,
      rating: 4.9,
    },
  ];
}

/**
 * Cancel a scheduled shipment.
 */
export async function cancelShipment(awbNumber: string): Promise<CancellationResponse> {
  return {
    success: true,
    awbNumber,
    status: "SHIPMENT_CANCELLED",
    message: `Shipment for AWB ${awbNumber} has been successfully cancelled in Xpressbees.`,
  };
}

/**
 * Retrieve list of Non-Delivery Reports (NDRs).
 */
export async function getNDRList(): Promise<NDRItem[]> {
  return [
    {
      awbNumber: "XB5584930291",
      reason: "Customer requested delivery at a later date/time",
      attempts: 1,
      status: "NDR_PENDING",
      reportedAt: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
    },
    {
      awbNumber: "XB7748392019",
      reason: "Address unlocatable/Incorrect pin code",
      attempts: 2,
      status: "NDR_ACTION_REQUIRED",
      reportedAt: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
    },
  ];
}

/**
 * Create or respond to an NDR action.
 */
export async function createNDR(ndrData: any): Promise<NDRResponse> {
  return {
    success: true,
    awbNumber: ndrData?.awbNumber || "XB5584930291",
    action: ndrData?.action || "REATTEMPT",
    message: `NDR resolution instruction '${ndrData?.action || "REATTEMPT"}' received and submitted to courier.`,
  };
}
