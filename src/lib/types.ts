export type Product = {
  id?: string
  name: string
  price: number
  costPrice: number
  stock: number
  description: string
}

export type CartItem = {
  product: Product
  quantity: number
}

export type SaleItem = {
  productId: string
  productName: string
  quantity: number
  price: number
}

export type Sale = {
  id: string
  items: SaleItem[]
  subtotal: number
  discount: number
  total: number
  date: string
}
