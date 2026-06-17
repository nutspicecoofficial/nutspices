"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, Phone, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
    confirmationResult: ConfirmationResult;
  }
}

export default function AdminLogin() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const recaptchaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clean up on mount to prevent any stale verifiers from other pages
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        console.error("Error clearing recaptcha on mount:", e);
      }
      (window as any).recaptchaVerifier = null;
    }

    return () => {
      // Clean up on unmount
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          console.error("Error clearing recaptcha on unmount:", e);
        }
        (window as any).recaptchaVerifier = null;
      }
    };
  }, []);

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
    if (phone.length !== 10) return;

    setLoading(true);
    setError("");

    try {
      // 1. Pre-verify that the number is authorized in the server backend
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", phone, portal: "admin", checkOnly: true }),
      });
      const data = await res.json();
      
      if (!data.success) {
        setError(data.error || "Unauthorized phone number.");
        setLoading(false);
        return;
      }

      // Clean up any stale verifier (e.g. from user login page)
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          console.error("Error clearing stale recaptcha verifier:", e);
        }
        (window as any).recaptchaVerifier = null;
      }

      if (!recaptchaRef.current) {
        throw new Error("reCAPTCHA container element not found.");
      }

      // 2. Initialize Firebase reCAPTCHA verifier
      window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaRef.current, {
        size: "invisible",
        callback: () => {
          // reCAPTCHA solved
        },
      });

      const phoneNumber = `+91${phone}`;
      const appVerifier = window.recaptchaVerifier;

      // 3. Request OTP from Firebase
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      window.confirmationResult = confirmationResult;

      setStep("otp");
    } catch (err: any) {
      console.error("Firebase OTP Error:", err);
      if (err.code === "auth/invalid-phone-number") {
        setError("Invalid phone number format.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later.");
      } else {
        setError(err.message || "Failed to send OTP. Please check your connection.");
      }
      // Reset recaptcha on error
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          console.error("Error clearing recaptcha on send error:", e);
        }
        (window as any).recaptchaVerifier = null;
      }
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
      if (!window.confirmationResult) {
        throw new Error("No confirmation result found. Please resend OTP.");
      }

      // 1. Verify OTP with Firebase to get ID token
      const result = await window.confirmationResult.confirm(otp);
      const firebaseUser = result.user;
      const idToken = await firebaseUser.getIdToken();

      // 2. Authenticate the session on the backend
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", phone, idToken, portal: "admin" }),
      });
      const data = await res.json();

      if (data.success) {
        router.push("/admin/navigation");
        router.refresh();
      } else {
        setError(data.error || "Invalid OTP");
      }
    } catch (err: any) {
      console.error("Verification failed:", err);
      if (err.code === "auth/invalid-verification-code") {
        setError("Incorrect OTP. Please try again.");
      } else {
        setError(err.message || "Verification failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1B3022] flex flex-col justify-center items-center p-4 font-inter">
      <div className="w-full max-w-md bg-white rounded-3xl p-10 shadow-2xl border-t-[12px] border-t-[#C5A059] relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#C5A059]/5 rounded-full blur-3xl"></div>

        {/* Invisible reCAPTCHA container */}
        <div ref={recaptchaRef}></div>

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
        NutspiceCo Management Infrastructure
      </p>
    </div>
  );
}
