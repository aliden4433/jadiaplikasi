
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

export async function duplicateProduct(product: Omit<Product, "id">) {
  try {
    const productsCol = collection(db, "products")
    const newProduct = { ...product, name: `${product.name} - Salinan` }
    await addDoc(productsCol, newProduct)
    revalidatePath("/dashboard/products")
    return { success: true, message: "Produk berhasil diduplikasi." }
  } catch (error) {
    console.error("Error duplicating product: ", error)
    return { success: false, message: "Gagal menduplikasi produk." }
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

export async function deleteProducts(ids: string[]) {
  try {
    const batch = writeBatch(db);
    ids.forEach(id => {
      const productRef = doc(db, "products", id);
      batch.delete(productRef);
    });
    await batch.commit();
    revalidatePath("/dashboard/products");
    return { success: true, message: `${ids.length} produk berhasil dihapus.` };
  } catch (error) {
    console.error("Error deleting products: ", error);
    return { success: false, message: "Gagal menghapus produk." };
  }
}


export async function updateProductsBatch(ids: string[], data: Partial<Omit<Product, "id">>) {
  try {
    const batch = writeBatch(db);
    ids.forEach(id => {
      const productRef = doc(db, "products", id);
      batch.update(productRef, data);
    });
    await batch.commit();
    revalidatePath("/dashboard/products");
    return { success: true, message: `${ids.length} produk berhasil diperbarui.` };
  } catch (error) {
    console.error("Error updating products: ", error);
    return { success: false, message: "Gagal memperbarui produk." };
  }
}
