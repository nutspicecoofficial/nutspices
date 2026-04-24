"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Save, 
  X, 
  Loader2, 
  Image as ImageIcon,
  Settings2
} from "lucide-react";
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
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Section {
  id: number;
  menuId: number;
  title: string;
  productIds: string;
  displayOrder: number;
}

interface Props {
  menuItem: { id: number; label: string };
  onClose: () => void;
}

function SortableSectionItem({ 
  section, 
  onDelete, 
  onUpdate 
}: { 
  section: Section; 
  onDelete: (id: number) => void;
  onUpdate: (id: number, updates: Partial<Section>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="bg-white border border-brand/10 rounded-2xl p-6 mb-4 shadow-sm group hover:border-[#C5A059]/30 transition-all"
    >
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-brand/5">
        <div className="flex items-center space-x-4">
          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-brand/20 hover:text-[#C5A059]">
            <GripVertical size={20} />
          </button>
          <div className="flex items-center space-x-2">
            <div className="bg-[#C5A059]/10 p-2 rounded-lg text-[#C5A059]">
              <Settings2 size={16} />
            </div>
            <input 
              type="text" 
              value={section.title}
              onChange={(e) => onUpdate(section.id, { title: e.target.value })}
              className="text-sm font-bold text-brand bg-transparent focus:outline-none focus:underline"
              placeholder="Section Title (e.g. New Arrivals)"
            />
          </div>
        </div>
        <button 
          onClick={() => onDelete(section.id)}
          className="p-2 text-brand/20 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-[10px] font-black text-brand/30 uppercase tracking-[0.2em] mb-2">Display Products (IDs)</label>
          <input 
            type="text"
            value={section.productIds}
            onChange={(e) => onUpdate(section.id, { productIds: e.target.value })}
            placeholder="e.g. 1, 2, 3 (Comma separated product IDs)"
            className="w-full bg-brand/5 border border-transparent focus:border-[#C5A059]/30 rounded-xl px-4 py-3 text-xs font-bold text-brand outline-none transition-all"
          />
        </div>
      </div>
    </div>
  );
}

export default function PageSectionEditor({ menuItem, onClose }: Props) {
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchSections = async () => {
    try {
      const res = await fetch(`/api/admin/sections?menuId=${menuItem.id}`);
      const data = await res.json();
      if (data.success) setSections(data.data);
    } catch (err) {
      console.error("Failed to fetch sections");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, [menuItem.id]);

  const handleAddSection = async () => {
    try {
      const res = await fetch("/api/admin/sections", {
        method: "POST",
        body: JSON.stringify({ menuId: menuItem.id, title: "New Carousel Section", displayOrder: sections.length }),
      });
      const data = await res.json();
      if (data.success) setSections([...sections, data.data]);
    } catch (err) {
      console.error("Failed to add section");
    }
  };

  const handleUpdateLocal = (id: number, updates: Partial<Section>) => {
    setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // 1. Save all content updates
      for (const section of sections) {
        await fetch("/api/admin/sections", {
          method: "PUT",
          body: JSON.stringify(section),
        });
      }
      onClose();
    } catch (err) {
      console.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this section?")) return;
    try {
      await fetch(`/api/admin/sections?id=${id}`, { method: "DELETE" });
      setSections(sections.filter(s => s.id !== id));
    } catch (err) {
      console.error("Failed to delete section");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      const newOrder = arrayMove(sections, oldIndex, newIndex).map((s, idx) => ({ ...s, displayOrder: idx }));
      setSections(newOrder);
      
      // Sync order to DB
      await fetch("/api/admin/sections", {
        method: "PUT",
        body: JSON.stringify(newOrder),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1B3022]/80 backdrop-blur-sm p-4">
      <div className="bg-brand-light w-full max-w-3xl h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 bg-white border-b border-brand/5 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-[#1B3022] p-3 rounded-2xl text-[#C5A059] shadow-lg">
              <Plus size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-playfair font-bold text-brand">Page Designer</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C5A059]">{menuItem.label} Context</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-brand/20 hover:text-brand transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-brand-light/50">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-[#C5A059] animate-spin" />
            </div>
          ) : (
            <>
              <div className="mb-8 flex items-center justify-between">
                <h3 className="text-sm font-bold text-brand uppercase tracking-widest">Page Sections (Carousels)</h3>
                <button 
                  onClick={handleAddSection}
                  className="flex items-center space-x-2 text-[10px] font-black text-white bg-brand px-4 py-2 rounded-full uppercase tracking-widest hover:bg-brand-hover transition-all shadow-md"
                >
                  <Plus size={14} />
                  <span>Add Carousel</span>
                </button>
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  {sections.map((section) => (
                    <SortableSectionItem 
                      key={section.id} 
                      section={section} 
                      onDelete={handleDelete}
                      onUpdate={handleUpdateLocal}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              {sections.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed border-brand/10 rounded-3xl">
                  <p className="text-brand/30 text-xs font-bold uppercase tracking-widest">No sections added yet.</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-8 bg-white border-t border-brand/5 flex justify-end space-x-4">
          <button onClick={onClose} className="px-6 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs text-brand/40 hover:bg-brand/5">Discard</button>
          <button 
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center space-x-3 bg-[#C5A059] text-white px-10 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-[#b39150] transition-all shadow-xl disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>Save Designer</span>
          </button>
        </div>
      </div>
    </div>
  );
}
