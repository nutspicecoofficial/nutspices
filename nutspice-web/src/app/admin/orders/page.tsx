"use client";

import React, { useEffect, useState } from "react";
import PaymentDetailsCard from "@/components/admin/PaymentDetailsCard";
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
  ChevronDown,
  Truck
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
  paymentMode?: string | null;
  paymentStatus?: string | null;
  amountPaid?: number | null;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<{ [key: number]: string }>({});
  const [statusFilter, setStatusFilter] = useState("all");
  const itemsPerPage = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate, statusFilter]);

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

  const handleUpdateStatus = async (orderId: number) => {
    const newStatus = selectedStatus[orderId];
    if (!newStatus || newStatus === orders.find(o => o.id === orderId)?.status) return;
    
    setUpdatingStatusId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const getStatusCount = (status: string) => {
    return orders.filter(o => o.status.toLowerCase() === status.toLowerCase()).length;
  };

  const getStatusBadgeStyle = (status: string) => {
    const s = status.toLowerCase();
    if (s === "order placed" || s === "pending") return "bg-amber-50 border-amber-200 text-amber-600";
    if (s === "processing" || s === "confirmed") return "bg-indigo-50 border-indigo-200 text-indigo-600";
    if (s === "shipped") return "bg-blue-50 border-blue-200 text-blue-600";
    if (s === "in transit" || s === "on the way") return "bg-purple-50 border-purple-200 text-purple-600";
    if (s === "out for delivery") return "bg-pink-50 border-pink-200 text-pink-600";
    if (s === "delivered" || s === "completed") return "bg-emerald-50 border-emerald-200 text-emerald-600";
    if (s === "cancelled") return "bg-rose-50 border-rose-200 text-rose-600";
    return "bg-brand/5 border-brand/10 text-brand/60";
  };

  const getNormalizedStatus = (status: string) => {
    const s = status.toLowerCase();
    if (s === "order placed" || s === "pending") return "Order Placed";
    if (s === "processing" || s === "confirmed") return "Processing";
    if (s === "shipped") return "Shipped";
    if (s === "in transit" || s === "on the way") return "In Transit";
    if (s === "out for delivery") return "Out for Delivery";
    if (s === "delivered" || s === "completed") return "Delivered";
    if (s === "cancelled") return "Cancelled";
    return status;
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toString().includes(searchTerm) ||
      order.status.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatusFilter = statusFilter === "all" || getNormalizedStatus(order.status).toLowerCase() === statusFilter.toLowerCase();
    
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

    return matchesSearch && matchesDate && matchesStatusFilter;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const statusCards = [
    { label: "PLACED", count: getStatusCount("Order Placed") + getStatusCount("pending"), icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "PROCESSING", count: getStatusCount("Processing"), icon: Box, color: "text-indigo-500", bg: "bg-indigo-50" },
    { label: "SHIPPED", count: getStatusCount("Shipped") + getStatusCount("In Transit") + getStatusCount("Out for Delivery"), icon: Truck, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "DELIVERED", count: getStatusCount("Delivered"), icon: CheckSquare, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "CANCELLED", count: getStatusCount("Cancelled"), icon: XCircle, color: "text-rose-500", bg: "bg-rose-50" },
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
          <div className="relative w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-4 pr-10 py-3 bg-white border border-brand/10 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]/10 focus:border-[#C5A059] transition-all text-brand text-xs font-bold uppercase tracking-widest cursor-pointer appearance-none"
            >
              <option value="all">All Statuses</option>
              <option value="Order Placed">Order Placed</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="In Transit">In Transit</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-brand/30 pointer-events-none" size={16} />
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
                      <span className={`px-2 py-0.5 border text-[8px] font-black uppercase tracking-widest rounded-full ${getStatusBadgeStyle(order.status)}`}>
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
                    <div className="flex flex-col gap-6">
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

                      <PaymentDetailsCard
                        paymentMode={order.paymentMode}
                        paymentStatus={order.paymentStatus}
                        amountPaid={order.amountPaid}
                        razorpayOrderId={order.razorpayOrderId}
                        razorpayPaymentId={order.razorpayPaymentId}
                      />
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
                        <select
                          className="flex-1 py-3 px-3 bg-white border border-brand/10 text-brand rounded-xl font-bold text-xs shadow-sm focus:outline-none focus:border-[#C5A059] transition-all disabled:opacity-50 disabled:bg-gray-50"
                          value={selectedStatus[order.id] || getNormalizedStatus(order.status)}
                          onChange={(e) => setSelectedStatus({ ...selectedStatus, [order.id]: e.target.value })}
                          disabled={getNormalizedStatus(order.status) === "Cancelled" || getNormalizedStatus(order.status) === "Delivered"}
                        >
                          {(() => {
                            const STATUS_ORDER = ["Order Placed", "Processing", "Shipped", "In Transit", "Out for Delivery", "Delivered"];
                            const currentIdx = STATUS_ORDER.indexOf(getNormalizedStatus(order.status));
                            
                            return (
                              <>
                                {STATUS_ORDER.map((status, idx) => (
                                  <option key={status} value={status} disabled={currentIdx !== -1 && idx < currentIdx}>
                                    {status}
                                  </option>
                                ))}
                                <option value="Cancelled">Cancelled</option>
                              </>
                            );
                          })()}
                        </select>
                        <button 
                          onClick={() => handleUpdateStatus(order.id)}
                          disabled={updatingStatusId === order.id || (selectedStatus[order.id] || getNormalizedStatus(order.status)) === getNormalizedStatus(order.status) || getNormalizedStatus(order.status) === "Cancelled" || getNormalizedStatus(order.status) === "Delivered"}
                          className="px-6 py-3 bg-[#1B3022] hover:bg-brand text-white rounded-xl font-bold text-[10px] transition-all shadow-md uppercase tracking-widest disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                        >
                          {updatingStatusId === order.id ? <Loader2 size={14} className="animate-spin" /> : "Update Status"}
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


