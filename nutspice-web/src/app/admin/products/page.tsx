"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Plus, Package, Trash2, Edit3, X, Star, Loader2, Check, Tag, Sparkles, Search } from "lucide-react";
const DEFAULT_SIZES = ["100g", "200g", "250g", "500g", "1kg", "2kg", "5kg"];

interface Variation { size: string; stock: number; sku: string; basePrice: number; salePrice: number; }
interface Product {
  id: number; name: string; description: string | null;
  basePrice: number; salePrice: number; images: string;
  category: string | null;
  totalStock: number;
  isFeatured: boolean | number | null;
  tags: string | null;
}

const LABEL = "block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-3";
const INPUT = "w-full bg-brand/5 border border-transparent focus:border-[#C5A059]/50 rounded-2xl px-5 py-4 text-sm font-semibold text-brand outline-none transition-all placeholder:text-brand/20";

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockEditingProduct, setStockEditingProduct] = useState<any>(null);
  const [stockVariations, setStockVariations] = useState<Variation[]>([]);

  // ── Form state ──────────────────────────────────────────────
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  // Removed overall mrp and salePrice
  const [isFeatured, setIsFeatured] = useState(false);
  const [tags, setTags] = useState("");

  // Images
  const [imageInput, setImageInput] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [customSizeInput, setCustomSizeInput] = useState("");

  // Sizes & Colors → Variations
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [variations, setVariations] = useState<Variation[]>([]);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      if (data.success) setProducts(data.data);
    } catch { } finally { setIsLoading(false); }
  };

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (p.category?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  // When sizes or colors change → regenerate variation matrix
  useEffect(() => {
    if (selectedSizes.length === 0) { 
      if (!editingId) setVariations([]); 
      return; 
    }
    const sizesToUse = selectedSizes;
    
    setVariations(prev => {
      const newVariations = [...prev];
      sizesToUse.forEach(size => {
        const exists = newVariations.find(v => v.size === size);
        if (!exists) {
          newVariations.push({ size, stock: 0, sku: "", basePrice: 0, salePrice: 0 });
        }
      });
      return newVariations.filter(v => sizesToUse.includes(v.size));
    });
  }, [selectedSizes.length]);


  const totalStock = useMemo(() => variations.reduce((a, v) => a + (Number(v.stock) || 0), 0), [variations]);
  // Overall discount display removed as pricing is now per variation

  const toggleSize = (s: string) => setSelectedSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const updateVariation = (size: string, field: keyof Variation, value: string | number) =>
    setVariations(prev => prev.map(v => v.size === size ? { ...v, [field]: value } : v));

  const addImage = () => {
    if (imageInput.trim()) { setImages(p => [...p, imageInput.trim()]); setImageInput(""); }
  };

  const addCustomSize = () => {
    if (customSizeInput.trim() && !selectedSizes.includes(customSizeInput.trim())) {
      setSelectedSizes(prev => [...prev, customSizeInput.trim()]);
      setCustomSizeInput("");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName(""); setDescription(""); setCategory("");
    setIsFeatured(false); setTags(""); setImages([]);
    setSelectedSizes([]); setVariations([]); setCustomSizeInput("");
  };

  const handleEdit = async (id: number) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/products?id=${id}`);
      const data = await res.json();
      if (data.success) {
        const p = data.data;
        setEditingId(p.id);
        setName(p.name);
        setDescription(p.description || "");
        setCategory(p.category || "");
        // mrp and salePrice are now in variations
        setIsFeatured(!!p.isFeatured);
        setTags(p.tags || "");
        setImages(JSON.parse(p.images || "[]"));
        
        // Handle variations
        if (p.variations) {
          const sizes = Array.from(new Set(p.variations.map((v: any) => v.size))).filter(s => s !== "Default") as string[];
          setSelectedSizes(sizes);
          setVariations(p.variations);
        }

        
        // Scroll to form
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch { showToast("Failed to load product details."); } finally { setIsSubmitting(false); }
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return showToast("Product name is required.");
    if (images.length < 1) return showToast("Add at least 1 image URL.");
    if (variations.length === 0) return showToast("Please add at least one size/color variation.");
    const overpricedVariation = variations.find(v => Number(v.salePrice) >= Number(v.basePrice));
    if (overpricedVariation) return showToast(`Sale Price must be LOWER than Base Price for: ${overpricedVariation.size}`);

    setIsSubmitting(true);
    try {
      const method = editingId ? "PATCH" : "POST";
      const payload = { 
        id: editingId, name, description, images, variations, 
        category, tags, isFeatured,
      };
      
      const res = await fetch("/api/admin/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) { 
        showToast(editingId ? "✓ Product updated!" : "✓ Product added to store!"); 
        fetchProducts(); 
        resetForm(); 
      }
      else showToast(data.details || data.error || "Failed to save product.");
    } catch (err: any) { showToast(err.message || "Network error."); } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("Product deleted successfully.");
        fetchProducts();
        if (editingId === id) resetForm();
      } else {
        showToast(data.error || "Failed to delete product.");
      }
    } catch { showToast("Network error."); }
  };

  const handleStockUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockEditingProduct) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: stockEditingProduct.id, 
          name: stockEditingProduct.name,
          variations: stockVariations 
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("✓ Stock updated successfully!");
        fetchProducts();
        setStockModalOpen(false);
      } else {
        showToast(data.error || "Failed to update stock");
      }
    } catch {
      showToast("Network error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openStockModal = async (product: Product) => {
    setStockEditingProduct(product);
    setStockModalOpen(true);
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/products?id=${product.id}`);
      const data = await res.json();
      if (data.success) {
        setStockVariations(data.data.variations || []);
      }
    } catch {
      showToast("Failed to load variations.");
      setStockModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full w-full overflow-hidden">
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-[#1B3022] text-[#C5A059] px-8 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 font-bold text-sm">
          <Check size={18} /><span>{toast}</span>
        </div>
      )}

      {/* ─── QUICK STOCK MODAL ────────────────────────── */}
      {stockModalOpen && stockEditingProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand/40 backdrop-blur-sm" onClick={() => !isSubmitting && setStockModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-brand/5 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-brand/5 flex items-center justify-between bg-brand/5">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl overflow-hidden border border-brand/10">
                  <img src={JSON.parse(stockEditingProduct.images || "[]")[0]} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="text-xl font-playfair font-bold text-brand">Quick Stock Update</h2>
                  <p className="text-[10px] font-black text-brand/30 uppercase tracking-widest">{stockEditingProduct.name}</p>
                </div>
              </div>
              <button onClick={() => setStockModalOpen(false)} className="p-2 hover:bg-brand/10 rounded-xl transition-all">
                <X size={20} className="text-brand/40" />
              </button>
            </div>

            <form onSubmit={handleStockUpdate} className="p-8">
              <div className="max-h-[50vh] overflow-y-auto custom-scrollbar pr-2 mb-8">
                <table className="w-full text-left">
                  <thead className="text-[10px] font-black text-brand/30 uppercase tracking-widest">
                    <tr>
                      <th className="pb-4 px-2">Variation</th>
                      <th className="pb-4 px-2">Stock Left</th>
                      <th className="pb-4 px-2">New Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand/5">
                    {stockVariations.map((v, idx) => (
                      <tr key={idx} className="group">
                        <td className="py-4 px-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-brand">{v.size}</span>
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <span className={`text-xs font-black ${v.stock < 10 ? "text-red-500" : "text-brand/40"}`}>{v.stock}</span>
                        </td>
                        <td className="py-4 px-2">
                          <input 
                            type="number" 
                            min="0"
                            value={v.stock}
                            onChange={(e) => {
                              const newVal = parseInt(e.target.value) || 0;
                              setStockVariations(prev => prev.map((item, i) => i === idx ? { ...item, stock: newVal } : item));
                            }}
                            className="w-24 bg-brand/5 border-2 border-transparent focus:border-brand-accent/30 rounded-xl px-4 py-2 text-xs font-black text-brand outline-none transition-all"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setStockModalOpen(false)}
                  className="flex-1 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-brand/40 hover:bg-brand/5 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-[2] bg-brand text-brand-accent px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:shadow-brand/20 transition-all flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  <span>Save Stock Levels</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex h-full w-full overflow-hidden">
        
        {/* ─── LEFT: FORM (Middle Workspace) ────────────────────────── */}
        <div className="flex-[3] h-full overflow-y-auto custom-scrollbar p-4 md:p-6 border-r border-brand/5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#C5A059]/10 rounded-xl">
                {editingId ? <Edit3 className="text-[#C5A059]" size={22} /> : <Plus className="text-[#C5A059]" size={22} />}
              </div>
              <div>
                <h1 className="text-3xl font-playfair font-bold text-brand">{editingId ? "Edit Product" : "Add New Product"}</h1>
                <p className="text-brand/40 text-xs font-medium mt-1">
                  {editingId ? `Updating product ID: ${editingId}` : "Fill in the details below to list a new item"}
                </p>
              </div>
            </div>
            {editingId && (
              <button onClick={resetForm} className="px-4 py-2 bg-brand/5 text-brand/40 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand/10 transition-all">
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-brand/5 space-y-8">

            {/* ── Section 1: Identity ── */}
            <div>
              <h3 className="text-xs font-black text-brand/30 uppercase tracking-[0.3em] mb-6 flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-brand text-white text-[8px] flex items-center justify-center font-black">1</span> Product Identity</h3>
              <div className="space-y-5">
                <div>
                  <label className={LABEL}>Product Name *</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Premium Roasted Almonds" className={INPUT} required />
                </div>
                <div>
                  <label className={LABEL}>Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the quality, source, and health benefits..." rows={3} className={`${INPUT} resize-none`} />
                </div>
                <div>
                  <label className={LABEL}>Tags (comma-separated)</label>
                  <input value={tags} onChange={e => setTags(e.target.value)} placeholder="roasted, salted, organic, energy booster…" className={INPUT} />
                </div>
                <div className="flex items-center justify-between p-6 bg-brand/5 rounded-[2.5rem] border border-brand/10 transition-all hover:bg-brand/[0.08]">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-2xl transition-all ${isFeatured ? "bg-brand-accent/20 text-brand-accent" : "bg-brand/10 text-brand/30"}`}>
                      <Sparkles size={20} className={isFeatured ? "animate-pulse" : ""} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-brand uppercase tracking-widest">Featured Product</p>
                      <p className="text-[10px] text-brand/40 font-medium">Spotlight this item on the homepage</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setIsFeatured(!isFeatured)} 
                    className={`w-14 h-7 rounded-full transition-all relative flex items-center px-1 ${isFeatured ? "bg-brand-accent shadow-[0_0_15px_rgba(197,160,89,0.3)]" : "bg-brand/20"}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-lg transition-transform duration-300 ease-out ${isFeatured ? "translate-x-7" : "translate-x-0"}`} />
                  </button>
                </div>
              </div>
            </div>


            {/* ── Section 3: Images ── */}
            <div>
              <h3 className="text-xs font-black text-brand/30 uppercase tracking-[0.3em] mb-6 flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-brand text-white text-[8px] flex items-center justify-center font-black">3</span> Product Images ({images.length})</h3>
              <div className="flex gap-3 mb-5">
                <input value={imageInput} onChange={e => setImageInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addImage())} placeholder="Paste image URL and press Enter or click Add →" className={`${INPUT} flex-1`} />
                <button type="button" onClick={addImage} className="bg-[#1B3022] text-[#C5A059] px-5 py-2 rounded-2xl font-bold text-xs hover:bg-[#2c4d37] transition-all whitespace-nowrap">Add URL</button>
              </div>
              {images.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {images.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-brand/10 group">
                      <img src={img} alt={`img-${i}`} className="w-full h-full object-cover" onError={e => (e.currentTarget.src = "/images/placeholder.png")} />
                      <button type="button" onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-red-500/80 text-white items-center justify-center hidden group-hover:flex"><X size={18} /></button>
                    </div>
                  ))}
                </div>
              )}
              {images.length === 0 && (
                <div className="border-2 border-dashed border-brand/10 rounded-2xl py-12 text-center text-brand/30">
                  <Package size={32} className="mx-auto mb-3" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No images added yet</p>
                </div>
              )}
            </div>

            {/* ── Section 4: Stock ── */}
            <div>
              <h3 className="text-xs font-black text-brand/30 uppercase tracking-[0.3em] mb-6 flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-brand text-white text-[8px] flex items-center justify-center font-black">4</span> Inventory Overview</h3>
              <div className="p-5 bg-brand/5 rounded-2xl flex items-center justify-between">
                <span className="text-[10px] font-black text-brand/40 uppercase tracking-widest">Total Combined Stock (All variations)</span>
                <span className="text-2xl font-black text-brand">{totalStock}</span>
              </div>
            </div>

            {/* ── Section 5: Sizes ── */}
            <div>
              <h3 className="text-xs font-black text-brand/30 uppercase tracking-[0.3em] mb-6 flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-brand text-white text-[8px] flex items-center justify-center font-black">5</span> Available Weights</h3>
              <div className="flex flex-wrap gap-2 items-center">
                {DEFAULT_SIZES.map(size => (
                  <button key={size} type="button" onClick={() => toggleSize(size)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedSizes.includes(size) ? "bg-[#1B3022] text-white border-[#1B3022]" : "bg-brand/5 text-brand/50 border-transparent hover:border-brand/20"}`}>
                    {size}
                  </button>
                ))}
                
                {selectedSizes.filter(s => !DEFAULT_SIZES.includes(s)).map(size => (
                  <button key={size} type="button" onClick={() => toggleSize(size)}
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all border bg-[#C5A059] text-white border-[#C5A059] flex items-center gap-2">
                    {size}
                    <X size={12} />
                  </button>
                ))}

                <div className="flex gap-2 ml-2">
                  <input 
                    value={customSizeInput} 
                    onChange={e => setCustomSizeInput(e.target.value)} 
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustomSize())}
                    placeholder="Add custom (e.g. 100g)" 
                    className="bg-brand/5 border border-transparent focus:border-[#C5A059]/50 rounded-xl px-4 py-2 text-xs font-semibold text-brand outline-none transition-all placeholder:text-brand/20 w-40" 
                  />
                  <button type="button" onClick={addCustomSize} className="bg-brand text-white p-2 rounded-xl hover:bg-brand-hover transition-all">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>



            {/* ── Section 7: Variation Matrix ── */}
            <div>
              <h3 className="text-xs font-black text-brand/30 uppercase tracking-[0.3em] mb-6 flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-brand text-white text-[8px] flex items-center justify-center font-black">7</span> Variation Matrix (Stock & SKU)</h3>
              {variations.length > 0 ? (
                <div className="overflow-hidden rounded-[2rem] border border-brand/5 shadow-sm">
                  <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-brand text-white/60 font-black uppercase tracking-widest">
                      <tr>
                        <th className="px-5 py-4">Weight</th>
                        <th className="px-5 py-4">Base Price (₹)</th>
                        <th className="px-5 py-4">Sale (₹)</th>
                        <th className="px-5 py-4">Stock Left</th>
                        <th className="px-5 py-4">SKU</th>
                        <th className="px-5 py-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand/5">
                      {variations.map((v, idx) => (
                        <tr key={`${v.size}-${idx}`} className="hover:bg-brand/5 transition-colors">
                          <td className="px-5 py-3 font-bold text-brand">{v.size}</td>
                          <td className="px-5 py-3">
                            <input 
                              type="number" 
                              value={v.basePrice ?? ""} 
                              onChange={e => updateVariation(v.size, "basePrice", e.target.value === "" ? "" : parseFloat(e.target.value))} 
                              className="w-20 bg-brand/5 border border-transparent focus:border-[#C5A059]/40 rounded-lg px-3 py-2 text-xs font-bold outline-none" 
                              placeholder="1000" 
                            />
                          </td>
                          <td className="px-5 py-3">
                            <input 
                              type="number" 
                              value={v.salePrice ?? ""} 
                              onChange={e => updateVariation(v.size, "salePrice", e.target.value === "" ? "" : parseFloat(e.target.value))} 
                              className={`w-20 border transition-all rounded-lg px-3 py-2 text-xs font-bold outline-none ${
                                v.salePrice && v.basePrice && Number(v.salePrice) >= Number(v.basePrice)
                                  ? "bg-red-50 border-red-200 text-red-600 focus:border-red-400" 
                                  : "bg-brand/5 border-transparent focus:border-[#C5A059]/40 text-green-600"
                              }`} 
                              placeholder="699" 
                            />
                          </td>
                          <td className="px-5 py-3">
                            <input type="number" value={v.stock ?? ""} onChange={e => updateVariation(v.size, "stock", e.target.value === "" ? "" : parseInt(e.target.value))} className="w-16 bg-brand/5 border border-transparent focus:border-[#C5A059]/40 rounded-lg px-3 py-2 text-xs font-bold outline-none" />
                          </td>
                          <td className="px-5 py-3">
                            <input type="text" value={v.sku ?? ""} onChange={e => updateVariation(v.size, "sku", e.target.value)} placeholder={`SKU-${v.size}`} className="w-full min-w-[80px] bg-brand/5 border border-transparent focus:border-[#C5A059]/40 rounded-lg px-3 py-2 text-xs font-bold outline-none" />
                          </td>
                          <td className="px-5 py-3 text-center">
                            <button 
                              type="button" 
                              onClick={() => setVariations(prev => prev.filter((_, i) => i !== idx))}
                              className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              ) : (
                <div className="py-10 text-center border-2 border-dashed border-brand/10 rounded-2xl">
                  <p className="text-[10px] font-black text-brand/30 uppercase tracking-[0.2em]">Select weights above to generate the variation matrix</p>
                </div>
              )}
            </div>

            {/* Submit */}
            <button disabled={isSubmitting}
              className="w-full bg-brand text-brand-accent py-6 rounded-[2rem] font-black uppercase tracking-[0.4em] text-xs hover:bg-brand-hover hover:shadow-[0_20px_40px_rgba(27,48,34,0.2)] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-4 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <div className="relative flex items-center space-x-3">
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : editingId ? <Check size={20} /> : <Plus size={20} />}
                <span>{isSubmitting ? "Processing..." : editingId ? "Update Product" : "Add to Store"}</span>
              </div>
            </button>
          </form>
        </div>

        {/* ─── RIGHT: INVENTORY (Context Sidebar) ───────────────────── */}
        <div className="flex-[1] min-w-[320px] h-full overflow-y-auto bg-brand/5 custom-scrollbar p-6">
          <div className="flex flex-col space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Package className="text-[#C5A059]" size={22} />
                <h2 className="text-2xl font-playfair font-bold text-brand">Inventory</h2>
              </div>
              <span className="text-[10px] font-black text-brand/30 uppercase tracking-widest bg-brand/5 px-3 py-1.5 rounded-full">{products.length} total</span>
            </div>

            {/* Search Bar */}
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand/20 group-focus-within:text-[#C5A059] transition-colors" size={16} />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search inventory..."
                className="w-full bg-white border border-brand/5 focus:border-[#C5A059]/30 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-brand outline-none transition-all shadow-sm"
              />
            </div>

            <div className="space-y-2 pr-1">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-brand/20">
                  <Loader2 size={36} className="animate-spin mb-3" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Loading…</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-brand/10 rounded-3xl">
                  <Package size={40} className="text-brand/10 mx-auto mb-3" />
                  <p className="text-[10px] font-black text-brand/30 uppercase tracking-widest">No products found</p>
                  <p className="text-[10px] text-brand/20 mt-2">Try a different search term</p>
                </div>
              ) : filteredProducts.map(product => {
                const imgs = JSON.parse(product.images || "[]");
                const off = product.basePrice && product.salePrice ? Math.round((1 - product.salePrice / product.basePrice) * 100) : 0;
                const isCurrentlyEditing = editingId === product.id;
                
                return (
                  <div key={product.id} className={`bg-white rounded-2xl p-3 border transition-all duration-300 group ${isCurrentlyEditing ? "border-brand-accent shadow-lg" : "border-brand/5 hover:border-brand-accent/30 shadow-sm"}`}>
                    <div className="flex items-center space-x-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-brand/5 border border-brand/5 flex-shrink-0 relative">
                        <img src={imgs[0] || "/images/placeholder.png"} alt={product.name} className="w-full h-full object-cover" onError={e => (e.currentTarget.src = "/images/placeholder.png")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-[11px] font-bold text-brand truncate">{product.name}</h3>
                          {product.isFeatured && <Sparkles size={8} className="text-brand-accent" />}
                        </div>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="text-[10px] font-black text-brand">₹{product.salePrice?.toLocaleString()}</span>
                          {off > 0 && <span className="text-[8px] text-green-600 font-bold">{off}% OFF</span>}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               openStockModal(product);
                             }}
                             title="Click to manage stock"
                             className={`text-[8px] font-black px-2 py-0.5 rounded-full hover:scale-105 active:scale-95 transition-all cursor-pointer ${(product.totalStock || 0) > 10 ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-600 border border-red-100"}`}
                           >
                            {product.totalStock || 0} STOCK
                          </button>
                          <div className="flex space-x-1">
                            <button onClick={() => handleEdit(product.id)} className={`p-1.5 rounded-lg transition-all ${isCurrentlyEditing ? "bg-brand text-white" : "bg-brand/5 text-brand hover:bg-brand hover:text-white"}`}><Edit3 size={10} /></button>
                            <button onClick={() => handleDelete(product.id)} className="p-1.5 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all"><Trash2 size={10} /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
