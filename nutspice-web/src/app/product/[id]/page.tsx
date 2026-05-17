"use client";

import { useState, useEffect, use } from "react";
import { Sparkles, ArrowLeft, ShoppingBag, Check, X, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import ProductCard from "@/components/ProductCard";

interface Variation {
  id: number;
  size: string;
  stock: number;
  mrp: number;
  salePrice: number;
}

interface Product {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  salePrice: number;
  images: string; // JSON string array
  isFeatured: boolean | number | null;
  variations: Variation[];
  enabledMeasurements?: string | null;
}

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [mainImage, setMainImage] = useState<string>("");
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [toast, setToast] = useState("");
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  const { items: cartItems, addItem } = useCartStore();

  useEffect(() => {
    window.scrollTo(0, 0);
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);

          // Set initial size to the first available variation
          if (data.variations.length > 0) {
            const firstAvailable = data.variations.find((v: any) => v.stock > 0);
            if (firstAvailable) {
              setSelectedSize(firstAvailable.size);
            } else {
              setSelectedSize(data.variations[0].size);
            }
          }

          // Set initial main image
          const images = JSON.parse(data.images || "[]");
          if (images.length > 0) {
            setMainImage(images[0]);
          }
          // Fetch related products
          try {
            const resFeatured = await fetch('/api/products/featured');
            if (resFeatured.ok) {
              const featuredData = await resFeatured.json();
              setRelatedProducts(featuredData.data.filter((p: any) => p.id.toString() !== id));
            }
          } catch (e) {
            console.error("Failed to fetch related products", e);
          }
        }
      } catch (error) {
        console.error("Failed to fetch product", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-light">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-light">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-brand mb-4">Product Not Found</h1>
          <Link href="/" className="text-brand-accent hover:underline">Back to Home</Link>
        </div>
      </div>
    );
  }

  const images = JSON.parse(product.images || "[]");
  const variations = product.variations || [];

  // Get unique sizes
  const availableSizes = Array.from(new Set(variations.map(v => v.size)));

  // Current selected variation
  const currentVariation = variations.find(
    v => v.size === selectedSize
  );

  const displayPrice = currentVariation?.salePrice || product.salePrice || product.basePrice;
  const mrp = currentVariation?.mrp || product.basePrice;
  const currentStock = currentVariation?.stock || 0;
  const existingCartItem = cartItems.find(item => item.id === `prod_${product.id}_${selectedSize}`);
  const remainingStock = currentStock - (existingCartItem?.quantity || 0);

  const enabledMeasurementsList = JSON.parse(product.enabledMeasurements || "[]") as string[];

  const handleAddToCart = () => {
    if (!selectedSize) {
      setToast("Please select a weight first");
      return;
    }
    if (!currentVariation) {
      setToast("The selected weight is currently unavailable.");
      return;
    }

    if (quantity > remainingStock) {
      setToast(`Only ${remainingStock} more items available in stock.`);
      return;
    }

    addItem({
      id: `prod_${product.id}_${selectedSize}`,
      productId: product.id,
      name: product.name,
      price: displayPrice,
      image: mainImage,
      quantity: quantity,
      size: selectedSize,
      stock: currentStock,
      customizations: null,
    });

    setAdded(true);
    setToast("Item successfully added to bag!");
    setQuantity(1);
    setTimeout(() => {
      setAdded(false);
      setToast("");
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-brand-light text-brand font-sans selection:bg-brand-accent/30">
      <main className="max-w-7xl mx-auto px-6 md:px-12 pt-8 pb-8">
        <button 
          onClick={() => router.back()} 
          className="inline-flex items-center space-x-3 text-brand/60 hover:text-brand-accent transition-all mb-4 text-xs font-bold uppercase tracking-widest group"
        >
          <div className="p-2 rounded-full bg-white shadow-sm border border-brand/5 group-hover:border-brand-accent/30 transition-all">
            <ArrowLeft size={14} />
          </div>
          <span>Back to Collections</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Image Gallery (5 cols) */}
          <div className="lg:col-span-5 flex flex-col-reverse md:flex-row gap-4">
            {/* Thumbnails */}
            <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto max-h-[600px] no-scrollbar">
              {images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setMainImage(img)}
                  className={`relative flex-shrink-0 w-20 h-24 md:w-24 md:h-32 rounded-lg overflow-hidden border-2 transition-all ${mainImage === img ? "border-brand-accent shadow-md scale-105" : "border-transparent hover:border-brand/20"
                    }`}
                >
                  <img src={img} alt={`${product.name} ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Main Image */}
            <div className="flex-1 aspect-square relative rounded-2xl overflow-hidden bg-white shadow-xl group">
              <img
                src={mainImage}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute top-6 right-6">
                <div className="bg-white/90 backdrop-blur-md p-3 rounded-full shadow-lg border border-brand/5 text-brand-accent">
                  <Sparkles size={20} />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Product Details (7 cols) */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="flex items-center space-x-2 mb-2">
              <span className="bg-brand/5 text-brand px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter">Premium Collection</span>
              {currentStock > 0 && currentStock < 5 && (
                <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter animate-pulse">
                  Only {currentStock} left!
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-serif font-bold mb-3 leading-tight text-brand">
              {product.name}
            </h1>

            <div className="flex items-baseline space-x-3 mb-6">
              <span className="text-2xl font-bold text-brand">₹{displayPrice.toLocaleString()}</span>
              {mrp > displayPrice && (
                <span className="text-lg text-brand/40 line-through font-medium">₹{mrp.toLocaleString()}</span>
              )}
            </div>

            <p className="text-brand/70 mb-4 text-xs leading-relaxed border-l-4 border-brand-accent/20 pl-5 italic">
              {product.description}
            </p>


            {/* Weight Selector */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold text-brand uppercase tracking-widest flex items-center gap-2">
                  1. Select Weight <span className="text-brand/30">—</span> <span className="text-brand-accent">{selectedSize || "None"}</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => {
                  const variation = variations.find(v => v.size === size);
                  const isOutOfStock = variation ? variation.stock === 0 : true;

                  return (
                    <button
                      key={size}
                      disabled={isOutOfStock}
                      onClick={() => {
                        setSelectedSize(size);
                        setQuantity(1);
                      }}
                      className={`min-w-[60px] h-10 rounded-xl flex items-center justify-center text-[10px] font-bold transition-all border-2 ${selectedSize === size
                          ? "bg-brand text-white border-brand scale-105 shadow-md"
                          : isOutOfStock
                            ? "bg-brand/5 text-brand/20 border-transparent cursor-not-allowed line-through opacity-50"
                            : "bg-white text-brand/70 border-brand/5 hover:border-[#C5A059] hover:text-brand shadow-sm"
                        }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>


            {/* Quantity & Add to Cart */}
            <div className="mb-4 pt-6 border-t border-brand/5">
              <h4 className="text-[10px] font-black text-brand uppercase tracking-widest mb-4">2. Quantity & Add to Bag</h4>
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center bg-brand/5 rounded-xl border border-brand/5 p-1">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-white rounded-lg transition-all text-brand disabled:opacity-30"
                    disabled={quantity <= 1}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center text-sm font-bold text-brand">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 hover:bg-white rounded-lg transition-all text-brand disabled:opacity-30"
                    disabled={quantity >= remainingStock}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button
                  disabled={!!(selectedSize && remainingStock <= 0)}
                  onClick={handleAddToCart}
                  className={`flex-1 md:flex-none md:min-w-[200px] flex items-center justify-center space-x-2 font-bold py-3 px-8 rounded-xl transition-all text-sm shadow-lg ${selectedSize && remainingStock <= 0
                      ? "bg-brand/10 text-brand/30 cursor-not-allowed"
                      : "bg-brand text-white hover:bg-brand-hover active:scale-[0.98] border border-transparent hover:border-[#C5A059]"
                    }`}
                >
                  {added ? (
                    <Check size={18} className="text-[#C5A059] animate-in zoom-in duration-300" />
                  ) : (
                    <ShoppingBag size={18} className="transition-all" />
                  )}
                  <span className={added ? "text-[#C5A059] transition-colors duration-300" : ""}>
                    {selectedSize && remainingStock <= 0 ? "Out of Stock" : added ? "Added!" : "Add to Bag"}
                  </span>
                </button>
              </div>
              {remainingStock > 0 && (
                <p className="mt-3 text-[9px] text-brand/30 font-bold uppercase tracking-widest italic">
                  {remainingStock} pieces remaining in harvest
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Related Items Carousel */}
        {relatedProducts.length > 0 && (
          <div className="mt-4 border-t border-brand/5 pt-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-playfair font-bold text-brand">You Might Also Like</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {relatedProducts.map((p) => {
                let imgUrl = "";
                try {
                  const imgs = JSON.parse(p.images || "[]");
                  imgUrl = imgs[0] || "";
                } catch (e) {}

                const productProp = {
                  id: p.id.toString(),
                  name: p.name,
                  description: p.description,
                  price: p.salePrice || p.basePrice,
                  mrp: p.basePrice,
                  imageUrl: imgUrl,
                  categorySlug: p.category || "nuts",
                };

                return (
                  <ProductCard key={p.id} product={productProp} />
                );
              })}
            </div>
          </div>
        )}

        {/* Floating Toast Notification */}
        {toast && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-[#1B3022] text-[#C5A059] px-8 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 font-bold text-sm animate-in fade-in slide-in-from-bottom-5 duration-300">
            <Check size={18} />
            <span>{toast}</span>
          </div>
        )}
      </main>
    </div>

  );
}
