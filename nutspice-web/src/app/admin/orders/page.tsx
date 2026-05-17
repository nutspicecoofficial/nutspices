"use client";

import React, { useEffect, useState } from "react";
import { 
  ShoppingBag, 
  Search, 
  Calendar, 
  User, 
  MapPin, 
  Package,
  ChevronRight,
  Loader2,
  Clock,
  CheckCircle2,
  Box,
  CheckSquare,
  XCircle,
  FileText,
  ChevronDown
} from "lucide-react";

type OrderItem = {
  id: number;
  productName: string;
  quantity: number;
  price: number;
  size: string;
  customizations: any;
};

type Order = {
  id: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  shippingAddress: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate]);

  useEffect(() => {
    async function fetchOrders() {
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
    }
    fetchOrders();
  }, []);

  const getStatusCount = (status: string) => {
    return orders.filter(o => o.status.toLowerCase() === status.toLowerCase()).length;
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toString().includes(searchTerm) ||
      order.status.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesDate = true;
    if (startDate || endDate) {
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (orderDate < start) matchesDate = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);
        if (orderDate > end) matchesDate = false;
      }
    }

    return matchesSearch && matchesDate;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const statusCards = [
    { label: "PENDING", count: getStatusCount("pending"), icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "CONFIRMED", count: getStatusCount("confirmed"), icon: CheckCircle2, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "PROCESSING", count: getStatusCount("processing"), icon: Box, color: "text-indigo-500", bg: "bg-indigo-50" },
    { label: "COMPLETED", count: getStatusCount("delivered") + getStatusCount("completed"), icon: CheckSquare, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "CANCELLED", count: getStatusCount("cancelled"), icon: XCircle, color: "text-rose-500", bg: "bg-rose-50" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-[#C5A059] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-6">
        <div className="flex-1">
          <h1 className="text-4xl font-playfair font-bold text-[#1B3022] mb-1">Order Fulfillment</h1>
          <p className="text-[#C5A059] text-sm font-medium tracking-wide">
            Track and manage customer purchases and custom fits.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="flex gap-2 w-full sm:w-auto">
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 px-3 py-3 bg-white border border-brand/10 rounded-xl shadow-sm focus:outline-none focus:border-[#C5A059] transition-all text-brand text-xs font-medium cursor-pointer"
              title="Start Date"
            />
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 px-3 py-3 bg-white border border-brand/10 rounded-xl shadow-sm focus:outline-none focus:border-[#C5A059] transition-all text-brand text-xs font-medium cursor-pointer"
              title="End Date"
            />
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand/30" size={18} />
            <input 
              type="text" 
              placeholder="Search order # or mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-brand/10 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]/10 focus:border-[#C5A059] transition-all text-brand text-sm font-medium placeholder:text-brand/20"
            />
          </div>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {statusCards.map((status) => {
          const Icon = status.icon;
          return (
            <div key={status.label} className="bg-white rounded-2xl p-4 border border-brand/5 shadow-sm hover:shadow-md transition-shadow group cursor-default">
              <div className="flex items-start justify-between mb-3">
                <span className="text-[9px] font-black tracking-[0.15em] text-brand/30 group-hover:text-brand transition-colors uppercase">{status.label}</span>
                <div className={`p-2 rounded-lg ${status.bg} ${status.color}`}>
                  <Icon size={14} />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-brand">{status.count}</span>
                <span className="text-[9px] font-bold text-brand/30 uppercase tracking-widest">Orders</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {paginatedOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-brand/5 shadow-sm">
            <h2 className="text-xl font-playfair font-bold text-brand mb-2">No results found</h2>
            <p className="text-brand/40 text-sm font-medium">Try searching with a different term or date range.</p>
          </div>
        ) : (
          paginatedOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-brand/5 shadow-sm overflow-hidden hover:shadow-md transition-all">
              <div 
                className="p-4 flex items-center justify-between cursor-pointer group"
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-[#1B3022]/5 p-3 rounded-xl group-hover:bg-[#C5A059] group-hover:text-white transition-colors">
                    <FileText size={20} className="text-[#C5A059] group-hover:text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-lg font-bold text-brand">Order <span className="text-brand/30 font-medium">#00{order.id}</span></h3>
                      <span className="px-2 py-0.5 bg-brand/5 border border-brand/10 text-[8px] font-black uppercase tracking-widest text-brand/60 rounded-full">
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-brand/40">
                      Placed on {new Date(order.createdAt).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[8px] font-black text-brand/20 uppercase tracking-widest mb-0.5">Amount</p>
                    <p className="text-xl font-bold text-brand font-sans">₹{order.totalAmount.toLocaleString()}</p>
                  </div>
                  <div className={`p-1.5 rounded-lg bg-brand/5 text-brand/30 transition-transform ${expandedOrder === order.id ? 'rotate-180' : ''}`}>
                    <ChevronDown size={18} />
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedOrder === order.id && (
                <div className="px-6 pb-6 pt-1 border-t border-brand/5 bg-brand/[0.005]">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
                    <div>
                      <h4 className="text-[9px] font-black text-brand/30 uppercase tracking-[0.2em] mb-4">Items Purchased</h4>
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-brand/5 shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-brand/5 rounded-lg flex items-center justify-center">
                                <Package size={14} className="text-brand/30" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-brand">{item.productName}</p>
                                <p className="text-[9px] font-bold text-brand/40 uppercase tracking-widest">Qty: {item.quantity} • {item.size}</p>
                              </div>
                            </div>
                            <p className="text-xs font-bold text-brand font-sans">₹{item.price * item.quantity}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex flex-col justify-between">
                      <div>
                        <h4 className="text-[9px] font-black text-brand/30 uppercase tracking-[0.2em] mb-4">Delivery Address</h4>
                        <div className="flex gap-3 p-4 bg-white rounded-2xl border border-brand/5 shadow-sm">
                          <MapPin size={16} className="text-[#C5A059] shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            {/* Scrollable & Wrapping Address Container */}
                            <div className="max-h-24 overflow-y-auto pr-2 custom-scrollbar">
                              <p className="text-xs text-brand font-medium leading-relaxed italic break-words">
                                "{order.shippingAddress}"
                              </p>
                            </div>
                            <div className="mt-3 pt-3 border-t border-brand/5">
                              <p className="text-[8px] font-black text-brand/30 uppercase tracking-widest mb-0.5">Customer Phone</p>
                              <p className="text-xs text-brand font-bold">{order.customerPhone}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-6">
                        <button className="flex-1 py-3 bg-[#1B3022] hover:bg-brand text-white rounded-xl font-bold text-[10px] transition-all shadow-md uppercase tracking-widest">
                          Update Status
                        </button>
                        <button className="px-4 py-3 border border-brand/10 hover:bg-brand/5 text-brand rounded-xl font-bold text-[10px] transition-all uppercase tracking-widest">
                          Invoice
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 bg-white p-4 rounded-2xl border border-brand/5 shadow-sm">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-xs font-bold text-brand uppercase tracking-widest hover:bg-brand/5 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          >
            Previous
          </button>
          <div className="text-xs font-black text-brand/50 uppercase tracking-widest">
            Page {currentPage} of {totalPages}
          </div>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-xs font-bold text-brand uppercase tracking-widest hover:bg-brand/5 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}


