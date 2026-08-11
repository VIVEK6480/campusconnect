// components/dashboard/DashboardCards.tsx

"use client";

import {
  Users,
  Building2,
  CalendarDays,
  UserRoundPlus,
  GraduationCap,
  UserCog,
} from "lucide-react";

interface DashboardData {
  users: number;
  students: number;
  faculty: number;
  admins: number;
  clubs: number;
  memberships: number;
  events: number;
  announcements: number;
  certificates: number;
  notifications: number;
}

interface DashboardCardsProps {
  data: DashboardData;
}

export default function DashboardCards({
  data,
}: DashboardCardsProps) {
  const cards = [
    {
      title: "Total Users",
      value: data.users,
      icon: Users,
      description: `${data.students} students`,
    },
    {
      title: "Clubs",
      value: data.clubs,
      icon: Building2,
      description: "Active clubs",
    },
    {
      title: "Events",
      value: data.events,
      icon: CalendarDays,
      description: "Campus events",
    },
    {
      title: "Memberships",
      value: data.memberships,
      icon: UserRoundPlus,
      description: "Club memberships",
    },
    {
      title: "Students",
      value: data.students,
      icon: GraduationCap,
      description: "Registered students",
    },
    {
      title: "Faculty",
      value: data.faculty,
      icon: UserCog,
      description: "Faculty members",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {card.title}
                </p>

                <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {card.value}
                </h3>

                <p className="mt-2 text-xs text-slate-500">
                  {card.description}
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-3 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                <Icon size={22} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}