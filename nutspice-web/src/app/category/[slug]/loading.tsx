import React from "react";

export default function Loading() {
  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center bg-white/50 backdrop-blur-sm fixed inset-0 z-[100]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {/* Main outer ring */}
          <div className="w-16 h-16 border-4 border-brand/10 rounded-full"></div>
          {/* Spinning inner ring */}
          <div className="w-16 h-16 border-4 border-t-[#C5A059] border-r-[#C5A059] rounded-full animate-spin absolute top-0 left-0"></div>
          {/* Pulsing center dot */}
          <div className="w-2 h-2 bg-brand rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
        </div>
        <div className="flex flex-col items-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand/40 animate-pulse">
            Curating Collection
          </p>
        </div>
      </div>
    </div>
  );
}
