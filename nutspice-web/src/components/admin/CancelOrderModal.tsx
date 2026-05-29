"use client";

import React, { useState } from "react";
import { X, AlertTriangle, Loader2 } from "lucide-react";

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (cancelReason: string) => Promise<void>;
  orderId: number;
}

export default function CancelOrderModal({
  isOpen,
  onClose,
  onConfirm,
  orderId
}: CancelOrderModalProps) {
  const [confirmInput, setConfirmInput] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetConfirmText = `NS${orderId}`;
  const isMatch =
    confirmInput.trim() === String(orderId) ||
    confirmInput.trim().toUpperCase() === targetConfirmText.toUpperCase() ||
    confirmInput.trim() === `00${orderId}` ||
    confirmInput.trim() === `#00${orderId}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMatch) return;
    if (!cancelReason.trim()) {
      setError("Cancellation reason is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(cancelReason);
      setConfirmInput("");
      setCancelReason("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to cancel order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-dark/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 border border-brand/5">
        {/* Header */}
        <div className="p-6 border-b border-brand/5 flex items-center justify-between bg-rose-50 text-rose-800">
          <div className="flex items-center space-x-3">
            <div className="bg-rose-100 p-2 rounded-xl text-rose-600">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="text-lg font-playfair font-bold">Cancel Order #00{orderId}</h2>
              <p className="text-rose-600/60 text-[10px] font-black uppercase tracking-wider mt-0.5">
                Critical Administrative Action
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-rose-400 hover:text-rose-600 hover:bg-rose-100/50 p-1.5 rounded-lg transition-all"
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

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-800 text-xs leading-relaxed">
            <strong>Warning:</strong> Cancelling this order will release all reserved virtual stocks. This action cannot be undone.
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-2">
                Type <span className="text-rose-600 font-bold">{targetConfirmText}</span> to confirm *
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={targetConfirmText}
                className="w-full bg-brand/5 border border-transparent focus:border-rose-500/50 rounded-2xl px-4 py-3.5 text-sm font-semibold text-brand outline-none transition-all placeholder:text-brand/20"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-2">
                Cancellation Reason *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please state the reason for cancellation..."
                rows={3}
                className="w-full bg-brand/5 border border-transparent focus:border-rose-500/50 rounded-2xl px-4 py-3.5 text-sm font-semibold text-brand outline-none transition-all placeholder:text-brand/20 resize-none"
                required
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-brand/10 text-brand text-xs font-bold uppercase tracking-widest hover:bg-brand/5 transition-all"
              disabled={isSubmitting}
            >
              Close
            </button>
            <button
              type="submit"
              disabled={!isMatch || !cancelReason.trim() || isSubmitting}
              className={`flex-1 py-3 px-4 rounded-xl text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md flex items-center justify-center space-x-2 ${
                isMatch && cancelReason.trim() && !isSubmitting
                  ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/10 cursor-pointer"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
              }`}
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
