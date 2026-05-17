"use client";

import React, { useEffect, useState } from "react";
import { ShoppingBag, Loader2, Package, CheckCircle2, Clock, Ruler, XCircle, AlertTriangle, Image as ImageIcon, MapPin, Check, X } from "lucide-react";
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
  items: OrderItem[];
}

const MILESTONES = [
  "confirmed",
  "shipped",
  "on the way",
  "out for delivery",
  "delivered"
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
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden transition-all duration-500 group">
              <div className="p-5 md:p-6 bg-brand flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/10 rounded-2xl text-white">
                    <Package size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black tracking-widest uppercase mb-1">Order #AS-{order.id}</h4>
                    <p className="text-xs font-medium text-white/70">NutspiceCo Selection</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 md:gap-10">
                  <div className="flex flex-col min-w-[80px]">
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1.5">Status</p>
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm ${
                        order.status === 'delivered' ? 'bg-green-500/20 text-green-300' : 
                        order.status === 'cancelled' ? 'bg-red-500/20 text-red-300' : 
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
              {order.status !== "cancelled" && (
                <div className="px-6 md:px-16 lg:px-24 pb-10 pt-10 bg-gray-50/50">
                  <div className="relative">
                    {/* Background Line */}
                    <div className="absolute top-1/2 left-0 w-full h-[3px] bg-gray-200 -translate-y-1/2 rounded-full" />
                    
                    {/* Active Progress Line */}
                    <div 
                      className="absolute top-1/2 left-0 h-[3px] bg-brand -translate-y-1/2 rounded-full transition-all duration-1000 ease-out" 
                      style={{ 
                        width: `${(MILESTONES.indexOf(order.status) / (MILESTONES.length - 1)) * 100}%` 
                      }} 
                    />

                    {/* Milestone Dots */}
                    <div className="relative flex justify-between">
                      {MILESTONES.map((m, idx) => {
                        const isCompleted = MILESTONES.indexOf(order.status) >= idx;
                        const isCurrent = order.status === m;
                        return (
                          <div key={m} className="flex flex-col items-center">
                            <div className={`w-3.5 h-3.5 rounded-full border-[3px] transition-all duration-500 ${
                              isCompleted 
                                ? "bg-white border-brand scale-125" 
                                : "bg-white border-gray-200"
                            } ${isCurrent ? "ring-4 ring-brand/10" : ""}`} />
                            <span className={`absolute mt-6 text-[9px] font-bold uppercase tracking-[0.15em] text-center whitespace-nowrap transition-colors duration-500 ${
                              isCompleted ? "text-gray-900" : "text-gray-400"
                            }`}>
                              {m}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="p-6 md:px-8 md:py-8 space-y-8 bg-white">
                {order.items.map((item, idx) => (
                  <div key={item.id} className="flex flex-col sm:flex-row gap-6 items-start pb-8 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-[#F9F6EE] rounded-2xl overflow-hidden flex-shrink-0 relative group/img">
                      {item.productImage ? (
                        <img 
                          src={item.productImage} 
                          alt={item.productName} 
                          className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = ""; // Clear src to show fallback
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <ImageIcon size={24} />
                        </div>
                      )}
                      {/* Fallback for broken images */}
                      <div className="absolute inset-0 flex items-center justify-center text-gray-200 -z-10 bg-gray-50">
                        <ImageIcon size={24} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 gap-2">
                        <h5 className="text-[16px] font-bold text-gray-900 leading-snug pr-4">{item.productName}</h5>
                        
                        {/* Inline Cancel Confirmation */}
                        {idx === 0 && ["pending"].includes(order.status) && (
                          <div className="flex items-center space-x-2">
                            {confirmingCancelId === order.id ? (
                              <div className="flex items-center space-x-2 animate-in fade-in slide-in-from-right-2 duration-300">
                                <span className="text-[8px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-2 py-1 rounded-md">Confirm?</span>
                                <button 
                                  disabled={isCancelling}
                                  onClick={() => handleCancelOrder(order.id)}
                                  className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow-sm flex items-center justify-center"
                                  title="Confirm Cancel"
                                >
                                  {isCancelling ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                </button>
                                <button 
                                  disabled={isCancelling}
                                  onClick={() => setConfirmingCancelId(null)}
                                  className="p-1.5 bg-brand/5 text-brand/40 rounded-lg hover:bg-brand/10 transition-all"
                                  title="Keep Order"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => setConfirmingCancelId(order.id)}
                                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-all group/cancel"
                              >
                                <XCircle size={14} className="group-hover/cancel:rotate-90 transition-transform duration-300" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Cancel</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 mb-4 mt-2">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest bg-gray-50 px-2.5 py-1 rounded-md">Weight: {item.size}</span>
                        <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest bg-gray-50 px-2.5 py-1 rounded-md">Qty: {item.quantity}</span>
                      </div>
                      
                      {/* Shipping Address Moved Here */}
                      {idx === 0 && (
                        <div className="mt-4 bg-gray-50/50 rounded-2xl p-4 w-full sm:w-3/4 flex gap-3 items-start border border-gray-100">
                          <MapPin size={16} className="text-brand flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-gray-400">Delivery Address</p>
                            <p className="text-[12px] font-medium text-gray-700 leading-relaxed">
                              {order.shippingAddress || "No address provided"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                      <div className="text-left sm:text-right self-start sm:self-center min-w-[80px]">
                        <span className="text-lg font-black text-brand tracking-widest">₹{item.price.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}



                  {/* Status Messages */}
                  {order.status === "cancelled" && (
                    <div className="pt-6 border-t border-brand/5">
                      <div className="flex items-center space-x-3 px-6 py-4 rounded-2xl bg-red-50 border border-red-100 text-red-600">
                        <AlertTriangle size={18} />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest">Order Cancelled</p>
                          <p className="text-[9px] font-medium opacity-70">A refund will be initiated if payment was captured. Amount will be credited within 7 to 9 business days.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
          ))}
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
