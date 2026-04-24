"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Ruler, Plus, Minus, ShoppingBag } from "lucide-react";

type DrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  baseSize: string;
};

export default function RefineDrawer({ isOpen, onClose, baseSize }: DrawerProps) {
  const [waistAdj, setWaistAdj] = useState(0);
  const [lengthAdj, setLengthAdj] = useState(0);
  const [sleeveAdj, setSleeveAdj] = useState(0);

  const formatAdj = (val: number) => (val > 0 ? `+${val.toFixed(1)}"` : val === 0 ? "Standard" : `${val.toFixed(1)}"`);

  const AdjustmentControl = ({ title, desc, value, setValue, min = -2, max = 2, step = 0.5 }: any) => (
    <div className="py-6 border-b border-brand/10">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="text-sm font-bold text-brand tracking-wider uppercase">{title}</h4>
          <p className="text-xs text-brand/60 mt-1 font-medium">{desc}</p>
        </div>
        <span className="text-brand font-mono text-sm font-bold bg-brand-accent/20 px-2 py-1 rounded">
          {formatAdj(value)}
        </span>
      </div>
      
      <div className="flex items-center space-x-4 mt-4">
        <button 
          onClick={() => setValue(Math.max(min, value - step))}
          className="p-2 rounded-full bg-white border border-brand/20 hover:border-brand text-brand transition-colors shadow-sm"
        >
          <Minus size={16} />
        </button>
        
        <div className="flex-1 relative h-1.5 bg-brand/10 rounded-full overflow-hidden border border-brand/5">
          <div 
            className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-brand-accent transition-all shadow-sm"
            style={{ left: `${((value - min) / (max - min)) * 100}%` }}
          />
        </div>

        <button 
          onClick={() => setValue(Math.min(max, value + step))}
          className="p-2 rounded-full bg-white border border-brand/20 hover:border-brand text-brand transition-colors shadow-sm"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-brand-dark/50 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-brand-light border-l border-brand-accent z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-brand/10 flex justify-between items-center bg-white border-t-4 border-t-brand-accent">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-brand-light rounded-md border border-brand/10">
                  <Ruler className="text-brand-accent" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-serif font-bold text-brand">Refine Your Fit</h2>
                  <p className="text-xs text-brand/60 font-semibold">Base Size: {baseSize || "Not selected"}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-brand/50 hover:text-brand transition">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-2 no-scrollbar">
              <AdjustmentControl 
                title="Waist" 
                desc="Adjust for a tighter or looser midsection." 
                value={waistAdj} 
                setValue={setWaistAdj} 
              />
              <AdjustmentControl 
                title="Sleeve Length" 
                desc="Perfect for shorter or longer arms." 
                value={sleeveAdj} 
                setValue={setSleeveAdj} 
              />
              <AdjustmentControl 
                title="Overall Length" 
                desc="Modify the hem length of your shirt." 
                value={lengthAdj} 
                setValue={setLengthAdj} 
              />
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-brand/10 bg-white">
              <button 
                onClick={onClose}
                className="w-full flex items-center justify-center space-x-2 bg-brand hover:bg-brand-hover text-white font-bold py-4 rounded-md transition-all active:scale-[0.98] shadow-md border border-transparent hover:border-brand-accent"
              >
                <ShoppingBag size={18} />
                <span>Update & Add to Cart</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
