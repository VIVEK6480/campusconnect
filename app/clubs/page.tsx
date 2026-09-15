"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import StudentLayout from "@/components/student/StudentLayout";

import {
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Search,
  Sparkles,
  Users,
  X,
  ArrowRight,
} from "lucide-react";

type Club = {
  id: string;
  name: string;
  description: string;
  category: string | null;
  logo: string | null;
  members: number;
  color: string;
};

type ClubsApiResponse = {
  success?: boolean;
  clubs?: Array<{
    id: string;
    name: string;
    description: string;
    category: string | null;
    logo?: string | null;
    members?: number;
  }>;
  totalClubs?: number;
  totalMembers?: number;
  myClubIds?: string[];
  message?: string;
};

const clubColors = [
  "from-slate-900 to-slate-800",
  "from-emerald-950 to-slate-900",
  "from-blue-950 to-slate-900",
  "from-indigo-950 to-slate-900",
  "from-zinc-900 to-stone-900",
  "from-teal-950 to-slate-900",
];

const defaultCategories = [
  "All",
  "Technology",
  "Arts",
  "Cultural",
  "Sports",
  "Business",
];

export default function ClubsPage() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [clubs, setClubs] = useState<Club[]>([]);
  const [joinedClubs, setJoinedClubs] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadClubs = useCallback(async () => {
    try {
      setError("");

      let userId = "";

      if (typeof window !== "undefined") {
        const storedUser = window.localStorage.getItem("user");

        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);

            if (parsedUser && typeof parsedUser === "object") {
              userId = String(parsedUser.id || "");
            }
          } catch (storageError) {
            console.error(
              "Unable to parse stored user:",
              storageError
            );
          }
        }
      }

      const query =
        userId.length > 0
          ? `?userId=${encodeURIComponent(userId)}`
          : "";

      const response = await fetch(
        `/api/clubs${query}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const data: ClubsApiResponse =
        await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load clubs."
        );
      }

      const apiClubs = Array.isArray(data.clubs)
        ? data.clubs
        : [];

      const formattedClubs: Club[] =
        apiClubs.map((club, index) => ({
          id: String(club.id),
          name: club.name || "Unnamed Club",
          description:
            club.description ||
            "No description available for this club.",
          category: club.category || "Other",
          logo: club.logo || null,
          members: Number(club.members || 0),
          color:
            clubColors[index % clubColors.length],
        }));

      setClubs(formattedClubs);

      setJoinedClubs(
        Array.isArray(data.myClubIds)
          ? data.myClubIds.map((id) => String(id))
          : []
      );
    } catch (loadError) {
      console.error(
        "Load clubs error:",
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load clubs."
      );

      setClubs([]);
      setJoinedClubs([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      if (cancelled) {
        return;
      }

      setLoading(true);

      try {
        await loadClubs();
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const timer = window.setTimeout(() => {
      void initialize();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [loadClubs]);

  const categories = useMemo(() => {
    const databaseCategories = clubs
      .map((club) => club.category)
      .filter(
        (
          value
        ): value is string =>
          Boolean(value)
      );

    const uniqueCategories = Array.from(
      new Set(databaseCategories)
    );

    const orderedKnownCategories =
      defaultCategories.slice(1).filter(
        (item) =>
          uniqueCategories.includes(item)
      );

    const otherCategories =
      uniqueCategories.filter(
        (item) =>
          !defaultCategories
            .slice(1)
            .includes(item)
      );

    return [
      "All",
      ...orderedKnownCategories,
      ...otherCategories,
    ];
  }, [clubs]);

  const filteredClubs = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return clubs.filter((club) => {
      const matchesCategory =
        category === "All" ||
        club.category === category;

      const matchesSearch =
        !searchValue ||
        club.name
          .toLowerCase()
          .includes(searchValue) ||
        club.description
          .toLowerCase()
          .includes(searchValue) ||
        (club.category || "")
          .toLowerCase()
          .includes(searchValue);

      return (
        matchesCategory &&
        matchesSearch
      );
    });
  }, [clubs, search, category]);

  const handleJoinClub = async (
    clubId: string
  ) => {
    if (actionLoading) {
      return;
    }

    let userId = "";

    if (typeof window !== "undefined") {
      const storedUser =
        window.localStorage.getItem("user");

      if (storedUser) {
        try {
          const parsedUser =
            JSON.parse(storedUser);

          userId = String(
            parsedUser?.id || ""
          );
        } catch (storageError) {
          console.error(
            "Unable to parse stored user:",
            storageError
          );
        }
      }
    }

    if (!userId) {
      setError(
        "Student information was not found. Please login again."
      );

      router.push("/auth/login");
      return;
    }

    const isJoined =
      joinedClubs.includes(clubId);

    setActionLoading(clubId);
    setError("");

    try {
      if (isJoined) {
        const response = await fetch(
          `/api/clubs?userId=${encodeURIComponent(
            userId
          )}&clubId=${encodeURIComponent(
            clubId
          )}`,
          {
            method: "DELETE",
            credentials: "include",
            cache: "no-store",
          }
        );

        const data =
          await response.json().catch(
            () => ({})
          );

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Unable to leave the club."
          );
        }
      } else {
        const response = await fetch(
          "/api/clubs",
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              action: "join",
              userId,
              clubId,
            }),
          }
        );

        const data =
          await response.json().catch(
            () => ({})
          );

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Unable to join the club."
          );
        }
      }

      await loadClubs();
    } catch (actionError) {
      console.error(
        "Club membership action error:",
        actionError
      );

      setError(
        actionError instanceof Error
          ? actionError.message
          : "Unable to update club membership."
      );
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <StudentLayout>
      <div className="min-h-screen bg-[#f5f8f7] text-slate-900">
        <main className="w-full min-w-0">
          <section className="w-full px-5 py-7 sm:px-7 lg:px-8 xl:px-9">
            {/* =================================================
                ERROR MESSAGE
            ================================================== */}

            {error && (
              <div className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => setError("")}
                  className="shrink-0 rounded-lg p-1 transition hover:bg-red-100"
                  aria-label="Close error"
                >
                  <X size={17} />
                </button>
              </div>
            )}

            {/* =================================================
                HERO
            ================================================== */}

            <div className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b2d22] via-[#0e3b2d] to-[#124a3b] p-7 text-white shadow-xl shadow-emerald-900/10 sm:p-9">
              <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />

              <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-teal-300/10 blur-3xl" />

              <div className="pointer-events-none absolute right-[35%] top-10 h-24 w-24 rounded-full border border-emerald-300/10" />

              <div className="relative z-10 flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
                    <Sparkles size={13} />
                    Campus Communities
                  </div>

                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    Discover your.
                    <span className="block text-emerald-300">
                      campus community.
                    </span>
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                    Explore student clubs, meet people with similar
                    interests, develop new skills and become an active
                    part of your campus community.
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                    <Building2 size={22} />
                  </div>

                  <div>
                    <p className="text-2xl font-bold">
                      {loading ? "..." : clubs.length}
                    </p>

                    <p className="text-xs text-slate-400">
                      Clubs available
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* =================================================
                STATS (ONLY 2 BOXES)
            ================================================== */}

            <div className="mb-7 grid gap-4 sm:grid-cols-2">
              <ClubStat
                icon={<Building2 size={20} />}
                title="Total Clubs"
                value={
                  loading
                    ? "..."
                    : clubs.length.toString()
                }
                description="Communities available"
              />

              <ClubStat
                icon={<CheckCircle2 size={20} />}
                title="My Clubs"
                value={
                  loading
                    ? "..."
                    : joinedClubs.length.toString()
                }
                description="Clubs you joined"
              />
            </div>

            {/* =================================================
                SEARCH + FILTER
            ================================================== */}

            <div className="mb-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
                    Explore
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    Find a club
                  </h2>
                </div>

                <div className="relative w-full xl:max-w-md">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search clubs..."
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>
              </div>

              <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                {categories.map((item) => {
                  const active = category === item;

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCategory(item)}
                      className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition ${
                        active
                          ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                          : "border border-slate-200 bg-white text-slate-500 hover:border-emerald-200 hover:text-emerald-600"
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* =================================================
                CLUB LIST HEADER
            ================================================== */}

            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
                  Clubs
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Explore Campus Clubs
                </h2>
              </div>

              <p className="text-sm text-slate-400">
                {loading
                  ? "Loading..."
                  : `${filteredClubs.length} ${
                      filteredClubs.length === 1
                        ? "club"
                        : "clubs"
                    }`}
              </p>
            </div>

            {/* =================================================
                LOADING
            ================================================== */}

            {loading ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map(
                  (_, index) => (
                    <div
                      key={index}
                      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                    >
                      <div className="h-[250px] animate-pulse bg-slate-200" />

                      <div className="space-y-4 p-5">
                        <div className="h-5 w-1/3 animate-pulse rounded bg-slate-200" />

                        <div className="h-16 animate-pulse rounded bg-slate-100" />

                        <div className="h-11 animate-pulse rounded-xl bg-slate-200" />
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : filteredClubs.length > 0 ? (
              /* =================================================
                  CLUB CARDS
              ================================================== */
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredClubs.map((club) => {
                  const isJoined =
                    joinedClubs.includes(club.id);

                  const isProcessing =
                    actionLoading === club.id;

                  return (
                    <div
                      key={club.id}
                      className="group flex flex-col overflow-hidden rounded-[26px] border border-slate-200/90 bg-white shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-emerald-200 hover:shadow-xl"
                    >
                      {/* FULL-IMAGE COVER */}

                      <div className="relative h-[250px] w-full overflow-hidden bg-[#07131d]">
                        {club.logo ? (
                          <img
                            src={club.logo}
                            alt={`${club.name} cover`}
                            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                          />
                        ) : (
                          <div
                            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${club.color}`}
                          >
                            <Building2
                              size={64}
                              className="text-white/30"
                            />
                          </div>
                        )}

                        {/* TOP BADGE */}

                        <div className="absolute left-4 top-4 z-10">
                          <span className="rounded-full border border-white/25 bg-black/65 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md shadow-sm">
                            {club.category || "Club"}
                          </span>
                        </div>

                        {/* GRADIENT SHADOW FOR TEXT READABILITY */}

                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                        {/* TITLE & MEMBERS OVERLAY AT BOTTOM OF IMAGE */}

                        <div className="absolute bottom-4 left-4 right-4 z-10 flex items-end justify-between gap-3">
                          <h3 className="font-serif text-[22px] font-bold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                            {club.name}
                          </h3>

                          <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/20 bg-black/45 px-2.5 py-1 text-[11px] font-semibold text-white/95 backdrop-blur-md shadow-sm">
                            <Users size={12} />

                            <span>
                              {Number(
                                club.members || 0
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* CLUB CONTENT */}

                      <div className="flex flex-1 flex-col p-5">
                        <p className="line-clamp-3 min-h-[66px] text-xs leading-5 text-slate-500">
                          {club.description}
                        </p>

                        <div className="mt-5 flex items-center gap-3 pt-2">
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() =>
                              void handleJoinClub(
                                club.id
                              )
                            }
                            className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                              isJoined
                                ? "border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600"
                            }`}
                          >
                            {isProcessing ? (
                              <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />

                                Updating...
                              </>
                            ) : isJoined ? (
                              <>
                                <CheckCircle2 size={16} />

                                Joined
                              </>
                            ) : (
                              <>
                                Join Club

                                <ArrowRight size={15} />
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-500"
                            aria-label={`View ${club.name}`}
                          >
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* =================================================
                  EMPTY STATE
              ================================================== */
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
                  <Search size={25} />
                </div>

                <h3 className="font-semibold text-slate-800">
                  No clubs found
                </h3>

                <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                  {clubs.length === 0
                    ? "There are currently no clubs available in the database."
                    : "Try searching with a different name or select another club category."}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCategory("All");
                  }}
                  className="mt-5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* =================================================
                LOWER INFORMATION
            ================================================== */}

            <div className="mt-7 grid gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                    <Users size={21} />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900">
                      Why join a club?
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Connect with students, develop practical
                      skills, participate in campus activities and
                      build meaningful experiences outside the
                      classroom.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                    <CalendarDays size={21} />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900">
                      Club activities
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Stay connected with club events, workshops,
                      competitions and activities happening across
                      the campus.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* =================================================
                FOOTER
            ================================================== */}

            <footer className="mt-8 border-t border-slate-200 py-6">
              <div className="flex flex-col justify-between gap-2 text-xs text-slate-400 sm:flex-row">
                <p>
                  © 2026 CampusConnect. Smart Campus Management.
                </p>

                <p>
                  Student Portal
                </p>
              </div>
            </footer>
          </section>
        </main>
      </div>
    </StudentLayout>
  );
}

/* ============================================================
   CLUB STAT
============================================================ */

function ClubStat({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 transition group-hover:bg-emerald-500 group-hover:text-white">
          {icon}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        {description}
      </p>
    </div>
  );
}