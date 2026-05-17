"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Edit2, Trash2, ExternalLink } from "lucide-react";

interface BannerItem {
  id: number;
  title: string;
  imageUrl: string;
  linkHref: string;
  displayOrder: number;
  isActive: boolean;
}

interface Props {
  item: BannerItem;
  onEdit: (item: BannerItem) => void;
  onDelete: (id: number) => void;
}

export function SortableBannerItem({ item, onEdit, onDelete }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : undefined,
    position: 'relative' as const,
  };

  return (
    <tr 
      ref={setNodeRef} 
      style={style}
      className={`hover:bg-brand/5 transition-all group ${isDragging ? 'bg-white shadow-2xl opacity-50' : ''}`}
    >
      <td className="px-8 py-5">
        <button 
          {...attributes} 
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 text-brand/20 hover:text-[#C5A059] transition-colors"
        >
          <GripVertical size={20} />
        </button>
      </td>
      <td className="px-8 py-5">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-16 bg-gray-100 rounded-lg overflow-hidden border border-brand/5 shadow-sm">
            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="font-bold text-brand block">{item.title}</span>
            <span className="text-[10px] text-brand/40 font-medium">{item.linkHref}</span>
          </div>
        </div>
      </td>
      <td className="px-8 py-5">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
          item.isActive ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
        }`}>
          {item.isActive ? "Active" : "Inactive"}
        </span>
      </td>

      <td className="px-8 py-5 text-right">
        <div className="flex justify-end space-x-2">
          <a 
            href={item.linkHref}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-lg bg-brand/5 text-brand/60 hover:bg-[#C5A059] hover:text-white transition-all"
          >
            <ExternalLink size={14} />
          </a>
          <button 
            onClick={() => onEdit(item)}
            className="p-2.5 rounded-lg bg-brand/5 text-brand/60 hover:bg-brand-accent hover:text-white transition-all"
          >
            <Edit2 size={14} />
          </button>
          <button 
            onClick={() => onDelete(item.id)}
            className="p-2.5 rounded-lg bg-brand/5 text-brand/60 hover:bg-red-500 hover:text-white transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}
