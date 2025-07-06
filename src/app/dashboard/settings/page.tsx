import { getExpenseCategories } from "./actions";
import { CategorySettingsClient } from "./category-settings-client";
import { GeneralSettings } from "./general-settings";

export default async function SettingsPage() {
  const categories = await getExpenseCategories();

  return (
    <div className="grid gap-6">
      <GeneralSettings />
      <CategorySettingsClient initialCategories={categories} />
    </div>
  );
}
