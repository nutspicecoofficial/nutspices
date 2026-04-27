"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  ShoppingBag, 
  Package, 
  TrendingUp, 
  ArrowUpRight, 
  Loader2,
  Sparkles
} from "lucide-react";

type Stats = {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/stats");
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard stats");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-brand-accent animate-spin" />
      </div>
    );
  }

  const statCards = [
    { 
      label: "Total Customers", 
      value: stats?.totalUsers || 0, 
      icon: Users, 
      color: "bg-blue-500", 
      bg: "bg-blue-50",
      trend: "+12% this month"
    },
    { 
      label: "Total Orders", 
      value: stats?.totalOrders || 0, 
      icon: ShoppingBag, 
      color: "bg-brand-accent", 
      bg: "bg-[#C5A059]/10",
      trend: "+5% from yesterday"
    },
    { 
      label: "Active Products", 
      value: stats?.totalProducts || 0, 
      icon: Package, 
      color: "bg-green-500", 
      bg: "bg-green-50",
      trend: "Inventory stable"
    },
  ];

  return (
    <div className="p-10">
      <div className="mb-10">
        <h1 className="text-4xl font-playfair font-bold text-brand">Dashboard Overview</h1>
        <p className="mt-2 text-brand/60 font-medium tracking-tight flex items-center">
          <Sparkles size={16} className="text-[#C5A059] mr-2" />
          Welcome back to the Ashwaah management hub.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-[2rem] p-8 shadow-sm border border-brand/5 hover:shadow-xl hover:-translate-y-1 transition-all group">
              <div className="flex items-start justify-between mb-6">
                <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color.replace('bg-', 'text-')} group-hover:scale-110 transition-transform`}>
                  <Icon size={24} />
                </div>
                <div className="flex items-center text-xs font-bold text-green-500 bg-green-50 px-2.5 py-1 rounded-full uppercase tracking-widest">
                  <TrendingUp size={12} className="mr-1" />
                  Live
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-brand/40 uppercase tracking-[0.2em]">{stat.label}</h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-5xl font-playfair font-bold text-brand">{stat.value}</span>
                  <ArrowUpRight size={20} className="text-[#C5A059] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <p className="mt-6 text-[10px] font-bold text-brand/40 uppercase tracking-widest border-t border-brand/5 pt-4">
                {stat.trend}
              </p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity / Quick Actions Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-brand/5">
          <h3 className="text-xl font-playfair font-bold text-brand mb-6">System Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-brand/5 rounded-2xl">
              <span className="text-sm font-bold text-brand/60 uppercase tracking-widest">Database</span>
              <span className="flex items-center text-xs font-bold text-green-600 bg-white px-3 py-1 rounded-full shadow-sm">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                Healthy
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-brand/5 rounded-2xl">
              <span className="text-sm font-bold text-brand/60 uppercase tracking-widest">Auth Service</span>
              <span className="flex items-center text-xs font-bold text-green-600 bg-white px-3 py-1 rounded-full shadow-sm">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                Healthy
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#1B3022] rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#C5A059]/10 rounded-full blur-3xl group-hover:bg-[#C5A059]/20 transition-colors"></div>
          <h3 className="text-xl font-playfair font-bold text-white mb-6 relative z-10">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4 relative z-10">
            <button className="bg-white/5 hover:bg-white/10 p-4 rounded-2xl transition-all text-left">
              <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest mb-1">Products</p>
              <p className="text-sm font-bold text-white">Add New</p>
            </button>
            <button className="bg-white/5 hover:bg-white/10 p-4 rounded-2xl transition-all text-left">
              <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest mb-1">Menus</p>
              <p className="text-sm font-bold text-white">Manage Nav</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
