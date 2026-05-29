"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  AlertTriangle, 
  Loader2, 
  CheckCircle2, 
  Calendar, 
  Phone, 
  MapPin, 
  MessageSquare 
} from "lucide-react";

interface NdrActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  awbNumber: string;
  courierRemarks: string;
  onSuccess: () => void;
}

export default function NdrActionModal({
  isOpen,
  onClose,
  awbNumber,
  courierRemarks,
  onSuccess
}: NdrActionModalProps) {
  const [action, setAction] = useState<"re-attempt" | "update-phone" | "update-address">("re-attempt");
  const [reAttemptDate, setReAttemptDate] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [remarks, setRemarks] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  // Set default re-attempt date to today or tomorrow
  useEffect(() => {
    if (isOpen) {
      setReAttemptDate(todayStr);
      // Reset form states
      setPhone("");
      setAddress("");
      setRemarks("");
      setAction("re-attempt");
      setError(null);
      setSuccess(false);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, ""); // Allow only digits
    if (val.length <= 10) {
      setPhone(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // 1. Validation
    if (!remarks.trim()) {
      setError("Remarks are required for all resolution actions.");
      setLoading(false);
      return;
    }

    let actionData: any = {};
    if (action === "re-attempt") {
      if (!reAttemptDate) {
        setError("Re-attempt date is required.");
        setLoading(false);
        return;
      }
    } else if (action === "update-phone") {
      if (phone.length !== 10) {
        setError("Phone number must be exactly 10 digits.");
        setLoading(false);
        return;
      }
      // Franchise API payload maps to action_data
      actionData = {
        phone: phone,
        new_phone_number: phone // Map both to be fully compatible with multiple API configurations
      };
    } else if (action === "update-address") {
      if (!address.trim()) {
        setError("Updated delivery address cannot be empty.");
        setLoading(false);
        return;
      }
      actionData = {
        address_1: address.trim()
      };
    }

    // 2. Submit payload
    const payload = {
      awb: awbNumber,
      action: action,
      action_data: actionData,
      re_attempt_date: action === "re-attempt" ? reAttemptDate : "",
      remarks: remarks.trim()
    };

    try {
      const res = await fetch("/api/shipping/ndr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit resolution request.");
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error("NDR resolution error:", err);
      setError(err.message || "An unexpected error occurred during submission.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-brand/5 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 bg-[#1B3022] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <AlertTriangle size={20} className="animate-pulse" />
            </div>
            <div>
              <h3 className="font-playfair text-lg font-bold">Resolve Shipping Exception</h3>
              <p className="text-[10px] text-white/60 tracking-wider font-bold uppercase mt-0.5">AWB: {awbNumber}</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Courier Exception Remark Display */}
          <div className="p-4 bg-amber-50 border border-amber-200/50 rounded-2xl">
            <span className="block text-[9px] font-black text-amber-800 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <AlertTriangle size={10} /> Courier Exception Remarks
            </span>
            <p className="text-xs text-amber-900 font-semibold leading-relaxed italic">
              "{courierRemarks || "No remarks provided by courier."}"
            </p>
          </div>

          {/* Action Choice Selection */}
          <div>
            <label className="block text-[9px] font-black text-brand/40 uppercase tracking-widest mb-2">
              Required Resolution Action
            </label>
            <div className="relative">
              <select
                value={action}
                onChange={(e) => setAction(e.target.value as any)}
                className="w-full px-4 py-3 bg-white border border-brand/10 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-[#C5A059]/10 focus:border-[#C5A059] text-sm text-brand font-bold uppercase tracking-wider cursor-pointer"
              >
                <option value="re-attempt">⚡ Re-Attempt Delivery</option>
                <option value="update-phone">📞 Update Customer Phone Number</option>
                <option value="update-address">📍 Update Delivery Address</option>
              </select>
            </div>
          </div>

          {/* Dynamic Fields Section */}
          <div className="space-y-4 pt-1">
            {action === "re-attempt" && (
              <div className="animate-in slide-in-from-top-2 duration-200">
                <label className="block text-[9px] font-black text-brand/40 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Calendar size={12} className="text-[#C5A059]" /> Preferred Re-attempt Date *
                </label>
                <input
                  type="date"
                  required
                  min={todayStr}
                  value={reAttemptDate}
                  onChange={(e) => setReAttemptDate(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-brand/10 rounded-xl shadow-xs focus:outline-none focus:border-[#C5A059] text-xs font-semibold text-brand"
                />
              </div>
            )}

            {action === "update-phone" && (
              <div className="animate-in slide-in-from-top-2 duration-200">
                <label className="block text-[9px] font-black text-brand/40 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Phone size={12} className="text-[#C5A059]" /> New 10-Digit Mobile Number *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-brand/40">+91</span>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="Enter phone number"
                    value={phone}
                    onChange={handlePhoneChange}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-brand/10 rounded-xl shadow-xs focus:outline-none focus:border-[#C5A059] text-sm font-bold text-brand font-mono"
                  />
                </div>
                <p className="text-[10px] text-brand/40 font-medium mt-1">Must be a valid 10-digit Indian mobile number.</p>
              </div>
            )}

            {action === "update-address" && (
              <div className="animate-in slide-in-from-top-2 duration-200">
                <label className="block text-[9px] font-black text-brand/40 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <MapPin size={12} className="text-[#C5A059]" /> New Delivery Address *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Enter complete alternate delivery address, including flat/house number, area, city, state, and 6-digit pincode."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-brand/10 rounded-xl shadow-xs focus:outline-none focus:border-[#C5A059] text-xs font-medium text-brand leading-relaxed"
                />
              </div>
            )}

            {/* General Remarks Textarea (Required for all) */}
            <div>
              <label className="block text-[9px] font-black text-brand/40 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <MessageSquare size={12} className="text-[#C5A059]" /> Resolution Remarks / Instructions *
              </label>
              <textarea
                required
                rows={2}
                placeholder="Provide instructions to the delivery agent (e.g. 'Customer is available after 5 PM', 'Call before delivery')."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-brand/10 rounded-xl shadow-xs focus:outline-none focus:border-[#C5A059] text-xs font-medium text-brand leading-relaxed"
              />
            </div>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex gap-2 items-start animate-shake">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex gap-2 items-center animate-bounce">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>Resolution submitted successfully! Refreshing...</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              disabled={loading || success}
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-brand/5 hover:bg-brand/10 disabled:bg-brand/5 text-brand rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 py-3 px-4 bg-[#1B3022] hover:bg-brand disabled:bg-brand/30 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  SUBMITTING...
                </>
              ) : (
                "SUBMIT RESOLUTION"
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
