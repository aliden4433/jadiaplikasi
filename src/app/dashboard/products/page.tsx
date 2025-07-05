import { getProducts } from "./actions"
import { ProductsClientPage } from "./products-client-page"

export default async function ProductsPage() {
  const products = await getProducts()

  return (
      <ProductsClientPage products={products} />
  )
}
