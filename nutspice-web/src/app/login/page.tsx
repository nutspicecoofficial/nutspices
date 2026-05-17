"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ShieldCheck, User, Phone, Loader2 } from "lucide-react";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { auth } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
    confirmationResult: ConfirmationResult;
  }
}


export default function Login() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp" | "profile">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0 && step === "otp") {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer, step]);

  // Step 1: Handle Phone Input (Numeric only, max 10)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(value);
    if (error) setError("");
  };

  // Step 2: Handle OTP Input (Numeric only, max 6)
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
      // 1. Initialize reCAPTCHA
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
          'callback': () => {
            // reCAPTCHA solved - will proceed with submit
          }
        });
      }

      const phoneNumber = `+91${phone}`;
      const appVerifier = window.recaptchaVerifier;

      // 2. Request OTP from Firebase
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      window.confirmationResult = confirmationResult;
      
      setStep("otp");
      setTimer(60);
    } catch (err: any) {
      console.error("Firebase OTP Error:", err);
      if (err.code === "auth/invalid-phone-number") {
        setError("Invalid phone number format.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later.");
      } else {
        setError("Failed to send OTP. Please check your connection.");
      }
      // Reset recaptcha on error
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
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

      // 1. Verify OTP with Firebase
      const result = await window.confirmationResult.confirm(otp);
      const user = result.user;
      const idToken = await user.getIdToken();
      
      // 2. Check user status in our backend
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "verify", 
          phone, 
          idToken
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        if (data.isNewUser) {
          setStep("profile");
        } else {
          router.push("/");
          router.refresh();
        }
      } else {
        setError(data.error || "Login failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      if (err.code === "auth/invalid-verification-code") {
        setError("Incorrect OTP. Please try again.");
      } else {
        setError("Failed to verify OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        body: JSON.stringify({ phone, fullName }),
      });
      const data = await res.json();
      
      if (data.success) {
        router.push("/");
        router.refresh();
      } else {
        setError(data.error || "Failed to save profile");
      }
    } catch (err) {
      setError("Failed to complete profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-white flex flex-col md:flex-row font-inter selection:bg-brand-accent/30 overflow-hidden">
      {/* Left Side: Image (Hidden on mobile) */}
      <div className="hidden md:block w-1/2 relative bg-brand-light h-full">
        <img 
          src="/images/dry_fruits_login.png" 
          alt="Premium Dry Fruits" 
          className="absolute inset-0 w-full h-full object-cover shadow-2xl"
        />
        <div className="absolute inset-0 bg-black/10"></div>
        
        {/* Decorative branding on image */}
        <div className="absolute inset-0 flex flex-col justify-center items-center p-12 text-white text-center z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
          >
            <p className="text-xl font-medium opacity-90 drop-shadow-lg tracking-[0.2em] uppercase">Nature's Finest Treasures</p>
          </motion.div>
        </div>
        
        {/* Artistic overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-brand/40 to-transparent mix-blend-multiply"></div>
      </div>

      {/* Right Side: Form */}
      <div className="w-full md:w-1/2 h-full flex flex-col justify-center items-center p-8 md:p-16 relative bg-white overflow-y-auto no-scrollbar">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-right-4 duration-700">

          <div className="text-center mb-12">
            <div className="mb-8 flex justify-center">
              <Image
                src="/images/logo.png"
                alt="NutspiceCo Logo"
                width={180}
                height={50}
                className="object-contain drop-shadow-sm"
              />
            </div>
            <h2 className="text-4xl font-playfair font-bold text-brand mb-4">
              {step === "profile" ? "Welcome" : "Sign In"}
            </h2>
            <div className="px-6">
              <p className="text-brand/50 text-sm leading-relaxed font-medium">
                {step === "phone" && "Enter your mobile number to access your account."}
                {step === "otp" && `We've sent a 6-digit verification code to +91 ${phone}`}
                {step === "profile" && "One last step! Tell us your name to personalize your experience."}
              </p>
            </div>
          </div>

          {/* Invisible reCAPTCHA container */}
          <div id="recaptcha-container"></div>

          {error && (
            <div className="mb-8 p-5 bg-red-50 border border-red-100 text-red-500 text-xs font-bold rounded-2xl text-center flex items-center justify-center space-x-3 shadow-sm animate-in zoom-in-95">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
              <span className="uppercase tracking-widest">{error}</span>
            </div>
          )}

          {/* STEP 1: Phone Number */}
          {step === "phone" && (
            <form onSubmit={handleSendOTP} className="space-y-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-brand/30 uppercase tracking-[0.3em] ml-2">Mobile Number</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center space-x-3 border-r border-brand/10 pr-4">
                    <Phone size={16} className="text-[#C5A059]" />
                    <span className="text-brand font-bold text-base">+91</span>
                  </div>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="9999999999" 
                    className="w-full bg-brand/5 border-2 border-transparent focus:border-[#C5A059]/30 focus:bg-white focus:shadow-[0_0_40px_rgba(197,160,89,0.1)] rounded-2xl py-5 pl-24 pr-6 text-brand font-bold text-lg tracking-[0.2em] placeholder:text-brand/10 placeholder:tracking-normal transition-all outline-none"
                    required
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading || phone.length !== 10} 
                className="w-full bg-[#1B3022] text-[#C5A059] font-black uppercase tracking-[0.2em] text-xs py-5 rounded-2xl shadow-xl hover:bg-[#25422f] hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex justify-center items-center space-x-3"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span>Continue</span>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: OTP Verification */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOTP} className="space-y-8">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-brand/30 uppercase tracking-[0.3em] ml-2">Verification Code</label>
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2">
                    <ShieldCheck className="text-[#C5A059]" size={20} />
                  </div>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    value={otp}
                    onChange={handleOtpChange}
                    placeholder="------" 
                    className="w-full bg-brand/5 border-2 border-transparent focus:border-[#C5A059]/30 focus:bg-white focus:shadow-[0_0_40px_rgba(197,160,89,0.1)] rounded-2xl py-6 px-12 text-brand font-mono font-bold text-center text-4xl tracking-[0.4em] placeholder:text-brand/10 transition-all outline-none"
                    required
                  />
                </div>
                <div className="flex justify-between mt-6 px-2">
                  <button type="button" onClick={() => setStep("phone")} className="text-[10px] text-brand/40 hover:text-[#C5A059] font-black uppercase tracking-widest transition-all">Change Number</button>
                  <button 
                    type="button" 
                    onClick={handleSendOTP}
                    disabled={timer > 0 || loading}
                    className={`text-[10px] font-black uppercase tracking-widest transition-all ${timer > 0 ? "text-brand/20 cursor-not-allowed" : "text-[#C5A059] hover:underline"}`}
                  >
                    {timer > 0 ? `Resend in ${timer}s` : "Resend Code"}
                  </button>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading || otp.length !== 6} 
                className="w-full bg-[#1B3022] text-[#C5A059] font-black uppercase tracking-[0.2em] text-xs py-5 rounded-2xl shadow-xl hover:bg-[#25422f] hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex justify-center items-center space-x-3"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span>Verify & Login</span>
                )}
              </button>
            </form>
          )}

          {/* STEP 3: Profile Setup */}
          {step === "profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-brand/30 uppercase tracking-[0.3em] ml-2">Full Name</label>
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2">
                    <User className="text-[#C5A059]" size={20} />
                  </div>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe" 
                    className="w-full bg-brand/5 border-2 border-transparent focus:border-[#C5A059]/30 focus:bg-white focus:shadow-[0_0_40px_rgba(197,160,89,0.1)] rounded-2xl py-5 pl-14 pr-6 text-brand font-bold text-lg transition-all outline-none"
                    required
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading || !fullName.trim()} 
                className="w-full bg-[#1B3022] text-[#C5A059] font-black uppercase tracking-[0.2em] text-xs py-5 rounded-2xl shadow-xl hover:bg-[#25422f] hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex justify-center items-center space-x-3"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span>Complete Setup</span>
                )}
              </button>
            </form>
          )}
        </div>

        <div className="mt-16 text-center">
          <p className="text-[10px] text-brand/30 max-w-xs leading-relaxed uppercase tracking-[0.2em] font-black">
            Secure login powered by NutspiceCo. By continuing, you agree to our <a href="#" className="text-brand/60 hover:text-brand underline decoration-[#C5A059]/30 underline-offset-4 transition-all">Terms</a> & <a href="#" className="text-brand/60 hover:text-brand underline decoration-[#C5A059]/30 underline-offset-4 transition-all">Privacy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}


