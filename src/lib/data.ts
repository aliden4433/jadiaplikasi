import type { Sale } from '@/lib/types'

const today = new Date()
const yesterday = new Date()
yesterday.setDate(today.getDate() - 1)

// Note: This is now historical mock data. Product data is managed in Firestore.
export const sales: Sale[] = [
  {
    id: 'sale1',
    items: [
      { productId: 'prod1', productName: 'Espresso', quantity: 2, price: 2.5 },
      { productId: 'prod3', productName: 'Croissant', quantity: 1, price: 2.75 },
    ],
    subtotal: 7.75,
    discount: 0,
    total: 7.75,
    date: today.toISOString(),
  },
  {
    id: 'sale2',
    items: [
      { productId: 'prod1', productName: 'Latte', quantity: 1, price: 3.5 },
      { productId: 'prod3', productName: 'Muffin', quantity: 2, price: 3.0 },
    ],
    subtotal: 9.5,
    discount: 1.0,
    total: 8.5,
    date: today.toISOString(),
  },
  {
    id: 'sale3',
    items: [{ productId: 'prod6', productName: 'Sandwich', quantity: 1, price: 6.5 }],
    subtotal: 6.5,
    discount: 0,
    total: 6.5,
    date: yesterday.toISOString(),
  },
  {
    id: 'sale4',
    items: [
      { productId: 'prod5', productName: 'Iced Tea', quantity: 1, price: 2.25 },
      { productId: 'prod7', productName: 'Bagel', quantity: 1, price: 2.5 },
      { productId: 'prod1', productName: 'Espresso', quantity: 3, price: 2.5 },
    ],
    subtotal: 12.25,
    discount: 2.0,
    total: 10.25,
    date: yesterday.toISOString(),
  },
]
