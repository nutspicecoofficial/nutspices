"use client";

import React, { useState, useEffect } from "react";
import { X, Search, Plus, Loader2, Package } from "lucide-react";

interface Product {
  id: number;
  name: string;
  images: string;
  salePrice: number | null;
  mrp: number | null;
  category: string | null;
}

interface ProductSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedIds: number[]) => void;
  initialSelectedIds: number[];
  onProductCreated?: () => void;
}

export default function ProductSelectorModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  initialSelectedIds,
  onProductCreated
}: ProductSelectorModalProps) {

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>(initialSelectedIds);
  const [isAdding, setIsAdding] = useState(false);

  // New Product Form State
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newSalePrice, setNewSalePrice] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newSizes, setNewSizes] = useState<{size: string, stock: number}[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(initialSelectedIds);
      setIsAdding(false);
    }
  }, [isOpen, initialSelectedIds]);

  const fetchProducts = async (searchTerm = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products?search=${searchTerm}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  // Live Search
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        fetchProducts(search);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [search, isOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(search);
  };

  const toggleProduct = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleAddProduct = async () => {
    // Strict Validation
    if (!newName.trim()) {
      alert("Product name is required.");
      return;
    }
    if (!newPrice || parseFloat(newPrice) <= 0) {
      alert("Please enter a valid MRP greater than 0.");
      return;
    }
    if (!newSalePrice || parseFloat(newSalePrice) <= 0) {
      alert("Please enter a valid Sale Price greater than 0.");
      return;
    }
    if (parseFloat(newSalePrice) > parseFloat(newPrice)) {
      alert("Sale Price cannot be higher than MRP.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          mrp: newPrice,
          salePrice: newSalePrice,
          category: newCategory,
          images: newImageUrl ? [newImageUrl] : [],
          variations: newSizes.length > 0 ? newSizes : [{ size: "Free Size", stock: 10 }],
          gender: "unisex"
        })
      });
      const data = await res.json();
      if (data.success) {
        // Automatically select the new product
        setSelectedIds([...selectedIds, data.data.id]);
        setIsAdding(false);
        // Clear form
        setNewName(""); setNewPrice(""); setNewSalePrice(""); setNewCategory(""); setNewImageUrl(""); setNewSizes([]);
        // Refresh list
        fetchProducts();
        // Notify parent
        onProductCreated?.();
      } else {
        alert(`Error: ${data.error}${data.details ? `\n\nDetails: ${data.details}` : ""}`);
      }
    } catch (err) {
      console.error(err);
      alert("Network error. Failed to save product.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSize = (size: string) => {
    const exists = newSizes.find(s => s.size === size);
    if (exists) {
      setNewSizes(newSizes.filter(s => s.size !== size));
    } else {
      setNewSizes([...newSizes, { size, stock: 10 }]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-dark/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] w-[95%] max-w-6xl h-[85vh] max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-8 border-b border-brand/5 flex items-center justify-between bg-brand text-white">
          <div className="flex items-center space-x-4">
            <div className="bg-[#C5A059] p-3 rounded-2xl">
              <Package size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-playfair font-bold">
                {isAdding ? "Add New Product" : "Select Products"}
              </h2>
              <p className="text-white/60 text-xs font-medium uppercase tracking-widest mt-1">
                {isAdding ? "Create a quick listing" : "Pick items for your carousel"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {isAdding ? (
          /* Create Form View */
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-2">Product Name *</label>
                  <input 
                    type="text" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Silk Saree"
                    className="w-full bg-brand/5 border border-transparent focus:border-[#C5A059]/50 rounded-2xl px-5 py-4 text-sm font-semibold text-brand outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-2">MRP (₹) *</label>
                    <input 
                      type="number" 
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="1200"
                      className="w-full bg-brand/5 border border-transparent focus:border-[#C5A059]/50 rounded-2xl px-5 py-4 text-sm font-semibold text-brand outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-2">Sale Price (₹) *</label>
                    <input 
                      type="number" 
                      value={newSalePrice}
                      onChange={(e) => setNewSalePrice(e.target.value)}
                      placeholder="999"
                      className="w-full bg-brand/5 border border-transparent focus:border-[#C5A059]/50 rounded-2xl px-5 py-4 text-sm font-semibold text-brand outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-2">Category</label>
                  <input 
                    type="text" 
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="e.g. Saree, Nighty"
                    className="w-full bg-brand/5 border border-transparent focus:border-[#C5A059]/50 rounded-2xl px-5 py-4 text-sm font-semibold text-brand outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-2">Image URL</label>
                  <div className="border-2 border-dashed border-brand/10 rounded-3xl p-6 text-center hover:border-[#C5A059]/30 transition-all group">
                    {newImageUrl ? (
                      <div className="relative aspect-video rounded-2xl overflow-hidden mb-4">
                        <img src={newImageUrl} className="w-full h-full object-cover" />
                        <button onClick={() => setNewImageUrl("")} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full shadow-lg"><X size={14}/></button>
                      </div>
                    ) : (
                      <div className="py-4">
                        <Plus size={32} className="mx-auto text-brand/10 mb-2 group-hover:text-[#C5A059]/50 transition-colors" />
                        <p className="text-[10px] font-black text-brand/30 uppercase tracking-widest">Paste Image Link Below</p>
                      </div>
                    )}
                    <input 
                      type="text" 
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-white border border-brand/10 rounded-xl py-3 px-4 text-xs font-bold text-brand outline-none focus:border-[#C5A059]/30 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-2">Quantity & Variations (Click to add)</label>
                  <div className="flex flex-wrap gap-2">
                    {["XS", "S", "M", "L", "XL", "2XL", "3XL"].map(size => {
                      const isSelected = newSizes.find(s => s.size === size);
                      return (
                        <button 
                          key={size}
                          type="button"
                          onClick={() => toggleSize(size)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                            isSelected 
                              ? "bg-brand text-white border-brand" 
                              : "bg-brand/5 text-brand/50 border-transparent hover:border-brand/10"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                  {newSizes.length > 0 ? (
                    <div className="mt-4 space-y-2">
                      {newSizes.map(s => (
                        <div key={s.size} className="flex items-center justify-between bg-brand/5 p-3 rounded-xl">
                          <span className="text-xs font-bold text-brand">{s.size}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-black text-brand/40 uppercase tracking-widest">Stock:</span>
                            <input 
                              type="number" 
                              value={s.stock}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setNewSizes(newSizes.map(item => item.size === s.size ? { ...item, stock: val } : item));
                              }}
                              className="w-16 bg-white border border-brand/10 rounded-lg px-2 py-1 text-xs font-bold text-brand outline-none"
                            />
                          </div>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-brand/5 flex justify-between items-center">
                        <span className="text-[10px] font-black text-brand/40 uppercase tracking-widest">Overall Stock:</span>
                        <span className="text-sm font-bold text-brand">{newSizes.reduce((acc, s) => acc + s.stock, 0)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 p-4 bg-brand/5 rounded-2xl border border-dashed border-brand/10 text-center">
                       <p className="text-[10px] font-black text-brand/20 uppercase tracking-widest">Default: Free Size (Stock: 10)</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Selection View */
          <>
            {/* Search Bar */}
            <div className="p-4 bg-brand/5 border-b border-brand/5">
              <form onSubmit={handleSearch} className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand/30" size={18} />
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products by name or category..."
                  className="w-full bg-white border border-brand/10 rounded-xl py-3 pl-12 pr-4 text-sm font-bold text-brand outline-none focus:border-[#C5A059]/30 transition-all shadow-sm"
                />
              </form>
            </div>

            {/* Product List */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-brand/20">
                  <Loader2 className="w-10 h-10 animate-spin mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest">Searching Inventory...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {products.map((product) => {
                    const isSelected = selectedIds.includes(product.id);
                    const images = JSON.parse(product.images || "[]");
                    return (
                      <div 
                        key={product.id}
                        onClick={() => toggleProduct(product.id)}
                        className={`flex items-center space-x-5 p-2.5 rounded-2xl border-2 cursor-pointer transition-all ${
                          isSelected 
                            ? "border-[#C5A059] bg-[#C5A059]/5 shadow-md" 
                            : "border-brand/5 hover:border-brand/10"
                        }`}
                      >
                        <div className="w-24 h-24 bg-brand/5 rounded-xl overflow-hidden flex-shrink-0 border border-brand/5">
                          <img 
                            src={images[0] || "/images/placeholder.png"} 
                            alt={product.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-brand truncate">{product.name}</h4>
                          <p className="text-[10px] text-brand/40 uppercase font-black tracking-tighter mt-1">₹{(product.salePrice || 0).toLocaleString()}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected 
                            ? "bg-[#C5A059] border-[#C5A059] text-white" 
                            : "border-brand/10 text-transparent"
                        }`}>
                          <Plus size={14} strokeWidth={3} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!loading && products.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-brand/40 font-bold uppercase tracking-widest text-xs">No products found.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-brand/5 bg-brand/5 flex items-center justify-between">
          {isAdding ? (
            <>
              <button 
                onClick={() => setIsAdding(false)}
                className="px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs text-brand/40 hover:bg-brand/5 transition-all"
              >
                Back to Selection
              </button>
              <button 
                onClick={handleAddProduct}
                disabled={isSaving}
                className="bg-[#1B3022] text-[#C5A059] px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#2c4d37] transition-all shadow-lg shadow-brand/10 disabled:opacity-50 flex items-center space-x-2"
              >
                {isSaving && <Loader2 size={14} className="animate-spin" />}
                <span>Save & Select</span>
              </button>
            </>
          ) : (
            <>
              <div className="text-xs font-bold text-brand/40 uppercase tracking-widest">
                {selectedIds.length} Products Selected
              </div>
              <div className="flex space-x-4">
                <button 
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs text-brand/40 hover:bg-brand/5 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => onConfirm(selectedIds)}
                  className="bg-[#1B3022] text-[#C5A059] px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#2c4d37] transition-all shadow-lg shadow-brand/10"
                >
                  Confirm Selection
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
