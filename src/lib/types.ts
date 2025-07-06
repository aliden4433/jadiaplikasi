export type Product = {
  id?: string
  name: string
  price: number
  costPrice: number
  stock: number
  description?: string
}

export type CartItem = {
  product: Product
  quantity: number
  price: number
}

export type SaleItem = {
  productId: string
  productName: string
  quantity: number
  price: number
  costPrice: number
}

export type Sale = {
  id: string
  transactionId: string
  items: SaleItem[]
  subtotal: number
  discount: number
  total: number
  totalCost: number
  profit: number
  date: string
}

export type AppUser = {
  uid: string
  email: string | null
  role: "admin" | "cashier"
}

export const expenseCategories = [
  "Stok Barang",
  "Operasional",
  "Gaji",
  "Marketing",
  "Sewa",
  "Lainnya",
] as const;

export type ExpenseCategory = typeof expenseCategories[number];

export type Expense = {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
};
