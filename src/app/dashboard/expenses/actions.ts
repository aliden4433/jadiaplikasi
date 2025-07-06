
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
import type { Expense } from "@/lib/types";

export async function getExpenses(): Promise<Expense[]> {
  const expensesCol = collection(db, "expenses");
  const q = query(expensesCol, orderBy("date", "desc"));
  const expenseSnapshot = await getDocs(q);
  const expenseList = expenseSnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Expense)
  );
  return expenseList;
}

export async function addExpense(expense: Omit<Expense, "id">) {
  try {
    const expensesCol = collection(db, "expenses");
    await addDoc(expensesCol, expense);
    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard/reports");
    revalidatePath("/dashboard/sales-history");
    return { success: true, message: "Pengeluaran berhasil ditambahkan." };
  } catch (error) {
    console.error("Error adding expense: ", error);
    return { success: false, message: "Gagal menambahkan pengeluaran." };
  }
}

export async function updateExpense(id: string, expense: Omit<Expense, "id">) {
  try {
    const expenseRef = doc(db, "expenses", id);
    await updateDoc(expenseRef, expense);
    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard/reports");
    revalidatePath("/dashboard/sales-history");
    return { success: true, message: "Pengeluaran berhasil diperbarui." };
  } catch (error) {
    console.error("Error updating expense: ", error);
    return { success: false, message: "Gagal memperbarui pengeluaran." };
  }
}

export async function deleteExpense(id: string) {
  try {
    const expenseRef = doc(db, "expenses", id);
    await deleteDoc(expenseRef);
    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard/reports");
    revalidatePath("/dashboard/sales-history");
    return { success: true, message: "Pengeluaran berhasil dihapus." };
  } catch (error) {
    console.error("Error deleting expense: ", error);
    return { success: false, message: "Gagal menghapus pengeluaran." };
  }
}
