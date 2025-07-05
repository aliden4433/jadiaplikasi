'use server';

import { revalidatePath } from 'next/cache';
import { collection, doc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product, CartItem } from '@/lib/types';
import {
  extractProducts as extractProductsFromPdfFlow,
} from '@/ai/flows/extract-products-from-pdf-flow';
import { getProducts, addProductsBatch } from '../products/actions';

export type SalesPdfReviewData = {
    extractedName: string;
    extractedPrice: number;
    extractedCostPrice: number;
    extractedQuantity: number;
    matchedProduct: Product | null;
};

export async function processSalesPdfForReview(pdfDataUri: string): Promise<SalesPdfReviewData[]> {
  const extractedResult = await extractProductsFromPdfFlow({ pdfDataUri });
  if (!extractedResult.products || extractedResult.products.length === 0) {
    return [];
  }

  // Group products by name and sum quantities
  const consolidatedProductsMap = new Map<string, { name: string; price: number; costPrice: number; quantity: number }>();

  for (const product of extractedResult.products) {
    const nameKey = product.name.toLowerCase().trim();
    if (consolidatedProductsMap.has(nameKey)) {
        const existing = consolidatedProductsMap.get(nameKey)!;
        existing.quantity += product.stock; // 'stock' from PDF is quantity
    } else {
        consolidatedProductsMap.set(nameKey, {
            name: product.name,
            price: product.price,
            costPrice: product.costPrice,
            quantity: product.stock,
        });
    }
  }

  const consolidatedExtractedProducts = Array.from(consolidatedProductsMap.values());

  const allDbProducts = await getProducts();
  // Sort products by name length descending to match longer, more specific names first
  const sortedDbProducts = allDbProducts.sort((a, b) => b.name.length - a.name.length);

  return consolidatedExtractedProducts.map(consolidatedProduct => {
    const extractedNameLower = consolidatedProduct.name.toLowerCase().trim();
    
    let matchedProduct: Product | null = null;

    // Custom mapping logic based on user request
    if (extractedNameLower.includes('120 x 50')) {
      matchedProduct = sortedDbProducts.find(p => p.name.toLowerCase().trim() === 'glaswool 50 cm') || null;
    } else if (extractedNameLower.includes('120 x 100')) {
      matchedProduct = sortedDbProducts.find(p => p.name.toLowerCase().trim() === 'glaswool 1m') || null;
    } else if (extractedNameLower.includes('60 x 30')) {
      matchedProduct = sortedDbProducts.find(p => p.name.toLowerCase().trim() === 'putih 60x30') || null;
    }

    // If no custom rule matched, fall back to the generic fuzzy matching
    if (!matchedProduct) {
        matchedProduct = 
            // 1. Exact match (case-insensitive, trimmed)
            sortedDbProducts.find(p => p.name.toLowerCase().trim() === extractedNameLower) ||
            // 2. DB product name is found within the extracted name
            //    (e.g., DB: "Kopi Susu", PDF: "Item Kopi Susu Spesial")
            sortedDbProducts.find(p => extractedNameLower.includes(p.name.toLowerCase().trim())) ||
            null;
    }

    return {
      extractedName: consolidatedProduct.name,
      extractedPrice: consolidatedProduct.price || 0,
      extractedCostPrice: consolidatedProduct.costPrice || 0,
      extractedQuantity: consolidatedProduct.quantity || 1,
      matchedProduct: matchedProduct
    };
  });
}


export async function addOrUpdateProductsAndGetCartItems(
    items: { name: string; price: number; costPrice: number; quantity: number; id?: string }[]
): Promise<CartItem[]> {
    const newProductsToCreate: Omit<Product, 'id'>[] = items
        .filter(item => !item.id) // Filter for new products which don't have an ID
        .map(item => ({
            name: item.name,
            price: item.price,
            costPrice: item.costPrice, // Default cost price for new products from sales
            stock: 0,     // Default stock, will be immediately adjusted by sale
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
  transactionDate: string
}) {
  try {
    const validItems = saleData.items.filter(item => item.product && item.product.id);
    
    if (validItems.length === 0) {
      throw new Error("Tidak ada item yang valid di keranjang untuk diproses.");
    }
    
    const subtotal = validItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const discountAmount = subtotal * (saleData.discountPercentage / 100);
    const total = subtotal - discountAmount;
    const totalCost = validItems.reduce((acc, item) => acc + (item.product.costPrice || 0) * item.quantity, 0);
    const profit = total - totalCost;

    await runTransaction(db, async (transaction) => {
      // 1. Get and increment the sales counter
      const counterRef = doc(db, "counters", "sales");
      const counterDoc = await transaction.get(counterRef);
      
      const currentCount = counterDoc.exists() ? counterDoc.data().count : 0;
      const newCount = currentCount + 1;
      const newTransactionId = `TRX-${String(newCount).padStart(5, '0')}`;
      
      // 2. READ all product documents first.
      const productRefs = validItems.map(item => doc(db, "products", item.product.id!));
      const productDocs = await Promise.all(productRefs.map(ref => transaction.get(ref)));

      // 3. Now perform all WRITE operations.
      // First, create the sale document.
      const salesCol = collection(db, "sales");
      const saleRef = doc(salesCol);
      
      const saleToSave = {
        transactionId: newTransactionId,
        items: validItems.map(item => ({
          productId: item.product.id!,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.price,
          costPrice: item.product.costPrice || 0,
        })),
        subtotal,
        discount: discountAmount,
        total,
        totalCost,
        profit,
        date: saleData.transactionDate,
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

      // Finally, update the counter
      transaction.set(counterRef, { count: newCount }, { merge: true });
    });
    
    revalidatePath("/dashboard/products")
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/reports")
    revalidatePath("/dashboard/sales-history")

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
