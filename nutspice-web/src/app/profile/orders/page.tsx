"use client";

import React, { useEffect, useState } from "react";
import { ShoppingBag, Loader2, Package, CheckCircle2, Clock, Ruler, XCircle, AlertTriangle, Image as ImageIcon, MapPin, Check, X, Truck, Plane, Bike, CheckSquare, Cog, ExternalLink } from "lucide-react";
import Link from "next/link";

interface OrderItem {
  id: number;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  size: string;
  customizations: {
    type: string;
    measurements: Record<string, string>;
  } | null;
}

interface Order {
  id: number;
  totalAmount: number;
  status: string;
  shippingAddress: string | null;
  createdAt: string;
  paymentId?: string | null;
  customerPhone?: string | null;
  cancelReason?: string | null;
  awbNumber?: string | null;
  shippingDetails?: string | null;
  shippingStatus?: string | null;
  items: OrderItem[];
}

const MILESTONES = [
  "Order Placed",
  "Processing",
  "Shipped",
  "In Transit",
  "Out for Delivery",
  "Delivered"
];

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [confirmingCancelId, setConfirmingCancelId] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/profile/orders");
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCancelOrder = async (orderId: number) => {
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/profile/orders/${orderId}/cancel`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (data.success) {
        showToast("Order cancelled successfully");
        fetchOrders();
      } else {
        showToast(data.error || "Failed to cancel order");
      }
    } catch (error) {
      console.error("Cancellation error:", error);
      showToast("Something went wrong");
    } finally {
      setIsCancelling(false);
      setConfirmingCancelId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C5A059] animate-spin mb-4" />
        <p className="text-[10px] font-black text-brand/40 uppercase tracking-[0.2em]">Preparing your harvest details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-playfair font-bold text-brand mb-2">My Orders</h1>
          <p className="text-brand/40 text-xs font-bold uppercase tracking-widest">Track your premium selections</p>
        </div>
        <Link href="/" className="p-3 rounded-full bg-brand/5 text-brand hover:bg-brand/10 transition-all border border-brand/5">
          <ShoppingBag size={20} />
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] p-20 shadow-sm border border-brand/5 text-center">
          <div className="w-20 h-20 bg-brand/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package size={40} className="text-brand/20" />
          </div>
          <h3 className="text-xl font-bold text-brand mb-2">No orders yet</h3>
          <p className="text-brand/60 text-sm mb-10 max-w-xs mx-auto">Your selection history will appear here once you place your first order.</p>
          <Link href="/" className="inline-block bg-brand text-white px-8 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-brand-hover shadow-lg">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const parsedDetails = (() => {
              if (!order.shippingDetails) return null;
              try {
                return typeof order.shippingDetails === "string"
                  ? JSON.parse(order.shippingDetails)
                  : order.shippingDetails;
              } catch {
                return null;
              }
            })();

            const trackingId = order.awbNumber || parsedDetails?.awbNumber;
            const isManual = parsedDetails?.isManualFulfillment === true;
            const courierName = isManual ? (parsedDetails?.courierName || "Courier") : "XpressBees";
            const trackingLink = isManual
              ? parsedDetails?.trackingUrl
              : `https://ship.xpressbees.com/tracking?awb=${trackingId}`;

            return (
              <div key={order.id} className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden transition-all duration-500 group">
                <div className="p-5 md:p-6 bg-brand flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/10 rounded-2xl text-white">
                      <Package size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black tracking-widest uppercase mb-1">Order #NS-{order.id}</h4>
                      <p className="text-xs font-medium text-white/70">NutspiceCo Selection</p>
                    </div>
                  </div>

                  {/* Dynamic tracking link badge */}
                  {trackingId && (
                    <div className="flex-1 md:ml-8 md:mr-auto flex justify-start">
                      <a
                        href={trackingLink || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors border border-white/20 text-white px-4 py-2 rounded-lg text-xs font-medium tracking-wide cursor-pointer"
                      >
                        <Truck size={14} />
                        <span>Track via {courierName}: {trackingId}</span>
                        <ExternalLink size={12} className="opacity-75" />
                      </a>
                    </div>
                  )}

                <div className="flex flex-wrap items-center gap-6 md:gap-10">
                  <div className="flex flex-col min-w-[80px]">
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1.5">Status</p>
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm ${
                        order.status?.toLowerCase() === 'delivered' ? 'bg-green-500/20 text-green-300' : 
                        order.status?.toLowerCase() === 'cancelled' ? 'bg-red-500/20 text-red-300' : 
                        'bg-[#C5A059]/20 text-[#C5A059]'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col min-w-[80px]">
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1.5">Date</p>
                    <span className="text-xs font-bold tracking-wide">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="flex flex-col text-left md:text-right min-w-[80px]">
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1.5">Total</p>
                    <span className="text-xl font-black tracking-widest">₹{order.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Milestones Tracker */}
              {order.status?.toLowerCase() !== "cancelled" ? (
                <div className="px-6 md:px-16 lg:px-24 pb-10 pt-10 bg-gray-50/50">
                  <div className="relative">
                    {/* Background Line */}
                    <div className="absolute top-1/2 left-0 w-full h-[3px] bg-gray-200 -translate-y-1/2 rounded-full" />
                    
                    {/* Active Progress Line */}
                    <div 
                      className="absolute top-1/2 left-0 h-[3px] bg-green-500 -translate-y-1/2 rounded-full transition-all duration-1000 ease-out" 
                      style={{ 
                        width: `${(Math.max(0, MILESTONES.findIndex(m => m.toLowerCase() === order.status?.toLowerCase()))) / (MILESTONES.length - 1) * 100}%` 
                      }} 
                    />

                    {/* Milestone Dots */}
                    <div className="relative flex justify-between">
                      {MILESTONES.map((m, idx) => {
                        const currentIdx = MILESTONES.findIndex(milestone => milestone.toLowerCase() === order.status?.toLowerCase());
                        const isCompleted = currentIdx >= idx;
                        const isCurrent = order.status?.toLowerCase() === m.toLowerCase();
                        
                        let Icon = Package;
                        if (m === "Processing") Icon = Cog;
                        if (m === "Shipped") Icon = Truck;
                        if (m === "In Transit") Icon = Plane;
                        if (m === "Out for Delivery") Icon = Bike;
                        if (m === "Delivered") Icon = CheckSquare;

                        return (
                          <div key={m} className="flex flex-col items-center">
                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-500 z-10 ${
                              isCompleted 
                                ? "bg-green-50 border-2 border-green-500 text-green-600" 
                                : "bg-white border-2 border-gray-100 text-gray-300"
                            } ${isCurrent ? "ring-4 ring-green-500/20" : ""}`}>
                              <Icon size={16} />
                            </div>
                            <span className={`absolute mt-12 text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-center whitespace-nowrap transition-colors duration-500 ${
                              isCompleted ? "text-green-600" : "text-gray-400"
                            }`}>
                              {m}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* Cancelled Order Tracker with Reason Beside It */
                <div className="px-6 md:px-12 lg:px-16 pb-10 pt-10 bg-gray-50/50 border-b border-brand/5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    {/* Progress Bar (2 Columns on Medium and Large screens) */}
                    <div className="md:col-span-2 relative pr-0 md:pr-8 py-4">
                      {/* Background Line */}
                      <div className="absolute top-1/2 left-0 w-full h-[3px] bg-gray-200 -translate-y-1/2 rounded-full" />
                      
                      {/* Active Progress Line (Red/Rose for cancellation) */}
                      <div 
                        className="absolute top-1/2 left-0 h-[3px] bg-rose-500 -translate-y-1/2 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: "100%" }} 
                      />

                      {/* Milestone Dots */}
                      <div className="relative flex justify-between">
                        {/* Milestone 1: Order Placed */}
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-rose-50 border-2 border-rose-500 text-rose-600 z-10">
                            <Package size={16} />
                          </div>
                          <span className="absolute mt-12 text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-center whitespace-nowrap text-rose-600">
                            Order Placed
                          </span>
                        </div>

                        {/* Milestone 2: Order Cancelled */}
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-rose-50 border-2 border-rose-500 text-rose-600 z-10 ring-4 ring-rose-500/20">
                            <XCircle size={16} />
                          </div>
                          <span className="absolute mt-12 text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-center whitespace-nowrap text-rose-600">
                            Order Cancelled
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Cancellation Details / Reason Card (1 Column on Medium and Large screens) */}
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 shadow-xs">
                      <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-0.5">Cancellation Details</p>
                        <p className="text-xs text-rose-800 font-bold leading-relaxed break-words">
                          {order.cancelReason && order.cancelReason.toLowerCase() !== "cancelled by customer"
                            ? `Order Cancelled by Admin - ${order.cancelReason}`
                            : "Order Cancelled by Customer"}
                        </p>
                        <p className="text-[9px] text-rose-700/80 font-medium mt-1 leading-relaxed">
                          A refund will be initiated if payment was captured. Amount will be credited within 7 to 9 business days.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-6 md:px-8 md:py-8 bg-white">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Items */}
                  <div>
                    <h4 className="text-[10px] font-black text-brand/30 uppercase tracking-[0.2em] mb-4">Items Purchased</h4>
                    <div className="space-y-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex flex-col sm:flex-row gap-4 items-start p-4 bg-gray-50/50 rounded-2xl border border-brand/5 shadow-sm">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#F9F6EE] rounded-xl overflow-hidden flex-shrink-0 relative group/img">
                            {item.productImage ? (
                              <img 
                                src={item.productImage} 
                                alt={item.productName} 
                                className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "";
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <ImageIcon size={20} />
                              </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center text-gray-200 -z-10 bg-gray-50">
                              <ImageIcon size={20} />
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0 w-full flex flex-col justify-between h-full">
                            <div>
                              <h5 className="text-[14px] font-bold text-gray-900 leading-snug">{item.productName}</h5>
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                                Qty: {item.quantity} • {item.size}
                              </p>
                            </div>
                            <div className="text-left mt-2">
                              <span className="text-sm font-black text-brand tracking-widest">₹{(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Address and Actions */}
                  <div className="flex flex-col justify-between h-full">
                    <div>
                      <h4 className="text-[10px] font-black text-brand/30 uppercase tracking-[0.2em] mb-4">Delivery Details</h4>
                      
                      {/* Address Card */}
                      <div className="flex gap-3 p-5 bg-white rounded-2xl border border-brand/5 shadow-sm mb-4">
                        <MapPin size={18} className="text-[#C5A059] flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-brand font-medium leading-relaxed italic">
                            "{order.shippingAddress || "No address provided"}"
                          </p>
                          <div className="mt-4 pt-4 border-t border-brand/5 grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[9px] font-black text-brand/30 uppercase tracking-widest mb-1">Customer Phone</p>
                              <p className="text-xs text-brand font-bold">{order.customerPhone || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-brand/30 uppercase tracking-widest mb-1">Mode of Payment</p>
                              <p className="text-xs text-brand font-bold">{order.paymentId ? "Online Payment" : "Prepaid"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions & Notes */}
                    <div className="mt-4">
                      {["order placed", "processing"].includes(order.status?.toLowerCase() || "") && (
                        <div className="space-y-4">
                          {confirmingCancelId === order.id ? (
                            <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                              <span className="text-xs font-bold text-red-600">Are you sure you want to cancel?</span>
                              <div className="flex gap-2 w-full sm:w-auto">
                                <button 
                                  disabled={isCancelling}
                                  onClick={() => handleCancelOrder(order.id)}
                                  className="flex-1 sm:flex-none px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-[10px] tracking-widest uppercase hover:bg-red-700 transition-all flex justify-center"
                                >
                                  {isCancelling ? <Loader2 size={14} className="animate-spin" /> : "Yes, Cancel"}
                                </button>
                                <button 
                                  disabled={isCancelling}
                                  onClick={() => setConfirmingCancelId(null)}
                                  className="flex-1 sm:flex-none px-4 py-2 bg-white text-gray-600 border border-gray-200 rounded-xl font-bold text-[10px] tracking-widest uppercase hover:bg-gray-50 transition-all"
                                >
                                  No
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setConfirmingCancelId(order.id)}
                              className="w-full py-3.5 bg-white border-2 border-red-100 text-red-500 rounded-xl font-bold text-xs transition-all shadow-sm uppercase tracking-widest hover:bg-red-50 flex items-center justify-center gap-2"
                            >
                              <XCircle size={16} />
                              Cancel Order
                            </button>
                          )}
                        </div>
                      )}
                      
                      <div className="mt-4 p-4 bg-brand/5 rounded-xl border border-brand/5">
                        <p className="text-[10px] font-bold text-brand/60 leading-relaxed">
                          <span className="text-brand font-black uppercase tracking-widest">NOTE: </span> 
                          Once shipping started you can't cancel the order. NO COD and No Return.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>


              </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-[#1B3022] text-[#C5A059] px-8 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 font-bold text-xs animate-in fade-in slide-in-from-bottom-5 duration-300 border border-[#C5A059]/20">
          <CheckCircle2 size={16} />
          <span className="uppercase tracking-widest">{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
