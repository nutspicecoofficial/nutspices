"use client";

import React, { useEffect, useState } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Package, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  Loader2,
  FileText,
  Download
} from "lucide-react";

interface MonthlyStats {
  users: number;
  orders: number;
  revenue: number;
  itemsSold: number;
  month: string;
}

export default function ReportsPage() {
  const [data, setData] = useState<{ current: MonthlyStats; lastMonth: MonthlyStats; history: MonthlyStats[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/admin/reports");
      const result = await res.json();
      if (result.success) {
        setData(result);
      }
    } catch (error) {
      console.error("Failed to fetch reports", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="animate-spin text-brand-accent mb-4" size={40} />
        <p className="text-brand/40 font-bold uppercase tracking-widest text-xs">Generating Business Insights...</p>
      </div>
    );
  }

  const calculateTrend = (current: number, last: number) => {
    if (last === 0) return 100;
    return ((current - last) / last) * 100;
  };

  const trends = {
    revenue: calculateTrend(data.current.revenue, data.lastMonth.revenue),
    orders: calculateTrend(data.current.orders, data.lastMonth.orders),
    users: calculateTrend(data.current.users, data.lastMonth.users),
    itemsSold: calculateTrend(data.current.itemsSold, data.lastMonth.itemsSold),
  };

  return (
    <div className="pb-20 px-8 pt-8 font-inter">
      {/* Header section */}
      <div className="mb-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-playfair font-bold text-brand">Business Analytics</h1>
          <p className="mt-2 text-brand/60 font-medium">Deep dive into your shop's performance and growth metrics.</p>
        </div>

        <button className="flex items-center space-x-3 bg-brand text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-brand-hover shadow-xl transition-all active:scale-95">
          <Download size={16} className="text-brand-accent" />
          <span>Export Full Report</span>
        </button>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-16">
        {[
          { label: "Revenue", value: `₹${data.current.revenue.toLocaleString()}`, lastValue: `₹${data.lastMonth.revenue.toLocaleString()}`, trend: trends.revenue, icon: TrendingUp, color: "bg-orange-500" },
          { label: "Items Sold", value: data.current.itemsSold, lastValue: data.lastMonth.itemsSold, trend: trends.itemsSold, icon: Package, color: "bg-green-500" },
          { label: "Orders", value: data.current.orders, lastValue: data.lastMonth.orders, trend: trends.orders, icon: ShoppingBag, color: "bg-[#C5A059]" },
          { label: "New Users", value: data.current.users, lastValue: data.lastMonth.users, trend: trends.users, icon: Users, color: "bg-blue-500" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-brand/5 group relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 ${stat.color}/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:scale-150 transition-transform duration-700`} />
            
            <div className="flex items-center justify-between mb-8">
              <div className={`p-4 rounded-2xl ${stat.color} text-white shadow-lg`}>
                <stat.icon size={20} />
              </div>
              <div className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${stat.trend >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                {stat.trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                <span>{Math.abs(Math.round(stat.trend))}%</span>
              </div>
            </div>

            <p className="text-[10px] font-black text-brand/30 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
            <h3 className="text-3xl font-black text-brand tracking-tighter mb-4">{stat.value}</h3>
            
            <div className="pt-4 border-t border-brand/5 flex items-center justify-between">
              <span className="text-[9px] font-bold text-brand/40 uppercase tracking-widest">Last Month</span>
              <span className="text-[10px] font-black text-brand/60">{stat.lastValue}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Historical Table */}
      <div className="bg-white rounded-[3rem] shadow-sm border border-brand/5 overflow-hidden">
        <div className="p-10 border-b border-brand/5 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-brand/5 rounded-2xl flex items-center justify-center text-brand">
              <Calendar size={24} />
            </div>
            <div>
              <h2 className="text-xl font-playfair font-bold text-brand">Monthly Performance History</h2>
              <p className="text-sm text-brand/40 font-medium tracking-tight">Comparison of last 6 months metrics.</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand/[0.02]">
                <th className="px-10 py-6 text-[10px] font-black text-brand/30 uppercase tracking-[0.2em]">Month</th>
                <th className="px-10 py-6 text-[10px] font-black text-brand/30 uppercase tracking-[0.2em]">Revenue</th>
                <th className="px-10 py-6 text-[10px] font-black text-brand/30 uppercase tracking-[0.2em]">Orders</th>
                <th className="px-10 py-6 text-[10px] font-black text-brand/30 uppercase tracking-[0.2em]">Items Sold</th>
                <th className="px-10 py-6 text-[10px] font-black text-brand/30 uppercase tracking-[0.2em]">New Users</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand/5">
              {data.history.map((month, idx) => (
                <tr key={idx} className="hover:bg-brand/[0.01] transition-colors group">
                  <td className="px-10 py-6">
                    <span className="text-sm font-black text-brand uppercase tracking-widest">{month.month}</span>
                  </td>
                  <td className="px-10 py-6 font-bold text-brand">₹{month.revenue.toLocaleString()}</td>
                  <td className="px-10 py-6">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-bold text-brand/60">{month.orders}</span>
                      <div className="w-20 h-1.5 bg-brand/5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#C5A059] rounded-full" style={{ width: `${Math.min(100, (month.orders / 50) * 100)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6 font-bold text-brand/60">{month.itemsSold}</td>
                  <td className="px-10 py-6">
                    <div className="flex items-center space-x-2">
                      <Users size={14} className="text-blue-400" />
                      <span className="text-sm font-bold text-brand/60">{month.users}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
