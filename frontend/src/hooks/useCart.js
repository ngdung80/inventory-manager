import { useState, useCallback, useMemo } from 'react';

const useCart = (initialTaxRate = 10) => {
  const [cartItems, setCartItems] = useState([]);
  const [taxRate, setTaxRate] = useState(initialTaxRate);
  const [discount, setDiscount] = useState(0);

  const addToCart = useCallback((product) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product.id === product.id);
      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          alert('Không thể thêm nữa. Đã đạt giới hạn tồn kho.');
          return prevItems;
        }
        return prevItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      if (product.stock < 1) {
        alert('Sản phẩm đã hết hàng.');
        return prevItems;
      }
      return [...prevItems, { product, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    setCartItems((prevItems) => {
      const item = prevItems.find((i) => i.product.id === productId);
      if (!item) return prevItems;

      if (quantity > item.product.stock) {
        alert('Đã đạt giới hạn tồn kho.');
        return prevItems;
      }
      if (quantity < 1) return prevItems;

      return prevItems.map((i) =>
        i.product.id === productId ? { ...i, quantity } : i
      );
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setDiscount(0);
  }, []);

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cartItems]);

  const taxAmount = useMemo(() => {
    return (subtotal * taxRate) / 100;
  }, [subtotal, taxRate]);

  const total = useMemo(() => {
    return subtotal + taxAmount - discount;
  }, [subtotal, taxAmount, discount]);

  return {
    cartItems,
    taxRate,
    setTaxRate,
    discount,
    setDiscount,
    subtotal,
    taxAmount,
    total,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };
};

export default useCart;
