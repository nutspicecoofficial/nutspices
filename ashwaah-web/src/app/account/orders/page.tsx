"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Package, ShoppingBag, ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function OrdersPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (!data.authenticated) {
          router.push("/login");
        }
      } catch (err) {
        console.error("Auth check failed", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C5A059] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="mb-10 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="p-2 rounded-full bg-white border border-brand/5 hover:border-[#C5A059]/30 transition-all text-brand">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-4xl font-playfair font-bold text-brand">My Orders</h1>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-12 shadow-sm border border-brand/5 min-h-[400px] flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-full bg-brand/5 flex items-center justify-center mb-6">
          <Package className="text-brand/40" size={32} />
        </div>
        <h2 className="text-2xl font-serif font-bold text-brand mb-3">No orders yet</h2>
        <p className="text-brand/60 mb-10 max-w-sm">
          It looks like you haven't placed any orders with Ashwaah yet. Your future boutique collections will appear here.
        </p>
        <Link 
          href="/" 
          className="flex items-center space-x-3 bg-brand text-white px-10 py-4 rounded-2xl font-bold tracking-widest uppercase text-sm hover:bg-brand-hover transition-all shadow-xl"
        >
          <ShoppingBag size={18} />
          <span>Start Shopping</span>
          <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
