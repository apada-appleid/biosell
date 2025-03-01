import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Cart, CartItem, Product } from '../types';

interface CartStore {
  cart: Cart;
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  hydrate: () => void; // Add hydration method
}

const initialState: Cart = {
  items: [],
  total: 0
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: initialState,
      
      addToCart: (product: Product, quantity: number) => {
        if (quantity <= 0) return;
        
        set((state) => {
          // Check if product already exists in cart
          const existingItemIndex = state.cart.items.findIndex(
            (item) => item.product.id === product.id
          );
          
          let updatedItems: CartItem[];
          
          if (existingItemIndex > -1) {
            // Update quantity if product already in cart
            updatedItems = [...state.cart.items];
            updatedItems[existingItemIndex].quantity += quantity;
          } else {
            // Add new product to cart
            updatedItems = [
              ...state.cart.items,
              { product, quantity }
            ];
          }
          
          // Calculate new total
          const total = updatedItems.reduce(
            (sum, item) => sum + (item.product.price * item.quantity),
            0
          );
          
          return {
            cart: {
              items: updatedItems,
              total
            }
          };
        });
      },
      
      removeFromCart: (productId: string) => {
        set((state) => {
          const updatedItems = state.cart.items.filter(
            (item) => item.product.id !== productId
          );
          
          const total = updatedItems.reduce(
            (sum, item) => sum + (item.product.price * item.quantity),
            0
          );
          
          return {
            cart: {
              items: updatedItems,
              total
            }
          };
        });
      },
      
      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          // If quantity is zero or negative, remove the item
          get().removeFromCart(productId);
          return;
        }
        
        set((state) => {
          const updatedItems = state.cart.items.map((item) => {
            if (item.product.id === productId) {
              return { ...item, quantity };
            }
            return item;
          });
          
          const total = updatedItems.reduce(
            (sum, item) => sum + (item.product.price * item.quantity),
            0
          );
          
          return {
            cart: {
              items: updatedItems,
              total
            }
          };
        });
      },
      
      clearCart: () => {
        set({ cart: initialState });
      },
      
      // Method to manually hydrate the cart from localStorage
      hydrate: () => {
        try {
          const stored = localStorage.getItem('cart-storage');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && parsed.state && parsed.state.cart) {
              set({ cart: parsed.state.cart });
            }
          }
        } catch (error) {
          console.error('Error hydrating cart from localStorage:', error);
        }
      }
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage), // Explicitly use localStorage
      skipHydration: false, // Allow automatic hydration
    }
  )
); 