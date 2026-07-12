import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Note, CartItem } from '../types';

interface CartState {
  items: CartItem[];
  coupon: string | null;
  couponDiscount: number; // Percentage discount (e.g., 10 for 10%)
  loading: boolean;
  paymentState: 'idle' | 'redirecting' | 'verifying' | 'success' | 'failed';
  
  addItem: (note: Note) => void;
  removeItem: (noteId: string) => void;
  clearCart: () => void;
  isInCart: (noteId: string) => boolean;
  syncItems: (dbNotes: any[]) => void;
  
  // Math selectors
  getSubtotal: () => number;
  getDiscount: () => number;
  getGST: () => number;
  getPlatformFee: () => number;
  getGrandTotal: () => number;
  
  // Coupon Actions
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  
  // Status setters
  setLoading: (l: boolean) => void;
  setPaymentState: (state: 'idle' | 'redirecting' | 'verifying' | 'success' | 'failed') => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      couponDiscount: 0,
      loading: false,
      paymentState: 'idle',

      addItem: (note: Note) => {
        const currentItems = get().items;
        const exists = currentItems.find(item => item.note.id === note.id);
        if (exists) return; // Max 1 quantity for digital guides

        set({
          items: [...currentItems, { note, quantity: 1 }]
        });
      },

      removeItem: (noteId: string) => {
        set({
          items: get().items.filter(item => item.note.id !== noteId)
        });
      },

      clearCart: () => set({ items: [], coupon: null, couponDiscount: 0, paymentState: 'idle' }),

      isInCart: (noteId: string) => {
        return get().items.some(item => item.note.id === noteId);
      },

      syncItems: (dbNotes: any[]) => {
        const currentItems = get().items;
        const updatedItems = currentItems
          .map(item => {
            const dbNote = dbNotes.find(n => n.id === item.note.id);
            if (dbNote && dbNote.status === 'active') {
              return {
                ...item,
                note: {
                  ...item.note,
                  ...dbNote
                }
              };
            }
            return null;
          })
          .filter((item): item is CartItem => item !== null);

        set({ items: updatedItems });
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => total + item.note.price * item.quantity, 0);
      },

      getDiscount: () => {
        const subtotal = get().getSubtotal();
        const pct = get().couponDiscount;
        return Number(((subtotal * pct) / 100).toFixed(2));
      },

      getGST: () => {
        const afterDiscount = get().getSubtotal() - get().getDiscount();
        return Number((afterDiscount * 0.18).toFixed(2)); // 18% GST standard
      },

      getPlatformFee: () => {
        // If cart is empty, fee is 0, otherwise standard ₹5
        return get().items.length > 0 ? 5.00 : 0.00;
      },

      getGrandTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscount();
        const gst = get().getGST();
        const fee = get().getPlatformFee();
        return Number((subtotal - discount + gst + fee).toFixed(2));
      },

      applyCoupon: (code: string) => {
        const upper = code.toUpperCase();
        if (upper === 'WELCOME10') {
          set({ coupon: 'WELCOME10', couponDiscount: 10 });
          return true;
        } else if (upper === 'MEDFIRST') {
          set({ coupon: 'MEDFIRST', couponDiscount: 15 }); // 15% off
          return true;
        } else if (upper === 'PHARMA20') {
          set({ coupon: 'PHARMA20', couponDiscount: 20 }); // 20% off
          return true;
        }
        return false;
      },

      removeCoupon: () => set({ coupon: null, couponDiscount: 0 }),

      setLoading: (l: boolean) => set({ loading: l }),
      
      setPaymentState: (state) => set({ paymentState: state })
    }),
    {
      name: 'stethonotes_cart', // Key for localStorage persisting
      partialize: (state) => ({
        items: state.items,
        coupon: state.coupon,
        couponDiscount: state.couponDiscount
      })
    }
  )
);
