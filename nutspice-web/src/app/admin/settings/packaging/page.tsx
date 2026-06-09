"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, Loader2, Check, AlertCircle, Info, Box } from "lucide-react";

interface PackageTier {
  id?: number;
  name: string;
  maxWeightGrams: number;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
}

export default function PackagingSettingsPage() {
  const router = useRouter();
  const [tiers, setTiers] = useState<PackageTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchTiers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/settings/package-tiers");
      const data = await res.json();
      if (data.success) {
        setTiers(data.data || []);
      } else if (res.status === 401) {
        router.push("/admin/login");
      } else {
        setError(data.error || "Failed to load package tiers.");
      }
    } catch (err) {
      setError("An unexpected error occurred while loading settings.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTiers();
  }, []);

  const handleAddRow = () => {
    setTiers((prev) => [
      ...prev,
      {
        name: "",
        maxWeightGrams: 0,
        lengthCm: 0,
        breadthCm: 0,
        heightCm: 0,
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    setTiers((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleChange = (index: number, field: keyof PackageTier, value: string | number) => {
    setTiers((prev) =>
      prev.map((tier, idx) => {
        if (idx === index) {
          return {
            ...tier,
            [field]: value,
          };
        }
        return tier;
      })
    );
  };

  const handleSave = async () => {
    // Basic validation
    for (const tier of tiers) {
      if (!tier.name.trim()) {
        setError("All tiers must have a name.");
        return;
      }
      if (tier.maxWeightGrams <= 0 || tier.lengthCm <= 0 || tier.breadthCm <= 0 || tier.heightCm <= 0) {
        setError("All numeric values must be greater than 0.");
        return;
      }
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/settings/package-tiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tiers),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess("Packaging configuration saved successfully!");
        fetchTiers(); // Reload updated items (will get their generated IDs)
      } else {
        setError(data.error || "Failed to save packaging configuration.");
      }
    } catch (err) {
      setError("An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-[#C5A059] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-10">
        <h1 className="text-4xl font-playfair font-bold text-brand">Packaging Settings</h1>
        <p className="mt-2 text-brand/60 font-medium">
          Define box variants and dimensions for shipping rate calculations.
        </p>
      </div>

      {/* Info Alert */}
      <div className="mb-6 p-4 bg-[#F9F6EE] border border-[#C5A059]/30 rounded-2xl flex items-start space-x-3 text-brand">
        <Info className="text-[#C5A059] h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="text-xs font-semibold leading-relaxed">
          <p className="font-bold text-brand uppercase tracking-wider text-[9px] mb-1">How it works:</p>
          The shipping calculation engine automatically selects the smallest box variant whose weight capacity (Max Weight) is greater than or equal to the total weight of items in the order.
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl flex items-center space-x-3 text-green-600 animate-in fade-in">
          <Check size={20} />
          <span className="text-sm font-bold uppercase tracking-wider">{success}</span>
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center space-x-3 text-red-500 animate-in fade-in">
          <AlertCircle size={20} />
          <span className="text-sm font-bold uppercase tracking-wider">{error}</span>
        </div>
      )}

      {/* Packaging Tiers Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-brand/5 overflow-hidden p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand/5 border-b border-brand/10">
                <th className="px-6 py-4 text-[10px] font-black text-brand/40 uppercase tracking-[0.2em]">Tier Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-brand/40 uppercase tracking-[0.2em]">Max Weight (g)</th>
                <th className="px-6 py-4 text-[10px] font-black text-brand/40 uppercase tracking-[0.2em]">Length (cm)</th>
                <th className="px-6 py-4 text-[10px] font-black text-brand/40 uppercase tracking-[0.2em]">Breadth (cm)</th>
                <th className="px-6 py-4 text-[10px] font-black text-brand/40 uppercase tracking-[0.2em]">Height (cm)</th>
                <th className="px-6 py-4 text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand/5">
              {tiers.map((tier, index) => (
                <tr key={index} className="hover:bg-brand/[0.01] transition-colors">
                  {/* Name */}
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      value={tier.name}
                      onChange={(e) => handleChange(index, "name", e.target.value)}
                      placeholder="e.g. Small Box"
                      className="w-full bg-brand/5 border border-brand/10 rounded-xl py-2 px-3 text-xs font-bold text-brand focus:outline-none focus:border-[#C5A059]/30 transition-all"
                    />
                  </td>
                  {/* Max Weight */}
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={tier.maxWeightGrams || ""}
                      onChange={(e) => handleChange(index, "maxWeightGrams", parseInt(e.target.value) || 0)}
                      placeholder="500"
                      className="w-32 bg-brand/5 border border-brand/10 rounded-xl py-2 px-3 text-xs font-bold text-brand focus:outline-none focus:border-[#C5A059]/30 transition-all"
                    />
                  </td>
                  {/* Length */}
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={tier.lengthCm || ""}
                      onChange={(e) => handleChange(index, "lengthCm", parseFloat(e.target.value) || 0)}
                      placeholder="10"
                      className="w-24 bg-brand/5 border border-brand/10 rounded-xl py-2 px-3 text-xs font-bold text-brand focus:outline-none focus:border-[#C5A059]/30 transition-all"
                    />
                  </td>
                  {/* Breadth */}
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={tier.breadthCm || ""}
                      onChange={(e) => handleChange(index, "breadthCm", parseFloat(e.target.value) || 0)}
                      placeholder="10"
                      className="w-24 bg-brand/5 border border-brand/10 rounded-xl py-2 px-3 text-xs font-bold text-brand focus:outline-none focus:border-[#C5A059]/30 transition-all"
                    />
                  </td>
                  {/* Height */}
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={tier.heightCm || ""}
                      onChange={(e) => handleChange(index, "heightCm", parseFloat(e.target.value) || 0)}
                      placeholder="10"
                      className="w-24 bg-brand/5 border border-brand/10 rounded-xl py-2 px-3 text-xs font-bold text-brand focus:outline-none focus:border-[#C5A059]/30 transition-all"
                    />
                  </td>
                  {/* Remove action */}
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(index)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-xl hover:bg-red-50"
                      aria-label="Delete tier"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {tiers.length === 0 && (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-brand/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-brand/20">
              <Box size={32} />
            </div>
            <p className="text-brand/40 font-bold uppercase tracking-widest text-xs">
              No package tiers defined. Click 'Add New Tier' to start.
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row sm:justify-between items-center gap-4 border-t border-brand/5 pt-6">
          <button
            type="button"
            onClick={handleAddRow}
            className="flex items-center space-x-2 border border-brand/10 text-brand px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-brand/5 transition-all shadow-xs cursor-pointer"
          >
            <Plus size={16} />
            <span>Add New Tier</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || tiers.length === 0}
            className="flex items-center space-x-2 bg-[#1B3022] text-[#C5A059] px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#2c4d37] transition-all shadow-lg disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
