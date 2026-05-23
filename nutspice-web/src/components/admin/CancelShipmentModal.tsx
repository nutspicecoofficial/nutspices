"use client";

import React, { useState } from "react";
import { X, HelpCircle, Loader2 } from "lucide-react";

interface CancelShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  awbNumber: string;
  orderId: number;
}

export default function CancelShipmentModal({
  isOpen,
  onClose,
  onConfirm,
  awbNumber,
  orderId
}: CancelShipmentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to cancel shipment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-dark/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 border border-brand/5">
        {/* Header */}
        <div className="p-6 border-b border-brand/5 flex items-center justify-between bg-amber-50 text-amber-800">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
              <HelpCircle size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold">Cancel Courier Shipment</h2>
              <p className="text-amber-600/60 text-[8px] font-black uppercase tracking-wider mt-0.5">
                Xpressbees Cancellation
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-amber-400 hover:text-amber-600 hover:bg-amber-100/50 p-1.5 rounded-lg transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1">
          {error && (
            <div className="p-4 bg-rose-50 text-rose-800 text-xs font-bold rounded-xl border border-rose-100 animate-in fade-in">
              {error}
            </div>
          )}

          <div className="text-xs text-brand/60 leading-relaxed space-y-2">
            <p>
              Are you sure you want to cancel the registered courier shipment for order <strong>#00{orderId}</strong>?
            </p>
            <div className="bg-brand/5 p-3 rounded-xl border border-brand/5 font-semibold text-brand text-center">
              Airway Bill (AWB): <code className="text-[#C5A059]">{awbNumber}</code>
            </div>
            <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wide">
              * This will retract the package consignment from the Xpressbees routing list.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-brand/10 text-brand text-xs font-bold uppercase tracking-widest hover:bg-brand/5 transition-all"
              disabled={isSubmitting}
            >
              No, Keep
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md shadow-amber-600/10 flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <span>Yes, Cancel AWB</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
