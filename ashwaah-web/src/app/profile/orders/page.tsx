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
  color: string;
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
        <p className="text-[10px] font-black text-brand/40 uppercase tracking-[0.2em]">Loading your wardrobe...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-playfair font-bold text-brand mb-2">My Orders</h1>
          <p className="text-brand/40 text-xs font-bold uppercase tracking-widest">Track your bespoke purchases</p>
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
          <p className="text-brand/60 text-sm mb-10 max-w-xs mx-auto">Your customized collection will appear here once you place your first order.</p>
          <Link href="/" className="inline-block bg-brand text-white px-8 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-brand-hover shadow-lg">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-[2rem] border border-brand/5 shadow-lg overflow-hidden hover:shadow-xl transition-all group">
              <div className="p-4 md:p-6 bg-[#1B3022] flex flex-col md:flex-row md:items-center justify-between border-b border-brand/5 gap-4 text-white">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl text-white group-hover:scale-110 transition-transform">
                    <Package size={20} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-3 mb-0.5">
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Order ID</p>
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-2 py-0.5 bg-white/5 rounded-full border border-white/5">#AS-{order.id}</span>
                    </div>
                    <h4 className="text-lg font-bold text-white leading-tight">Ashwaah Custom Fit</h4>
                  </div>
                </div>

                <div className="flex flex-wrap items-start gap-4 md:gap-8">
                  <div className="flex flex-col justify-center min-w-[100px]">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Status</p>
                    <div className="flex items-center h-6">
                      <span className={`inline-flex items-center px-3 py-0 h-6 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm border ${
                        order.status === 'delivered' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 
                        order.status === 'cancelled' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 
                        'bg-[#C5A059]/20 text-[#C5A059] border-[#C5A059]/30'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center min-w-[80px]">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Date</p>
                    <div className="flex items-center h-6">
                      <span className="text-[10px] font-bold text-white">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center text-right min-w-[80px]">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Total</p>
                    <div className="flex items-center justify-end h-6">
                      <span className="text-lg font-black text-white tracking-tighter">₹{order.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Milestones Tracker */}
              {order.status !== "cancelled" && (
                <div className="px-10 md:px-24 lg:px-32 pb-8 pt-4">
                  <div className="relative">
                    {/* Background Line */}
                    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-brand/10 -translate-y-1/2 rounded-full" />
                    
                    {/* Active Progress Line */}
                    <div 
                      className="absolute top-1/2 left-0 h-[2px] bg-[#C5A059] -translate-y-1/2 rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(197,160,89,0.4)]" 
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
                            <div className={`w-2 h-2 rounded-full border-2 transition-all duration-500 ${
                              isCompleted 
                                ? "bg-[#C5A059] border-[#C5A059] scale-150" 
                                : "bg-white border-brand/20"
                            } ${isCurrent ? "animate-pulse ring-4 ring-[#C5A059]/20" : ""}`} />
                            <span className={`absolute mt-6 text-[10px] font-bold uppercase tracking-[0.15em] text-center whitespace-nowrap transition-colors duration-500 ${
                              isCompleted ? "text-brand" : "text-brand/20"
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

              <div className="p-6 md:px-8 md:py-6 space-y-6">
                {order.items.map((item, idx) => (
                  <div key={item.id} className="flex flex-row gap-6 items-start pb-6 border-b border-brand/5 last:border-0 last:pb-0">
                    <div className="w-24 h-32 bg-brand/5 rounded-2xl overflow-hidden flex-shrink-0 border border-brand/5 shadow-sm relative group/img">
                      {item.productImage ? (
                        <img 
                          src={item.productImage} 
                          alt={item.productName} 
                          className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = ""; // Clear src to show fallback
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-brand/20">
                          <ImageIcon size={24} />
                        </div>
                      )}
                      {/* Fallback for broken images */}
                      <div className="absolute inset-0 flex items-center justify-center text-brand/10 -z-10 bg-brand/5">
                        <ImageIcon size={24} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h5 className="text-base font-bold text-brand">{item.productName}</h5>
                        
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

                      <div className="flex items-center space-x-3 mb-4">
                        <span className="text-xs font-medium text-brand/40 uppercase tracking-widest">Size: {item.size}</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-brand/10"></div>
                        <span className="text-xs font-medium text-brand/40 uppercase tracking-widest">Qty: {item.quantity}</span>
                      </div>
                      
                      {item.customizations && item.customizations.measurements && Object.keys(item.customizations.measurements).length > 0 && (
                        <div className="bg-brand/5 rounded-2xl p-4 border border-brand/5 mb-4">
                          <div className="flex items-center space-x-2 mb-3">
                            <Ruler size={12} className="text-[#C5A059]" />
                            <span className="text-[9px] font-black text-brand uppercase tracking-widest">Your Custom Fit (Inches)</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {Object.entries(item.customizations.measurements).map(([key, val]) => (
                              <div key={key}>
                                <p className="text-[8px] font-bold text-brand/40 uppercase tracking-tighter mb-0.5">{key}</p>
                                <p className="text-[10px] font-black text-brand">{val}"</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Shipping Address Moved Here */}
                      {idx === 0 && (
                        <div className="mt-4">
                          <div className="flex items-start space-x-3 px-4 py-3 rounded-2xl bg-brand/5 border border-brand/5 w-full md:w-3/4">
                            <MapPin size={14} className="text-[#C5A059] mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-[9px] font-black uppercase tracking-widest mb-1 text-brand/40">Delivery Address</p>
                              <p className="text-[11px] font-bold text-brand leading-relaxed">
                                {order.shippingAddress || "No address provided"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                      <div className="text-right self-center min-w-[80px]">
                        <span className="text-sm font-black text-brand">₹{item.price.toLocaleString()}</span>
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
                          <p className="text-[9px] font-medium opacity-70">A refund will be initiated if payment was captured.</p>
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
