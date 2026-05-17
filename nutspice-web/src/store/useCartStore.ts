import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string; // unique hash for the item configuration
  productId: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size: string;
  color?: string;
  customizations: any;
  stock: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  setItems: (items: CartItem[]) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (newItem) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((item) => item.id === newItem.id);
        
        if (existingItem) {
          const newQuantity = existingItem.quantity + (newItem.quantity || 1);
          const limitedQuantity = Math.min(newQuantity, existingItem.stock);
          set({
            items: currentItems.map((item) =>
              item.id === newItem.id
                ? { ...item, quantity: limitedQuantity }
                : item
            ),
          });
        } else {
          const initialQuantity = Math.min(newItem.quantity || 1, newItem.stock);
          set({ items: [...currentItems, { ...newItem, quantity: initialQuantity }] });
        }
      },
      
      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },
      
      updateQuantity: (id, delta) => {
        const currentItems = get().items;
        set({
          items: currentItems.map((item) => {
            if (item.id === id) {
              const newQuantity = item.quantity + delta;
              const limitedQuantity = Math.min(Math.max(0, newQuantity), item.stock);
              return { ...item, quantity: limitedQuantity };
            }
            return item;
          }).filter(item => item.quantity > 0),
        });
      },
      
      setItems: (items) => set({ items }),
      
      clearCart: () => set({ items: [] }),
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },
    }),
    {
      name: "nutspiceco-cart",
    }
  )
);
