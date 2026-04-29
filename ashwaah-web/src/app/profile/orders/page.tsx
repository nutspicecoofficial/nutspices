"use client";

import React, { useEffect, useState } from "react";
import { ShoppingBag, Loader2, Package, CheckCircle2, Clock, Ruler, ChevronRight, XCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface OrderItem {
  id: number;
  productName: string;
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
  const [toast, setToast] = useState<string | null>(null);

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

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm("Are you sure you want to cancel this bespoke order? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/profile/orders/${orderId}/cancel`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (data.success) {
        setToast("Order cancelled successfully");
        fetchOrders();
      } else {
        setToast(data.error || "Failed to cancel order");
      }
    } catch (error) {
      console.error("Cancellation error:", error);
      setToast("Something went wrong");
    } finally {
      setTimeout(() => setToast(null), 3000);
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
        <div className="space-y-10">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-[2.5rem] border border-brand/5 shadow-xl overflow-hidden hover:shadow-2xl transition-all group">
              <div className="p-6 md:p-8 bg-[#1B3022] flex flex-col md:flex-row md:items-center justify-between border-b border-brand/5 gap-6 text-white">
                <div className="flex items-center space-x-6">
                  <div className="p-4 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl text-white group-hover:scale-110 transition-transform">
                    <Package size={24} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Order ID</p>
                      <span className="text-xs font-bold text-white/40 uppercase tracking-widest px-2.5 py-1 bg-white/5 rounded-full border border-white/5">#AS-{order.id}</span>
                    </div>
                    <h4 className="text-xl font-bold text-white">Ashwaah Custom Fit</h4>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 md:gap-12">
                  <div className="min-w-[120px]">
                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Status</p>
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm border ${
                      order.status === 'delivered' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 
                      order.status === 'cancelled' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 
                      'bg-[#C5A059]/20 text-[#C5A059] border-[#C5A059]/30'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="min-w-[100px]">
                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Placed On</p>
                    <span className="text-xs font-bold text-white">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="text-right min-w-[100px]">
                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Total</p>
                    <span className="text-xl font-black text-white tracking-tighter">₹{order.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Milestones Tracker */}
              {order.status !== "cancelled" && (
                <div className="px-12 md:px-32 lg:px-48 pb-12 pt-4">
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
                  <div key={item.id} className="flex flex-col md:flex-row gap-6 items-start pb-6 border-b border-brand/5 last:border-0 last:pb-0">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h5 className="text-base font-bold text-brand">{item.productName}</h5>
                        
                        {/* Compact Cancel Button Moved Here */}
                        {idx === 0 && ["pending", "processing", "confirmed"].includes(order.status) && (
                          <button 
                            onClick={() => handleCancelOrder(order.id)}
                            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-all group/cancel"
                          >
                            <XCircle size={14} className="group-hover/cancel:rotate-90 transition-transform duration-300" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Cancel</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 mb-4">
                        <span className="text-xs font-medium text-brand/40 uppercase tracking-widest">Size: {item.size}</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-brand/10"></div>
                        <span className="text-xs font-medium text-brand/40 uppercase tracking-widest">Qty: {item.quantity}</span>
                      </div>
                      
                      {item.customizations && item.customizations.measurements && Object.keys(item.customizations.measurements).length > 0 && (
                        <div className="bg-brand/5 rounded-2xl p-4 border border-brand/5">
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
                    </div>
                      <div className="text-right self-center">
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
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-[#1B3022] text-[#C5A059] px-8 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 font-bold text-xs animate-in fade-in slide-in-from-bottom-5 duration-300 border border-[#C5A059]/20">
          <CheckCircle2 size={16} />
          <span className="uppercase tracking-widest">{toast}</span>
        </div>
      )}
    </div>
  );
}
