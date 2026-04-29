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
          set({
            items: currentItems.map((item) =>
              item.id === newItem.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          });
        } else {
          set({ items: [...currentItems, { ...newItem, quantity: 1 }] });
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
              const newQuantity = Math.max(0, item.quantity + delta);
              return { ...item, quantity: newQuantity };
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
      name: "ashwaah-cart",
    }
  )
);
