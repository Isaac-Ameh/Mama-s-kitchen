import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartItem, Meal } from '../types/menu';
import { MEALS } from '../data/meals';
import { useAppAuth } from './AppAuthContext';
import { parseApiJson } from '../lib/api';

interface CartContextValue {
  items: CartItem[];
  isLoading: boolean;
  totalItems: number;
  subtotal: number;
  lastAddedMessage: string | null;
  addToCart: (meal: Meal, quantity?: number) => boolean;
  updateQuantity: (mealId: string, quantity: number) => void;
  removeFromCart: (mealId: string) => void;
  clearCart: () => void;
  dismissNotification: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

interface ServerCartEntry {
  mealId: string;
  quantity: number;
}

function hydrateCartItems(entries: ServerCartEntry[]): CartItem[] {
  const hydrated: CartItem[] = [];
  for (const entry of entries) {
    const meal = MEALS.find((m) => m.id === entry.mealId);
    if (meal && Number.isInteger(entry.quantity) && entry.quantity > 0) {
      hydrated.push({ meal, quantity: entry.quantity });
    }
  }
  return hydrated;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, userId, getToken } = useAppAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastAddedMessage, setLastAddedMessage] = useState<string | null>(null);

  // Sync cart from protected /api/cart endpoint when signed in; clear when signed out
  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !userId) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    async function loadServerCart() {
      setIsLoading(true);
      try {
        const token = await getToken();
        if (!token) return;

        const res = await fetch('/api/cart', {
          credentials: 'same-origin',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;

        const data = await parseApiJson<{ items?: ServerCartEntry[] }>(
          res,
          'Unable to load cart.'
        );
        if (!cancelled && Array.isArray(data.items)) {
          setItems(hydrateCartItems(data.items));
        }
      } catch {
        // Keep current state if network request fails
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadServerCart();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, userId, getToken]);

  const persistCartToServer = useCallback(
    async (nextItems: CartItem[]) => {
      if (!isSignedIn) return;
      try {
        const token = await getToken();
        if (!token) return;

        await fetch('/api/cart', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            items: nextItems.map((item) => ({
              mealId: item.meal.id,
              quantity: Math.min(99, Math.max(1, item.quantity)),
            })),
          }),
        });
      } catch {
        // Ignore transient sync failures
      }
    },
    [isSignedIn, getToken]
  );

  useEffect(() => {
    if (!lastAddedMessage) return;
    const timer = window.setTimeout(() => {
      setLastAddedMessage(null);
    }, 2800);
    return () => window.clearTimeout(timer);
  }, [lastAddedMessage]);

  const addToCart = useCallback(
    (meal: Meal, quantity = 1): boolean => {
      if (!isSignedIn) {
        return false;
      }

      const safeQty = Math.min(99, Math.max(1, quantity));
      setItems((prev) => {
        const existing = prev.find((item) => item.meal.id === meal.id);
        const next = existing
          ? prev.map((item) =>
              item.meal.id === meal.id
                ? { ...item, quantity: Math.min(99, item.quantity + safeQty) }
                : item
            )
          : [...prev, { meal, quantity: safeQty }];
        void persistCartToServer(next);
        return next;
      });
      setLastAddedMessage(`${safeQty} × ${meal.name} added to your cart`);
      return true;
    },
    [isSignedIn, persistCartToServer]
  );

  const updateQuantity = useCallback(
    (mealId: string, quantity: number) => {
      if (!isSignedIn) return;
      setItems((prev) => {
        const next =
          quantity <= 0
            ? prev.filter((item) => item.meal.id !== mealId)
            : prev.map((item) =>
                item.meal.id === mealId
                  ? { ...item, quantity: Math.min(99, quantity) }
                  : item
              );
        void persistCartToServer(next);
        return next;
      });
    },
    [isSignedIn, persistCartToServer]
  );

  const removeFromCart = useCallback(
    (mealId: string) => {
      if (!isSignedIn) return;
      setItems((prev) => {
        const next = prev.filter((item) => item.meal.id !== mealId);
        void persistCartToServer(next);
        return next;
      });
    },
    [isSignedIn, persistCartToServer]
  );

  const clearCart = useCallback(() => {
    setItems([]);
    if (!isSignedIn) return;
    void (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        await fetch('/api/cart', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Ignore transient sync failures
      }
    })();
  }, [isSignedIn, getToken]);

  const dismissNotification = useCallback(() => {
    setLastAddedMessage(null);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.meal.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        isLoading,
        totalItems,
        subtotal,
        lastAddedMessage,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        dismissNotification,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}
