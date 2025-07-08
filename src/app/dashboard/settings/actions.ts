
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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ExpenseCategoryDoc, GlobalSettings } from "@/lib/types";

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
