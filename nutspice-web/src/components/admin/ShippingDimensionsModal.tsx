"use client";

import React, { useState, useEffect } from "react";
import { X, Box, Truck, Loader2, Star } from "lucide-react";

interface CourierService {
  id: string;
  name: string;
  charge: number;
  estimatedDays: number;
  rating: number;
}

interface ShippingDimensionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    packageDetails: { 
      weight: number; 
      length: number; 
      width: number; 
      height: number;
      invoiceNumber?: string;
      invoiceDate?: string;
      courierId?: string;
    },
    courierId: string
  ) => Promise<void>;
  orderId: number;
  order?: any;
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

const formatDateForInput = (dateStrOrObj: string | Date): string => {
  if (!dateStrOrObj) return "";
  const date = typeof dateStrOrObj === "string" ? new Date(dateStrOrObj) : dateStrOrObj;
  if (isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function ShippingDimensionsModal({
  isOpen,
  onClose,
  onConfirm,
  orderId,
  order
}: ShippingDimensionsModalProps) {
  const [fulfillmentMode, setFulfillmentMode] = useState<'XPRESSBEES' | 'MANUAL'>('XPRESSBEES');
  const [manualCourierName, setManualCourierName] = useState("");
  const [manualAwbNumber, setManualAwbNumber] = useState("");
  const [manualTrackingUrl, setManualTrackingUrl] = useState("");
  const [manualCourierContact, setManualCourierContact] = useState("");

  const [weight, setWeight] = useState("0.5");
  const [length, setLength] = useState("10");
  const [breadth, setBreadth] = useState("10"); // Breadth maps to width
  const [height, setHeight] = useState("10");
  const [invoiceNumber, setInvoiceNumber] = useState(() => `NS-INV-${orderId}`);
  const [invoiceDate, setInvoiceDate] = useState(() => formatDateForInput(new Date()));
  const [selectedCourier, setSelectedCourier] = useState("");
  const [couriers, setCouriers] = useState<CourierService[]>([]);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isTiersLoaded, setIsTiersLoaded] = useState(false);
  const [dbTiers, setDbTiers] = useState<any[]>([]);
  const [isReady, setIsReady] = useState(false);

  // Fetch database package tiers on mount
  useEffect(() => {
    const fetchPackageTiers = async () => {
      try {
        const res = await fetch("/api/admin/settings/package-tiers");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setDbTiers(json.data);
        }
      } catch (err) {
        console.error("Failed to load package tiers in dimensions modal:", err);
      } finally {
        setIsTiersLoaded(true);
      }
    };
    fetchPackageTiers();
  }, []);

  // Auto-fill calculated weight and dimensions on modal mount/open once tiers are loaded
  useEffect(() => {
    if (!isOpen || !order || !isTiersLoaded) {
      if (!isOpen) {
        setIsReady(false);
      }
      return;
    }
    
    const calculatedW = calculateTotalWeight(order.items);
    setWeight(String(calculatedW));

    const totalWeightGrams = calculatedW * 1000;
    
    if (dbTiers.length > 0) {
      const matchedTier = dbTiers.find(t => t.maxWeightGrams >= totalWeightGrams);
      if (matchedTier) {
        setLength(String(matchedTier.lengthCm));
        setBreadth(String(matchedTier.breadthCm));
        setHeight(String(matchedTier.heightCm));
      } else {
        // Oversized Fallback: select the largest tier and scale dimensions proportionally
        const largestTier = dbTiers[dbTiers.length - 1];
        const ratio = totalWeightGrams / largestTier.maxWeightGrams;
        setLength(String(Math.ceil(largestTier.lengthCm * ratio)));
        setBreadth(String(Math.ceil(largestTier.breadthCm * ratio)));
        setHeight(String(Math.ceil(largestTier.heightCm * ratio)));
      }
    } else {
      // Fallback if no database tiers exist
      setLength("10");
      setBreadth("10");
      setHeight("10");
    }
    setIsReady(true);
  }, [isOpen, order, isTiersLoaded, dbTiers]);

  // Fetch live shipping rates whenever weight or dimensions change, with 500ms debounce
  useEffect(() => {
    if (!isOpen || !order || !isReady || fulfillmentMode === "MANUAL") return;

    const pincode = extractPincode(order.shippingAddress || "");
    if (!pincode) {
      setError("Could not find a valid 6-digit Indian pincode in shipping address.");
      setCouriers([]);
      setSelectedCourier("");
      return;
    }

    const w = parseFloat(weight);
    const l = parseFloat(length);
    const b = parseFloat(breadth);
    const h = parseFloat(height);

    if (isNaN(w) || w <= 0 || isNaN(l) || l <= 0 || isNaN(b) || b <= 0 || isNaN(h) || h <= 0) {
      // Inputs are invalid or temporarily empty while typing, don't query the API
      setCouriers([]);
      setSelectedCourier("");
      return;
    }

    setError(null);
    setIsLoadingRates(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/shipping/calculate-rates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destinationPincode: pincode,
            weight: w,
            length: l,
            breadth: b,
            height: h
          })
        });

        const result = await res.json();
        if (result.success && Array.isArray(result.rates)) {
          const mappedCouriers = result.rates.map((r: any) => {
            const name = r.name || "";
            const isExpress = name.toLowerCase().includes("air") || name.toLowerCase().includes("express");
            
            // Map rate service names to exact Xpressbees courier IDs
            let id = isExpress ? "12993" : "12992"; // production values for B2C AIR and B2C Surface
            if (name.toLowerCase().includes("b2b")) {
              id = "12994"; // B2B Surface
            }

            return {
              id: id,
              name: name,
              charge: r.total_price ?? r.courier_charges ?? 65.0,
              estimatedDays: isExpress ? 2 : 5,
              rating: isExpress ? 4.8 : 4.3
            };
          });

          setCouriers(mappedCouriers);

          // Auto-select first courier option if none selected, or if selected is not in current list
          if (mappedCouriers.length > 0) {
            const exists = mappedCouriers.find((c: CourierService) => c.id === selectedCourier);
            if (!exists) {
              setSelectedCourier(mappedCouriers[0].id);
            }
          } else {
            setSelectedCourier("");
          }
        } else {
          throw new Error(result.error || "Failed to load shipping rates.");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Error loading live shipping rates. Please verify inputs.");
        setCouriers([]);
        setSelectedCourier("");
      } finally {
        setIsLoadingRates(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [isOpen, weight, length, breadth, height, order?.shippingAddress, isReady]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (fulfillmentMode === "XPRESSBEES") {
        const w = parseFloat(weight);
        const l = parseFloat(length);
        const b = parseFloat(breadth);
        const h = parseFloat(height);

        if (isNaN(w) || w <= 0 || isNaN(l) || l <= 0 || isNaN(b) || b <= 0 || isNaN(h) || h <= 0) {
          setError("Please verify packaging dimension inputs. All numbers must be greater than 0.");
          setIsSubmitting(false);
          return;
        }

        if (!invoiceNumber.trim()) {
          setError("Please enter a valid invoice number.");
          setIsSubmitting(false);
          return;
        }

        if (!invoiceDate) {
          setError("Please select an invoice date.");
          setIsSubmitting(false);
          return;
        }

        if (!selectedCourier) {
          setError("Please select a courier service.");
          setIsSubmitting(false);
          return;
        }

        await onConfirm(
          { 
            weight: w, 
            length: l, 
            width: b, 
            height: h, 
            invoiceNumber, 
            invoiceDate, 
            courierId: selectedCourier 
          }, 
          selectedCourier
        );
      } else {
        if (!manualCourierName.trim()) {
          setError("Please enter a courier name.");
          setIsSubmitting(false);
          return;
        }

        if (!manualAwbNumber.trim()) {
          setError("Please enter a tracking ID / AWB.");
          setIsSubmitting(false);
          return;
        }

        await onConfirm(
          {
            mode: "MANUAL",
            manualDetails: {
              courierName: manualCourierName.trim(),
              awbNumber: manualAwbNumber.trim(),
              trackingUrl: manualTrackingUrl.trim() || undefined,
              courierContact: manualCourierContact.trim() || undefined
            },
            invoiceNumber: invoiceNumber.trim() || undefined,
            invoiceDate: invoiceDate || undefined
          } as any,
          ""
        );
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate shipment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-dark/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 border border-brand/5">
        {/* Header */}
        <div className="p-6 border-b border-brand/5 flex items-center justify-between bg-brand text-white">
          <div className="flex items-center space-x-3">
            <div className="bg-brand-accent p-2 rounded-xl text-white">
              <Box size={20} />
            </div>
            <div>
              <h2 className="text-lg font-playfair font-bold">Register Shipment - Order #00{orderId}</h2>
              <p className="text-white/60 text-[10px] font-black uppercase tracking-wider mt-0.5">
                Prepare Package & Allocate Courier
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-white/60 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {error && (
            <div className="p-4 bg-rose-50 text-rose-800 text-xs font-bold rounded-xl border border-rose-100 animate-in fade-in">
              {error}
            </div>
          )}

          {/* Fulfillment Mode Toggle */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em]">Fulfillment Mode</label>
            <div className="grid grid-cols-2 gap-2 bg-brand/5 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setFulfillmentMode("XPRESSBEES")}
                className={`py-2 px-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                  fulfillmentMode === "XPRESSBEES"
                    ? "bg-brand text-white shadow-xs cursor-pointer"
                    : "text-brand/60 hover:text-brand hover:bg-brand/5 cursor-pointer"
                }`}
              >
                XpressBees (Auto)
              </button>
              <button
                type="button"
                onClick={() => setFulfillmentMode("MANUAL")}
                className={`py-2 px-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                  fulfillmentMode === "MANUAL"
                    ? "bg-brand text-white shadow-xs cursor-pointer"
                    : "text-brand/60 hover:text-brand hover:bg-brand/5 cursor-pointer"
                }`}
              >
                Manual (Local)
              </button>
            </div>
          </div>

          {fulfillmentMode === "XPRESSBEES" ? (
            /* Packaging Dimensions (Auto mode only) */
            <div className="space-y-4 animate-in fade-in duration-200">
              <h3 className="text-xs font-bold text-brand uppercase tracking-widest border-b border-brand/5 pb-2">
                Packaging Dimensions
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-2">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full bg-brand/5 border border-transparent focus:border-brand-accent/50 rounded-xl px-3 py-2.5 text-xs font-semibold text-brand outline-none transition-all"
                    required={fulfillmentMode === "XPRESSBEES"}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-2">Length (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="w-full bg-brand/5 border border-transparent focus:border-brand-accent/50 rounded-xl px-3 py-2.5 text-xs font-semibold text-brand outline-none transition-all"
                    required={fulfillmentMode === "XPRESSBEES"}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-2">Breadth (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={breadth}
                    onChange={(e) => setBreadth(e.target.value)}
                    className="w-full bg-brand/5 border border-transparent focus:border-brand-accent/50 rounded-xl px-3 py-2.5 text-xs font-semibold text-brand outline-none transition-all"
                    required={fulfillmentMode === "XPRESSBEES"}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-2">Height (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full bg-brand/5 border border-transparent focus:border-brand-accent/50 rounded-xl px-3 py-2.5 text-xs font-semibold text-brand outline-none transition-all"
                    required={fulfillmentMode === "XPRESSBEES"}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Manual Courier Details Form */
            <div className="space-y-4 animate-in fade-in duration-200">
              <h3 className="text-xs font-bold text-brand uppercase tracking-widest border-b border-brand/5 pb-2">
                Manual Courier Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-2">Courier Name</label>
                  <input
                    type="text"
                    value={manualCourierName}
                    onChange={(e) => setManualCourierName(e.target.value)}
                    placeholder="e.g. India Post, DTDC"
                    className="w-full bg-brand/5 border border-transparent focus:border-brand-accent/50 rounded-xl px-3 py-2.5 text-xs font-semibold text-brand outline-none transition-all"
                    required={fulfillmentMode === "MANUAL"}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-2">Tracking ID / AWB</label>
                  <input
                    type="text"
                    value={manualAwbNumber}
                    onChange={(e) => setManualAwbNumber(e.target.value)}
                    placeholder="e.g. IP123456789IN"
                    className="w-full bg-brand/5 border border-transparent focus:border-brand-accent/50 rounded-xl px-3 py-2.5 text-xs font-semibold text-brand outline-none transition-all"
                    required={fulfillmentMode === "MANUAL"}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-2">Tracking URL</label>
                  <input
                    type="url"
                    value={manualTrackingUrl}
                    onChange={(e) => setManualTrackingUrl(e.target.value)}
                    placeholder="e.g. https://www.indiapost.gov.in/..."
                    className="w-full bg-brand/5 border border-transparent focus:border-brand-accent/50 rounded-xl px-3 py-2.5 text-xs font-semibold text-brand outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-2">Courier Contact</label>
                  <input
                    type="text"
                    value={manualCourierContact}
                    onChange={(e) => setManualCourierContact(e.target.value)}
                    placeholder="e.g. 1800-266-6868"
                    className="w-full bg-brand/5 border border-transparent focus:border-brand-accent/50 rounded-xl px-3 py-2.5 text-xs font-semibold text-brand outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Invoice Override (Rendered in both modes) */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-brand uppercase tracking-widest border-b border-brand/5 pb-2">
              Invoice Details Override
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-2">Invoice Number</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full bg-brand/5 border border-transparent focus:border-brand-accent/50 rounded-xl px-3 py-2.5 text-xs font-semibold text-brand outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-2">Invoice Date</label>
                <input
                  type="date"
                  value={invoiceDate}
                  min={order?.createdAt ? formatDateForInput(order.createdAt) : undefined}
                  max={formatDateForInput(new Date())}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full bg-brand/5 border border-transparent focus:border-brand-accent/50 rounded-xl px-3 py-2.5 text-xs font-semibold text-brand outline-none transition-all cursor-pointer"
                  required
                />
              </div>
            </div>
          </div>

          {/* Courier Selection (Rendered in Xpressbees mode only) */}
          {fulfillmentMode === "XPRESSBEES" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-brand/5 pb-2">
                <h3 className="text-xs font-bold text-brand uppercase tracking-widest">
                  Courier Service Options
                </h3>
                {isLoadingRates && (
                  <div className="flex items-center space-x-2 text-[10px] text-brand/40 font-bold uppercase tracking-wider">
                    <Loader2 size={12} className="animate-spin text-brand-accent" />
                    <span>Loading Live Rates...</span>
                  </div>
                )}
              </div>

              {isLoadingRates ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl border border-brand/10 bg-brand/[0.01] flex items-start justify-between animate-pulse">
                    <div className="space-y-2 flex-grow">
                      <div className="h-4 bg-brand/10 rounded w-3/4"></div>
                      <div className="h-3 bg-brand/5 rounded w-1/2"></div>
                    </div>
                    <div className="h-4 bg-brand/10 rounded w-12"></div>
                  </div>
                  <div className="p-4 rounded-2xl border border-brand/10 bg-brand/[0.01] flex items-start justify-between animate-pulse">
                    <div className="space-y-2 flex-grow">
                      <div className="h-4 bg-brand/10 rounded w-3/4"></div>
                      <div className="h-3 bg-brand/5 rounded w-1/2"></div>
                    </div>
                    <div className="h-4 bg-brand/10 rounded w-12"></div>
                  </div>
                </div>
              ) : couriers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {couriers.map((courier) => {
                    const isSelected = selectedCourier === courier.id;
                    return (
                      <div
                        key={courier.id}
                        onClick={() => setSelectedCourier(courier.id)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start justify-between ${
                          isSelected
                            ? "border-[#1B3022] bg-[#1B3022]/[0.03] shadow-xs"
                            : "border-brand/5 hover:border-brand/20 hover:bg-brand/[0.01]"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Truck size={14} className={isSelected ? "text-brand" : "text-brand/40"} />
                            <span className="text-xs font-bold text-brand">{courier.name}</span>
                          </div>
                          <div className="flex items-center space-x-3 text-[10px] font-medium text-brand/40">
                            <span>Est: {courier.estimatedDays} days</span>
                            <span className="flex items-center text-amber-500">
                              <Star size={10} className="fill-amber-500 mr-0.5" />
                              {courier.rating}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-brand">₹{courier.charge.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                !isLoadingRates && (
                  <div className="p-8 bg-brand/5 rounded-2xl text-center border border-dashed border-brand/10">
                    <p className="text-[10px] font-black text-brand/30 uppercase tracking-widest">
                      No available shipping services found.
                    </p>
                  </div>
                )
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex space-x-3 pt-2 border-t border-brand/5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-brand/10 text-brand text-xs font-bold uppercase tracking-widest hover:bg-brand/5 transition-all cursor-pointer"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                fulfillmentMode === "XPRESSBEES"
                  ? (isLoadingRates || !selectedCourier || isSubmitting)
                  : (isSubmitting || !manualCourierName.trim() || !manualAwbNumber.trim())
              }
              className={`flex-1 py-3 px-4 rounded-xl text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md flex items-center justify-center space-x-2 ${
                fulfillmentMode === "XPRESSBEES"
                  ? (selectedCourier && !isLoadingRates && !isSubmitting
                      ? "bg-brand hover:bg-brand-hover shadow-brand/15 cursor-pointer"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none")
                  : (!isSubmitting && manualCourierName.trim() && manualAwbNumber.trim()
                      ? "bg-brand hover:bg-brand-hover shadow-brand/15 cursor-pointer"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none")
              }`}
            >
              {isSubmitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <span>{fulfillmentMode === "XPRESSBEES" ? "Register & Get AWB" : "Save Manual Shipment"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
