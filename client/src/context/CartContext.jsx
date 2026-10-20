import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api.js';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    try {
      const res = await api.get('/cart');
      setItems(res.data.items || []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = useCallback(async (product_id, quantity = 1) => {
    setLoading(true);
    try {
      const res = await api.post('/cart/items', { product_id, quantity });
      setItems(res.data.items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateItem = useCallback(async (product_id, quantity) => {
    const res = await api.put(`/cart/items/${product_id}`, { quantity });
    setItems(res.data.items || []);
  }, []);

  const removeItem = useCallback(async (product_id) => {
    const res = await api.delete(`/cart/items/${product_id}`);
    setItems(res.data.items || []);
  }, []);

  const mergeGuestCart = useCallback(async () => {
    try {
      const res = await api.post('/cart/merge');
      setItems(res.data.items || []);
    } catch {
      // ignore
    }
  }, []);

  const clearLocalCart = useCallback(() => {
    setItems([]);
  }, []);

  const total = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        total,
        count,
        isOpen,
        loading,
        setIsOpen,
        fetchCart,
        addItem,
        updateItem,
        removeItem,
        mergeGuestCart,
        clearLocalCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
