import { ShoppingBag, Clock, CheckCircle2, Truck, Loader2 } from "lucide-react";

export default function AdminOrders() {
  return (
    <div>
      <div className="mb-10">
        <h1 className="text-4xl font-playfair font-bold text-brand">Order Fulfillment</h1>
        <p className="mt-2 text-brand/60 font-medium">Track and manage customer purchases and custom fits.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { label: "Pending", count: 0, icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
          { label: "Processing", count: 0, icon: Truck, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Completed", count: 0, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white p-6 rounded-3xl border border-brand/5 shadow-sm flex items-center space-x-4">
            <div className={`p-3 rounded-2xl ${s.bg} ${s.color}`}>
              <s.icon size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-brand/40 uppercase tracking-widest">{s.label}</p>
              <p className="text-xl font-bold text-brand">{s.count} Orders</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] p-20 shadow-sm border border-brand/5 text-center">
        <div className="w-20 h-20 bg-brand/5 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag size={40} className="text-brand/20" />
        </div>
        <h3 className="text-2xl font-playfair font-bold text-brand mb-2">No orders to display</h3>
        <p className="text-brand/60 font-medium max-w-sm mx-auto">
          When customers start placing orders for their custom-fit apparel, they will appear here.
        </p>
      </div>
    </div>
  );
}
