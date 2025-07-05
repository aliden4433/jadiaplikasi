'use server';

import { revalidatePath } from 'next/cache';
import { collection, doc, runTransaction, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product, CartItem } from '@/lib/types';
import {
  extractProducts as extractProductsFromPdfFlow,
} from '@/ai/flows/extract-products-from-pdf-flow';
import { getProducts, addProductsBatch } from '../products/actions';

export type SalesPdfReviewData = {
    extractedName: string;
    extractedPrice: number;
    extractedQuantity: number;
    matchedProduct: Product | null;
};

export async function processSalesPdfForReview(pdfDataUri: string): Promise<SalesPdfReviewData[]> {
  const extractedResult = await extractProductsFromPdfFlow({ pdfDataUri });
  if (!extractedResult.products || extractedResult.products.length === 0) {
    return [];
  }

  const allDbProducts = await getProducts();
  const productMap = new Map(allDbProducts.map(p => [p.name.toLowerCase().trim(), p]));

  return extractedResult.products.map(extractedProduct => {
    const nameKey = extractedProduct.name.toLowerCase().trim();
    const matchedProduct = productMap.get(nameKey) || null;
    return {
      extractedName: extractedProduct.name,
      extractedPrice: extractedProduct.price || 0,
      extractedQuantity: extractedProduct.stock || 1, // 'stock' from PDF is interpreted as quantity
      matchedProduct: matchedProduct
    };
  });
}

export async function addOrUpdateProductsAndGetCartItems(
    items: { name: string; price: number; quantity: number; id?: string }[]
): Promise<CartItem[]> {
    const newProductsToCreate: Omit<Product, 'id'>[] = items
        .filter(item => !item.id) // Filter for new products which don't have an ID
        .map(item => ({
            name: item.name,
            price: item.price,
            costPrice: 0, // Default cost price for new products from sales
            stock: 0,     // Default stock, will be immediately adjusted by sale
            description: '', // Default description
        }));

    // Batch-create new products if any
    if (newProductsToCreate.length > 0) {
        await addProductsBatch(newProductsToCreate);
    }

    // Re-fetch all products to get IDs for the new ones and latest data for all
    const allDbProducts = await getProducts();
    const productMapByName = new Map(allDbProducts.map(p => [p.name.toLowerCase().trim(), p]));
    const productMapById = new Map(allDbProducts.map(p => [p.id!, p]));

    const cartItems: CartItem[] = [];

    for (const item of items) {
        // Find product by ID if it exists, otherwise by name (for new/edited products)
        const product = item.id
            ? productMapById.get(item.id)
            : productMapByName.get(item.name.toLowerCase().trim());
        
        if (product) {
            cartItems.push({
                product,
                quantity: item.quantity,
                price: item.price, // Use the price from the review form
            });
        }
    }
    return cartItems;
}


export async function addSale(saleData: {
  items: CartItem[]
  discountPercentage: number
}) {
  try {
    // 1. Filter out items that don't have a product or product ID to prevent crashes.
    const validItems = saleData.items.filter(item => item.product && item.product.id);
    
    if (validItems.length === 0) {
      throw new Error("Tidak ada item yang valid di keranjang untuk diproses.");
    }
    
    // 2. Recalculate totals on the server based only on valid items to ensure data integrity.
    const subtotal = validItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const discountAmount = subtotal * (saleData.discountPercentage / 100);
    const total = subtotal - discountAmount;

    await runTransaction(db, async (transaction) => {
      // Step 1: READ all product documents first.
      const productRefs = validItems.map(item => doc(db, "products", item.product.id!));
      const productDocs = await Promise.all(productRefs.map(ref => transaction.get(ref)));

      // Step 2: Now perform all WRITE operations.
      // First, create the sale document.
      const salesCol = collection(db, "sales");
      const saleRef = doc(salesCol);
      
      const saleToSave = {
        items: validItems.map(item => ({
          productId: item.product.id!,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.price,
        })),
        subtotal,
        discount: discountAmount,
        total,
        date: new Date().toISOString(),
      };
      transaction.set(saleRef, saleToSave);

      // Next, update the stock for each product.
      for (let i = 0; i < validItems.length; i++) {
        const item = validItems[i];
        const productDoc = productDocs[i];
        const productRef = productRefs[i];

        if (!productDoc.exists()) {
          throw new Error(`Produk "${item.product.name}" tidak ditemukan.`);
        }

        const currentStock = productDoc.data().stock;
        const newStock = currentStock - item.quantity;

        transaction.update(productRef, { stock: newStock });
      }
    });
    
    revalidatePath("/dashboard/products")
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/reports")

    const skippedItemsCount = saleData.items.length - validItems.length;
    const message = skippedItemsCount > 0 
        ? `Transaksi berhasil dicatat. ${skippedItemsCount} item diabaikan karena data tidak lengkap.`
        : "Transaksi berhasil dicatat.";

    return { success: true, message: message }
  } catch (error) {
    console.error("Error adding sale: ", error)
    const errorMessage = error instanceof Error ? error.message : "Gagal mencatat transaksi."
    return { success: false, message: errorMessage }
  }
}
