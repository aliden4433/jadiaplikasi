import { getProducts } from './products/actions'
import { SalesClientPage } from './sales-client-page'

export default async function SalesPage() {
  const products = await getProducts()
  return <SalesClientPage products={products} />
}
