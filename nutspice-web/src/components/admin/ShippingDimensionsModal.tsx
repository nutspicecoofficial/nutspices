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
  order?: { createdAt?: string | Date };
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
  const [weight, setWeight] = useState("0.5");
  const [length, setLength] = useState("10");
  const [breadth, setBreadth] = useState("10"); // Breadth maps to width
  const [height, setHeight] = useState("10");
  const [invoiceNumber, setInvoiceNumber] = useState(() => `NS-INV-${orderId}`);
  const [invoiceDate, setInvoiceDate] = useState(() => formatDateForInput(new Date()));
  const [selectedCourier, setSelectedCourier] = useState("");
  const [couriers, setCouriers] = useState<CourierService[]>([]);
  const [loadingCouriers, setLoadingCouriers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch couriers once when the modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchCouriers = async () => {
      setLoadingCouriers(true);
      setError(null);
      try {
        const query = new URLSearchParams({
          weight: weight || "0.5",
          length: length || "10",
          width: breadth || "10",
          height: height || "10"
        });
        const res = await fetch(`/api/admin/shipping/couriers?${query.toString()}`);
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          setCouriers(result.data);
          // Auto-select first courier option if none selected
          if (result.data.length > 0) {
            const exists = result.data.find((c: CourierService) => c.id === selectedCourier);
            if (!exists) {
              setSelectedCourier(result.data[0].id);
            }
          } else {
            setSelectedCourier("");
          }
        } else {
          throw new Error(result.error || "Failed to load couriers.");
        }
      } catch (err: unknown) {
        console.error(err);
        setError("Error loading live shipping rates. Please verify inputs.");
      } finally {
        setLoadingCouriers(false);
      }
    };

    fetchCouriers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weight);
    const l = parseFloat(length);
    const b = parseFloat(breadth);
    const h = parseFloat(height);

    if (isNaN(w) || w <= 0 || isNaN(l) || l <= 0 || isNaN(b) || b <= 0 || isNaN(h) || h <= 0) {
      setError("Please verify packaging dimension inputs. All numbers must be greater than 0.");
      return;
    }

    if (!invoiceNumber.trim()) {
      setError("Please enter a valid invoice number.");
      return;
    }

    if (!invoiceDate) {
      setError("Please select an invoice date.");
      return;
    }

    if (!selectedCourier) {
      setError("Please select a courier service.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
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

          {/* Package details */}
          <div className="space-y-4">
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
                  required
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
                  required
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
                  required
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
                  required
                />
              </div>
            </div>
          </div>

          {/* Invoice Override */}
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

          {/* Courier Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-brand/5 pb-2">
              <h3 className="text-xs font-bold text-brand uppercase tracking-widest">
                Courier Service Options
              </h3>
              {loadingCouriers && (
                <div className="flex items-center space-x-2 text-[10px] text-brand/40 font-bold uppercase tracking-wider">
                  <Loader2 size={12} className="animate-spin text-brand-accent" />
                  <span>Loading Live Rates...</span>
                </div>
              )}
            </div>

            {couriers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {couriers.map((courier) => {
                  const isSelected = selectedCourier === courier.id;
                  return (
                    <div
                      key={courier.id}
                      onClick={() => setSelectedCourier(courier.id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start justify-between ${
                        isSelected
                          ? "border-brand bg-brand/[0.02] shadow-sm"
                          : "border-brand/5 hover:border-brand/10"
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
              !loadingCouriers && (
                <div className="p-8 bg-brand/5 rounded-2xl text-center border border-dashed border-brand/10">
                  <p className="text-[10px] font-black text-brand/30 uppercase tracking-widest">
                    No available shipping services found.
                  </p>
                </div>
              )
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex space-x-3 pt-2 border-t border-brand/5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-brand/10 text-brand text-xs font-bold uppercase tracking-widest hover:bg-brand/5 transition-all"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loadingCouriers || !selectedCourier || isSubmitting}
              className={`flex-1 py-3 px-4 rounded-xl text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md flex items-center justify-center space-x-2 ${
                selectedCourier && !loadingCouriers && !isSubmitting
                  ? "bg-brand hover:bg-brand-hover shadow-brand/15 cursor-pointer"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
              }`}
            >
              {isSubmitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <span>Register & Get AWB</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
