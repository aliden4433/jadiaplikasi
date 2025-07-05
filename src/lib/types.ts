export type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  image: string;
  category: string;
  description: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type Sale = {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  date: string;
};
