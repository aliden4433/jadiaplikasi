
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
      const saleRef = doc(db, 'sales', sale.id);

      // Create a list of items that have a valid product ID, along with their refs.
      const validItemsWithRefs = sale.items
        .filter(item => !!item.productId)
        .map(item => ({
          itemData: item,
          ref: doc(db, 'products', item.productId!),
        }));
      
      // Step 1: READ all product documents first.
      if (validItemsWithRefs.length > 0) {
        const productDocs = await Promise.all(
          validItemsWithRefs.map(x => transaction.get(x.ref))
        );
        
        // Step 2: Now perform all WRITE operations.
        for (let i = 0; i < productDocs.length; i++) {
          const productDoc = productDocs[i];
          const { itemData, ref } = validItemsWithRefs[i];

          if (productDoc.exists()) {
            const currentStock = productDoc.data().stock || 0;
            const newStock = currentStock + itemData.quantity;
            transaction.update(ref, { stock: newStock });
          }
        }
      }

      // Finally, delete the sale document.
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

export async function deleteSales(sales: Sale[]) {
    if (!sales || sales.length === 0) {
      return { success: false, message: 'Tidak ada transaksi yang dipilih.' };
    }
  
    try {
      await Promise.all(sales.map(sale => deleteSale(sale)));
  
      revalidatePath('/dashboard/sales-history');
      revalidatePath('/dashboard/products');
      revalidatePath('/dashboard/reports');
      revalidatePath('/dashboard');
  
      return { success: true, message: `${sales.length} transaksi berhasil dihapus dan stok dikembalikan.` };
    } catch (error) {
      console.error('Error deleting sales: ', error);
      const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus beberapa transaksi.';
      return { success: false, message: errorMessage };
    }
}
