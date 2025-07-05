"use server"

import { revalidatePath } from "next/cache"
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, writeBatch } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Product } from "@/lib/types"

export async function getProducts(): Promise<Product[]> {
  const productsCol = collection(db, "products")
  const q = query(productsCol, orderBy("name", "asc"));
  const productSnapshot = await getDocs(q)
  const productList = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product))
  return productList
}

export async function addProduct(product: Omit<Product, "id">) {
  try {
    const productsCol = collection(db, "products")
    await addDoc(productsCol, product)
    revalidatePath("/dashboard/products")
    return { success: true, message: "Produk berhasil ditambahkan." }
  } catch (error) {
    console.error("Error adding product: ", error)
    return { success: false, message: "Gagal menambahkan produk." }
  }
}

export async function addProductsBatch(products: Omit<Product, "id">[]) {
  try {
    const productsCol = collection(db, "products");
    const batch = writeBatch(db);

    products.forEach((product) => {
      const docRef = doc(productsCol); // Automatically generate unique ID
      batch.set(docRef, product);
    });

    await batch.commit();
    revalidatePath("/dashboard/products");
    return { success: true, message: "Produk berhasil diimpor." };
  } catch (error) {
    console.error("Error adding products in batch: ", error);
    return { success: false, message: "Gagal mengimpor produk." };
  }
}

export async function updateProduct(id: string, product: Omit<Product, "id">) {
  try {
    const productRef = doc(db, "products", id)
    await updateDoc(productRef, product)
    revalidatePath("/dashboard/products")
    return { success: true, message: "Produk berhasil diperbarui." }
  } catch (error) {
    console.error("Error updating product: ", error)
    return { success: false, message: "Gagal memperbarui produk." }
  }
}

export async function deleteProduct(id: string) {
  try {
    const productRef = doc(db, "products", id)
    await deleteDoc(productRef)
    revalidatePath("/dashboard/products")
    return { success: true, message: "Produk berhasil dihapus." }
  } catch (error) {
    console.error("Error deleting product: ", error)
    return { success: false, message: "Gagal menghapus produk." }
  }
}
