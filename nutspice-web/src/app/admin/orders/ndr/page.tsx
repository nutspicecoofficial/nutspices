"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import NdrActionModal from "@/components/admin/NdrActionModal";
import { 
  AlertTriangle, 
  Loader2, 
  Calendar, 
  Truck, 
  FileText, 
  RefreshCw, 
  ArrowLeft,
  Info,
  Clock,
  ExternalLink
} from "lucide-react";

interface NDRItem {
  awbNumber: string;
  reason: string;
  attempts: number;
  status: string;
  reportedAt: string;
  ndrResolutions?: any[];
  isLocal?: boolean;
  orderId?: number;
}

export default function NdrDashboard() {
  const [ndrItems, setNdrItems] = useState<NDRItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'LOCAL' | 'ALL'>('LOCAL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAwb, setSelectedAwb] = useState("");
  const [selectedRemarks, setSelectedRemarks] = useState("");

  const fetchNdrList = async (isManual = false) => {
    if (isManual) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetch("/api/shipping/ndr");
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch active NDR exceptions list.");
      }
      setNdrItems(data.data || []);
    } catch (err: any) {
      console.error("Failed to fetch NDR list:", err);
      setError(err.message || "Failed to retrieve NDR exceptions. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNdrList();
  }, []);

  const handleResolveClick = (awb: string, remarks: string) => {
    setSelectedAwb(awb);
    setSelectedRemarks(remarks);
    setModalOpen(true);
  };

  const handleResolutionSuccess = () => {
    // Refresh list on successful resolution submission
    fetchNdrList(true);
  };

  // Filter exceptions based on selection
  const displayedNdrs = ndrItems.filter(ndr => filterMode === 'ALL' ? true : ndr.isLocal === true);

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans">
      
      {/* Header and Controls */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Link 
            href="/admin/orders" 
            className="inline-flex items-center gap-2 text-xs font-bold text-[#C5A059] hover:text-[#1B3022] uppercase tracking-wider transition-colors mb-3 cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to Fulfillment
          </Link>
          <h1 className="text-4xl font-playfair font-bold text-[#1B3022] mb-1">Non-Delivery Reports (NDR)</h1>
          <p className="text-[#C5A059] text-sm font-medium tracking-wide">
            Manage failed courier deliveries and coordinate real-time re-attempt instructions to prevent Return-To-Origin (RTO).
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-center">
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as 'LOCAL' | 'ALL')}
            className="bg-white border border-[#1B3022]/10 text-[#1B3022] font-bold text-xs uppercase tracking-wider rounded-xl px-4 py-3 focus:outline-none focus:border-[#C5A059] transition-all cursor-pointer shadow-xs"
          >
            <option value="LOCAL">Nuts Spice Co NDRs</option>
            <option value="ALL">All NDRs</option>
          </select>
          <button
            type="button"
            onClick={() => fetchNdrList(true)}
            disabled={loading || refreshing}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-[#1B3022] hover:bg-brand disabled:bg-brand/40 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw size={14} className={`${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Sync Exceptions"}
          </button>
        </div>
      </div>

      {/* Info Warning Bar */}
      <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
        <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed font-semibold">
          <p className="font-bold">Proactive Delivery Resolution Required</p>
          <p className="font-normal text-amber-800/90 mt-0.5">
            Xpressbees requires delivery exceptions to be resolved within 48 hours. If left unresolved, shipments are automatically returned to our warehouse under Return-to-Origin (RTO) charges. Resolving phone/address details directly updates customer consignments at the hub.
          </p>
        </div>
      </div>

      {/* Main Content Pane */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-10 h-10 text-[#C5A059] animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-rose-100 shadow-sm max-w-xl mx-auto">
          <div className="w-12 h-12 bg-rose-50 border border-rose-200 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} />
          </div>
          <h2 className="text-xl font-playfair font-bold text-brand mb-2">Sync Failure</h2>
          <p className="text-brand/40 text-xs font-semibold mb-6">
            {error}
          </p>
          <button
            type="button"
            onClick={() => fetchNdrList()}
            className="px-5 py-2.5 bg-[#1B3022] hover:bg-brand text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      ) : displayedNdrs.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-brand/5 shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Truck size={24} />
          </div>
          <h2 className="text-xl font-playfair font-bold text-brand mb-2">Zero Exceptions Found</h2>
          <p className="text-brand/40 text-sm font-medium max-w-md mx-auto">
            {filterMode === 'LOCAL'
              ? "All storefront shipments are moving smoothly! No active exceptions belong to Nuts Spice Co."
              : "All Xpressbees shipments are moving smoothly! There are no outstanding NDR exceptions requiring administrator action."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Card list for small screens, Table for large screens */}
          <div className="hidden lg:block bg-white rounded-3xl border border-brand/5 shadow-sm overflow-hidden">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-brand/5 border-b border-brand/10">
                  <th className="px-6 py-4 text-[9px] font-black text-brand/40 uppercase tracking-widest">AWB Number</th>
                  <th className="px-6 py-4 text-[9px] font-black text-brand/40 uppercase tracking-widest">Reported Date</th>
                  <th className="px-6 py-4 text-[9px] font-black text-brand/40 uppercase tracking-widest">Courier Remark / Exception Reason</th>
                  <th className="px-6 py-4 text-[9px] font-black text-brand/40 uppercase tracking-widest text-center">Attempts</th>
                  <th className="px-6 py-4 text-[9px] font-black text-brand/40 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand/5">
                {displayedNdrs.map((item) => (
                  <tr key={item.awbNumber} className="hover:bg-brand/[0.005] transition-colors">
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-mono text-sm font-bold text-brand">{item.awbNumber}</span>
                        {item.isLocal && item.orderId ? (
                          <Link 
                            href={`/admin/orders/${item.orderId}`}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-[#C5A059] hover:underline mt-1"
                          >
                            View Order <ExternalLink size={10} />
                          </Link>
                        ) : (
                          <span className="text-[10px] text-brand/30 font-bold mt-1 select-none">
                            External Courier NDR
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-xs font-semibold text-brand/50">
                        <Calendar size={14} className="text-[#C5A059]" />
                        {new Date(item.reportedAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4.5">
                      <div className="flex flex-col gap-2 max-w-lg">
                        <div className="flex items-start gap-2">
                          <div className="p-1 rounded-md bg-amber-50 text-amber-600 mt-0.5 shrink-0">
                            <AlertTriangle size={12} />
                          </div>
                          <p className="text-xs text-brand font-semibold leading-relaxed">
                            {item.reason}
                          </p>
                        </div>
                        
                        {/* NDR Audit Resolutions History Timeline */}
                        {item.ndrResolutions && item.ndrResolutions.length > 0 && (
                          <div className="pl-3.5 border-l-2 border-emerald-500/40 space-y-2 mt-1 animate-in fade-in duration-200">
                            <span className="block text-[8px] font-black text-emerald-800 uppercase tracking-widest mb-1 select-none">
                              🛡️ Resolution History ({item.ndrResolutions.length})
                            </span>
                            {item.ndrResolutions.map((res: any, idx: number) => (
                              <div key={idx} className="text-[10px] text-brand bg-emerald-500/[0.01] border border-emerald-500/5 rounded-lg p-2 leading-relaxed shadow-2xs">
                                <div className="flex items-center justify-between gap-4 mb-0.5">
                                  <span className="font-black uppercase tracking-wider text-emerald-700 text-[8px]">
                                    {res.action === "re-attempt" ? "⚡ Re-Attempt" : res.action === "update-phone" ? "📞 Phone Update" : "📍 Address Update"}
                                  </span>
                                  <span className="text-brand/40 font-semibold font-mono text-[9px]">
                                    {new Date(res.submittedAt).toLocaleDateString("en-GB")} {new Date(res.submittedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                </div>
                                <p className="text-brand/80 font-medium italic">
                                  Remarks: "{res.remarks}"
                                </p>
                                {res.action === "update-phone" && res.action_data?.phone && (
                                  <p className="text-brand/50 font-bold mt-0.5">
                                    New Mobile: +91 {res.action_data.phone}
                                  </p>
                                )}
                                {res.action === "update-address" && res.action_data?.address_1 && (
                                  <p className="text-brand/50 font-bold mt-0.5 break-words">
                                    New Address: "{res.action_data.address_1}"
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4.5 whitespace-nowrap text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand/5 border border-brand/10 text-xs font-bold text-brand">
                        <Clock size={12} className="text-[#C5A059]" />
                        {item.attempts}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 whitespace-nowrap text-right">
                      <button
                        type="button"
                        onClick={() => handleResolveClick(item.awbNumber, item.reason)}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                      >
                        Resolve Exception
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
 
          {/* Cards for mobile view */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-4">
            {displayedNdrs.map((item) => (
              <div 
                key={item.awbNumber}
                className="bg-white rounded-2xl border border-brand/5 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3.5">
                    <span className="font-mono text-sm font-black text-brand tracking-wide">{item.awbNumber}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand/5 border border-brand/10 rounded-full text-[10px] font-bold text-brand">
                      {item.attempts} {item.attempts === 1 ? "attempt" : "attempts"}
                    </span>
                  </div>
 
                  <div className="space-y-3 mb-5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-brand/40">
                      <Calendar size={14} className="text-[#C5A059]" />
                      Reported: {new Date(item.reportedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="p-3 bg-amber-50/50 border border-amber-200/55 rounded-xl flex items-start gap-2.5">
                      <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-900 font-semibold leading-relaxed">
                        {item.reason}
                      </p>
                    </div>
 
                    {/* NDR Audit Resolutions History Timeline Mobile */}
                    {item.ndrResolutions && item.ndrResolutions.length > 0 && (
                      <div className="pl-3.5 border-l-2 border-emerald-500/40 space-y-2 mt-3 animate-in fade-in duration-200">
                        <span className="block text-[8px] font-black text-emerald-800 uppercase tracking-widest mb-1 select-none">
                          🛡️ Resolution History ({item.ndrResolutions.length})
                        </span>
                        {item.ndrResolutions.map((res: any, idx: number) => (
                          <div key={idx} className="text-[10px] text-brand bg-emerald-500/[0.01] border border-emerald-500/5 rounded-lg p-2 leading-relaxed shadow-2xs">
                            <div className="flex items-center justify-between gap-4 mb-0.5">
                              <span className="font-black uppercase tracking-wider text-emerald-700 text-[8px]">
                                {res.action === "re-attempt" ? "⚡ Re-Attempt" : res.action === "update-phone" ? "📞 Phone Update" : "📍 Address Update"}
                              </span>
                              <span className="text-brand/40 font-semibold font-mono text-[9px]">
                                {new Date(res.submittedAt).toLocaleDateString("en-GB")} {new Date(res.submittedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <p className="text-brand/80 font-medium italic">
                              Remarks: "{res.remarks}"
                            </p>
                            {res.action === "update-phone" && res.action_data?.phone && (
                              <p className="text-brand/50 font-bold mt-0.5">
                                New Mobile: +91 {res.action_data.phone}
                              </p>
                            )}
                            {res.action === "update-address" && res.action_data?.address_1 && (
                              <p className="text-brand/50 font-bold mt-0.5 break-words">
                                New Address: "{res.action_data.address_1}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
 
                <div className="flex items-center justify-between gap-4 pt-3.5 border-t border-brand/5">
                  {item.isLocal && item.orderId ? (
                    <Link 
                      href={`/admin/orders/${item.orderId}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C5A059] hover:underline"
                    >
                      View Order <ExternalLink size={12} />
                    </Link>
                  ) : (
                    <span className="text-xs text-brand/30 font-bold select-none">
                      External Courier NDR
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleResolveClick(item.awbNumber, item.reason)}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                  >
                    Resolve Exception
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolution Modal */}
      <NdrActionModal
        isOpen={modalOpen}
        awbNumber={selectedAwb}
        courierRemarks={selectedRemarks}
        onClose={() => setModalOpen(false)}
        onSuccess={handleResolutionSuccess}
      />
    </div>
  );
}
