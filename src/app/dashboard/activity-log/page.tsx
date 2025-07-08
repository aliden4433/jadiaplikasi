
import { getActivityLog } from "./actions";
import { ActivityLogClientPage } from "./activity-log-client-page";

export default async function ActivityLogPage() {
  const activities = await getActivityLog();
  return <ActivityLogClientPage activities={activities} />;
}
