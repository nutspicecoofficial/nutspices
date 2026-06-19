"use client";

import React, { useState, useEffect } from "react";
import { X, Pencil, Loader2, MapPin } from "lucide-react";

interface EditAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  existingAddress: string;
  customerPhone: string;
  onSuccess: () => void;
}

function parseAddressString(addressStr: string) {
  const extract = (key: string) => {
    const regex = new RegExp(`${key}:\\s*([^,]+)`, 'i');
    const match = addressStr.match(regex);
    return match ? match[1].trim() : "";
  };

  const name = extract('Name');
  const street = extract('Street');
  const city = extract('City');
  const state = extract('State');
  const pincode = extract('Pincode');
  const contact = extract('Contact');

  return { name, street, city, state, pincode, contact };
}

export default function EditAddressModal({
  isOpen,
  onClose,
  orderId,
  existingAddress,
  customerPhone,
  onSuccess
}: EditAddressModalProps) {
  const [name, setName] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [alternateContact, setAlternateContact] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill inputs when modal opens or address changes
  useEffect(() => {
    if (isOpen && existingAddress) {
      const parsed = parseAddressString(existingAddress);
      setName(parsed.name);
      setStreet(parsed.street);
      setCity(parsed.city);
      setState(parsed.state);
      setPincode(parsed.pincode);
      setAlternateContact(parsed.contact);
      setError(null);
    }
  }, [isOpen, existingAddress]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !street.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
      setError("Please fill in all required fields (Name, Street, City, State, Pincode).");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/address`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          alternateContact: alternateContact.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update address.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update address.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-dark/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 border border-brand/5">
        {/* Header */}
        <div className="p-6 border-b border-brand/5 flex items-center justify-between bg-brand text-white">
          <div className="flex items-center space-x-3">
            <div className="bg-brand-accent p-2 rounded-xl text-white">
              <MapPin size={20} />
            </div>
            <div>
              <h2 className="text-lg font-playfair font-bold">Edit Shipping Address</h2>
              <p className="text-white/60 text-[10px] font-black uppercase tracking-wider mt-0.5">
                Order #00{orderId} Delivery Details
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-white/60 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {error && (
            <div className="p-4 bg-rose-50 text-rose-800 text-xs font-bold rounded-xl border border-rose-100 animate-in fade-in">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-2">Recipient Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Recipient Full Name"
                className="w-full bg-brand/5 border border-transparent focus:border-brand-accent/50 rounded-xl px-3 py-2.5 text-xs font-semibold text-brand outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-2">Street Address *</label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="House No, Building, Area, Colony"
                className="w-full bg-brand/5 border border-transparent focus:border-brand-accent/50 rounded-xl px-3 py-2.5 text-xs font-semibold text-brand outline-none transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-2">City *</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className="w-full bg-brand/5 border border-transparent focus:border-brand-accent/50 rounded-xl px-3 py-2.5 text-xs font-semibold text-brand outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-2">State *</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="State"
                  className="w-full bg-brand/5 border border-transparent focus:border-brand-accent/50 rounded-xl px-3 py-2.5 text-xs font-semibold text-brand outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-2">Pincode *</label>
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="6-digit Indian Pincode"
                  className="w-full bg-brand/5 border border-transparent focus:border-brand-accent/50 rounded-xl px-3 py-2.5 text-xs font-semibold text-brand outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-2">Alternate Contact</label>
                <input
                  type="text"
                  value={alternateContact}
                  onChange={(e) => setAlternateContact(e.target.value)}
                  placeholder="Alternate Phone Number"
                  className="w-full bg-brand/5 border border-transparent focus:border-brand-accent/50 rounded-xl px-3 py-2.5 text-xs font-semibold text-brand outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Read Only Core Account Phone */}
          <div className="pt-2 border-t border-brand/5">
            <p className="text-[10px] font-black text-brand/35 uppercase tracking-widest text-center">
              Account Phone: {customerPhone} - Unchangeable
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex space-x-3 pt-2">
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
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl text-white text-xs font-bold uppercase tracking-widest bg-brand hover:bg-brand-hover shadow-md shadow-brand/15 flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
