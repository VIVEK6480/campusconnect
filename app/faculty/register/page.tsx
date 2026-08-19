"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  User,
  Building2,
} from "lucide-react";

const departments = [
  "Computer Science & Engineering",
  "Artificial Intelligence & Machine Learning",
  "Information Technology",
  "Electronics & Communication Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Management",
  "Commerce",
  "Science",
  "Humanities",
  "Other",
];

export default function FacultyRegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (
      !cleanName ||
      !cleanEmail ||
      !cleanPhone ||
      !department ||
      !password ||
      !confirmPassword
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      /*
       * Faculty ID is NOT entered here.
       *
       * The backend/admin approval process should generate:
       * RNT-XXXX
       */

      const res = await fetch("/api/auth/faculty/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          name: cleanName,
          fullName: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          department,
          password,
          role: "FACULTY",
        }),
      });

      let data: {
        success?: boolean;
        message?: string;
        user?: {
          id?: string;
          name?: string;
          email?: string;
          role?: string;
          approvalStatus?: string;
          campusUserId?: string | null;
        };
      };

      try {
        data = await res.json();
      } catch {
        setError("Invalid response from the server.");
        return;
      }

      console.log("FACULTY REGISTRATION RESPONSE:", data);

      if (!res.ok || !data.success) {
        setError(
          data.message ||
            "Unable to create faculty account. Please try again."
        );
        return;
      }

      setSuccess(
        "Faculty registration submitted successfully. Your account will be reviewed by the administrator. Your Faculty ID (RNT-XXXX) will be generated and sent after approval."
      );

      setFullName("");
      setEmail("");
      setPhone("");
      setDepartment("");
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        router.push("/faculty/login");
      }, 2500);
    } catch (err) {
      console.error("FACULTY REGISTRATION ERROR:", err);

      setError(
        "Unable to connect to the server. Please check that the CampusConnect server is running."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#08111f] text-white">
      {/* BACKGROUND */}

      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(
                circle at 10% 20%,
                rgba(34, 211, 238, 0.18),
                transparent 32%
              ),
              radial-gradient(
                circle at 90% 25%,
                rgba(56, 189, 248, 0.14),
                transparent 34%
              ),
              radial-gradient(
                circle at 80% 90%,
                rgba(14, 165, 233, 0.14),
                transparent 35%
              ),
              linear-gradient(
                135deg,
                #07101d 0%,
                #0b1728 48%,
                #08111f 100%
              )
            `,
          }}
        />

        <div className="absolute -left-48 -top-32 h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-[130px]" />

        <div className="absolute -right-48 top-20 h-[580px] w-[580px] rounded-full bg-sky-500/10 blur-[140px]" />

        <div className="absolute -bottom-48 right-[5%] h-[500px] w-[500px] rounded-full bg-cyan-400/10 blur-[130px]" />

        <div
          className="absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage: `
              linear-gradient(
                rgba(255,255,255,0.8) 1px,
                transparent 1px
              ),
              linear-gradient(
                90deg,
                rgba(255,255,255,0.8) 1px,
                transparent 1px
              )
            `,
            backgroundSize: "55px 55px",
          }}
        />

        <div className="absolute left-[10%] top-[20%] h-3 w-3 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_35px_rgba(103,232,249,1)]" />

        <div className="absolute right-[14%] top-[28%] h-2.5 w-2.5 animate-pulse rounded-full bg-sky-300 shadow-[0_0_30px_rgba(125,211,252,1)]" />

        <div className="absolute bottom-[20%] left-[18%] h-2 w-2 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_28px_rgba(103,232,249,1)]" />

        <div className="absolute bottom-[24%] right-[28%] h-2 w-2 animate-pulse rounded-full bg-sky-300 shadow-[0_0_25px_rgba(125,211,252,1)]" />
      </div>

      {/* MAIN */}

      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#0d1728]/90 shadow-2xl shadow-black/50 backdrop-blur-xl">

          {/* HEADER */}

          <div className="flex items-center justify-between border-b border-white/10 bg-[#101c30]/90 px-7 py-5 sm:px-10">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-sky-500 shadow-lg shadow-cyan-500/20">
                <GraduationCap size={25} />
              </div>

              <div>
                <h1 className="text-lg font-bold tracking-tight">
                  CampusConnect
                </h1>

                <p className="text-xs text-slate-400">
                  Smart Campus Management
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-medium text-cyan-300 sm:flex">
              <ShieldCheck size={14} />
              Faculty Portal
            </div>
          </div>

          {/* CONTENT */}

          <div className="px-6 py-8 sm:px-10 sm:py-10 lg:px-16">
            <div className="mx-auto max-w-3xl">

              {/* TITLE */}

              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                  <User size={22} />
                </div>

                <h2 className="text-3xl font-bold tracking-tight">
                  Create Faculty Account
                </h2>

                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">
                  Register your faculty account. Your application
                  will be reviewed by the administrator before access
                  is granted.
                </p>
              </div>

              {/* SUCCESS */}

              {success && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-4 text-sm leading-6 text-cyan-200">
                  <CheckCircle2
                    size={19}
                    className="mt-0.5 shrink-0 text-cyan-300"
                  />

                  <span>{success}</span>
                </div>
              )}

              {/* ERROR */}

              {error && (
                <div
                  role="alert"
                  className="mb-6 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-300"
                >
                  {error}
                </div>
              )}

              {/* FORM */}

              <form
                onSubmit={handleRegister}
                className="grid grid-cols-1 gap-5 sm:grid-cols-2"
              >

                {/* FULL NAME */}

                <div>
                  <label
                    htmlFor="fullName"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Full Name
                  </label>

                  <div className="relative">
                    <User
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                    />

                    <input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        setError("");
                      }}
                      required
                      disabled={loading}
                      autoComplete="name"
                      className="h-14 w-full rounded-xl border border-white/10 bg-white/[0.045] pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* EMAIL */}

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Email Address
                  </label>

                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                    />

                    <input
                      id="email"
                      type="email"
                      placeholder="faculty@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      required
                      disabled={loading}
                      autoComplete="email"
                      className="h-14 w-full rounded-xl border border-white/10 bg-white/[0.045] pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* PHONE */}

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Phone Number
                  </label>

                  <div className="relative">
                    <Phone
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                    />

                    <input
                      id="phone"
                      type="tel"
                      placeholder="Enter phone number"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setError("");
                      }}
                      required
                      disabled={loading}
                      autoComplete="tel"
                      className="h-14 w-full rounded-xl border border-white/10 bg-white/[0.045] pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* DEPARTMENT */}

                <div>
                  <label
                    htmlFor="department"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Department
                  </label>

                  <div className="relative">
                    <Building2
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-500"
                    />

                    <select
                      id="department"
                      value={department}
                      onChange={(e) => {
                        setDepartment(e.target.value);
                        setError("");
                      }}
                      required
                      disabled={loading}
                      className="h-14 w-full appearance-none rounded-xl border border-white/10 bg-[#111c2e] pl-12 pr-10 text-sm text-white outline-none transition focus:border-cyan-400/60 focus:bg-[#142238] focus:ring-4 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="" disabled>
                        Select department
                      </option>

                      {departments.map((item) => (
                        <option
                          key={item}
                          value={item}
                          className="bg-[#111c2e] text-white"
                        >
                          {item}
                        </option>
                      ))}
                    </select>

                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                      ▾
                    </span>
                  </div>
                </div>

                {/* PASSWORD */}

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <LockKeyhole
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                    />

                    <input
                      id="password"
                      type={
                        showPassword ? "text" : "password"
                      }
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      required
                      minLength={8}
                      disabled={loading}
                      autoComplete="new-password"
                      className="h-14 w-full rounded-xl border border-white/10 bg-white/[0.045] pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((value) => !value)
                      }
                      disabled={loading}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-cyan-300"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>

                  <p className="mt-1.5 text-xs text-slate-600">
                    Minimum 8 characters
                  </p>
                </div>

                {/* CONFIRM PASSWORD */}

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Confirm Password
                  </label>

                  <div className="relative">
                    <LockKeyhole
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                    />

                    <input
                      id="confirmPassword"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError("");
                      }}
                      required
                      disabled={loading}
                      autoComplete="new-password"
                      className="h-14 w-full rounded-xl border border-white/10 bg-white/[0.045] pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (value) => !value
                        )
                      }
                      disabled={loading}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-cyan-300"
                      aria-label={
                        showConfirmPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* FACULTY ID INFORMATION */}

                <div className="sm:col-span-2">
                  <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/[0.06] px-4 py-3">
                    <p className="text-xs leading-5 text-cyan-200/80">
                      <span className="font-semibold text-cyan-300">
                        Faculty ID:
                      </span>{" "}
                      Your Faculty User ID will be automatically
                      generated as{" "}
                      <span className="font-semibold text-cyan-300">
                        RNT-XXXX
                      </span>{" "}
                      after your registration is approved by the
                      administrator. You do not need to enter it
                      during registration.
                    </p>
                  </div>
                </div>

                {/* SUBMIT */}

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition duration-300 hover:from-cyan-400 hover:to-sky-400 hover:shadow-cyan-400/30 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                    {loading ? (
                      <>
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create Faculty Account
                        <ArrowRight
                          size={18}
                          className="transition-transform duration-300 group-hover:translate-x-1"
                        />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* FOOTER LINKS */}

              <div className="mt-7 text-center">
                <p className="text-sm text-slate-500">
                  Already have a faculty account?{" "}
                  <Link
                    href="/faculty/login"
                    className="font-medium text-cyan-400 transition hover:text-cyan-300 hover:underline"
                  >
                    Sign in
                  </Link>
                </p>

                <Link
                  href="/"
                  className="mt-4 inline-block text-xs font-medium text-cyan-400 transition hover:text-cyan-300 hover:underline"
                >
                  ← Back to CampusConnect Portals
                </Link>
              </div>

              {/* SECURITY */}

              <div className="mt-8 border-t border-white/5 pt-6 text-center">
                <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
                  <ShieldCheck size={14} />
                  Secure faculty registration
                </div>

                <p className="mt-1 text-xs text-slate-700">
                  CampusConnect Faculty Portal
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </main>
  );
}