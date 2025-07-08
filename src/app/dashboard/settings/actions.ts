
"use server";

import { revalidatePath } from "next/cache";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  getDoc,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ExpenseCategoryDoc, GlobalSettings, Product, Sale, SaleItem } from "@/lib/types";

const CATEGORIES_COLLECTION = "expense_categories";
const SETTINGS_COLLECTION = "global_settings";
const MAIN_SETTINGS_DOC_ID = "main";


export async function getExpenseCategories(): Promise<ExpenseCategoryDoc[]> {
  const categoriesCol = collection(db, CATEGORIES_COLLECTION);
  const q = query(categoriesCol, orderBy("name", "asc"));
  const snapshot = await getDocs(q);
  const list = snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as ExpenseCategoryDoc)
  );
  return list;
}

export async function addExpenseCategory(name: string) {
  try {
    const categoriesCol = collection(db, CATEGORIES_COLLECTION);
    await addDoc(categoriesCol, { name, descriptions: [] });
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/expenses");
    return { success: true, message: "Kategori berhasil ditambahkan." };
  } catch (error) {
    console.error("Error adding expense category: ", error);
    return { success: false, message: "Gagal menambahkan kategori." };
  }
}

export async function updateExpenseCategory(id: string, data: { name?: string; descriptions?: string[] }) {
  try {
    const categoryRef = doc(db, CATEGORIES_COLLECTION, id);
    await updateDoc(categoryRef, data);
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/expenses");
    return { success: true, message: "Kategori berhasil diperbarui." };
  } catch (error) {
    console.error("Error updating expense category: ", error);
    return { success: false, message: "Gagal memperbarui kategori." };
  }
}

export async function deleteExpenseCategory(id: string) {
  try {
    const categoryRef = doc(db, CATEGORIES_COLLECTION, id);
    await deleteDoc(categoryRef);
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/expenses");
    return { success: true, message: "Kategori berhasil dihapus." };
  } catch (error) {
    console.error("Error deleting expense category: ", error);
    return { success: false, message: "Gagal menghapus kategori. Pastikan tidak ada pengeluaran yang menggunakan kategori ini." };
  }
}

export async function getGlobalSettings(): Promise<GlobalSettings> {
  const settingsRef = doc(db, SETTINGS_COLLECTION, MAIN_SETTINGS_DOC_ID);
  const docSnap = await getDoc(settingsRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as GlobalSettings;
  } else {
    // Return default settings if not found
    return { defaultDiscount: 0 };
  }
}

export async function updateGlobalSettings(data: Partial<Omit<GlobalSettings, 'id'>>) {
  try {
    const settingsRef = doc(db, SETTINGS_COLLECTION, MAIN_SETTINGS_DOC_ID);
    await setDoc(settingsRef, data, { merge: true });
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard"); // For sales page
    return { success: true, message: "Pengaturan berhasil diperbarui." };
  } catch (error) {
    console.error("Error updating global settings: ", error);
    return { success: false, message: "Gagal memperbarui pengaturan." };
  }
}

export async function synchronizeCostPrices() {
  try {
    const productsCol = collection(db, "products");
    const productsSnapshot = await getDocs(productsCol);
    const productMap = new Map<string, Product>();
    productsSnapshot.docs.forEach(doc => {
      productMap.set(doc.id, { id: doc.id, ...doc.data() } as Product);
    });

    const salesCol = collection(db, "sales");
    const salesSnapshot = await getDocs(salesCol);

    const batch = writeBatch(db);
    let updatedSalesCount = 0;

    salesSnapshot.docs.forEach(saleDoc => {
      const sale = { id: saleDoc.id, ...saleDoc.data() } as Sale;
      let needsUpdate = false;
      
      const newItems: SaleItem[] = sale.items.map(item => {
        const product = productMap.get(item.productId);
        if (product && item.costPrice !== product.costPrice) {
          needsUpdate = true;
          return { ...item, costPrice: product.costPrice };
        }
        return item;
      });

      if (needsUpdate) {
        const newTotalCost = newItems.reduce((acc, item) => acc + (item.costPrice || 0) * item.quantity, 0);
        const newProfit = sale.total - newTotalCost;
        
        const saleRef = saleDoc.ref;
        batch.update(saleRef, {
          items: newItems,
          totalCost: newTotalCost,
          profit: newProfit,
        });
        updatedSalesCount++;
      }
    });

    if (updatedSalesCount > 0) {
      await batch.commit();
    }

    revalidatePath("/dashboard/reports");
    revalidatePath("/dashboard/sales-history");

    return { success: true, message: `${updatedSalesCount} transaksi telah disinkronkan dengan harga modal terbaru.` };
  } catch (error) {
    console.error("Error synchronizing cost prices: ", error);
    return { success: false, message: "Gagal menyinkronkan harga." };
  }
}
