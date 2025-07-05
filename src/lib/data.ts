import type { Product, Sale } from '@/lib/types';

export const products: Product[] = [
  { id: 'prod1', name: 'Espresso', price: 2.50, stock: 100, image: 'https://placehold.co/150x150.png', category: 'Drinks', description: 'Strong black coffee.' },
  { id: 'prod2', name: 'Latte', price: 3.50, stock: 80, image: 'https://placehold.co/150x150.png', category: 'Drinks', description: 'Espresso with steamed milk.' },
  { id: 'prod3', name: 'Croissant', price: 2.75, stock: 50, image: 'https://placehold.co/150x150.png', category: 'Pastries', description: 'Buttery, flaky pastry.' },
  { id: 'prod4', name: 'Muffin', price: 3.00, stock: 60, image: 'https://placehold.co/150x150.png', category: 'Pastries', description: 'Blueberry muffin.' },
  { id: 'prod5', name: 'Iced Tea', price: 2.25, stock: 90, image: 'https://placehold.co/150x150.png', category: 'Drinks', description: 'Refreshing iced tea.' },
  { id: 'prod6', name: 'Sandwich', price: 6.50, stock: 30, image: 'https://placehold.co/150x150.png', category: 'Food', description: 'Turkey and cheese sandwich.' },
  { id: 'prod7', name: 'Bagel', price: 2.50, stock: 70, image: 'https://placehold.co/150x150.png', category: 'Pastries', description: 'Plain bagel with cream cheese.' },
  { id: 'prod8', name: 'Scone', price: 3.25, stock: 45, image: 'https://placehold.co/150x150.png', category: 'Pastries', description: 'Cranberry orange scone.' },
  { id: 'prod9', name: 'Hot Chocolate', price: 3.75, stock: 65, image: 'https://placehold.co/150x150.png', category: 'Drinks', description: 'Rich hot chocolate with whipped cream.' },
  { id: 'prod10', name: 'Salad', price: 7.50, stock: 25, image: 'https://placehold.co/150x150.png', category: 'Food', description: 'Fresh garden salad.' },
];

const today = new Date();
const yesterday = new Date();
yesterday.setDate(today.getDate() - 1);

export const sales: Sale[] = [
  {
    id: 'sale1',
    items: [{ product: products[0], quantity: 2 }, { product: products[2], quantity: 1 }],
    subtotal: 7.75,
    discount: 0,
    total: 7.75,
    date: today.toISOString(),
  },
  {
    id: 'sale2',
    items: [{ product: products[1], quantity: 1 }, { product: products[3], quantity: 2 }],
    subtotal: 9.50,
    discount: 1.00,
    total: 8.50,
    date: today.toISOString(),
  },
  {
    id: 'sale3',
    items: [{ product: products[5], quantity: 1 }],
    subtotal: 6.50,
    discount: 0,
    total: 6.50,
    date: yesterday.toISOString(),
  },
  {
    id: 'sale4',
    items: [{ product: products[4], quantity: 1 }, { product: products[6], quantity: 1 }, { product: products[0], quantity: 3 }],
    subtotal: 12.25,
    discount: 2.00,
    total: 10.25,
    date: yesterday.toISOString(),
  },
];
