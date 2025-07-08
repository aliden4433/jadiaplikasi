import { getExpenseCategories, getGlobalSettings } from "./actions";
import { CategorySettingsClient } from "./category-settings-client";
import { GeneralSettings } from "./general-settings";
import type { GlobalSettings } from "@/lib/types";

export default async function SettingsPage() {
  const categories = await getExpenseCategories();
  const settings: GlobalSettings = await getGlobalSettings();

  return (
    <div className="grid gap-6">
      <GeneralSettings initialSettings={settings} />
      <CategorySettingsClient initialCategories={categories} />
    </div>
  );
}
