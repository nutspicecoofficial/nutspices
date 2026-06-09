"use client";

import React, { useState } from "react";
import { X, MapPin } from "lucide-react";

interface PincodeEstimatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (pincode: string) => void;
}

export default function PincodeEstimatorModal({ isOpen, onClose, onSubmit }: PincodeEstimatorModalProps) {
  const [pincode, setPincode] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pincode.replace(/\D/g, "");
    if (clean.length !== 6) {
      setError("Pincode must be exactly 6 digits.");
      return;
    }
    setError("");
    onSubmit(clean);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-brand-dark/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative overflow-hidden border border-brand/5 animate-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-brand/40 hover:text-brand transition-colors p-1"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2.5 bg-[#005B41]/5 rounded-xl text-[#005B41]">
            <MapPin size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-brand">Estimate Delivery</h3>
            <p className="text-[9px] text-brand/40 font-black uppercase tracking-widest">
              Enter pincode for shipping rates
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-brand/40 uppercase tracking-widest ml-1">
              Indian Pincode (6 Digits)
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={pincode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                setPincode(val);
                if (val.length === 6) {
                  setError("");
                }
              }}
              className="w-full bg-brand/5 border border-brand/5 focus:border-[#C5A059]/50 rounded-xl py-3 px-4 text-sm font-bold text-brand focus:outline-none focus:ring-2 focus:ring-[#C5A059]/20 transition-all"
              placeholder="e.g. 500035"
            />
            {error && <p className="text-[10px] font-semibold text-rose-600 ml-1">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={pincode.length !== 6}
            className="w-full bg-[#005B41] text-white py-3 rounded-xl font-bold tracking-widest uppercase text-xs hover:bg-[#004230] transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Calculate
          </button>
        </form>
      </div>
    </div>
  );
}
