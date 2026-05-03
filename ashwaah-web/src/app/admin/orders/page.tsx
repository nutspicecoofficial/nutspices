"use client";

import React, { useEffect, useState } from "react";
import { ShoppingBag, Clock, CheckCircle2, Truck, Loader2, User, Phone, Ruler, ChevronDown, ChevronUp, Sparkles, Scissors, MapPin } from "lucide-react";

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
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  items: OrderItem[];
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const ORDER_STATUSES = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "on the way",
    "out for delivery",
    "delivered",
    "cancelled"
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/admin/orders");
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

  const updateOrderStatus = async (id: number, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
      }
    } catch (error) {
      console.error("Failed to update status", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const statusCounts = {
    pending: orders.filter(o => o.status?.toLowerCase() === "pending").length,
    confirmed: orders.filter(o => o.status?.toLowerCase() === "confirmed").length,
    processing: orders.filter(o => ["processing", "shipped", "on the way", "out for delivery"].includes(o.status?.toLowerCase())).length,
    completed: orders.filter(o => o.status?.toLowerCase() === "delivered").length,
    cancelled: orders.filter(o => o.status?.toLowerCase() === "cancelled").length,
  };

  const filteredOrders = orders.filter(order => {
    const s = searchTerm.toLowerCase();
    return (
      order.id.toString().includes(s) ||
      order.customerPhone?.includes(s) ||
      (order.customerName || "").toLowerCase().includes(s)
    );
  });

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "pending": return "bg-amber-50 text-amber-600 border-amber-100";
      case "confirmed": return "bg-blue-50 text-blue-600 border-blue-100";
      case "processing": return "bg-indigo-50 text-indigo-600 border-indigo-100";
      case "shipped": return "bg-indigo-50 text-indigo-600 border-indigo-100";
      case "on the way": return "bg-cyan-50 text-cyan-600 border-cyan-100";
      case "out for delivery": return "bg-purple-50 text-purple-600 border-purple-100";
      case "delivered": return "bg-green-50 text-green-600 border-green-100";
      case "cancelled": return "bg-red-50 text-red-600 border-red-100";
      default: return "bg-amber-50 text-amber-600 border-amber-100";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="animate-spin text-brand-accent mb-4" size={40} />
        <p className="text-brand/40 font-bold uppercase tracking-widest text-xs">Loading Orders...</p>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-playfair font-bold text-brand">Order Fulfillment</h1>
          <p className="mt-2 text-brand/60 font-medium">Track and manage customer purchases and custom fits.</p>
        </div>

        <div className="relative group min-w-[300px]">
          <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 text-brand/30 group-focus-within:text-[#C5A059] transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search by order # or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-brand/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-brand focus:outline-none focus:ring-4 focus:ring-[#C5A059]/5 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-6 mb-10">
        {[
          { label: "Pending", count: statusCounts.pending, icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
          { label: "Confirmed", count: statusCounts.confirmed, icon: CheckCircle2, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Processing", count: statusCounts.processing, icon: Truck, color: "text-indigo-500", bg: "bg-indigo-50" },
          { label: "Completed", count: statusCounts.completed, icon: ShoppingBag, color: "text-green-500", bg: "bg-green-50" },
          { label: "Cancelled", count: statusCounts.cancelled, icon: ShoppingBag, color: "text-red-500", bg: "bg-red-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white p-6 rounded-3xl border border-brand/5 shadow-sm flex items-center space-x-4">
            <div className={`p-3 rounded-2xl ${s.bg} ${s.color}`}>
              <s.icon size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-brand/40 uppercase tracking-widest">{s.label}</p>
              <p className="text-xl font-bold text-brand">{s.count} Orders</p>
            </div>
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] p-20 shadow-sm border border-brand/5 text-center">
          <div className="w-20 h-20 bg-brand/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag size={40} className="text-brand/20" />
          </div>
          <h3 className="text-2xl font-playfair font-bold text-brand mb-2">{searchTerm ? "No matching orders" : "No orders to display"}</h3>
          <p className="text-brand/60 font-medium max-w-sm mx-auto">
            {searchTerm ? "Adjust your search filters to find what you are looking for." : "When customers start placing orders for their custom-fit apparel, they will appear here."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {filteredOrders.map((order) => {
            const hasBespokeItems = order.items.some(item => item.customizations?.type === "Bespoke" || (item.customizations?.measurements && Object.keys(item.customizations.measurements).length > 0));
            
            return (
            <div key={order.id} className={`rounded-[2rem] border overflow-hidden shadow-sm hover:shadow-md transition-all ${hasBespokeItems ? 'bg-[#F9F6EE] border-[#C5A059]/30 ring-1 ring-[#C5A059]/10' : 'bg-white border-brand/5'}`}>
              {/* Order Header */}
              <div 
                className="p-6 flex flex-col md:flex-row justify-between items-center cursor-pointer"
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
              >
          <div className="flex items-center space-x-6">
            <div className="bg-brand/5 p-4 rounded-2xl">
              <ShoppingBag className="text-brand" size={24} />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <span className="text-lg font-bold text-brand">Order #{order.id}</span>
                {hasBespokeItems && (
                  <div className="flex items-center space-x-1 px-3 py-1 bg-[#C5A059] text-white rounded-full">
                    <Scissors size={10} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Bespoke Order</span>
                  </div>
                )}
                <div className="relative group">
                  <select 
                    value={order.status}
                    disabled={updatingId === order.id}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateOrderStatus(order.id, e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className={`appearance-none px-4 py-1.5 pr-10 rounded-full text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all border outline-none ${getStatusStyles(order.status)} ${updatingId === order.id ? "opacity-50 animate-pulse" : ""}`}
                  >
                    {ORDER_STATUSES.map(s => (
                      <option key={s} value={s} className={getStatusStyles(s)}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={10} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" />
                </div>
              </div>
                    <p className="text-xs text-brand/40 font-medium mt-1">
                      Placed on {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-10 mt-4 md:mt-0">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-brand/40 uppercase tracking-widest mb-1">Amount</p>
                    <p className="text-xl font-bold text-brand">₹{order.totalAmount.toLocaleString()}</p>
                  </div>
                  <div className="p-2 rounded-full bg-brand/5 text-brand/40">
                    {expandedOrder === order.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
              </div>

              {/* Order Details (Expanded) */}
              {expandedOrder === order.id && (
                <div className="border-t border-brand/5 p-8 bg-brand/[0.01]">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Customer Info */}
                    <div className="space-y-6">
                      <h4 className="text-xs font-black text-brand uppercase tracking-widest flex items-center gap-2">
                        <User size={14} className="text-brand-accent" /> Customer Details
                      </h4>
                      <div className="bg-white p-5 rounded-2xl border border-brand/5 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-brand/40 uppercase">Name</span>
                          <span className="text-xs font-black text-brand">{order.customerName || "Guest User"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-brand/40 uppercase">Phone</span>
                          <span className="text-xs font-black text-brand flex items-center gap-1">
                            <Phone size={10} /> {order.customerPhone}
                          </span>
                        </div>
                      </div>

                      {/* Shipping Address */}
                      <div className="space-y-6 pt-4">
                        <h4 className="text-xs font-black text-brand uppercase tracking-widest flex items-center gap-2">
                          <MapPin size={14} className="text-brand-accent" /> Delivery Address
                        </h4>
                        <div className="bg-white p-5 rounded-2xl border border-brand/5">
                          <p className="text-xs font-bold text-brand/70 leading-relaxed">
                            {order.shippingAddress || "No address provided"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="lg:col-span-2 space-y-6">
                      <h4 className="text-xs font-black text-brand uppercase tracking-widest flex items-center gap-2">
                        <Ruler size={14} className="text-brand-accent" /> Customizations & Items
                      </h4>
                      <div className="space-y-4">
                        {order.items.map((item) => (
                          <div key={item.id} className="bg-white p-6 rounded-3xl border border-brand/5 shadow-sm">
                            <div className="flex justify-between items-start mb-6">
                              <div>
                                <h5 className="text-sm font-black text-brand">{item.productName}</h5>
                                <p className="text-[10px] text-brand/40 font-bold mt-1 uppercase tracking-widest">
                                  {item.size} / {item.color} — Qty: {item.quantity}
                                </p>
                              </div>
                              <span className="text-sm font-bold text-brand">₹{item.price.toLocaleString()}</span>
                            </div>

                            {item.customizations && item.customizations.measurements && Object.keys(item.customizations.measurements).length > 0 && (
                              <div className="bg-[#1B3022]/5 rounded-2xl p-5 border border-[#1B3022]/10">
                                <div className="flex items-center space-x-2 mb-4">
                                  <Sparkles size={12} className="text-[#C5A059]" />
                                  <span className="text-[10px] font-black text-[#1B3022] uppercase tracking-[0.2em]">Bespoke Measurements (Inches)</span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  {Object.entries(item.customizations.measurements).map(([key, val]) => (
                                    <div key={key} className="bg-white/80 p-3 rounded-xl border border-[#1B3022]/5">
                                      <p className="text-[8px] font-black text-brand/40 uppercase tracking-widest mb-1">{key}</p>
                                      <p className="text-xs font-black text-brand">{val}"</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {!item.customizations?.measurements && (
                              <div className="py-2 px-4 bg-brand/5 rounded-full inline-block">
                                <p className="text-[10px] font-bold text-brand/40 uppercase tracking-widest">Standard Fit — No Customizations</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}
