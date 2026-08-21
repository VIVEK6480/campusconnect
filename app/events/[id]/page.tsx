

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  MapPin,
  Users,
  GraduationCap,
} from "lucide-react";

export default function EventDetailsPage() {
  const params = useParams();

  const eventId = params?.id;

  return (
    <div className="min-h-screen bg-[#f5f8f7] text-slate-900">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="flex h-16 items-center border-b border-slate-200 bg-white px-5 sm:px-8">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/20">

            <GraduationCap size={21} />

          </div>

          <div>

            <p className="text-sm font-bold text-slate-900">
              CampusConnect
            </p>

            <p className="text-[11px] text-emerald-600">
              Student Portal
            </p>

          </div>

        </div>

      </header>


      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8">

        <Link
          href="/events"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-600"
        >

          <ArrowLeft size={16} />

          Back to Events

        </Link>


        {/* =================================================
            EVENT CARD
        ================================================== */}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          {/* =================================================
              EVENT COVER
          ================================================== */}

          <div className="relative h-52 overflow-hidden bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-700">

            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

            <div className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

            <div className="relative flex h-full items-center px-7 sm:px-10">

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-white shadow-lg backdrop-blur-sm">

                <CalendarDays size={30} />

              </div>

            </div>

          </div>


          {/* =================================================
              EVENT CONTENT
          ================================================== */}

          <div className="p-7 sm:p-10">

            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">

              <div>

                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
                  Event Details
                </p>

                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  Event
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  Event ID: {String(eventId || "")}
                </p>

              </div>


              <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-600">
                Campus Event
              </div>

            </div>


            {/* =================================================
                EVENT INFORMATION
            ================================================== */}

            <div className="mt-8 grid gap-4 sm:grid-cols-3">

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                <CalendarDays
                  size={21}
                  className="text-emerald-500"
                />

                <p className="mt-3 text-xs text-slate-400">
                  Date
                </p>

                <p className="mt-1 text-sm font-bold text-slate-900">
                  Event Date
                </p>

              </div>


              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                <Clock3
                  size={21}
                  className="text-emerald-500"
                />

                <p className="mt-3 text-xs text-slate-400">
                  Time
                </p>

                <p className="mt-1 text-sm font-bold text-slate-900">
                  Event Time
                </p>

              </div>


              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                <MapPin
                  size={21}
                  className="text-emerald-500"
                />

                <p className="mt-3 text-xs text-slate-400">
                  Venue
                </p>

                <p className="mt-1 text-sm font-bold text-slate-900">
                  Event Venue
                </p>

              </div>

            </div>


            {/* =================================================
                DESCRIPTION
            ================================================== */}

            <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6">

              <h2 className="text-lg font-bold text-slate-900">
                About this event
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Event information will be displayed here when
                available.
              </p>

            </div>


            {/* =================================================
                PARTICIPATION
            ================================================== */}

            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">

                <Users size={21} />

              </div>

              <div>

                <p className="text-sm font-semibold text-slate-900">
                  CampusConnect Event
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Check the Events section for complete event
                  information and participation details.
                </p>

              </div>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}