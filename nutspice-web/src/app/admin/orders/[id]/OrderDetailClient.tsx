"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PaymentDetailsCard from "@/components/admin/PaymentDetailsCard";
import NdrActionModal from "@/components/admin/NdrActionModal";
import CancelShipmentModal from "@/components/admin/CancelShipmentModal";
import { 
  ArrowLeft, 
  Clock, 
  MapPin, 
  Package, 
  FileText, 
  Truck, 
  Download,
  AlertTriangle,
  ChevronDown,
  Info,
  XCircle
} from "lucide-react";

interface OrderItem {
  id: number;
  productName: string | null;
  quantity: number;
  price: number;
  size: string;
  color: string | null;
  customizations: string | null;
}

interface Order {
  id: number;
  totalAmount: number;
  status: string | null;
  createdAt: string | null;
  shippingAddress: string | null;
  paymentMode: string | null;
  paymentStatus: string | null;
  amountPaid: number | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  paymentId: string | null;
  orderStatus: string | null;
  shippingStatus: string | null;
  awbNumber: string | null;
  shippingDetails: string | null;
  cancelReason: string | null;
  customerPhone?: string; // fallback phone
}

interface OrderDetailClientProps {
  order: Order;
  items: OrderItem[];
  customerPhone: string;
}

export default function OrderDetailClient({
  order,
  items,
  customerPhone
}: OrderDetailClientProps) {
  const router = useRouter();
  const [ndrModalOpen, setNdrModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const handleCancelShipment = async () => {
    const res = await fetch(`/api/orders/${order.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cancelShipmentOnly: true
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to cancel shipment.");
    }
    router.refresh();
  };

  // Parse shipping details
  const parsedShippingDetails = (() => {
    if (!order.shippingDetails) return null;
    try {
      return JSON.parse(order.shippingDetails);
    } catch {
      return null;
    }
  })();

  const isNdrActive = parsedShippingDetails?.isNdr || parsedShippingDetails?.ndrActive || order.shippingStatus === "NDR_ACTION_REQUIRED";
  const ndrReason = parsedShippingDetails?.ndrReason || parsedShippingDetails?.ndrRemarks || "Delivery failed. Action required.";

  const getStatusBadgeStyle = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "order placed" || s === "pending") return "bg-amber-50 border-amber-200 text-amber-600";
    if (s === "processing" || s === "confirmed") return "bg-indigo-50 border-indigo-200 text-indigo-600";
    if (s === "shipped") return "bg-blue-50 border-blue-200 text-blue-600";
    if (s === "in transit" || s === "on the way") return "bg-purple-50 border-purple-200 text-purple-600";
    if (s === "out for delivery") return "bg-pink-50 border-pink-200 text-pink-600";
    if (s === "delivered" || s === "completed") return "bg-emerald-50 border-emerald-200 text-emerald-600";
    if (s === "cancelled") return "bg-rose-50 border-rose-200 text-rose-600";
    return "bg-brand/5 border-brand/10 text-brand/60";
  };

  const handleNdrSuccess = () => {
    // Refresh the router to query database and get updated details state
    router.refresh();
  };

  const labelUrl = parsedShippingDetails?.label || parsedShippingDetails?.labelUrl;
  const manifestUrl = parsedShippingDetails?.manifestUrl;

  return (
    <div className="p-6 max-w-5xl mx-auto font-sans">
      {/* Back Button & Header */}
      <div className="mb-6">
        <Link 
          href="/admin/orders" 
          className="inline-flex items-center gap-2 text-xs font-bold text-[#C5A059] hover:text-[#1B3022] uppercase tracking-wider transition-colors mb-4 cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Orders List
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-playfair font-bold text-[#1B3022]">Order #00{order.id}</h1>
              <span className={`px-2.5 py-0.5 border text-[9px] font-black uppercase tracking-widest rounded-full ${getStatusBadgeStyle(order.status || "")}`}>
                {order.status || "Pending"}
              </span>
              {isNdrActive && (
                <span className="bg-red-100 text-red-700 border border-red-200 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1 select-none">
                  <AlertTriangle size={12} className="shrink-0" />
                  NDR Alert
                </span>
              )}
            </div>
            <p className="text-xs text-brand/40 font-medium mt-1">
              Placed on {order.createdAt ? new Date(order.createdAt).toLocaleString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              }) : "N/A"}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="block text-[8px] font-black text-brand/30 uppercase tracking-widest mb-0.5">Total Amount</span>
            <span className="text-2xl font-bold text-[#1B3022] font-sans">₹{order.totalAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* NDR Exception Alert Banner */}
      {isNdrActive && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <AlertTriangle size={20} className="animate-pulse" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-0.5">Non-Delivery Exception Alert</h5>
              <p className="text-xs text-amber-800 font-semibold leading-relaxed">
                Courier Remark: <span className="italic">"{ndrReason}"</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNdrModalOpen(true)}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all shadow-md cursor-pointer shrink-0 text-center"
          >
            Resolve NDR Exception
          </button>
        </div>
      )}

      {/* Cancelled Alert Banner */}
      {order.status?.toLowerCase() === "cancelled" && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 shrink-0">
              <XCircle size={20} />
            </div>
            <div>
              <h5 className="text-xs font-bold text-rose-900 uppercase tracking-wider mb-0.5">Order Cancelled</h5>
              <p className="text-xs text-rose-800 font-semibold leading-relaxed">
                {order.cancelReason && order.cancelReason !== "Cancelled by customer"
                  ? `Order Cancelled by Admin: "${order.cancelReason}"`
                  : `Order Cancelled: "${order.cancelReason || "No reason provided."}"`}
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-brand/5 p-4 rounded-2xl border border-brand/5 mb-6">
        <div>
          <p className="text-[8px] font-black text-brand/35 uppercase tracking-wider mb-1">Order State</p>
          <span className="px-2.5 py-1 bg-brand/10 text-brand font-bold text-xs rounded-lg uppercase tracking-wide">
            {order.orderStatus || "0_PLACED"}
          </span>
        </div>
        <div>
          <p className="text-[8px] font-black text-brand/35 uppercase tracking-wider mb-1">Shipping State</p>
          <span className="px-2.5 py-1 bg-[#C5A059]/10 text-[#C5A059] font-bold text-xs rounded-lg uppercase tracking-wide">
            {order.shippingStatus || "PENDING"}
          </span>
        </div>
        <div>
          <p className="text-[8px] font-black text-brand/35 uppercase tracking-wider mb-1">Airway Bill (AWB)</p>
          {order.awbNumber ? (
            <a
              href={`https://www.xpressbees.com/track?awb=${order.awbNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C5A059] font-bold text-xs hover:underline flex items-center gap-1.5"
              title="Track with Xpressbees"
            >
              {order.awbNumber}
              <span className="text-[8px] px-1 bg-[#C5A059]/10 rounded font-normal uppercase">Track ↗</span>
            </a>
          ) : (
            <span className="text-brand/30 text-xs font-semibold">Not Allocated</span>
          )}
        </div>
      </div>

      {/* Core Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Items and Payment */}
        <div className="space-y-6">
          
          {/* Items Purchased */}
          <div>
            <h4 className="text-[9px] font-black text-brand/30 uppercase tracking-[0.2em] mb-4">Items Purchased</h4>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-brand/5 shadow-xs">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 bg-brand/5 rounded-xl flex items-center justify-center">
                      <Package size={16} className="text-brand/30" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-brand">{item.productName || "NutSpice fit product"}</p>
                      <p className="text-[9px] font-bold text-brand/40 uppercase tracking-widest mt-0.5">
                        Qty: {item.quantity} • {item.size}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-brand font-sans">₹{item.price * item.quantity}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Card */}
          <PaymentDetailsCard
            paymentMode={order.paymentMode}
            paymentStatus={order.paymentStatus}
            amountPaid={order.amountPaid}
            razorpayOrderId={order.razorpayOrderId}
            razorpayPaymentId={order.razorpayPaymentId}
            paymentId={order.paymentId}
            totalAmount={order.totalAmount}
          />

        </div>

        {/* Right Column: Delivery and Shipping details */}
        <div className="space-y-6">
          
          {/* Delivery Address */}
          <div>
            <h4 className="text-[9px] font-black text-brand/30 uppercase tracking-[0.2em] mb-4">Delivery Address</h4>
            <div className="flex gap-3.5 p-5 bg-white rounded-2xl border border-brand/5 shadow-xs">
              <MapPin size={18} className="text-[#C5A059] shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-brand font-medium leading-relaxed italic break-words">
                  "{order.shippingAddress}"
                </p>
                <div className="mt-4 pt-4 border-t border-brand/5">
                  <p className="text-[8px] font-black text-brand/30 uppercase tracking-widest mb-1">Customer Phone</p>
                  <p className="text-xs text-brand font-bold">{customerPhone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping details and documents */}
          {(parsedShippingDetails?.invoiceNumber || labelUrl || manifestUrl || order.awbNumber) && (
            <div>
              <h4 className="text-[9px] font-black text-brand/30 uppercase tracking-[0.2em] mb-4">Shipping details & Documents</h4>
              <div className="flex gap-3.5 p-5 bg-white rounded-2xl border border-brand/5 shadow-xs relative">
                
                {/* Cancel Shipment Button with Slide-out Animation & Tooltip */}
                {order.awbNumber && order.shippingStatus !== "DELIVERED" && (
                  <div className="absolute bottom-5 right-5 group">
                    <button
                      type="button"
                      onClick={() => setCancelModalOpen(true)}
                      className="flex items-center gap-0 hover:gap-2 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-100 transition-all duration-300 ease-out cursor-pointer overflow-hidden max-w-[34px] hover:max-w-[150px] group/btn shadow-xs"
                    >
                      <span className="text-[9px] font-black uppercase tracking-wider text-rose-600 opacity-0 group-hover/btn:opacity-100 max-w-0 group-hover/btn:max-w-[100px] transition-all duration-300 ease-out overflow-hidden whitespace-nowrap">
                        Cancel Shipment
                      </span>
                      <XCircle size={16} className="shrink-0" />
                    </button>
                    <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-48 p-2 bg-[#1B3022] text-white text-[10px] normal-case tracking-normal font-medium rounded-lg shadow-lg z-35 pointer-events-none text-center leading-relaxed">
                      Cancel this Xpressbees shipment. Order will return to Processing state.
                      <div className="absolute top-full right-3 w-1.5 h-1.5 bg-[#1B3022] rotate-45 -translate-y-0.5"></div>
                    </div>
                  </div>
                )}
                <FileText size={18} className="text-[#C5A059] shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-5">
                    <div>
                      <span className="block text-[9px] font-black text-brand/40 uppercase tracking-widest mb-1">
                        Invoice Number
                      </span>
                      <span className="text-xs font-bold text-brand font-mono">
                        {parsedShippingDetails?.invoiceNumber || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-black text-brand/40 uppercase tracking-widest mb-1">
                        Invoice Date
                      </span>
                      <span className="text-xs font-bold text-brand">
                        {parsedShippingDetails?.invoiceDate ? new Date(parsedShippingDetails.invoiceDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-black text-brand/40 uppercase tracking-widest mb-1">
                        Weight
                      </span>
                      <span className="text-xs font-bold text-brand">
                        {(() => {
                          const w = parsedShippingDetails?.weight;
                          if (w === undefined || w === null || w === "") return "N/A";
                          const val = parseFloat(w);
                          if (isNaN(val)) return "N/A";
                          return val < 15 ? `${val} kg` : `${val} g`;
                        })()}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-black text-brand/40 uppercase tracking-widest mb-1">
                        Dimensions
                      </span>
                      <span className="text-xs font-bold text-brand">
                        {(() => {
                          const l = parsedShippingDetails?.length;
                          const w = parsedShippingDetails?.breadth || parsedShippingDetails?.width;
                          const h = parsedShippingDetails?.height;
                          if (!l && !w && !h) return "N/A";
                          return `${l || "N/A"} x ${w || "N/A"} x ${h || "N/A"} cm`;
                        })()}
                      </span>
                    </div>
                  </div>

                  {/* Documents */}
                  {(labelUrl || manifestUrl) && (
                    <div className="flex flex-wrap gap-3.5 pt-4 border-t border-brand/5">
                      {labelUrl && (
                        <a
                          href={labelUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors shadow-xs cursor-pointer"
                        >
                          <Download size={14} />
                          Order Label
                        </a>
                      )}
                      {manifestUrl && (
                        <a
                          href={manifestUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors shadow-xs cursor-pointer"
                        >
                          <Download size={14} />
                          View Manifest
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* NDR Modal Trigger */}
      {ndrModalOpen && (
        <NdrActionModal
          isOpen={true}
          awbNumber={order.awbNumber || ""}
          courierRemarks={ndrReason}
          onClose={() => setNdrModalOpen(false)}
          onSuccess={handleNdrSuccess}
        />
      )}

      {/* Cancel Shipment Modal Trigger */}
      {cancelModalOpen && (
        <CancelShipmentModal
          isOpen={true}
          orderId={order.id}
          awbNumber={order.awbNumber || ""}
          onClose={() => setCancelModalOpen(false)}
          onConfirm={handleCancelShipment}
        />
      )}
    </div>
  );
}
