"use client";

import React, { useState, useEffect } from "react";
import { X, HelpCircle, Loader2, AlertTriangle } from "lucide-react";

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
  const [typedAwb, setTypedAwb] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset states on open
  useEffect(() => {
    if (isOpen) {
      setTypedAwb("");
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typedAwb !== awbNumber) {
      setError("Entered AWB number does not match.");
      return;
    }

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 border border-brand/5">
        
        {/* Header */}
        <div className="p-6 border-b border-brand/5 flex items-center justify-between bg-rose-50 text-rose-800">
          <div className="flex items-center space-x-3">
            <div className="bg-rose-100 p-2 rounded-xl text-rose-600">
              <AlertTriangle size={20} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Cancel Courier Shipment</h2>
              <p className="text-rose-600/60 text-[8px] font-black uppercase tracking-wider mt-0.5">
                Xpressbees AWB Voiding
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-rose-400 hover:text-rose-600 hover:bg-rose-100/50 p-1.5 rounded-lg transition-all cursor-pointer"
            title="Close"
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

          <div className="p-4 bg-rose-50/50 border border-rose-200/55 rounded-2xl flex items-start gap-2.5 select-none">
            <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={16} />
            <div className="text-[10px] text-rose-900 font-bold leading-normal uppercase">
              Visual Warning: This action will permanently void the active shipping label and retract the consignment from Xpressbees routing list.
            </div>
          </div>

          <div className="text-xs text-brand/60 leading-relaxed space-y-3">
            <p>
              Are you sure you want to cancel the registered courier shipment for order <strong>#00{orderId}</strong>? The order status will revert to <strong>Processing</strong> state.
            </p>
            <div className="bg-brand/5 p-3 rounded-xl border border-brand/5 font-semibold text-brand text-center select-all">
              Airway Bill (AWB) to Void: <code className="text-[#C5A059] font-mono text-sm">{awbNumber}</code>
            </div>
          </div>

          {/* Typing confirmation */}
          <div className="space-y-2">
            <label className="block text-[9px] font-black text-brand/40 uppercase tracking-widest">
              Confirm AWB Number *
            </label>
            <input
              type="text"
              required
              placeholder={`Type exact AWB: ${awbNumber}`}
              value={typedAwb}
              onChange={(e) => setTypedAwb(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-brand/10 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-[#C5A059]/10 focus:border-[#C5A059] text-sm font-bold text-brand font-mono text-center"
              autoComplete="off"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-brand/10 text-brand text-xs font-bold uppercase tracking-widest hover:bg-brand/5 transition-all cursor-pointer text-center"
              disabled={isSubmitting}
            >
              No, Keep AWB
            </button>
            <button
              type="submit"
              disabled={isSubmitting || typedAwb !== awbNumber}
              className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-rose-600/30 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md shadow-rose-600/10 flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <span>Confirm Cancellation</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
