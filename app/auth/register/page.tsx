"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type Subject = {
  id: string;
  name: string;
  semester: number;
};

type RegisterResponse = {
  success?: boolean;
  message?: string;
  data?: {
    id?: string;
    campusUserId?: string;
    name?: string;
    email?: string;
    role?: string;
    approvalStatus?: string;
    semester?: number;
    section?: string;
    subjectIds?: string[];
    registrationCount?: number;
  };
};

/* =========================================================
   PAGE
========================================================= */

export default function RegisterPage() {
  /* =======================================================
     ACCOUNT
  ======================================================== */

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  /* =======================================================
     ACADEMIC INFORMATION
  ======================================================== */

  const [semester, setSemester] =
    useState("");

  const [section, setSection] =
    useState("");

  const [subjects, setSubjects] =
    useState<Subject[]>([]);

  const [
    selectedSubjectIds,
    setSelectedSubjectIds,
  ] = useState<string[]>([]);

  const [
    subjectsLoading,
    setSubjectsLoading,
  ] = useState(false);

  /* =======================================================
     UI STATE
  ======================================================== */

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(false);


  /* =======================================================
     LOAD SUBJECTS
  ======================================================== */

  useEffect(() => {
    let cancelled = false;

    async function loadSubjects() {
      try {
        setSubjectsLoading(true);

        const response = await fetch(
          "/api/auth/register",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        let data: {
          success?: boolean;
          message?: string;
          subjects?: Subject[];
        } = {};

        try {
          data = await response.json();
        } catch {
          data = {};
        }

        if (!response.ok || !data.success) {
          if (!cancelled) {
            setSubjects([]);
          }

          return;
        }

        if (!cancelled) {
          setSubjects(
            Array.isArray(data.subjects)
              ? data.subjects
              : []
          );
        }
      } catch (loadError) {
        console.error(
          "REGISTER SUBJECT LOAD ERROR:",
          loadError
        );

        if (!cancelled) {
          setSubjects([]);
        }
      } finally {
        if (!cancelled) {
          setSubjectsLoading(false);
        }
      }
    }

    void loadSubjects();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     FILTER SUBJECTS BY SEMESTER
  ======================================================== */

  const filteredSubjects = useMemo(() => {
    if (!semester) {
      return [];
    }

    const selectedSemester =
      Number(semester);

    return subjects.filter(
      (subject) =>
        subject.semester ===
        selectedSemester
    );
  }, [subjects, semester]);

  /* =======================================================
     TOGGLE SUBJECT
  ======================================================== */

  function toggleSubject(
    subjectId: string
  ) {
    setSelectedSubjectIds(
      (current) => {
        if (
          current.includes(subjectId)
        ) {
          return current.filter(
            (id) =>
              id !== subjectId
          );
        }

        return [
          ...current,
          subjectId,
        ];
      }
    );
  }

  /* =======================================================
     SELECT ALL SUBJECTS
  ======================================================== */

  function selectAllSubjects() {
    const ids: string[] =
      filteredSubjects.map(
        (subject) => subject.id
      );

    setSelectedSubjectIds(ids);
  }

  /* =======================================================
     CLEAR SUBJECTS
  ======================================================== */

  function clearAllSubjects() {
    setSelectedSubjectIds([]);
  }

  /* =======================================================
     SUBMIT
  ======================================================== */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    /* -----------------------------------------------
       NAME
    ------------------------------------------------ */

    if (!name.trim()) {
      setError(
        "Please enter your full name."
      );
      return;
    }

    if (name.trim().length < 2) {
      setError(
        "Please enter a valid full name."
      );
      return;
    }

    /* -----------------------------------------------
       EMAIL
    ------------------------------------------------ */

    if (!email.trim()) {
      setError(
        "Please enter your email address."
      );
      return;
    }

    /* -----------------------------------------------
       PASSWORD
    ------------------------------------------------ */

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters long."
      );
      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    /* -----------------------------------------------
       SEMESTER
    ------------------------------------------------ */

    if (!semester) {
      setError(
        "Please select your semester."
      );
      return;
    }

    /* -----------------------------------------------
       SECTION
    ------------------------------------------------ */

    if (!section) {
      setError(
        "Please select your section."
      );
      return;
    }

    /* -----------------------------------------------
       SUBJECTS
    ------------------------------------------------ */

    if (
      selectedSubjectIds.length ===
      0
    ) {
      setError(
        "Please select at least one subject."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            email:
              email
                .trim()
                .toLowerCase(),
            password,
            role: "STUDENT",
            semester:
              Number(semester),
            section,
            subjectIds:
              selectedSubjectIds,
          }),
        }
      );

      let result: RegisterResponse =
        {};

      try {
        result =
          await response.json();
      } catch {
        result = {};
      }

      if (!response.ok) {
        setError(
          result.message ||
            "Registration failed."
        );
        return;
      }

      /* ---------------------------------------------
         SUCCESS
      ---------------------------------------------- */

      setSuccess(true);

      /* ---------------------------------------------
         CLEAR FORM
      ---------------------------------------------- */

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setSemester("");
      setSection("");
      setSelectedSubjectIds([]);
    } catch (submitError) {
      console.error(
        "REGISTRATION SUBMIT ERROR:",
        submitError
      );

      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     JSX
  ======================================================== */

  return (
    <div className="min-h-screen bg-[#06110f] text-white">
      <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">

        {/* =================================================
            BACKGROUND
        ================================================== */}

        <div className="pointer-events-none absolute inset-0">

          <div className="absolute left-[-120px] top-[-120px] h-[350px] w-[350px] rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="absolute bottom-[-150px] right-[-100px] h-[400px] w-[400px] rounded-full bg-teal-500/10 blur-3xl" />

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(30,180,130,0.06),transparent_35%)]" />

        </div>

        {/* =================================================
            MAIN CONTAINER
        ================================================== */}

        <div className="relative z-10 mx-auto w-full max-w-6xl">

          {/* =================================================
              HEADER
          ================================================== */}

          <div className="mb-7 text-center">

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">

              <GraduationCap
                size={28}
              />

            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Create Student Account
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Join the CampusConnect campus
              management platform
            </p>

          </div>

          {/* =================================================
              CARD
          ================================================== */}

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-xl sm:p-7 lg:p-8">

            {/* =================================================
                REGISTRATION INFORMATION
            ================================================== */}

            <div className="mb-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4">

              <div className="flex items-start gap-3">

                <GraduationCap
                  size={20}
                  className="mt-0.5 shrink-0 text-emerald-400"
                />

                <div className="min-w-0">

                  <p className="text-sm font-semibold text-emerald-300">
                    Student Registration
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Complete your account and
                    academic information. Your
                    registration will be reviewed
                    by an authorized Admin before
                    you can access the Student
                    Portal.
                  </p>

                </div>

              </div>

            </div>

            {/* =================================================
                FORM
            ================================================== */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* =================================================
                  HORIZONTAL TWO COLUMN AREA
              ================================================== */}

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

                {/* =================================================
                    ACCOUNT INFORMATION
                ================================================== */}

                <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">

                  <div className="mb-5 flex items-center gap-2">

                    <User
                      size={18}
                      className="text-emerald-400"
                    />

                    <h2 className="text-sm font-bold text-slate-200">
                      Account Information
                    </h2>

                  </div>

                  <div className="space-y-4">

                    {/* NAME */}

                    <div>

                      <label className="mb-2 block text-xs font-semibold text-slate-300">
                        Full name
                      </label>

                      <div className="relative">

                        <User
                          size={17}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                        />

                        <input
                          type="text"
                          value={name}
                          onChange={(event) =>
                            setName(
                              event.target
                                .value
                            )
                          }
                          placeholder="Enter your full name"
                          autoComplete="name"
                          className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.035] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/60 focus:bg-white/[0.055] focus:ring-2 focus:ring-emerald-500/10"
                        />

                      </div>

                    </div>

                    {/* EMAIL */}

                    <div>

                      <label className="mb-2 block text-xs font-semibold text-slate-300">
                        Email address
                      </label>

                      <div className="relative">

                        <Mail
                          size={17}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                        />

                        <input
                          type="email"
                          value={email}
                          onChange={(event) =>
                            setEmail(
                              event.target
                                .value
                            )
                          }
                          placeholder="Enter your email"
                          autoComplete="email"
                          className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.035] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/60 focus:bg-white/[0.055] focus:ring-2 focus:ring-emerald-500/10"
                        />

                      </div>

                    </div>

                    {/* PASSWORD */}

                    <div>

                      <label className="mb-2 block text-xs font-semibold text-slate-300">
                        Password
                      </label>

                      <div className="relative">

                        <Lock
                          size={17}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                        />

                        <input
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          value={password}
                          onChange={(event) =>
                            setPassword(
                              event.target
                                .value
                            )
                          }
                          placeholder="Create a password"
                          autoComplete="new-password"
                          className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.035] pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/60 focus:bg-white/[0.055] focus:ring-2 focus:ring-emerald-500/10"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(
                              (value) =>
                                !value
                            )
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                          aria-label={
                            showPassword
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {showPassword ? (
                            <EyeOff
                              size={17}
                            />
                          ) : (
                            <Eye
                              size={17}
                            />
                          )}
                        </button>

                      </div>

                      <p className="mt-1.5 text-[10px] text-slate-600">
                        Password must contain at
                        least 8 characters.
                      </p>

                    </div>

                    {/* CONFIRM PASSWORD */}

                    <div>

                      <label className="mb-2 block text-xs font-semibold text-slate-300">
                        Confirm password
                      </label>

                      <div className="relative">

                        <Lock
                          size={17}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                        />

                        <input
                          type={
                            showConfirmPassword
                              ? "text"
                              : "password"
                          }
                          value={
                            confirmPassword
                          }
                          onChange={(event) =>
                            setConfirmPassword(
                              event.target
                                .value
                            )
                          }
                          placeholder="Confirm your password"
                          autoComplete="new-password"
                          className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.035] pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/60 focus:bg-white/[0.055] focus:ring-2 focus:ring-emerald-500/10"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(
                              (value) =>
                                !value
                            )
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                          aria-label={
                            showConfirmPassword
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff
                              size={17}
                            />
                          ) : (
                            <Eye
                              size={17}
                            />
                          )}
                        </button>

                      </div>

                    </div>

                  </div>

                </section>

                {/* =================================================
                    ACADEMIC INFORMATION
                ================================================== */}

                <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">

                  <div className="mb-5 flex items-center gap-2">

                    <BookOpen
                      size={18}
                      className="text-emerald-400"
                    />

                    <div>

                      <h2 className="text-sm font-bold text-slate-200">
                        Academic Information
                      </h2>

                      <p className="mt-0.5 text-[10px] text-slate-500">
                        Select your semester,
                        section and subjects.
                      </p>

                    </div>

                  </div>

                  {/* SEMESTER + SECTION */}

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                    {/* SEMESTER */}

                    <div>

                      <label className="mb-2 block text-xs font-semibold text-slate-300">
                        Semester
                      </label>

                      <select
                        value={semester}
                        onChange={(event) => {
                          const value =
                            event.target.value;

                          setSemester(value);

                          // Reset selected subjects
                          // when semester changes.
                          setSelectedSubjectIds(
                            []
                          );
                        }}
                        className="h-12 w-full cursor-pointer rounded-xl border border-white/10 bg-[#14201d] px-4 text-sm text-slate-200 outline-none transition focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/10"
                      >

                        <option value="">
                          Select semester
                        </option>

                        {Array.from(
                          { length: 8 },
                          (_, index) => (
                            <option
                              key={
                                index + 1
                              }
                              value={
                                index + 1
                              }
                            >
                              Semester{" "}
                              {index + 1}
                            </option>
                          )
                        )}

                      </select>

                    </div>

                    {/* SECTION */}

                    <div>

                      <label className="mb-2 block text-xs font-semibold text-slate-300">
                        Section
                      </label>

                      <div className="relative">

                        <Users
                          size={17}
                          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                        />

                        <select
                          value={section}
                          onChange={(event) =>
                            setSection(
                              event.target
                                .value
                            )
                          }
                          className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-[#14201d] pl-11 pr-10 text-sm text-slate-200 outline-none transition focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/10"
                        >

                          <option value="">
                            Select section
                          </option>

                          <option value="A">
                            Section A
                          </option>

                          <option value="B">
                            Section B
                          </option>

                          <option value="C">
                            Section C
                          </option>

                          <option value="D">
                            Section D
                          </option>

                        </select>

                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                          ▾
                        </span>

                      </div>

                    </div>

                  </div>

                  {/* =================================================
                      SUBJECTS
                  ================================================== */}

                  <div className="mt-5">

                    <div className="mb-2 flex items-center justify-between">

                      <label className="text-xs font-semibold text-slate-300">
                        Subjects
                      </label>

                      {semester &&
                        filteredSubjects.length >
                          0 && (
                          <div className="flex items-center gap-2">

                            <button
                              type="button"
                              onClick={
                                selectAllSubjects
                              }
                              className="text-[10px] font-semibold text-emerald-400 transition hover:text-emerald-300"
                            >
                              Select all
                            </button>

                            <span className="text-slate-700">
                              |
                            </span>

                            <button
                              type="button"
                              onClick={
                                clearAllSubjects
                              }
                              className="text-[10px] font-semibold text-slate-500 transition hover:text-slate-300"
                            >
                              Clear
                            </button>

                          </div>
                        )}

                    </div>

                    {!semester ? (

                      <div className="flex h-28 items-center justify-center rounded-xl border border-white/10 bg-white/[0.025]">

                        <div className="text-center">

                          <BookOpen
                            size={20}
                            className="mx-auto text-slate-600"
                          />

                          <p className="mt-2 text-xs font-medium text-slate-500">
                            Select semester first
                          </p>

                        </div>

                      </div>

                    ) : subjectsLoading ? (

                      <div className="flex h-28 items-center justify-center rounded-xl border border-white/10 bg-white/[0.025]">

                        <div className="flex items-center gap-2 text-xs text-slate-500">

                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-emerald-400" />

                          Loading subjects...

                        </div>

                      </div>

                    ) : filteredSubjects.length ===
                      0 ? (

                      <div className="flex h-28 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/[0.04]">

                        <div className="text-center">

                          <BookOpen
                            size={20}
                            className="mx-auto text-amber-400"
                          />

                          <p className="mt-2 text-xs font-semibold text-amber-300">
                            No subjects available
                          </p>

                          <p className="mt-1 text-[10px] text-slate-500">
                            No subjects have been
                            added for Semester{" "}
                            {semester} yet.
                          </p>

                        </div>

                      </div>

                    ) : (

                      <div className="max-h-[245px] overflow-y-auto rounded-xl border border-white/10 bg-white/[0.02] p-2">

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">

                          {filteredSubjects.map(
                            (subject) => {
                              const selected =
                                selectedSubjectIds.includes(
                                  subject.id
                                );

                              return (
                                <button
                                  key={
                                    subject.id
                                  }
                                  type="button"
                                  onClick={() =>
                                    toggleSubject(
                                      subject.id
                                    )
                                  }
                                  className={`flex min-h-[50px] items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                                    selected
                                      ? "border-emerald-400/50 bg-emerald-500/[0.10]"
                                      : "border-white/10 bg-white/[0.025] hover:border-emerald-400/30 hover:bg-white/[0.05]"
                                  }`}
                                >

                                  <div className="flex min-w-0 items-center gap-2.5">

                                    <BookOpen
                                      size={15}
                                      className={
                                        selected
                                          ? "shrink-0 text-emerald-400"
                                          : "shrink-0 text-slate-500"
                                      }
                                    />

                                    <div className="min-w-0">

                                      <p
                                        className={`truncate text-xs font-semibold ${
                                          selected
                                            ? "text-emerald-300"
                                            : "text-slate-300"
                                        }`}
                                      >
                                        {
                                          subject.name
                                        }
                                      </p>

                                      <p className="mt-0.5 text-[10px] text-slate-600">
                                        Semester{" "}
                                        {
                                          subject.semester
                                        }
                                      </p>

                                    </div>

                                  </div>

                                  <span
                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                                      selected
                                        ? "border-emerald-400 bg-emerald-500"
                                        : "border-slate-600 bg-transparent"
                                    }`}
                                  >

                                    {selected && (
                                      <CheckCircle2
                                        size={
                                          13
                                        }
                                        className="text-white"
                                      />
                                    )}

                                  </span>

                                </button>
                              );
                            }
                          )}

                        </div>

                      </div>

                    )}

                    {/* SELECTED COUNT */}

                    {semester &&
                      filteredSubjects.length >
                        0 && (
                        <div className="mt-2 flex items-center justify-between">

                          <p className="text-[10px] text-slate-600">
                            Select the subjects
                            you are currently
                            studying.
                          </p>

                          <span className="text-[10px] font-semibold text-emerald-400">
                            {
                              selectedSubjectIds.length
                            }{" "}
                            selected
                          </span>

                        </div>
                      )}

                  </div>

                </section>

              </div>

              {/* =================================================
                  ERROR
              ================================================== */}

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs leading-5 text-red-300">
                  {error}
                </div>
              )}

              {/* =================================================
                  SUBMIT
              ================================================== */}

              <button
                type="submit"
                disabled={loading}
                className="group flex h-13 w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:via-teal-400 hover:to-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {loading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                    Creating account...
                  </>
                ) : (
                  <>
                    Submit Registration

                    <ArrowRight
                      size={18}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </>
                )}

              </button>

            </form>

            {/* =================================================
                BOTTOM INFORMATION
            ================================================== */}

            <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center gap-2 text-xs text-slate-500">

                <ShieldCheck
                  size={15}
                  className="text-emerald-400"
                />

                Admin approval required
                before login

              </div>

              <div className="text-xs text-slate-500">

                Already have an account?{" "}

                <Link
                  href="/auth/login"
                  className="font-semibold text-emerald-400 transition hover:text-emerald-300"
                >
                  Sign in
                </Link>

              </div>

            </div>

          </div>

          {/* =================================================
              FOOTER
          ================================================== */}

          <div className="mt-5 text-center">

            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-600">

              <ShieldCheck
                size={13}
              />

              Your connection is protected

            </div>

            <p className="mt-2 text-[10px] text-slate-700">
              CampusConnect Student Portal
            </p>

          </div>

        </div>
      </div>

      {/* =====================================================
          REGISTRATION SUCCESS MESSAGE
      ====================================================== */}

      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-emerald-400/20 bg-[#0b1714] shadow-2xl shadow-black/60">

            <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500" />

            <div className="p-7 sm:p-9">

              <div className="flex flex-col items-center text-center">

                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-500/10 shadow-lg shadow-emerald-500/10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
                    <CheckCircle2
                      size={30}
                      className="text-emerald-400"
                    />
                  </div>
                </div>

                <h2 className="mt-6 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Registration Submitted Successfully
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
                  Your student registration has been received successfully.
                  Your account is now waiting for review by the CampusConnect
                  Administration.
                </p>

              </div>

              <div className="mt-7 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.045] p-5 sm:p-6">

                <div className="flex items-start gap-4">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                    <ShieldCheck
                      size={23}
                      className="text-emerald-400"
                    />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-emerald-300">
                      Admin approval is pending
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      An authorized Admin will review your registration.
                      You will receive a new email when your application
                      is either approved or rejected.
                    </p>
                  </div>

                </div>

              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">

                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                    If approved
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    Your approval email will include your Campus User ID,
                    class, semester and all registered subjects.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                    If rejected
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    Your email will contain the latest rejection status
                    and the reason provided by the Admin.
                  </p>
                </div>

              </div>

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className="h-11 rounded-xl border border-white/10 px-6 text-sm font-medium text-slate-400 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
                >
                  Close
                </button>

                <Link
                  href="/auth/login"
                  className="group flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-500/15 transition hover:from-emerald-400 hover:via-teal-400 hover:to-emerald-500"
                >
                  Go to Student Login
                  <ArrowRight
                    size={17}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </Link>

              </div>

            </div>
          </div>
        </div>
      )}


    </div>
  );
}