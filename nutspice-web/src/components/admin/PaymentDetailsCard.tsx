import React from "react";
import { CreditCard } from "lucide-react";

interface PaymentDetailsCardProps {
  paymentMode?: string | null;
  paymentStatus?: string | null;
  amountPaid?: number | null;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  paymentId?: string | null;
  totalAmount?: number | null;
}

export default function PaymentDetailsCard({
  paymentMode,
  paymentStatus,
  amountPaid,
  razorpayOrderId,
  razorpayPaymentId,
  paymentId,
  totalAmount,
}: PaymentDetailsCardProps) {
  // Resolve legacy orders where specific payment details fields were left null
  const resolvedPaymentId = razorpayPaymentId || paymentId || null;
  const hasPayment = !!resolvedPaymentId;
  const isOnline = hasPayment || !!razorpayOrderId;

  const resolvedMode = paymentMode || (isOnline ? "Prepaid" : "N/A");
  const resolvedStatus = paymentStatus || (hasPayment ? "PAID" : "N/A");
  const resolvedAmount = amountPaid !== undefined && amountPaid !== null
    ? amountPaid
    : (hasPayment && totalAmount !== undefined && totalAmount !== null ? totalAmount : null);

  const isPaid = resolvedStatus?.toUpperCase() === "PAID";
  const isFailed = resolvedStatus?.toUpperCase() === "FAILED";

  const getStatusStyle = (status?: string | null) => {
    if (!status) return "text-brand/40 italic font-medium";
    const s = status.toUpperCase();
    if (s === "PAID") return "text-green-600 font-extrabold";
    if (s === "FAILED") return "text-rose-600 font-extrabold";
    return "text-brand/80 font-bold";
  };

  return (
    <div className="bg-white rounded-2xl border border-rose-100/80 shadow-sm p-6 flex flex-col h-full hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-6 border-b border-rose-50/60 pb-4">
        <div className="p-2 bg-rose-50 rounded-xl text-rose-500">
          <CreditCard size={18} />
        </div>
        <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-[0.18em]">
          Payment Details
        </h4>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
        <div>
          <span className="block text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1.5">
            Mode
          </span>
          <span className="text-xs font-bold text-brand uppercase tracking-wider">
            {resolvedMode}
          </span>
        </div>

        <div>
          <span className="block text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1.5">
            Status
          </span>
          <span className={`text-xs uppercase tracking-wider ${getStatusStyle(resolvedStatus)}`}>
            {resolvedStatus}
          </span>
        </div>

        <div className="sm:col-span-2 border-t border-rose-50/40 my-1"></div>

        <div>
          <span className="block text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1.5">
            Amount Paid
          </span>
          <span className="text-sm font-black text-brand font-sans">
            {resolvedAmount !== null ? `₹${resolvedAmount.toLocaleString()}` : "N/A"}
          </span>
        </div>

        <div>
          <span className="block text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1.5">
            Razorpay Order ID
          </span>
          <span className="text-xs font-semibold text-brand break-all font-mono">
            {razorpayOrderId || "N/A"}
          </span>
        </div>

        <div className="sm:col-span-2">
          <span className="block text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1.5">
            Razorpay Payment ID
          </span>
          <span className="text-xs font-semibold text-brand break-all font-mono">
            {resolvedPaymentId || "N/A"}
          </span>
        </div>
      </div>
    </div>
  );
}
