"use client";

import { useState, useEffect } from "react";
import { MapPin, Loader2, ChevronLeft, Trash2, ShieldCheck, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AddressPage() {
  const [addresses, setAddresses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchAddress();
  }, []);

  const fetchAddress = async () => {
    try {
      const res = await fetch("/api/profile/address");
      const data = await res.json();
      if (data.success) {
        setAddresses(data.addresses || []);
      }
    } catch (error) {
      console.error("Failed to fetch address", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (addressToDelete: string, index: number) => {
    if (!confirm("Are you sure you want to remove this shipping address?")) return;
    
    setDeletingIndex(index);
    try {
      const res = await fetch("/api/profile/address", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addressToDelete })
      });
      if (res.ok) {
        setAddresses(addresses.filter(a => a !== addressToDelete));
      }
    } catch (error) {
      console.error("Failed to delete address", error);
    } finally {
      setDeletingIndex(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C5A059] animate-spin mb-4" />
        <p className="text-[10px] font-black text-brand/40 uppercase tracking-widest">Loading Addresses...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-10 pb-24">
      <div className="flex items-center space-x-4 mb-10">
        <button onClick={() => router.back()} className="p-2 rounded-full bg-brand/5 text-brand hover:bg-brand/10 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-4xl font-playfair font-bold text-brand">My Addresses</h1>
          <p className="text-brand/40 text-xs font-bold uppercase tracking-widest mt-1">Manage your saved shipping destinations</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-brand/5 relative overflow-hidden min-h-[300px] flex flex-col">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <MapPin size={120} />
        </div>

        {addresses.length > 0 ? (
          <div className="flex flex-col h-full flex-1 z-10">
            <div className="flex items-center space-x-3 text-brand/40 mb-6">
              <MapPin size={18} className="text-[#C5A059]" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em]">Saved Delivery Addresses</h2>
            </div>
            
            <div className="space-y-4">
              {addresses.map((addr, idx) => (
                <div key={idx} className="bg-brand/5 border border-brand/10 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden transition-all hover:border-brand/20">
                  <p className="text-brand font-medium leading-relaxed whitespace-pre-wrap text-sm md:text-base break-words flex-1">
                    {addr}
                  </p>
                  <button 
                    onClick={() => handleDelete(addr, idx)}
                    disabled={deletingIndex === idx}
                    className="flex items-center justify-center space-x-2 text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition-all border border-red-100 disabled:opacity-50 flex-shrink-0"
                  >
                    {deletingIndex === idx ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      {deletingIndex === idx ? 'Removing...' : 'Delete'}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center h-full flex-1 py-10 z-10">
            <div className="w-16 h-16 bg-brand/5 rounded-full flex items-center justify-center mb-6">
              <MapPin size={24} className="text-brand/20" />
            </div>
            <h3 className="text-xl font-bold text-brand mb-2">No Addresses Saved</h3>
            <p className="text-brand/60 text-sm max-w-sm mx-auto leading-relaxed mb-8">
              You haven't saved any shipping destinations yet. You can easily add a new address during your next checkout.
            </p>
            <Link 
              href="/" 
              className="flex items-center space-x-2 bg-brand text-white px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-brand-hover shadow-lg transition-all"
            >
              <ShoppingBag size={16} />
              <span>Continue Shopping</span>
            </Link>
          </div>
        )}
      </div>


    </div>
  );
}
