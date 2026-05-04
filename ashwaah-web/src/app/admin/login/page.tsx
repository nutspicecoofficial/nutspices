"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, Phone, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const adminPhone = "9999999999";

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(value);
    if (error) setError("");
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
    if (error) setError("");
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone !== adminPhone) {
      setError("Unauthorized phone number. This portal is for administrators only.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", phone }),
      });
      const data = await res.json();
      if (data.success) {
        setStep("otp");
      } else {
        setError(data.error || "Failed to send OTP");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", phone, otp, portal: "admin" }),
      });
      const data = await res.json();

      if (data.success) {
        router.push("/admin/navigation");
        router.refresh();
      } else {
        setError(data.error || "Invalid OTP");
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1B3022] flex flex-col justify-center items-center p-4 font-inter">



      <div className="w-full max-w-md bg-white rounded-3xl p-10 shadow-2xl border-t-[12px] border-t-[#C5A059] relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#C5A059]/5 rounded-full blur-3xl"></div>

        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#1B3022] flex items-center justify-center shadow-2xl relative">
            <Lock className="text-[#C5A059]" size={32} />
            <div className="absolute -bottom-2 -right-2 bg-[#C5A059] p-1.5 rounded-lg shadow-lg">
              <ShieldCheck size={16} className="text-[#1B3022]" />
            </div>
          </div>
          <h2 className="text-3xl font-playfair font-bold text-[#1B3022] mb-3">
            Admin Portal
          </h2>
          <p className="text-[#1B3022]/60 text-sm font-medium uppercase tracking-widest">
            {step === "phone" ? "Authorization Required" : "Security Verification"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-xl text-center">
            {error}
          </div>
        )}

        {/* STEP 1: Phone Number */}
        {step === "phone" && (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-[#1B3022]/40 uppercase mb-2 tracking-[0.2em] ml-1">Admin Phone</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center space-x-2 border-r border-[#1B3022]/10 pr-3">
                  <Phone size={14} className="text-[#C5A059]" />
                  <span className="text-[#1B3022] font-bold text-sm">+91</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="9999999999"
                  className="w-full bg-[#1B3022]/5 border-2 border-transparent focus:border-[#C5A059]/30 focus:bg-white rounded-xl py-4 pl-20 pr-4 text-[#1B3022] font-bold tracking-widest transition-all outline-none"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || phone.length !== 10}
              className="w-full bg-[#1B3022] text-white font-bold py-5 rounded-2xl shadow-xl hover:bg-[#2c4d37] disabled:opacity-50 transition-all active:scale-95 flex justify-center items-center space-x-2 group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span className="uppercase tracking-[0.2em] text-xs">Request Access</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: OTP Verification */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-[#1B3022]/40 uppercase mb-2 tracking-[0.2em] ml-1">Security Code</label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C5A059]" size={18} />
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={handleOtpChange}
                  placeholder="123456"
                  className="w-full bg-[#1B3022]/5 border-2 border-transparent focus:border-[#C5A059]/30 focus:bg-white rounded-xl py-4 px-12 text-[#1B3022] font-mono font-bold text-center text-2xl tracking-[0.5em] transition-all outline-none"
                  required
                />
              </div>
              <div className="flex justify-center mt-4">
                <button type="button" onClick={() => setStep("phone")} className="text-[10px] text-[#1B3022]/40 hover:text-[#1B3022] font-black uppercase tracking-widest transition-colors">Use different account</button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-[#C5A059] text-white font-bold py-5 rounded-2xl shadow-xl hover:bg-[#b39150] disabled:opacity-50 transition-all active:scale-95 flex justify-center items-center space-x-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="uppercase tracking-[0.2em] text-xs">Authorize Entry</span>
              )}
            </button>
          </form>
        )}
      </div>

      <p className="mt-10 text-center text-[10px] text-white/30 max-w-xs leading-relaxed uppercase tracking-[0.3em] font-bold">
        Ashwaah Management Infrastructure
      </p>
    </div>
  );
}
