"use client";

import React, { useEffect, useState } from "react";
import { 
  Package, 
  TrendingUp, 
  AlertCircle, 
  Truck, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Filter,
  Loader2,
  Box,
  Image as ImageIcon
} from "lucide-react";

interface ProductStats {
  id: number;
  name: string;
  category: string;
  basePrice: number;
  sold: number;
  remaining: number;
  toBeDelivered: number;
  image: string | null;
}

export default function InventoryPage() {
  const [data, setData] = useState<Record<string, ProductStats[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await fetch("/api/admin/inventory");
      const result = await res.json();
      if (result.success) {
        setData(result.data);
        // Expand all categories by default
        setExpandedCategories(Object.keys(result.data));
      }
    } catch (error) {
      console.error("Failed to fetch inventory", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };

  const filteredData = Object.entries(data).reduce((acc, [category, products]) => {
    const filtered = products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as Record<string, ProductStats[]>);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="animate-spin text-brand-accent mb-4" size={40} />
        <p className="text-brand/40 font-bold uppercase tracking-widest text-xs">Syncing Inventory...</p>
      </div>
    );
  }

  return (
    <div className="pb-20 px-8 pt-8">
      {/* Header section */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-playfair font-bold text-brand">Inventory Management</h1>
          <p className="mt-2 text-brand/60 font-medium">Real-time stock tracking and fulfillment metrics.</p>
        </div>

        <div className="relative group min-w-[350px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand/30 group-focus-within:text-[#C5A059] transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search products or categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-brand/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-brand focus:outline-none focus:ring-4 focus:ring-[#C5A059]/5 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-8">
        {Object.keys(filteredData).length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-20 shadow-sm border border-brand/5 text-center">
            <div className="w-20 h-20 bg-brand/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Box size={40} className="text-brand/20" />
            </div>
            <h3 className="text-2xl font-playfair font-bold text-brand mb-2">No products found</h3>
            <p className="text-brand/60 font-medium max-w-sm mx-auto">Try adjusting your search terms to find specific inventory items.</p>
          </div>
        ) : (
          Object.entries(filteredData).map(([category, products]) => (
            <div key={category} className="space-y-4">
              <button 
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-4 bg-brand/[0.02] hover:bg-brand/[0.05] rounded-2xl transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-[#C5A059]" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-brand">{category}</h2>
                  <span className="text-[10px] font-bold text-brand/30 bg-white border border-brand/5 px-2 py-0.5 rounded-full">
                    {products.length} Products
                  </span>
                </div>
                {expandedCategories.includes(category) ? <ChevronUp size={16} className="text-brand/30" /> : <ChevronDown size={16} className="text-brand/30" />}
              </button>

              {expandedCategories.includes(category) && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  {products.map((product) => (
                    <div key={product.id} className="bg-white rounded-[2rem] border border-brand/5 p-6 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                      {/* Product Header */}
                      <div className="flex items-start space-x-4 mb-6">
                        <div className="w-20 h-20 bg-brand/5 rounded-2xl overflow-hidden flex-shrink-0 border border-brand/5">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-brand/20">
                              <ImageIcon size={24} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-brand truncate mb-1">{product.name}</h3>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest">₹{product.basePrice.toLocaleString()}</span>
                            <span className="text-brand/10">|</span>
                            <span className="text-[10px] font-bold text-brand/40 uppercase tracking-widest truncate">{product.category}</span>
                          </div>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100/50 text-center">
                          <p className="text-[8px] font-black text-green-600 uppercase tracking-widest mb-1">Sold</p>
                          <div className="flex items-center justify-center space-x-1">
                            <TrendingUp size={12} className="text-green-500" />
                            <p className="text-lg font-black text-green-700">{product.sold}</p>
                          </div>
                        </div>
                        
                        <div className={`p-4 rounded-2xl border text-center ${product.remaining <= 5 ? 'bg-red-50/50 border-red-100/50' : 'bg-brand/5 border-brand/5'}`}>
                          <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${product.remaining <= 5 ? 'text-red-600' : 'text-brand/40'}`}>Remaining</p>
                          <div className="flex items-center justify-center space-x-1">
                            {product.remaining <= 5 && <AlertCircle size={12} className="text-red-500" />}
                            <p className={`text-lg font-black ${product.remaining <= 5 ? 'text-red-700' : 'text-brand'}`}>{product.remaining}</p>
                          </div>
                        </div>

                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 text-center">
                          <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mb-1">To be Deliver</p>
                          <div className="flex items-center justify-center space-x-1">
                            <Truck size={12} className="text-blue-500" />
                            <p className="text-lg font-black text-blue-700">{product.toBeDelivered}</p>
                          </div>
                        </div>
                      </div>

                      {/* Low Stock Warning */}
                      {product.remaining <= 5 && product.remaining > 0 && (
                        <div className="mt-4 py-2 px-3 bg-red-600 text-white rounded-xl flex items-center justify-center space-x-2 animate-pulse">
                          <AlertCircle size={12} />
                          <span className="text-[9px] font-black uppercase tracking-widest">Low Stock Warning</span>
                        </div>
                      )}
                      
                      {product.remaining === 0 && (
                        <div className="mt-4 py-2 px-3 bg-gray-900 text-white rounded-xl flex items-center justify-center space-x-2">
                          <Box size={12} />
                          <span className="text-[9px] font-black uppercase tracking-widest">Out of Stock</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
