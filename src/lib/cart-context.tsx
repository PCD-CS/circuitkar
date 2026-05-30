"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type MutableRefObject,
} from "react";
import { useToast } from "@/components/ui/Toast";
import type { CartItemWithProduct } from "@/types";

interface CartContextType {
  items: CartItemWithProduct[];
  itemCount: number;
  subtotal: number;
  addItem: (productId: string, qty?: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  updateQty: (cartItemId: string, qty: number) => void;
  clearCart: () => Promise<void>;
  refresh: () => Promise<void>;
  isLoading: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

const SESSION_KEY = "ck_cart_session";

function ensureSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [items, setItems] = useState<CartItemWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const sessionRef = useRef<string>("");
  // Debounce timers per cart item — prevents in-flight race conditions on rapid clicks
  const pendingRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map()) as MutableRefObject<Map<string, ReturnType<typeof setTimeout>>>;

  const headers = useCallback((): HeadersInit => {
    return {
      "Content-Type": "application/json",
      "x-cart-session": sessionRef.current,
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/cart", { headers: headers() });
      const data = await res.json();
      if (res.ok) setItems(data.items ?? []);
    } catch {
      // ignore network errors on background refresh
    } finally {
      setIsLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    sessionRef.current = ensureSessionId();
    refresh();
  }, [refresh]);

  const addItem = useCallback(
    async (productId: string, qty = 1) => {
      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({ productId, quantity: qty }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setItems(data.items ?? []);
        setIsOpen(true);
      } catch {
        toast("Could not add to cart.", "error");
        refresh();
      }
    },
    [headers, refresh, toast],
  );

  const updateQty = useCallback(
    (cartItemId: string, qty: number) => {
      // Immediately reflect in UI — no wait
      setItems((curr) =>
        curr.map((i) => (i.id === cartItemId ? { ...i, quantity: qty } : i)),
      );
      // Cancel any pending debounced call for this item
      const existing = pendingRef.current.get(cartItemId);
      if (existing !== undefined) clearTimeout(existing);
      // Debounce the actual API call — rapid clicks collapse into one request
      pendingRef.current.set(
        cartItemId,
        setTimeout(async () => {
          pendingRef.current.delete(cartItemId);
          try {
            const res = await fetch(`/api/cart/${cartItemId}`, {
              method: "PUT",
              headers: headers(),
              body: JSON.stringify({ quantity: qty }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setItems(data.items ?? []);
          } catch {
            // Sync from server on error instead of using stale prev snapshot
            refresh();
            toast("Could not update quantity.", "error");
          }
        }, 350),
      );
    },
    [headers, refresh, toast],
  );

  const removeItem = useCallback(
    async (cartItemId: string) => {
      const prev = items;
      setItems((curr) => curr.filter((i) => i.id !== cartItemId));
      try {
        const res = await fetch(`/api/cart/${cartItemId}`, {
          method: "DELETE",
          headers: headers(),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setItems(data.items ?? []);
      } catch {
        setItems(prev);
        toast("Could not remove item.", "error");
      }
    },
    [headers, items, toast],
  );

  const clearCart = useCallback(async () => {
    const prev = items;
    setItems([]);
    try {
      const res = await fetch("/api/cart/clear", {
        method: "DELETE",
        headers: headers(),
      });
      if (!res.ok) throw new Error();
    } catch {
      setItems(prev);
      toast("Could not clear cart.", "error");
    }
  }, [headers, items, toast]);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce(
    (sum, i) => sum + Number(i.product?.price ?? 0) * i.quantity,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        refresh,
        isLoading,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
