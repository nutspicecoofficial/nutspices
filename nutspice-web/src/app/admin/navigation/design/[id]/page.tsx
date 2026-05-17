"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Save, 
  ArrowLeft, 
  Loader2, 
  Check,
  Package,
  X,
  Layout,
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
import ProductSelectorModal from "@/components/admin/ProductSelectorModal";

interface Product {
  id: number;
  name: string;
  images: string;
  salePrice: number | null;
  mrp: number | null;
  category: string | null;
  isFeatured: boolean | number | null;
  isCustomizable: boolean | number | null;
}

interface Section {
  id: number;
  menuId: number;
  title: string;
  productIds: string;
  displayOrder: number;
}

interface NavItem {
  id: number;
  label: string;
}

function SortableSectionItem({ 
  section, 
  allProducts,
  onDelete, 
  onUpdate,
  onUpdateProducts
}: { 
  section: Section; 
  allProducts: Product[];
  onDelete: (id: number) => void;
  onUpdate: (id: number, updates: Partial<Section>) => void;
  onUpdateProducts: () => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  
  const productIdsArray = section.productIds 
    ? section.productIds.split(",").map(id => parseInt(id.trim())).filter(id => !isNaN(id))
    : [];

  const selectedProducts = allProducts.filter(p => productIdsArray.includes(p.id));

  const style = { 
    transform: CSS.Transform.toString(transform), 
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative' as const,
  };

  const handleConfirmSelection = (selectedIds: number[]) => {
    onUpdate(section.id, { productIds: selectedIds.join(",") });
    setIsModalOpen(false);
  };

  const removeProduct = (id: number) => {
    const newIds = productIdsArray.filter(i => i !== id);
    onUpdate(section.id, { productIds: newIds.join(",") });
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`bg-white border ${isDragging ? 'border-[#C5A059] shadow-2xl' : 'border-brand/10'} rounded-2xl p-6 mb-4 shadow-sm group hover:border-[#C5A059]/30 transition-all`}
    >
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-brand/5">
        <div className="flex items-center space-x-4">
          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-brand/20 hover:text-[#C5A059] transition-colors p-1">
            <GripVertical size={20} />
          </button>
          <div className="flex items-center space-x-3">
            <div className="bg-[#C5A059]/10 p-2 rounded-lg text-[#C5A059]">
              <Settings2 size={16} />
            </div>
            <input 
              type="text" 
              value={section.title}
              onChange={(e) => onUpdate(section.id, { title: e.target.value })}
              className="text-lg font-playfair font-bold text-brand bg-transparent focus:outline-none focus:border-b border-[#C5A059] transition-all"
              placeholder="Section Title (e.g. New Arrivals)"
            />
          </div>
        </div>
        <button 
          onClick={() => onDelete(section.id)}
          className="p-2 text-brand/20 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
          title="Delete Section"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 pl-12">
        <div>
          <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-4">Display Products (IDS)</label>
          
          <div className="flex flex-wrap gap-3 mb-6">
            {selectedProducts.map((product) => (
              <div 
                key={product.id}
                className="flex items-center space-x-2 bg-brand/5 border border-brand/10 rounded-xl pl-2 pr-3 py-2 group/pill hover:border-[#C5A059]/30 transition-all"
              >
                <div className="w-6 h-6 rounded-lg overflow-hidden bg-white border border-brand/5">
                  <img 
                    src={(() => {
                      try {
                        const imgs = JSON.parse(product.images || "[]");
                        return imgs[0] || "/images/placeholder.png";
                      } catch { return "/images/placeholder.png"; }
                    })()} 
                    alt={product.name} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <span className="text-[10px] font-bold text-brand uppercase tracking-tight">{product.name}</span>
                <button 
                  onClick={() => removeProduct(product.id)}
                  className="p-1 hover:bg-red-50 hover:text-red-500 rounded-md transition-colors text-brand/20"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-2 bg-[#1B3022] text-white px-4 py-2 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-[#2c4d37] transition-all shadow-sm"
            >
              <Plus size={14} />
              <span>Add Products</span>
            </button>
          </div>
          
          <p className="text-[10px] text-brand/30 font-medium">Use the product selector to add items to this carousel. They will appear on the site in the order you select them.</p>
        </div>
      </div>

      <ProductSelectorModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmSelection}
        initialSelectedIds={productIdsArray}
        onProductCreated={onUpdateProducts}
      />
    </div>
  );
}

export default function DesignWorkspace() {
  const params = useParams();
  const router = useRouter();
  const menuId = parseInt(params.id as string);

  const [menuItem, setMenuItem] = useState<NavItem | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchAllProducts = async () => {
    try {
      const prodRes = await fetch("/api/admin/products");
      const prodData = await prodRes.json();
      if (prodData.success) {
        setAllProducts(prodData.data);
      }
    } catch (err) {
      console.error("Failed to load products");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch menu details to get the label
        const navRes = await fetch("/api/admin/nav?all=true");
        const navData = await navRes.json();
        if (navData.success) {
          const item = navData.data.find((i: NavItem) => i.id === menuId);
          if (item) setMenuItem(item);
        }

        // Fetch sections
        const secRes = await fetch(`/api/admin/sections?menuId=${menuId}`);
        const secData = await secRes.json();
        if (secData.success) {
          setSections(secData.data);
        }

        await fetchAllProducts();
      } catch (err) {
        console.error("Failed to load workspace data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [menuId]);


  const handleAddSection = async () => {
    if (isAddingSection) return;
    setIsAddingSection(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          menuId, 
          title: "New Product Carousel", 
          displayOrder: sections.length 
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSections([...sections, data.data]);
        setSuccessMsg("New section added!");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErrorMsg(data.error || "Failed to create section");
      }
    } catch (err) {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setIsAddingSection(false);
    }
  };

  const handleUpdateLocal = (id: number, updates: Partial<Section>) => {
    setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSuccessMsg("");
    try {
      for (const section of sections) {
        await fetch("/api/admin/sections", {
          method: "PUT",
          body: JSON.stringify(section),
        });
      }
      setSuccessMsg("Page layout saved successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this section?")) return;
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
      
      await fetch("/api/admin/sections", {
        method: "PUT",
        body: JSON.stringify(newOrder),
      });
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
    <div className="max-w-5xl mx-auto p-10 pb-20">
      <div className="mb-8">
        <Link 
          href="/admin/navigation" 
          className="inline-flex items-center space-x-2 text-brand/40 hover:text-brand transition-colors text-sm font-bold mb-6"
        >
          <ArrowLeft size={16} />
          <span>Back to List</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Layout className="text-[#C5A059]" size={24} />
              <h1 className="text-3xl font-playfair font-bold text-brand">Designing Page: {menuItem?.label}</h1>
            </div>
            <p className="text-brand/60 font-medium">Manage and reorder the product carousels displayed on this page.</p>
          </div>

          <div className="flex items-center space-x-4">
            <button 
              onClick={handleAddSection}
              disabled={isAddingSection}
              className="flex items-center space-x-2 bg-brand/5 text-brand px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-brand/10 transition-all disabled:opacity-50"
            >
              {isAddingSection ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              <span>Add Section</span>
            </button>
            <button 
              onClick={handleSaveAll}
              disabled={isSaving}
              className="flex items-center space-x-2 bg-[#C5A059] text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#b39150] transition-all shadow-lg disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="mb-8 p-4 bg-green-50 border border-green-100 rounded-xl flex items-center space-x-3 text-green-600 animate-in fade-in slide-in-from-top-4">
          <Check size={20} />
          <span className="text-sm font-bold uppercase tracking-wider">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center space-x-3 text-red-600 animate-in fade-in slide-in-from-top-4">
          <X size={20} />
          <span className="text-sm font-bold uppercase tracking-wider">{errorMsg}</span>
        </div>
      )}

      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-brand/5 min-h-[400px]">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
            {sections.map((section) => (
              <SortableSectionItem 
                key={section.id} 
                section={section} 
                allProducts={allProducts}
                onDelete={handleDelete}
                onUpdate={handleUpdateLocal}
                onUpdateProducts={fetchAllProducts}
              />
            ))}
          </SortableContext>
        </DndContext>

        {sections.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-brand/10 rounded-3xl">
            <Layout size={48} className="text-brand/10 mx-auto mb-4" />
            <p className="text-brand/40 text-sm font-bold uppercase tracking-widest">No sections found</p>
            <button 
              onClick={handleAddSection}
              disabled={isAddingSection}
              className="mt-4 text-[#C5A059] font-bold text-sm hover:underline disabled:opacity-50 flex items-center justify-center mx-auto space-x-2"
            >
              {isAddingSection && <Loader2 size={14} className="animate-spin" />}
              <span>{isAddingSection ? "Adding..." : "Add your first carousel"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
