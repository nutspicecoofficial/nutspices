"use client";

import React, { useState } from "react";
import { X, AlertTriangle, Loader2 } from "lucide-react";

interface DowngradeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  currentStatus: string;
  targetStatus: string;
  orderId: number;
}

export default function DowngradeConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  currentStatus,
  targetStatus,
  orderId
}: DowngradeConfirmationModalProps) {
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
      setError(err.message || "Failed to downgrade order status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-dark/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 border border-brand/5">
        {/* Header */}
        <div className="p-6 border-b border-brand/5 flex items-center justify-between bg-amber-50 text-amber-800">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="text-lg font-playfair font-bold">Downgrade Order #00{orderId}</h2>
              <p className="text-amber-600/60 text-[10px] font-black uppercase tracking-wider mt-0.5">
                Lifecycle State Warning
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

          <div className="space-y-4">
            <p className="text-brand text-sm font-medium leading-relaxed">
              You are about to move this order backwards from <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">{currentStatus}</span> to <span className="font-bold text-[#C5A059] bg-[#C5A059]/10 px-2 py-0.5 rounded">{targetStatus}</span>.
            </p>
            
            <p className="text-brand/60 text-xs leading-relaxed">
              Moving an order backwards in the fulfillment lifecycle may cause discrepancies in shipment state, inventory stock levels, or customer notifications. Please confirm if you wish to proceed.
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer shadow-amber-600/10"
            >
              {isSubmitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <span>Confirm Downgrade</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
