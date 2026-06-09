"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Loader2, CreditCard, ShieldCheck, CheckCircle2, Scissors, Sparkles, MapPin, AlertTriangle, Truck, Star } from "lucide-react";
import { useRouter } from "next/navigation";

const PACKAGE_DIMENSIONS: Record<number, { L: number; B: number; H: number }> = {
  0.5 : { L: 10, B: 10, H: 10 },
  1 : { L: 20, B: 20, H: 20 },
  1.5 : { L: 30, B: 30, H: 30 },
  2 : { L: 40, B: 40, H: 40 },
};

function getDimensionsForWeight(weightInKg: number) {
  const keys = [0.5, 1, 1.5, 2];
  const matchedKey = keys.find(k => k >= weightInKg) || 2;
  return PACKAGE_DIMENSIONS[matchedKey as keyof typeof PACKAGE_DIMENSIONS];
}

function parseWeightToKg(sizeStr: string): number {
  if (!sizeStr) return 0.5;
  const clean = sizeStr.toLowerCase().trim();
  const numeric = parseFloat(clean);
  if (isNaN(numeric)) return 0.5;
  if (clean.endsWith("kg")) {
    return numeric;
  }
  if (clean.endsWith("g")) {
    return numeric / 1000;
  }
  // Fallback for unlabeled numbers
  return numeric >= 10 ? numeric / 1000 : numeric;
}

function calculateTotalWeight(items: any[]): number {
  if (!items || !Array.isArray(items) || items.length === 0) return 0.5;
  let total = 0;
  for (const item of items) {
    const qty = item.quantity || 1;
    const w = parseWeightToKg(item.size || "");
    total += w * qty;
  }
  return total > 0 ? total : 0.5;
}

function extractPincode(address: string): string {
  if (!address) return "";
  const match = address.match(/\b\d{6}\b/);
  return match ? match[0] : "";
}

export default function CartPage() {
  const { items, updateQuantity, removeItem, getTotalPrice, getTotalItems, clearCart } = useCartStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState<"address" | "processing">("address");
  const [savedAddresses, setSavedAddresses] = useState<string[]>([]);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number | null>(null);
  const [fetchingAddress, setFetchingAddress] = useState(false);
  const [address, setAddress] = useState({
    fullName: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    phone: ""
  });
  const [orderId, setOrderId] = useState<number | null>(null);
  const router = useRouter();

  // Shipping dynamic rates state variables
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [selectedRateId, setSelectedRateId] = useState("");
  const [shippingError, setShippingError] = useState<string | null>(null);

  const totalWeight = calculateTotalWeight(items);
  const dimensions = getDimensionsForWeight(totalWeight);

  const handleSelectRate = (rateId: string) => {
    setSelectedRateId(rateId);
    const selected = shippingRates.find((r) => r.id === rateId);
    if (selected) {
      setShippingCost(selected.charge);
    }
  };

  // Handle hydration and load Razorpay script
  useEffect(() => {
    setIsHydrated(true);
    
    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Fetch live shipping rates when checkout opens, pincode changes, or address changes
  useEffect(() => {
    if (!isCheckoutModalOpen) {
      setShippingRates([]);
      setShippingCost(0);
      setSelectedRateId("");
      setShippingError(null);
      return;
    }

    let activePincode = "";
    let shouldDebounce = false;

    if (showNewAddressForm) {
      activePincode = address.pincode.trim();
      shouldDebounce = true;
    } else if (selectedAddressIndex !== null && savedAddresses[selectedAddressIndex]) {
      activePincode = extractPincode(savedAddresses[selectedAddressIndex]);
      shouldDebounce = false;
    }

    if (!activePincode || activePincode.length !== 6) {
      setShippingRates([]);
      setShippingCost(0);
      setSelectedRateId("");
      if (showNewAddressForm && activePincode.length > 0) {
        setShippingError("Please enter a valid 6-digit delivery pincode.");
      } else if (!showNewAddressForm) {
        setShippingError("Please select a delivery address.");
      } else {
        setShippingError(null);
      }
      return;
    }

    const w = totalWeight;
    const l = dimensions.L;
    const b = dimensions.B;
    const h = dimensions.H;

    setShippingError(null);
    setIsLoadingRates(true);

    const fetchRates = async () => {
      try {
        const res = await fetch("/api/shipping/calculate-rates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destinationPincode: activePincode,
            weight: w,
            length: l,
            breadth: b,
            height: h
          })
        });

        const result = await res.json();
        if (result.success && Array.isArray(result.rates) && result.rates.length > 0) {
          const mappedRates = result.rates.map((r: any) => {
            const name = r.name || "";
            const isExpress = name.toLowerCase().includes("air") || name.toLowerCase().includes("express");
            let id = isExpress ? "12993" : "12992"; // B2C AIR and B2C Surface
            if (name.toLowerCase().includes("b2b")) {
              id = "12994";
            }
            return {
              id,
              name,
              charge: r.total_price ?? r.courier_charges ?? 65.0,
              estimatedDays: isExpress ? 2 : 5
            };
          });

          setShippingRates(mappedRates);

          // Auto-select cheapest rate
          const cheapest = mappedRates.reduce((prev: any, curr: any) => 
            prev.charge < curr.charge ? prev : curr
          );
          setSelectedRateId(cheapest.id);
          setShippingCost(cheapest.charge);
        } else {
          throw new Error(result.error || "No rates available. Pincode may be invalid or unserviceable.");
        }
      } catch (err: any) {
        console.error(err);
        setShippingRates([]);
        setShippingCost(0);
        setSelectedRateId("");
        setShippingError(err.message || "Error calculating rates. Location may be unserviceable.");
      } finally {
        setIsLoadingRates(false);
      }
    };

    if (shouldDebounce) {
      const timer = setTimeout(fetchRates, 500);
      return () => clearTimeout(timer);
    } else {
      fetchRates();
    }
  }, [
    isCheckoutModalOpen,
    showNewAddressForm,
    selectedAddressIndex,
    savedAddresses,
    address.pincode,
    totalWeight,
    dimensions.L,
    dimensions.B,
    dimensions.H
  ]);

  if (!isHydrated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C5A059] animate-spin" />
      </div>
    );
  }

  if (items.length === 0 && !isCheckoutModalOpen && !isProcessingPayment) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
        <div className="w-24 h-24 bg-brand/5 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="text-brand/20" size={40} />
        </div>
        <h1 className="text-3xl font-playfair font-bold text-brand mb-4">Your cart is empty</h1>
        <p className="text-brand/60 mb-10 text-center max-w-md leading-relaxed">
          Looks like you haven't added any premium selections yet. Explore our latest harvest and find your favorites.
        </p>
        <Link 
          href="/" 
          className="bg-brand text-white px-10 py-4 rounded-2xl font-bold tracking-widest uppercase text-sm hover:bg-brand-hover transition-all shadow-xl active:scale-95"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const shipping = shippingCost; 
  const total = subtotal + shipping;

  const handleCheckout = async () => {
    setIsCheckoutModalOpen(true);
    setPaymentStep("address");
    
    // Reset shipping states when opening checkout
    setShippingCost(0);
    setShippingRates([]);
    setSelectedRateId("");
    setShippingError(null);
    
    // Attempt to fetch saved addresses
    setFetchingAddress(true);
    try {
      const res = await fetch("/api/profile/address");
      const data = await res.json();
      if (data.success && data.addresses && data.addresses.length > 0) {
        setSavedAddresses(data.addresses);
        setSelectedAddressIndex(0);
        setShowNewAddressForm(false);
      } else {
        setSavedAddresses([]);
        setShowNewAddressForm(true);
      }
    } catch (e) {
      console.error("Failed to load saved addresses", e);
      setShowNewAddressForm(true);
    } finally {
      setFetchingAddress(false);
    }
  };

  const handleRazorpayPayment = async () => {
    setIsProcessingPayment(true);
    setPaymentStep("processing");

    try {
      // 1. Create Order on Backend
      const orderRes = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total })
      });
      
      const orderData = await orderRes.json();
      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to initiate payment");
      }

      // Find selected rate details to send
      const selectedRate = shippingRates.find((r) => r.id === selectedRateId);
      const shippingDetailsObj = selectedRate ? {
        courierId: selectedRate.id,
        courierName: selectedRate.name,
        shippingCharges: selectedRate.charge,
        weight: totalWeight,
        dimensions: dimensions
      } : null;

      // 2. Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_your_key_id", // Fallback for safety
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Nutspice Co.",
        description: "Premium Nut & Spice Selections",
        order_id: orderData.orderId,
        handler: async function (response: any) {
          // 3. Verify Payment and Create Order in DB
          try {
            const checkoutRes = await fetch("/api/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                items,
                totalAmount: total,
                paymentMethod: "online_prepaid",
                shippingAddress: showNewAddressForm 
                  ? `Name: ${address.fullName}, Street: ${address.street}, City: ${address.city}, State: ${address.state}, Pincode: ${address.pincode}, Contact: ${address.phone}`
                  : savedAddresses[selectedAddressIndex || 0],
                shippingDetails: shippingDetailsObj ? JSON.stringify(shippingDetailsObj) : null,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const checkoutData = await checkoutRes.json();
            if (checkoutData.success) {
              clearCart();
              router.push("/profile/orders");
            } else {
              alert("Checkout failed: " + checkoutData.error);
              setPaymentStep("address");
              setIsProcessingPayment(false);
            }
          } catch (err) {
            console.error("Verification error:", err);
            alert("Payment verification failed. Please contact support.");
            setPaymentStep("address");
            setIsProcessingPayment(false);
          }
        },
        prefill: {
          name: address.fullName,
          contact: address.phone,
        },
        theme: {
          color: "#005B41",
        },
        modal: {
          ondismiss: function() {
            setIsProcessingPayment(false);
            setPaymentStep("address");
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error: any) {
      console.error("Payment initiation error:", error);
      alert(error.message || "Something went wrong. Please try again.");
      setPaymentStep("address");
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
      <div className="flex items-center space-x-4 mb-6">
        <h1 className="text-3xl font-playfair font-bold text-brand">Shopping Cart</h1>
        <span className="bg-brand/5 text-brand/60 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
          {getTotalItems()} Items
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Cart Items List */}
        <div className="lg:col-span-8 space-y-5 lg:max-h-[75vh] lg:overflow-y-auto lg:pr-4 no-scrollbar">
          {items.map((item) => {
            const isBespoke = item.customizations?.type === "Bespoke";
            return (
              <div 
                key={item.id} 
                className={`group rounded-3xl p-4 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 border ${
                  isBespoke 
                    ? 'bg-[#F9F6EE] border-[#C5A059]/40' 
                    : 'bg-white border-brand/40 hover:border-brand/70'
                }`}
              >
              {/* Product Image */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-[#F9F6EE] rounded-2xl overflow-hidden flex-shrink-0 relative">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                />
              </div>

              {/* Item Info */}
              <div className="flex-1 flex flex-col h-full text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-base font-bold text-brand leading-tight">{item.name}</h3>
                      {isBespoke && (
                        <div className="flex items-center space-x-1 px-2 py-0.5 bg-[#C5A059] text-white rounded-full">
                          <Scissors size={10} />
                          <span className="text-[8px] font-black uppercase tracking-widest">Bespoke</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-1">
                      <span className="text-[9px] font-bold text-brand/40 uppercase tracking-widest bg-brand/5 px-2 py-0.5 rounded-full">
                        Weight: {item.size}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-0 text-lg font-bold text-brand">
                    ₹{item.price.toLocaleString()}
                  </div>
                </div>

                <div className="mt-auto pt-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-100">
                  {/* Quantity Selector */}
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden transition-colors hover:border-gray-300">
                    <button 
                      onClick={() => updateQuantity(item.id, -1)}
                      className="p-2 sm:px-3 hover:bg-gray-200 text-gray-600 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 sm:w-10 text-center font-bold text-gray-900 text-xs sm:text-sm">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, 1)}
                      disabled={item.quantity >= item.stock}
                      className="p-2 sm:px-3 hover:bg-gray-200 text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="mt-4 sm:mt-0 flex items-center space-x-2 text-gray-400 hover:text-red-500 transition-colors group/remove"
                  >
                    <div className="p-2 rounded-xl bg-gray-50 group-hover/remove:bg-red-50 transition-colors">
                      <Trash2 size={16} className="group-hover/remove:scale-110 transition-transform" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:block">Remove</span>
                  </button>
                </div>
              </div>
              </div>
            );
          })}
        </div>

        {/* Right: Price Summary */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 sticky top-24">
            <h2 className="text-sm font-bold mb-6 tracking-widest uppercase border-b border-gray-100 pb-4 text-brand">Order Summary</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center text-brand/60">
                <span className="text-xs font-bold tracking-widest uppercase">Subtotal</span>
                <span className="text-sm font-bold tracking-widest text-brand">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-brand/60 pb-4 border-b border-gray-100">
                <span className="text-xs font-bold tracking-widest uppercase">Shipping</span>
                {shippingCost > 0 ? (
                  <span className="text-[#005B41] font-bold text-sm">₹{shippingCost.toLocaleString()}</span>
                ) : (
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-[#005B41]">Calculated at checkout</span>
                )}
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-black tracking-widest uppercase text-brand">Total Amount</span>
                <span className="text-xl font-black text-[#005B41] tracking-widest">₹{total.toLocaleString()}</span>
              </div>
            </div>

            <button 
              onClick={handleCheckout}
              className="w-full bg-[#005B41] text-white py-4 rounded-xl font-bold tracking-widest uppercase text-xs hover:bg-[#004230] transition-all shadow-md flex items-center justify-center group active:scale-[0.98]"
            >
              Proceed to Checkout
              <ArrowRight size={16} className="ml-3 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <div className="mt-6 flex items-center justify-center space-x-3 opacity-40">
              <div className="text-[8px] text-brand uppercase tracking-[0.3em] font-black">Prepaid Only</div>
              <div className="h-1 w-1 rounded-full bg-brand"></div>
              <div className="text-[8px] text-brand uppercase tracking-[0.3em] font-black">Safe Checkout</div>
            </div>
          </div>
        </div>
      </div>

      {/* Razorpay Checkout Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-dark/40 backdrop-blur-md animate-in fade-in duration-300">
          <div 
            className="bg-white rounded-[2.5rem] w-full max-w-xl p-8 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >

            {paymentStep === "address" && (
              <div className="animate-in slide-in-from-right-5 duration-300">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="p-3 bg-brand/5 rounded-2xl text-brand">
                    {fetchingAddress ? <Loader2 size={24} className="animate-spin" /> : <MapPin size={24} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-brand">Delivery Address</h3>
                    <p className="text-[10px] text-brand/40 font-black uppercase tracking-widest">
                      {fetchingAddress ? "Looking for your saved address..." : "Where should we deliver your harvest?"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {!showNewAddressForm && savedAddresses.length > 0 ? (
                    <div className="space-y-4">
                      <div className="max-h-60 overflow-y-auto no-scrollbar space-y-3 pr-2">
                        {savedAddresses.map((addr, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => setSelectedAddressIndex(idx)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              selectedAddressIndex === idx 
                                ? 'border-[#C5A059] bg-[#C5A059]/5' 
                                : 'border-brand/10 hover:border-brand/30'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm font-medium text-brand whitespace-pre-wrap break-words min-w-0">{addr}</p>
                              {selectedAddressIndex === idx && <CheckCircle2 size={18} className="text-[#C5A059] flex-shrink-0 mt-1" />}
                            </div>
                          </div>
                        ))}
                      </div>
                      <button 
                        onClick={() => setShowNewAddressForm(true)}
                        className="w-full py-4 border-2 border-dashed border-brand/20 rounded-xl text-xs font-bold text-brand hover:bg-brand/5 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus size={16} /> Add New Address
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {savedAddresses.length > 0 && (
                        <button 
                          onClick={() => setShowNewAddressForm(false)}
                          className="text-xs font-bold text-brand hover:underline self-start mb-2 flex items-center gap-2"
                        >
                          &larr; Back to saved addresses
                        </button>
                      )}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-brand/40 uppercase tracking-widest ml-1">Full Name</label>
                        <input 
                          type="text" 
                          required
                          value={address.fullName}
                          onChange={(e) => setAddress({...address, fullName: e.target.value})}
                          className="w-full bg-brand/5 border border-brand/5 rounded-xl py-3 px-4 text-sm font-bold text-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all"
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-brand/40 uppercase tracking-widest ml-1">Street / Apartment / Landmark</label>
                        <input 
                          type="text" 
                          required
                          value={address.street}
                          onChange={(e) => setAddress({...address, street: e.target.value})}
                          className="w-full bg-brand/5 border border-brand/5 rounded-xl py-3 px-4 text-sm font-bold text-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all"
                          placeholder="123 Boutique Lane, Suite 4B"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-brand/40 uppercase tracking-widest ml-1">City</label>
                          <input 
                            type="text" 
                            required
                            value={address.city}
                            onChange={(e) => setAddress({...address, city: e.target.value})}
                            className="w-full bg-brand/5 border border-brand/5 rounded-xl py-3 px-4 text-sm font-bold text-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all"
                            placeholder="Mumbai"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-brand/40 uppercase tracking-widest ml-1">State</label>
                          <input 
                            type="text" 
                            required
                            value={address.state}
                            onChange={(e) => setAddress({...address, state: e.target.value})}
                            className="w-full bg-brand/5 border border-brand/5 rounded-xl py-3 px-4 text-sm font-bold text-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all"
                            placeholder="Maharashtra"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-brand/40 uppercase tracking-widest ml-1">Pincode</label>
                          <input 
                            type="text" 
                            required
                            maxLength={6}
                            value={address.pincode}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                              setAddress({...address, pincode: val});
                            }}
                            className="w-full bg-brand/5 border border-brand/5 rounded-xl py-3 px-4 text-sm font-bold text-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all"
                            placeholder="6 Digits"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-brand/40 uppercase tracking-widest ml-1">Contact Phone</label>
                          <input 
                            type="text" 
                            required
                            maxLength={10}
                            value={address.phone}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setAddress({...address, phone: val});
                            }}
                            className="w-full bg-brand/5 border border-brand/5 rounded-xl py-3 px-4 text-sm font-bold text-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all"
                            placeholder="10 Digits"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Delivery Options & Shipping Calculator */}
                  <div className="space-y-4 pt-4 border-t border-brand/5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-brand uppercase tracking-widest">
                        Delivery Options
                      </h4>
                      {isLoadingRates && (
                        <div className="flex items-center space-x-2 text-[10px] text-brand/40 font-bold uppercase tracking-wider">
                          <Loader2 size={12} className="animate-spin text-[#005B41]" />
                          <span>Loading rates...</span>
                        </div>
                      )}
                    </div>

                    {isLoadingRates ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-pulse">
                        <div className="p-4 rounded-2xl border border-brand/10 bg-brand/[0.01] flex items-start justify-between">
                          <div className="space-y-2 flex-grow">
                            <div className="h-4 bg-brand/10 rounded w-3/4"></div>
                            <div className="h-3 bg-brand/5 rounded w-1/2"></div>
                          </div>
                          <div className="h-4 bg-brand/10 rounded w-12"></div>
                        </div>
                        <div className="p-4 rounded-2xl border border-brand/10 bg-brand/[0.01] flex items-start justify-between">
                          <div className="space-y-2 flex-grow">
                            <div className="h-4 bg-brand/10 rounded w-3/4"></div>
                            <div className="h-3 bg-brand/5 rounded w-1/2"></div>
                          </div>
                          <div className="h-4 bg-brand/10 rounded w-12"></div>
                        </div>
                      </div>
                    ) : shippingError ? (
                      <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start space-x-3 text-rose-800">
                        <AlertTriangle size={18} className="flex-shrink-0 mt-0.5 text-rose-600" />
                        <div className="text-xs font-semibold">{shippingError}</div>
                      </div>
                    ) : shippingRates.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {shippingRates.map((rate) => {
                          const isSelected = selectedRateId === rate.id;
                          return (
                            <div
                              key={rate.id}
                              onClick={() => handleSelectRate(rate.id)}
                              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start justify-between ${
                                isSelected
                                  ? "border-[#005B41] bg-[#005B41]/[0.03] shadow-xs"
                                  : "border-brand/10 hover:border-brand/20 hover:bg-brand/[0.01]"
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <Truck size={14} className={isSelected ? "text-[#005B41]" : "text-brand/40"} />
                                  <span className="text-xs font-bold text-brand">{rate.name}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-[10px] font-medium text-brand/40">
                                  <span>Est: {rate.estimatedDays} days</span>
                                  <span className="flex items-center text-amber-500">
                                    <Star size={10} className="fill-amber-500 mr-0.5" />
                                    4.5
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-bold text-[#005B41]">₹{rate.charge.toFixed(2)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 bg-brand/5 rounded-2xl text-center border border-dashed border-brand/10">
                        <p className="text-[10px] font-black text-brand/30 uppercase tracking-widest">
                          Please enter or select a delivery address to calculate shipping.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Checkout Order Summary inside modal */}
                  {!isLoadingRates && !shippingError && shippingRates.length > 0 && (
                    <div className="bg-[#F9F6EE] border border-[#C5A059]/30 rounded-2xl p-4 space-y-2.5 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex justify-between items-center text-xs font-bold text-brand/60">
                        <span>Subtotal</span>
                        <span>₹{subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold text-brand/60">
                        <span>Shipping ({shippingRates.find(r => r.id === selectedRateId)?.name || "Courier"})</span>
                        <span>₹{shippingCost.toLocaleString()}</span>
                      </div>
                      <div className="border-t border-brand/10 pt-2 flex justify-between items-center text-sm font-black text-brand">
                        <span>Total Amount</span>
                        <span className="text-[#005B41]">₹{total.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsCheckoutModalOpen(false)}
                      className="flex-1 py-4 border-2 border-brand/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand/40 hover:bg-brand/5 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button"
                      disabled={
                        isLoadingRates ||
                        !!shippingError ||
                        shippingRates.length === 0 ||
                        (showNewAddressForm 
                          ? (!address.fullName || !address.street || !address.city || address.pincode.length !== 6 || address.phone.length !== 10)
                          : selectedAddressIndex === null)
                      }
                      onClick={handleRazorpayPayment}
                      className="flex-[2] py-4 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-hover shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Pay Now
                    </button>
                  </div>
                </div>
              </div>
            )}


            {paymentStep === "processing" && (
              <div className="py-20 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
                <div className="relative mb-10">
                  <div className="w-24 h-24 border-4 border-brand-accent/20 rounded-full"></div>
                  <div className="absolute inset-0 w-24 h-24 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ShieldCheck size={32} className="text-brand-accent animate-pulse" />
                  </div>
                </div>
                <h3 className="text-2xl font-playfair font-bold text-brand mb-2">Processing Payment</h3>
                <p className="text-[10px] text-brand/40 font-black uppercase tracking-widest">Verifying with your bank...</p>
              </div>
            )}


          </div>
        </div>
      )}
    </div>
  );
}
