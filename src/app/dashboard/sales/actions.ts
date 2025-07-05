'use server';

import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product } from '@/lib/types';
import {
  extractProducts as extractProductsFromPdfFlow,
} from '@/ai/flows/extract-products-from-pdf-flow';
import { getProducts, addProductsBatch } from '../products/actions';

type ProcessedPdfResult = {
    productsForCart: Product[];
    newProductsCount: number;
    existingProductsCount: number;
}

export async function processSalesPdf(pdfDataUri: string): Promise<ProcessedPdfResult> {
  // 1. Extract products using AI
  const extractedResult = await extractProductsFromPdfFlow({ pdfDataUri });
  if (!extractedResult.products || extractedResult.products.length === 0) {
    return { productsForCart: [], newProductsCount: 0, existingProductsCount: 0 };
  }

  // 2. Get all existing products for lookup
  const allDbProducts = await getProducts();
  const productMap = new Map(allDbProducts.map(p => [p.name.toLowerCase().trim(), p]));

  const productsToCreate: Omit<Product, 'id'>[] = [];
  const productsForCartMap = new Map<string, Product>();

  // 3. Differentiate between new and existing products
  for (const extractedProduct of extractedResult.products) {
    const nameKey = extractedProduct.name.toLowerCase().trim();
    const existingProduct = productMap.get(nameKey);

    if (existingProduct) {
        if (!productsForCartMap.has(existingProduct.id!)) {
             productsForCartMap.set(existingProduct.id!, existingProduct);
        }
    } else {
        // Avoid adding duplicate new products if they appear multiple times in the PDF
        if (!productsToCreate.some(p => p.name.toLowerCase().trim() === nameKey)) {
            productsToCreate.push({
                name: extractedProduct.name,
                description: extractedProduct.description || '',
                price: extractedProduct.price || 0,
                costPrice: extractedProduct.costPrice || 0,
                stock: extractedProduct.stock || 0,
            });
        }
    }
  }
  
  const existingProductsCount = productsForCartMap.size;
  let finalProductsForCart = Array.from(productsForCartMap.values());

  // 4. Batch-create new products if any
  if (productsToCreate.length > 0) {
    await addProductsBatch(productsToCreate);

    // 5. Re-fetch all products to get the newly created ones with their IDs
    const updatedDbProducts = await getProducts();
    const updatedProductMap = new Map(updatedDbProducts.map(p => [p.name.toLowerCase().trim(), p]));

    // 6. Find the newly created products and add them to the cart list
    for (const newProdData of productsToCreate) {
        const nameKey = newProdData.name.toLowerCase().trim();
        if (updatedProductMap.has(nameKey)) {
            finalProductsForCart.push(updatedProductMap.get(nameKey)!);
        }
    }
  }
  
  return {
    productsForCart: finalProductsForCart,
    newProductsCount: productsToCreate.length,
    existingProductsCount: existingProductsCount,
  };
}
