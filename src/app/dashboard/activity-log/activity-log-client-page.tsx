
"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ShoppingCart, Wallet } from "lucide-react";

import type { ActivityLogItem } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ActivityLogClientPageProps {
  activities: ActivityLogItem[];
}

const formatCurrency = (value: number) => {
  const isNegative = value < 0;
  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Math.abs(value));
  return isNegative ? `-${formatted}` : formatted;
};

const ActivityIcon = ({ type }: { type: "sale" | "expense" }) => {
  if (type === "sale") {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
        <ShoppingCart className="h-4 w-4 text-green-600 dark:text-green-400" />
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
      <Wallet className="h-4 w-4 text-red-600 dark:text-red-400" />
    </div>
  );
};

export function ActivityLogClientPage({ activities }: ActivityLogClientPageProps) {
  const groupedActivities = useMemo(() => {
    return activities.reduce((acc, activity) => {
      const dateKey = format(new Date(activity.date), "eeee, d MMMM yyyy", { locale: id });
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(activity);
      return acc;
    }, {} as Record<string, ActivityLogItem[]>);
  }, [activities]);

  const sortedDates = Object.keys(groupedActivities).sort(
    (a, b) =>
      new Date(groupedActivities[b][0].date).getTime() -
      new Date(groupedActivities[a][0].date).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Aktivitas</CardTitle>
        <CardDescription>
          Melihat riwayat semua penjualan dan pengeluaran yang tercatat.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            Belum ada aktivitas yang tercatat.
          </div>
        ) : (
          <div className="space-y-8">
            {sortedDates.map((date) => (
              <div key={date}>
                <h3 className="mb-4 text-lg font-semibold">{date}</h3>
                <div className="relative space-y-8 pl-8 after:absolute after:inset-y-0 after:left-4 after:w-px after:bg-border">
                  {groupedActivities[date].map((activity) => (
                    <div key={activity.id} className="relative flex items-start gap-4">
                      <div className="absolute -left-8 top-0 z-10">
                        <ActivityIcon type={activity.type} />
                      </div>
                      <div className="grid flex-1 gap-1">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{activity.description}</p>
                            <p className={cn(
                                "text-sm font-semibold",
                                activity.type === "sale" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                            )}>
                                {formatCurrency(activity.amount)}
                            </p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <span>
                            {format(new Date(activity.date), "HH:mm", { locale: id })}
                          </span>
                          {activity.user && (
                            <>
                              <span className="mx-1">·</span>
                              <span>{activity.user}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
