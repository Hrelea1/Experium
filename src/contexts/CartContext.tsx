import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type DeliveryType = 'physical' | 'digital' | null;

export interface CartItemService {
  serviceId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CartItem {
  id: string;
  title: string;
  location: string;
  price: number;
  quantity: number;
  image: string;
  isGift: boolean;
  services: CartItemService[];
}

export interface PersonalDetails {
  fullName: string;
  email: string;
  phone: string;
}

export interface DeliveryAddress {
  country: string;
  county: string;
  city: string;
  address: string;
  postcode: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity' | 'isGift' | 'services'>, services?: CartItemService[]) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  toggleGift: (id: string, isGift: boolean) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  totalWithVat: number;
  deliveryType: DeliveryType;
  setDeliveryType: (type: DeliveryType) => void;
  personalDetails: PersonalDetails;
  setPersonalDetails: (details: PersonalDetails) => void;
  deliveryAddress: DeliveryAddress;
  setDeliveryAddress: (address: DeliveryAddress) => void;
  checkoutStep: number;
  setCheckoutStep: (step: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'experium_cart';

const initialPersonalDetails: PersonalDetails = {
  fullName: '',
  email: '',
  phone: '',
};

const initialDeliveryAddress: DeliveryAddress = {
  country: 'România',
  county: '',
  city: '',
  address: '',
  postcode: '',
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });
  const [deliveryType, setDeliveryType] = useState<DeliveryType>(null);
  const [personalDetails, setPersonalDetails] = useState<PersonalDetails>(initialPersonalDetails);
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>(initialDeliveryAddress);
  const [checkoutStep, setCheckoutStep] = useState(0);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (item: Omit<CartItem, 'quantity' | 'isGift' | 'services'>, services: CartItemService[] = []) => {
    setItems(current => {
      // Each item is unique (includes timestamp in id), so no need to find existing
      return [...current, { ...item, quantity: 1, isGift: false, services }];
    });
  };

  const removeItem = (id: string) => {
    setItems(current => current.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    setItems(current =>
      current.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const toggleGift = (id: string, isGift: boolean) => {
    setItems(current =>
      current.map(item =>
        item.id === id ? { ...item, isGift } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setDeliveryType(null);
    setPersonalDetails(initialPersonalDetails);
    setDeliveryAddress(initialDeliveryAddress);
    setCheckoutStep(0);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => {
    const itemPrice = item.price * item.quantity;
    const servicesPrice = item.services.reduce((s, svc) => s + svc.price * svc.quantity, 0);
    return sum + itemPrice + servicesPrice;
  }, 0);
  // Price already includes VAT - no separate calculation needed
  const totalWithVat = subtotal;

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      toggleGift,
      clearCart,
      totalItems,
      subtotal,
      totalWithVat,
      deliveryType,
      setDeliveryType,
      personalDetails,
      setPersonalDetails,
      deliveryAddress,
      setDeliveryAddress,
      checkoutStep,
      setCheckoutStep,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
