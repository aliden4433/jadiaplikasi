import { getProducts } from './products/actions'
import { getSalesHistory } from './reports/actions'
import { getExpenseCategories, getGlobalSettings } from './settings/actions'
import { SalesClientPage } from './sales-client-page'

export default async function SalesPage() {
  const products = await getProducts()
  const sales = await getSalesHistory()
  const categories = await getExpenseCategories()
  const settings = await getGlobalSettings()
  return <SalesClientPage products={products} sales={sales} categories={categories} initialSettings={settings} />
}
