"use client";

import {
  Users,
  CalendarDays,
  Building2,
  Megaphone,
} from "lucide-react";

export default function RecentActivity() {
  const activities = [
    {
      title: "User management",
      description: "Users can be managed from the Users section.",
      icon: Users,
      time: "System",
    },
    {
      title: "Club management",
      description: "Create and manage campus clubs.",
      icon: Building2,
      time: "System",
    },
    {
      title: "Event management",
      description: "Manage upcoming campus events.",
      icon: CalendarDays,
      time: "System",
    },
    {
      title: "Announcements",
      description: "Publish important campus announcements.",
      icon: Megaphone,
      time: "System",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-900">
          Quick Activity
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          CampusConnect management overview
        </p>
      </div>

      <div className="space-y-5">
        {activities.map((activity) => {
          const Icon = activity.icon;

          return (
            <div
              key={activity.title}
              className="flex items-center gap-4"
            >
              <div className="rounded-xl bg-slate-100 p-3 text-slate-600">
                <Icon size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800">
                  {activity.title}
                </p>

                <p className="truncate text-xs text-slate-500">
                  {activity.description}
                </p>
              </div>

              <span className="text-xs text-slate-400">
                {activity.time}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}