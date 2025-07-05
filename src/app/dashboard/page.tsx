import { getProducts } from './products/actions'
import { getSalesHistory } from './reports/actions'
import { SalesClientPage } from './sales-client-page'

export default async function SalesPage() {
  const products = await getProducts()
  const sales = await getSalesHistory()
  return <SalesClientPage products={products} sales={sales} />
}
