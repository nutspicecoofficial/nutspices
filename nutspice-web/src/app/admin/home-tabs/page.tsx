"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, AlertCircle, Loader2, Save, LayoutGrid } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableTabItem } from "@/components/admin/SortableTabItem";

type TabItem = {
  id: number;
  title: string;
  linkHref: string;
  imageUrl: string;
  displayOrder: number;
  isActive: boolean;
};

export default function AdminHomeTabs() {
  const router = useRouter();
  const [items, setItems] = useState<TabItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ 
    title: "", 
    linkHref: "", 
    imageUrl: "", 
    displayOrder: 0, 
    isActive: true 
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/admin/home-tabs?all=true");
      const data = await res.json();
      if (data.success) {
        setItems(data.data);
      } else if (res.status === 401) {
        router.push("/admin/login");
      }
    } catch (err) {
      setError("Failed to fetch home tabs.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleEdit = (item: TabItem) => {
    setEditingId(item.id);
    setFormData({ 
      title: item.title, 
      linkHref: item.linkHref || "", 
      imageUrl: item.imageUrl || "", 
      displayOrder: item.displayOrder, 
      isActive: item.isActive 
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ title: "", linkHref: "", imageUrl: "", displayOrder: 0, isActive: true });
  };

  const handleAddNew = () => {
    setFormData({ title: "", linkHref: "", imageUrl: "", displayOrder: items.length, isActive: true });
    setEditingId(0);
  };

  const handleSave = async (id: number | null) => {
    setIsSaving(true);
    setError("");
    setSuccess("");
    
    try {
      const method = id ? "PUT" : "POST";
      const payload = id ? { id, ...formData } : formData;
      
      const res = await fetch("/api/admin/home-tabs", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (data.success) {
        setSuccess(id ? "Tab updated successfully!" : "Tab added successfully!");
        handleCancel();
        fetchItems();
        router.refresh();
      } else {
        setError(data.error || "Failed to save tab.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this tab?")) return;
    
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/home-tabs?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setSuccess("Tab deleted successfully!");
        fetchItems();
        router.refresh();
      }
    } catch (err) {
      setError("Failed to delete tab.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
        ...item,
        displayOrder: index,
      }));

      setItems(newItems);

      try {
        await fetch("/api/admin/home-tabs", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newItems),
        });
        router.refresh();
      } catch (err) {
        setError("Failed to save new order.");
        fetchItems();
      }
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
      <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-playfair font-bold text-brand">Home Tabs</h1>
          <p className="mt-2 text-brand/60 font-medium">Manage the info cards displayed below the banner.</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="flex items-center space-x-2 bg-[#C5A059] text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#b39150] transition-all shadow-lg"
        >
          <Plus size={16} />
          <span>Add New Tab</span>
        </button>
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

      {/* Add/Edit Form */}
      {editingId !== null && (
        <div className="mb-12 bg-white rounded-3xl p-8 shadow-sm border border-brand/5 animate-in zoom-in-95 duration-200">
          <h2 className="text-xl font-playfair font-bold text-brand mb-6">
            {editingId === 0 ? "Add New Tab" : "Edit Tab"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-brand/40 uppercase tracking-widest mb-2 ml-1">Title</label>
              <input 
                type="text" 
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Premium Quality"
                className="w-full bg-brand/5 border border-brand/10 rounded-xl py-3 px-4 text-sm font-bold text-brand focus:outline-none focus:border-[#C5A059]/30 focus:ring-4 focus:ring-[#C5A059]/10 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-brand/40 uppercase tracking-widest mb-2 ml-1">Navigate Link</label>
              <input 
                type="text" 
                value={formData.linkHref}
                onChange={(e) => setFormData({ ...formData, linkHref: e.target.value })}
                placeholder="e.g. /category/dry-fruits"
                className="w-full bg-brand/5 border border-brand/10 rounded-xl py-3 px-4 text-sm font-bold text-brand focus:outline-none focus:border-[#C5A059]/30 focus:ring-4 focus:ring-[#C5A059]/10 transition-all"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-brand/40 uppercase tracking-widest mb-2 ml-1">Icon/Image URL</label>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <input 
                    type="text" 
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="e.g. /images/icons/premium.svg"
                    className="w-full bg-brand/5 border border-brand/10 rounded-xl py-3 px-4 text-sm font-bold text-brand focus:outline-none focus:border-[#C5A059]/30 focus:ring-4 focus:ring-[#C5A059]/10 transition-all"
                  />
                </div>
                {formData.imageUrl && (
                  <div className="w-12 h-12 rounded-xl bg-brand/5 border border-brand/10 overflow-hidden flex items-center justify-center">
                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-contain p-2" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col">
              <label className="block text-[10px] font-bold text-brand/40 uppercase tracking-widest mb-2 ml-1">Status</label>
              <button 
                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                className={`flex-1 flex items-center justify-center space-x-2 rounded-xl border-2 transition-all font-bold text-xs uppercase tracking-widest py-3 ${
                  formData.isActive 
                    ? "border-green-100 bg-green-50 text-green-600" 
                    : "border-gray-100 bg-gray-50 text-gray-400"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${formData.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span>{formData.isActive ? "Active" : "Inactive"}</span>
              </button>
            </div>
          </div>
          <div className="mt-8 flex justify-end space-x-4">
            <button 
              onClick={handleCancel}
              className="px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs text-brand/40 hover:bg-brand/5 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={() => handleSave(editingId === 0 ? null : editingId)}
              disabled={isSaving || !formData.title.trim()}
              className="flex items-center space-x-2 bg-[#1B3022] text-[#C5A059] px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#2c4d37] transition-all shadow-lg disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
              <span>{editingId === 0 ? "Create Tab" : "Save Changes"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Sortable Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-brand/5 overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand/5 border-b border-brand/10">
                  <th className="w-16 px-8 py-6"></th>
                  <th className="px-8 py-6 text-[10px] font-black text-brand/40 uppercase tracking-[0.2em]">Tab Info</th>
                  <th className="px-8 py-6 text-[10px] font-black text-brand/40 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand/5 relative">
                {items.map((item) => (
                  <SortableTabItem 
                    key={item.id} 
                    item={item} 
                    onEdit={handleEdit} 
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </SortableContext>
        </DndContext>
        {items.length === 0 && (
          <div className="p-20 text-center">
            <div className="w-16 h-16 bg-brand/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-brand/20">
              <LayoutGrid size={32} />
            </div>
            <p className="text-brand/40 font-bold uppercase tracking-widest text-xs">No tabs found. Click 'Add New Tab' to start.</p>
          </div>
        )}
      </div>
    </div>
  );
}
