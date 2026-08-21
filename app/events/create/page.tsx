"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Building2,
  GraduationCap,
  MapPin,
  Plus,
  Clock3,
} from "lucide-react";

type Club = {
  id: string;
  name: string;
};

export default function CreateEventPage() {
  const router = useRouter();

  const [clubs, setClubs] = useState<Club[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [clubId, setClubId] = useState("");
  const [image, setImage] = useState("");

  useEffect(() => {
    async function loadClubs() {
      try {
        const response = await fetch("/api/clubs", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to load clubs"
          );
        }

        setClubs(
          Array.isArray(data.clubs)
            ? data.clubs
            : []
        );
      } catch (err) {
        console.error(
          "LOAD CLUBS ERROR:",
          err
        );

        setError(
          "Unable to load clubs. You can still create the event without selecting a club."
        );
      } finally {
        setLoadingClubs(false);
      }
    }

    loadClubs();
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setError("");
    setSuccess("");

    const cleanTitle = title.trim();
    const cleanDescription =
      description.trim();
    const cleanVenue = venue.trim();

    if (!cleanTitle) {
      setError("Event title is required.");
      return;
    }

    if (!cleanDescription) {
      setError("Event description is required.");
      return;
    }

    if (!cleanVenue) {
      setError("Event venue is required.");
      return;
    }

    if (!eventDate) {
      setError("Event date and time are required.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        "/api/events",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            title: cleanTitle,
            description: cleanDescription,
            venue: cleanVenue,
            eventDate,
            image: image.trim() || null,
            clubId: clubId || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            "Failed to create event."
        );

        return;
      }

      setSuccess(
        "Event created successfully."
      );

      setTitle("");
      setDescription("");
      setVenue("");
      setEventDate("");
      setClubId("");
      setImage("");

      setTimeout(() => {
        router.push("/events");
        router.refresh();
      }, 700);
    } catch (err) {
      console.error(
        "CREATE EVENT ERROR:",
        err
      );

      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

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
              Smart Campus Management
            </p>

          </div>

        </div>

      </header>


      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8">

        <Link
          href="/events"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-600"
        >

          <ArrowLeft size={16} />

          Back to Events

        </Link>


        {/* =================================================
            PAGE HEADER
        ================================================== */}

        <div className="mb-7">

          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600">

            <Plus size={14} />

            Create Event

          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Create a new event
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Add an event to the CampusConnect event portal
            for students and campus communities.
          </p>

        </div>


        {/* =================================================
            FORM CARD
        ================================================== */}

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-600">
              {success}
            </div>
          )}


          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >

            {/* =================================================
                TITLE
            ================================================== */}

            <div>

              <label
                htmlFor="title"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Event Title
              </label>

              <div className="relative">

                <CalendarDays
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                  placeholder="Enter event title"
                  disabled={saving}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                />

              </div>

            </div>


            {/* =================================================
                DESCRIPTION
            ================================================== */}

            <div>

              <label
                htmlFor="description"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Description
              </label>

              <textarea
                id="description"
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                placeholder="Describe the event..."
                rows={5}
                disabled={saving}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
              />

            </div>


            {/* =================================================
                VENUE + DATE
            ================================================== */}

            <div className="grid gap-6 md:grid-cols-2">

              <div>

                <label
                  htmlFor="venue"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Venue
                </label>

                <div className="relative">

                  <MapPin
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="venue"
                    type="text"
                    value={venue}
                    onChange={(e) =>
                      setVenue(e.target.value)
                    }
                    placeholder="Enter venue"
                    disabled={saving}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                </div>

              </div>


              <div>

                <label
                  htmlFor="eventDate"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Date &amp; Time
                </label>

                <div className="relative">

                  <Clock3
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="eventDate"
                    type="datetime-local"
                    value={eventDate}
                    onChange={(e) =>
                      setEventDate(e.target.value)
                    }
                    disabled={saving}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                </div>

              </div>

            </div>


            {/* =================================================
                CLUB
            ================================================== */}

            <div>

              <label
                htmlFor="clubId"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Club
              </label>

              <div className="relative">

                <Building2
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  id="clubId"
                  value={clubId}
                  onChange={(e) =>
                    setClubId(e.target.value)
                  }
                  disabled={
                    saving ||
                    loadingClubs
                  }
                  className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  <option value="">
                    {loadingClubs
                      ? "Loading clubs..."
                      : "Select a club (optional)"}
                  </option>

                  {clubs.map((club) => (
                    <option
                      key={club.id}
                      value={club.id}
                    >
                      {club.name}
                    </option>
                  ))}

                </select>

              </div>

              <p className="mt-2 text-xs text-slate-400">
                You can optionally associate this event with
                a campus club.
              </p>

            </div>


            {/* =================================================
                IMAGE
            ================================================== */}

            <div>

              <label
                htmlFor="image"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Event Image URL
              </label>

              <input
                id="image"
                type="url"
                value={image}
                onChange={(e) =>
                  setImage(e.target.value)
                }
                placeholder="https://example.com/event-image.jpg"
                disabled={saving}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <p className="mt-2 text-xs text-slate-400">
                Optional. Add a public image URL for the event.
              </p>

            </div>


            {/* =================================================
                ACTIONS
            ================================================== */}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">

              <Link
                href="/events"
                className="flex h-12 items-center justify-center rounded-xl border border-slate-200 px-6 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-7 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={17} />

                    Create Event
                  </>
                )}

              </button>

            </div>

          </form>

        </div>


        {/* =================================================
            FOOTER
        ================================================== */}

        <footer className="mt-8 border-t border-slate-200 py-6">

          <p className="text-center text-xs text-slate-400">
            © 2026 CampusConnect. Smart Campus Management.
          </p>

        </footer>

      </main>

    </div>
  );
}