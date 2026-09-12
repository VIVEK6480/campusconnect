"use client";

import {
  Check,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type Member = {
  id?: string;
  userId?: string;

  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    campusUserId?: string | null;
  } | null;
};

type Club = {
  id: string;
  name: string;
  description?: string | null;
  logo?: string | null;
  category?: string | null;
  createdAt?: string;
  updatedAt?: string;

  members?: Member[];
  memberCount?: number;

  events?: unknown[];
  eventCount?: number;

  announcements?: unknown[];
  announcementCount?: number;
};

type ClubForm = {
  name: string;
  description: string;
  category: string;
  logo: string;
};

const EMPTY_FORM: ClubForm = {
  name: "",
  description: "",
  category: "",
  logo: "",
};

/* ======================================================
   HELPERS
====================================================== */

function getSafeNumber(value: unknown): number {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (typeof value === "string") {
    const number = Number(value);

    if (Number.isFinite(number)) {
      return number;
    }
  }

  return 0;
}

function getMemberCount(club: Club): number {
  if (
    typeof club.memberCount === "number"
  ) {
    return getSafeNumber(club.memberCount);
  }

  if (Array.isArray(club.members)) {
    return club.members.length;
  }

  return 0;
}

function formatDate(date?: string) {
  if (!date) {
    return "—";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

/* ======================================================
   PAGE
====================================================== */

export default function AdminClubsPage() {
  const [clubs, setClubs] =
    useState<Club[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [isEditing, setIsEditing] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<ClubForm>(EMPTY_FORM);

  /* ======================================================
     FETCH CLUBS
  ====================================================== */

  const fetchClubs = useCallback(
    async () => {
      const response = await fetch(
        "/api/admin/clubs",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to fetch clubs."
        );
      }

      const receivedClubs =
        Array.isArray(data?.clubs)
          ? data.clubs
          : Array.isArray(data?.data)
          ? data.data
          : [];

      setClubs(receivedClubs);

      return receivedClubs;
    },
    []
  );

  /* ======================================================
     INITIAL LOAD

     Page renders immediately.
     Only club content waits for API.
  ====================================================== */

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError("");

        await fetchClubs();
      } catch (err) {
        console.error(
          "FETCH CLUBS ERROR:",
          err
        );

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to fetch clubs."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [fetchClubs]);

  /* ======================================================
     FILTER
  ====================================================== */

  const filteredClubs =
    useMemo(() => {
      const value =
        search.trim().toLowerCase();

      if (!value) {
        return clubs;
      }

      return clubs.filter((club) => {
        const name =
          club.name?.toLowerCase() ||
          "";

        const category =
          club.category?.toLowerCase() ||
          "";

        const description =
          club.description
            ?.toLowerCase() || "";

        return (
          name.includes(value) ||
          category.includes(value) ||
          description.includes(value)
        );
      });
    }, [clubs, search]);

  /* ======================================================
     STATS
  ====================================================== */

  const totalClubs =
    clubs.length;

  const totalMembers =
    useMemo(() => {
      return clubs.reduce(
        (total, club) =>
          total +
          getMemberCount(club),
        0
      );
    }, [clubs]);

  /* ======================================================
     OPEN CREATE
  ====================================================== */

  function openCreateModal() {
    setError("");
    setSuccess("");

    setIsEditing(false);
    setEditingId(null);

    setForm(EMPTY_FORM);

    setIsModalOpen(true);
  }

  /* ======================================================
     OPEN EDIT
  ====================================================== */

  function openEditModal(
    club: Club
  ) {
    setError("");
    setSuccess("");

    setIsEditing(true);
    setEditingId(club.id);

    setForm({
      name: club.name || "",
      description:
        club.description || "",
      category:
        club.category || "",
      logo:
        club.logo || "",
    });

    setIsModalOpen(true);
  }

  /* ======================================================
     CLOSE MODAL
  ====================================================== */

  function closeModal() {
    if (saving) {
      return;
    }

    setIsModalOpen(false);
    setIsEditing(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  /* ======================================================
     SUBMIT
  ====================================================== */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const name =
      form.name.trim();

    const description =
      form.description.trim();

    const category =
      form.category.trim();

    const logo =
      form.logo.trim();

    if (!name) {
      setError(
        "Club name is required."
      );
      return;
    }

    if (!description) {
      setError(
        "Club description is required."
      );
      return;
    }

    try {
      setSaving(true);

      const url =
        isEditing && editingId
          ? `/api/admin/clubs/${editingId}`
          : "/api/admin/clubs";

      const method =
        isEditing
          ? "PUT"
          : "POST";

      const response =
        await fetch(url, {
          method,
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name,
            description,
            category:
              category || null,
            logo:
              logo || null,
          }),
        });

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            (isEditing
              ? "Failed to update club."
              : "Failed to create club.")
        );
      }

      setSuccess(
        isEditing
          ? "Club updated successfully."
          : "Club created successfully."
      );

      setIsModalOpen(false);
      setIsEditing(false);
      setEditingId(null);
      setForm(EMPTY_FORM);

      await fetchClubs();
    } catch (err) {
      console.error(
        isEditing
          ? "UPDATE CLUB ERROR:"
          : "CREATE CLUB ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : isEditing
          ? "Failed to update club."
          : "Failed to create club."
      );
    } finally {
      setSaving(false);
    }
  }

  /* ======================================================
     DELETE
  ====================================================== */

  async function handleDelete(
    club: Club
  ) {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${club.name}"?\n\nThis action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response =
        await fetch(
          `/api/admin/clubs/${club.id}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to delete club."
        );
      }

      setClubs(
        (current) =>
          current.filter(
            (item) =>
              item.id !== club.id
          )
      );

      setSuccess(
        "Club deleted successfully."
      );
    } catch (err) {
      console.error(
        "DELETE CLUB ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete club."
      );
    }
  }

  /* ======================================================
     IMAGE ERROR
  ====================================================== */

  function handleImageError(
    event: React.SyntheticEvent<HTMLImageElement>
  ) {
    const image =
      event.currentTarget;

    image.style.display =
      "none";

    const parent =
      image.parentElement;

    if (parent) {
      parent.classList.add(
        "club-image-fallback"
      );
    }
  }

  /* ======================================================
     REFRESH

     Does NOT blank the page.
  ====================================================== */

  async function handleRefresh() {
    setError("");
    setSuccess("");

    try {
      await fetchClubs();

      setSuccess(
        "Club data refreshed successfully."
      );
    } catch (error) {
      console.error(
        "REFRESH CLUBS ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to refresh clubs."
      );
    }
  }

  /* ======================================================
     SKELETON
  ====================================================== */

  function ClubSkeleton() {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-[275px] w-full animate-pulse bg-slate-200" />

        <div className="space-y-3 p-3">
          <div className="h-10 w-full animate-pulse rounded-lg bg-slate-200" />

          <div className="h-10 w-full animate-pulse rounded-lg bg-slate-200" />

          <div className="mx-auto h-3 w-28 animate-pulse rounded bg-slate-200" />
        </div>
      </div>
    );
  }

  /* ======================================================
     UI
  ====================================================== */

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#f6f8fc]">

      {/* ==================================================
          MAIN
      ================================================== */}

      <main className="w-full px-4 py-5 md:px-6 lg:px-8">

        {/* ==================================================
            HERO
        ================================================== */}

        <section className="relative flex h-[280px] w-full flex-col justify-center overflow-hidden rounded-[22px] bg-gradient-to-br from-[#07132f] via-[#102a62] to-[#1d4ed8] px-6 py-8 text-white shadow-lg md:px-8 md:py-8">

          <div className="pointer-events-none absolute -right-8 -top-14 h-40 w-40 rounded-full border border-white/10" />

          <div className="pointer-events-none absolute right-12 -top-6 h-28 w-28 rounded-full border border-white/10" />

          <div className="pointer-events-none absolute right-[17%] bottom-[-85px] h-56 w-56 rounded-full border border-white/10" />

          <div className="relative z-10 max-w-3xl lg:pr-44">

            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[11px] font-semibold backdrop-blur-sm md:text-xs">

              <Users size={15} />

              <span>
                CampusConnect Club Administration
              </span>

            </div>

            <h2 className="mt-5 font-serif text-2xl font-bold leading-tight md:text-3xl lg:text-[42px]">

              One workspace.

              <br />

              <span className="text-indigo-200">
                Every campus club.
              </span>

            </h2>

            <p className="mt-4 max-w-2xl font-serif text-xs leading-6 text-white/85 md:text-sm">

              Create, manage and organize college clubs,
              members and club information from one
              administration portal.

            </p>

          </div>

          {/* CREATE CLUB */}

          <div className="relative z-10 mt-4 lg:absolute lg:right-6 lg:top-1/2 lg:mt-0 lg:-translate-y-1/2">

            <button
              type="button"
              onClick={
                openCreateModal
              }
              className="group flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-xs font-semibold text-[#28346f] shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.03] hover:bg-white hover:shadow-[0_10px_25px_rgba(79,70,229,0.28)]"
            >

              <Plus
                size={15}
                className="transition-transform duration-300 group-hover:scale-110"
              />

              <span className="transition-transform duration-300 group-hover:translate-x-0.5">
                Create Club
              </span>

            </button>

          </div>

        </section>

        {/* ==================================================
            TWO STATS
        ================================================== */}

        <div className="mt-5 grid w-full grid-cols-1 gap-4 md:grid-cols-2">

          {/* TOTAL CLUBS */}

          <div className="group relative w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:border-indigo-200 hover:shadow-[0_12px_30px_rgba(79,70,229,0.16)]">

            <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-all duration-300 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-[0_6px_18px_rgba(79,70,229,0.35)]">

              <Users
                size={19}
                className="transition-transform duration-300 group-hover:scale-110"
              />

            </div>

            <p className="text-xs font-medium text-slate-500 transition-colors duration-300 group-hover:text-indigo-600">
              Total Clubs
            </p>

            <p className="mt-2 font-serif text-3xl font-bold text-slate-900">
              {loading ? (
                <span className="inline-block h-9 w-8 animate-pulse rounded bg-slate-200" />
              ) : (
                totalClubs
              )}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Communities available
            </p>

          </div>

          {/* TOTAL MEMBERS */}

          <div className="group relative w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:border-indigo-200 hover:shadow-[0_12px_30px_rgba(79,70,229,0.16)]">

            <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-all duration-300 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-[0_6px_18px_rgba(79,70,229,0.35)]">

              <Users
                size={19}
                className="transition-transform duration-300 group-hover:scale-110"
              />

            </div>

            <p className="text-xs font-medium text-slate-500 transition-colors duration-300 group-hover:text-indigo-600">
              Total Members
            </p>

            <p className="mt-2 font-serif text-3xl font-bold text-slate-900">
              {loading ? (
                <span className="inline-block h-9 w-8 animate-pulse rounded bg-slate-200" />
              ) : (
                totalMembers
              )}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Students participating
            </p>

          </div>

        </div>

        {/* ==================================================
            SEARCH
        ================================================== */}

        <div className="relative mt-5">

          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search clubs by name, category or description..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />

        </div>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="mt-4 flex w-full items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600">

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="rounded-md p-1 hover:bg-red-100"
            >

              <X size={16} />

            </button>

          </div>
        )}

        {/* ==================================================
            SUCCESS
        ================================================== */}

        {success && (
          <div className="mt-4 flex w-full items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700">

            <div className="flex items-center gap-2">

              <Check size={16} />

              <span>
                {success}
              </span>

            </div>

            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
              className="rounded-md p-1 hover:bg-emerald-100"
            >

              <X size={16} />

            </button>

          </div>
        )}

        {/* ==================================================
            CLUB AREA
        ================================================== */}

        {loading ? (
          <div className="mt-6 grid w-full grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-4">

            {Array.from({
              length: 6,
            }).map(
              (_, index) => (
                <ClubSkeleton
                  key={index}
                />
              )
            )}

          </div>
        ) : filteredClubs.length ===
          0 ? (
          /* ==================================================
             EMPTY
          ================================================== */

          <div className="mt-6 rounded-xl border border-slate-200 bg-white px-5 py-12 text-center shadow-sm">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">

              <Users
                size={22}
                className="text-slate-400"
              />

            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900">

              {search
                ? "No clubs found"
                : "No clubs available"}

            </h2>

            <p className="mt-2 text-sm text-slate-500">

              {search
                ? "Try another search term."
                : "Create your first club to get started."}

            </p>

            {!search && (
              <button
                type="button"
                onClick={
                  openCreateModal
                }
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0b1428] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#111d38]"
              >

                <Plus size={15} />

                Create Club

              </button>
            )}

          </div>
        ) : (
          /* ==================================================
             CLUB GRID
          ================================================== */

          <div className="mt-6 grid w-full grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-4">

            {filteredClubs.map(
              (club) => {
                return (
                  <article
                    key={club.id}
                    className="group flex min-w-0 w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.015] hover:border-indigo-200 hover:shadow-[0_14px_35px_rgba(79,70,229,0.18)]"
                  >

                    {/* IMAGE */}

                    <div className="relative h-[275px] w-full shrink-0 overflow-hidden bg-[#0b1428]">

                      {club.logo ? (
                        <img
                          src={
                            club.logo
                          }
                          alt={`${club.name} logo`}
                          className="absolute inset-0 block h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                          onError={
                            handleImageError
                          }
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#0b1428]">

                          <div className="text-center text-white">

                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-white/20 bg-white/10 transition-transform duration-300 group-hover:scale-105">

                              <ImageIcon
                                size={30}
                              />

                            </div>

                            <p className="mt-4 text-sm font-semibold">
                              {
                                club.name
                              }
                            </p>

                            <p className="mt-1 text-xs text-white/60">
                              Club Image
                            </p>

                          </div>

                        </div>
                      )}

                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      <div className="absolute left-3 top-3 rounded-full bg-[#0b1428]/90 px-3 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">

                        {
                          club.category ||
                          "Club"
                        }

                      </div>

                      <div className="absolute bottom-4 left-4 right-4">

                        <h2 className="truncate text-2xl font-bold text-white drop-shadow-md">

                          {
                            club.name
                          }

                        </h2>

                      </div>

                    </div>

                    {/* EDIT / DELETE */}

                    <div className="grid grid-cols-2 gap-2 bg-white p-3">

                      <button
                        type="button"
                        onClick={() =>
                          openEditModal(
                            club
                          )
                        }
                        className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-100"
                      >

                        <Pencil
                          size={17}
                        />

                        Edit

                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(
                            club
                          )
                        }
                        className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-500 transition hover:bg-red-100"
                      >

                        <Trash2
                          size={17}
                        />

                        Delete

                      </button>

                    </div>

                    {/* CREATED DATE */}

                    <div className="px-3 pb-3">

                      <p className="text-center text-[11px] text-slate-400">

                        Created{" "}
                        {formatDate(
                          club.createdAt
                        )}

                      </p>

                    </div>

                  </article>
                );
              }
            )}

          </div>
        )}

      </main>

      {/* ======================================================
          CREATE / EDIT MODAL
      ====================================================== */}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm">

          <div className="max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

              <div>

                <h2 className="text-xl font-bold text-slate-900">

                  {isEditing
                    ? "Edit Club"
                    : "Create Club"}

                </h2>

                <p className="mt-1 text-sm text-slate-500">

                  {isEditing
                    ? "Update club information."
                    : "Add a new college club."}

                </p>

              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
              >

                <X size={19} />

              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleSubmit
              }
              className="p-5"
            >

              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600">

                  {error}

                </div>
              )}

              <div className="space-y-5">

                {/* NAME */}

                <div>

                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Club Name *
                  </label>

                  <input
                    type="text"
                    value={
                      form.name
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          name:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="e.g. Coding Club"
                    disabled={
                      saving
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                  />

                </div>

                {/* CATEGORY + IMAGE */}

                <div className="grid gap-4 md:grid-cols-2">

                  <div>

                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Category
                    </label>

                    <input
                      type="text"
                      value={
                        form.category
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,
                            category:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="e.g. Technology"
                      disabled={
                        saving
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                    />

                  </div>

                  <div>

                    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">

                      <ImageIcon
                        size={15}
                      />

                      Image URL

                    </label>

                    <input
                      type="url"
                      value={
                        form.logo
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,
                            logo:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="https://..."
                      disabled={
                        saving
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                    />

                  </div>

                </div>

                {/* DESCRIPTION */}

                <div>

                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Description *
                  </label>

                  <textarea
                    value={
                      form.description
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          description:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    rows={6}
                    placeholder="Describe the club..."
                    disabled={
                      saving
                    }
                    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                  />

                </div>

                {/* IMAGE PREVIEW */}

                <div>

                  <p className="mb-2 text-sm font-semibold text-slate-700">
                    Image Preview
                  </p>

                  <div className="relative h-[250px] w-full overflow-hidden rounded-lg bg-[#0b1428]">

                    {form.logo ? (
                      <img
                        src={
                          form.logo
                        }
                        alt="Club preview"
                        className="absolute inset-0 block h-full w-full object-cover"
                        onError={
                          handleImageError
                        }
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#0b1428]">

                        <div className="text-center text-white/80">

                          <ImageIcon
                            size={35}
                            className="mx-auto"
                          />

                          <p className="mt-2 text-sm">
                            Club Image
                          </p>

                        </div>

                      </div>
                    )}

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                  </div>

                </div>

              </div>

              {/* ACTIONS */}

              <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >

                  Cancel

                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="flex items-center gap-2 rounded-lg bg-[#0b1428] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#111d38] disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {saving ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />

                      {isEditing
                        ? "Saving..."
                        : "Creating..."}
                    </>
                  ) : (
                    <>
                      {isEditing ? (
                        <Check
                          size={17}
                        />
                      ) : (
                        <Plus
                          size={15}
                        />
                      )}

                      {isEditing
                        ? "Save Changes"
                        : "Create Club"}
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ======================================================
          GLOBAL CSS
      ====================================================== */}

      <style jsx global>{`
        .club-image-fallback {
          background: #0b1428 !important;
        }

        .club-image-fallback::after {
          content: "";
          position: absolute;
          inset: 0;
          background: #0b1428;
        }

        html,
        body {
          width: 100%;
          min-width: 0;
          margin: 0;
        }

        #__next {
          width: 100%;
          min-width: 0;
        }

        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }
      `}</style>

    </div>
  );
}