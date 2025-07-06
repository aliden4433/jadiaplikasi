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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ExpenseCategoryDoc } from "@/lib/types";

const CATEGORIES_COLLECTION = "expense_categories";

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
    await addDoc(categoriesCol, { name });
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/expenses");
    return { success: true, message: "Kategori berhasil ditambahkan." };
  } catch (error) {
    console.error("Error adding expense category: ", error);
    return { success: false, message: "Gagal menambahkan kategori." };
  }
}

export async function updateExpenseCategory(id: string, name: string) {
  try {
    const categoryRef = doc(db, CATEGORIES_COLLECTION, id);
    await updateDoc(categoryRef, { name });
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
