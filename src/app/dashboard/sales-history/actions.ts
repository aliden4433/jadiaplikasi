'use server';

import { revalidatePath } from 'next/cache';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Sale } from '@/lib/types';

export async function deleteSale(sale: Sale) {
  if (!sale || !sale.id) {
    return { success: false, message: 'Data penjualan tidak valid.' };
  }

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Get the sale document ref
      const saleRef = doc(db, 'sales', sale.id);

      // 2. For each item in the sale, update the product stock
      for (const item of sale.items) {
        if (!item.productId) continue;
        const productRef = doc(db, 'products', item.productId);
        const productDoc = await transaction.get(productRef);

        if (productDoc.exists()) {
          const currentStock = productDoc.data().stock;
          const newStock = currentStock + item.quantity;
          transaction.update(productRef, { stock: newStock });
        }
        // If product doesn't exist, we can't restock it. We'll just ignore it.
      }

      // 3. Delete the sale document
      transaction.delete(saleRef);
    });

    revalidatePath('/dashboard/sales-history');
    revalidatePath('/dashboard/products');
    revalidatePath('/dashboard/reports');
    revalidatePath('/dashboard');

    return { success: true, message: 'Transaksi berhasil dihapus dan stok dikembalikan.' };
  } catch (error) {
    console.error('Error deleting sale: ', error);
    const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus transaksi.';
    return { success: false, message: errorMessage };
  }
}
