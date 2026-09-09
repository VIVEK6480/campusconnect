"use client";

import {
  Activity,
  Award,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Edit3,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Phone,
  Save,
  Settings,
  ShieldCheck,
  Upload,
  UserCircle,
  UserRound,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type FacultyUser = {
  id?: string;
  name?: string;
  email?: string;
  facultyId?: string;
  campusUserId?: string | null;
  role?: string;
  approvalStatus?: string;
  department?: string;
  designation?: string;
  phone?: string;
  qualification?: string;
  specialization?: string;
  joiningDate?: string;
  address?: string;
  city?: string;
  state?: string;
  officeHours?: string;
  profileImage?: string | null;
};

type ProfileForm = {
  name: string;
  phone: string;
  designation: string;
  qualification: string;
  specialization: string;
  address: string;
  city: string;
  state: string;
  officeHours: string;
};

const DEFAULT_FACULTY: FacultyUser = {
  name: "Vivek Kumar",
  email: "faculty@campusconnect.com",
  facultyId: "RNT-9457",
  role: "Faculty Member",
  approvalStatus: "APPROVED",
  department: "Computer Science & Engineering",
  designation: "Assistant Professor",
  qualification: "M.Tech",
  specialization: "CSE",
  profileImage: null,
};

const navigation = [
  { title: "Dashboard", href: "/dashboard/faculty", icon: GraduationCap },
  { title: "Students", href: "/dashboard/faculty/students", icon: Users },
  { title: "Student Approval", href: "/dashboard/faculty/approvals/students", icon: CheckCircle2 },
  { title: "Attendance", href: "/dashboard/faculty/attendance", icon: ClipboardCheck },
  { title: "Events", href: "/dashboard/faculty/events", icon: CalendarDays },
  { title: "Faculty Profile", href: "/faculty/profile", icon: UserCircle },
];

function normalizeFaculty(raw: Partial<FacultyUser>): FacultyUser {
  return {
    ...DEFAULT_FACULTY,
    ...raw,
    facultyId: raw.facultyId || raw.campusUserId || DEFAULT_FACULTY.facultyId,
    profileImage: raw.profileImage || null,
  };
}

function formFromUser(user: FacultyUser): ProfileForm {
  return {
    name: user.name || "",
    phone: user.phone || "",
    designation: user.designation || "",
    qualification: user.qualification || "",
    specialization: user.specialization || "",
    address: user.address || "",
    city: user.city || "",
    state: user.state || "",
    officeHours: user.officeHours || "",
  };
}

function readStoredFaculty(): FacultyUser {
  if (typeof window === "undefined") return DEFAULT_FACULTY;

  for (const key of ["facultyUser", "faculty", "currentFaculty", "user"]) {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) continue;
      const candidate = JSON.parse(stored);
      if (candidate && typeof candidate === "object" && candidate.email) {
        return normalizeFaculty(candidate);
      }
    } catch {
      // Continue to check next key
    }
  }

  return DEFAULT_FACULTY;
}

export default function FacultyProfilePage() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<FacultyUser>(() => readStoredFaculty());
  const [editing, setEditing] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<ProfileForm>(() => formFromUser(readStoredFaculty()));
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoChanged, setPhotoChanged] = useState(false);
  const [photoReading, setPhotoReading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [securityMessage, setSecurityMessage] = useState("");
  const [securityError, setSecurityError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        const response = await fetch("/api/faculty/profile", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.success || !data.faculty) {
          throw new Error(data.message || "Unable to load faculty profile.");
        }

        if (cancelled) return;
        const loaded = normalizeFaculty(data.faculty);
        setUser(loaded);
        setForm(formFromUser(loaded));
        syncLocalStorage(loaded);
      } catch (loadError) {
        console.error("LOAD FACULTY PROFILE ERROR:", loadError);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && mobileSidebarOpen) {
        setMobileSidebarOpen(false);
      }
      if (event.key === "Escape" && editing && !saving) {
        setEditing(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editing, mobileSidebarOpen, saving]);

  const facultyName = user.name || "Vivek Kumar";
  const facultyRole = user.role || "Faculty Member";
  const facultyId = user.facultyId || "RNT-9457";
  const facultyEmail = user.email || "faculty@campusconnect.com";
  const department = user.department || "Computer Science & Engineering";
  const designation = user.designation || "Assistant Professor";
  const approvalStatus = user.approvalStatus || "APPROVED";

  const initials = useMemo(
    () =>
      facultyName
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "VK",
    [facultyName],
  );

  const completion = useMemo(() => {
    const fields = [
      user.name,
      user.email,
      user.facultyId || user.campusUserId,
      user.phone,
      user.qualification,
      user.specialization,
      user.department,
      user.designation,
      user.joiningDate,
      user.address,
    ];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [user]);

  function isActive(href: string) {
    if (href === "/dashboard/faculty") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function updateForm(field: keyof ProfileForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setSuccess("");
  }

  function openEditor() {
    setForm(formFromUser(user));
    setPhotoPreview(user.profileImage || null);
    setPhotoChanged(false);
    setError("");
    setSuccess("");
    setEditing(true);
  }

  function closeEditor() {
    if (saving) return;
    setForm(formFromUser(user));
    setPhotoPreview(user.profileImage || null);
    setPhotoChanged(false);
    setError("");
    setEditing(false);
  }

  function syncLocalStorage(updated: FacultyUser) {
    try {
      for (const key of ["facultyUser", "faculty", "currentFaculty", "user"]) {
        const stored = localStorage.getItem(key);
        if (!stored) continue;
        const candidate = JSON.parse(stored);
        if (candidate && typeof candidate === "object") {
          localStorage.setItem(key, JSON.stringify({ ...candidate, ...updated }));
        }
      }
    } catch {
      // Handled silently
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    try {
      setSaving(true);

      const payload: Record<string, unknown> = {
        action: "update-profile",
        name: form.name.trim(),
        phone: form.phone.trim(),
        designation: form.designation.trim(),
        qualification: form.qualification.trim(),
        specialization: form.specialization.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        officeHours: form.officeHours.trim(),
      };

      if (photoChanged) payload.profileImage = photoPreview;

      const response = await fetch("/api/faculty/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success || !data.faculty) {
        throw new Error(data.message || "Unable to update profile.");
      }

      const updated = normalizeFaculty(data.faculty);
      setUser(updated);
      setForm(formFromUser(updated));
      setPhotoPreview(updated.profileImage || null);
      setPhotoChanged(false);
      syncLocalStorage(updated);
      setEditing(false);
      setSuccess(
        photoChanged
          ? "Faculty profile and photo updated successfully."
          : "Profile information updated successfully.",
      );
    } catch (saveError) {
      console.error("SAVE FACULTY PROFILE ERROR:", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  function selectPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError("");
    setSuccess("");

    if (!/^image\/(png|jpeg|webp)$/i.test(file.type)) {
      setError("Please select a PNG, JPG/JPEG or WebP image.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Profile photo must be 2 MB or smaller.");
      return;
    }

    setPhotoReading(true);
    const reader = new FileReader();

    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setPhotoPreview(result || null);
      setPhotoChanged(true);
      setPhotoReading(false);
    };

    reader.onerror = () => {
      setPhotoReading(false);
      setError("Unable to read the selected image.");
    };

    reader.readAsDataURL(file);
  }

  function removePhoto() {
    setPhotoPreview(null);
    setPhotoChanged(true);
    setError("");
    setSuccess("");
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (passwordSaving) return;

    setSecurityError("");
    setSecurityMessage("");

    if (!currentPassword) {
      setSecurityError("Please enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      setSecurityError("New password must contain at least 8 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setSecurityError("New passwords do not match.");
      return;
    }

    try {
      setPasswordSaving(true);

      const response = await fetch("/api/faculty/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword: confirmNewPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update password.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setSecurityMessage("Password updated successfully.");
    } catch (passwordError) {
      setSecurityError(
        passwordError instanceof Error
          ? passwordError.message
          : "Unable to update password.",
      );
    } finally {
      setPasswordSaving(false);
    }
  }

  async function signOut() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
    } catch (logoutError) {
      console.error("FACULTY LOGOUT ERROR:", logoutError);
    }

    try {
      ["facultyUser", "faculty", "currentFaculty", "user", "token", "facultyToken"].forEach(
        (key) => localStorage.removeItem(key),
      );
    } catch {
      // Handled silently
    }

    router.replace("/faculty/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#edf4fa]">
        <aside className="fixed inset-y-0 left-0 hidden w-[270px] bg-[#0b1423] lg:block" />
        <main className="min-h-screen lg:pl-[270px]">
          <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
            <div className="animate-pulse space-y-5">
              <div className="h-[250px] rounded-[28px] bg-slate-200" />
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="h-[150px] rounded-[22px] bg-slate-200" />
                ))}
              </div>
              <div className="h-[520px] rounded-[26px] bg-slate-200" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#edf4fa] text-[#142238]">
      <ProfileLayoutStyles />
      {mobileSidebarOpen && (
        <button
          aria-label="Close sidebar overlay"
          type="button"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-[#07111f]/70 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* FACULTY SIDEBAR */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[270px] flex-col border-r border-[#223149] bg-[#0b1423] text-white shadow-[8px_0_35px_rgba(5,15,30,0.16)] transition-transform duration-300 lg:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[92px] shrink-0 items-center border-b border-[#223149] px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#54bce5] shadow-[0_8px_25px_rgba(84,188,229,0.25)]">
              <GraduationCap size={25} />
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-[19px] font-bold tracking-tight">CampusConnect</h1>
              <p className="mt-0.5 text-[11px] text-[#91a4bb]">Faculty Portal</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setMobileSidebarOpen(false)}
            className="ml-auto rounded-lg p-2 text-[#8fa3bb] transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-7">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#63758d]">
            Main Menu
          </p>
          <nav className="space-y-1.5">
            {navigation.map((item) => (
              <SidebarLink
                key={item.title}
                item={item}
                active={isActive(item.href)}
                onNavigate={() => setMobileSidebarOpen(false)}
              />
            ))}
          </nav>

          <div className="my-7 h-px bg-[#223149]" />

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#63758d]">
            Account
          </p>
          <nav className="space-y-1.5">
            <button
              type="button"
              onClick={() => void signOut()}
              className="group flex h-11 w-full items-center gap-3 rounded-xl px-3.5 text-left text-[13px] font-medium text-[#9aabc0] transition-all duration-200 hover:bg-[#142135] hover:text-white"
            >
              <LogOut size={18} className="text-[#8195ad] transition group-hover:text-[#63c9ef]" />
              <span>Sign Out</span>
            </button>
          </nav>
        </div>

        <div className="shrink-0 border-t border-[#223149] p-4">
          <div className="flex items-center gap-3 rounded-2xl bg-[#111e2f] px-3.5 py-3">
            <Avatar user={user} initials={initials} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold">{facultyName}</p>
              <p className="truncate text-[11px] text-[#8296ae]">{facultyRole}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-h-screen min-w-0 lg:pl-[270px]">
        {/* HEADER */}
        <header className="sticky top-0 z-30 h-[86px] border-b border-[#dce6f0] bg-white/95 backdrop-blur-xl">
          <div className="mx-auto flex h-full w-full max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dce6f0] bg-white text-[#263a53] shadow-sm lg:hidden"
                aria-label="Open sidebar"
              >
                <Menu size={20} />
              </button>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#3985b6]">Faculty Portal</p>
                <p className="mt-1 hidden text-[11px] text-[#71839a] sm:block">
                  Faculty profile & account workspace
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                aria-label="Notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#dce6f0] bg-white text-[#4f6680] shadow-sm transition hover:-translate-y-0.5 hover:border-[#9bcbe4] hover:bg-[#f4f9fd] hover:text-[#398fbe]"
              >
                <Bell size={18} />
                <span className="absolute right-[9px] top-[8px] h-1.5 w-1.5 rounded-full bg-[#54bce5]" />
              </button>
              <button
                type="button"
                aria-label="Settings"
                className="hidden h-10 w-10 items-center justify-center rounded-xl border border-[#dce6f0] bg-white text-[#4f6680] shadow-sm transition hover:-translate-y-0.5 hover:border-[#9bcbe4] hover:bg-[#f4f9fd] hover:text-[#398fbe] sm:flex"
              >
                <Settings size={18} />
              </button>
              <div className="mx-1 hidden h-8 w-px bg-[#dce6f0] sm:block" />
              <div className="hidden items-center gap-2.5 sm:flex">
                <Avatar user={user} initials={initials} size="md" />
                <div>
                  <p className="text-[12px] font-semibold text-[#18283d]">{facultyName}</p>
                  <p className="text-[10px] text-[#72849a]">{facultyRole}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="relative min-h-[calc(100vh-86px)] w-full min-w-0 overflow-hidden bg-[#edf4fa] px-4 py-6 sm:px-6 lg:px-8">
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(88,157,197,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(88,157,197,0.08) 1px, transparent 1px)",
                backgroundSize: "42px 42px",
              }}
            />
            <div className="absolute -left-24 top-24 h-96 w-96 rounded-full bg-[#d9edf8] blur-3xl" />
            <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-[#e5f3fa] blur-3xl" />
          </div>

          <div className="relative mx-auto w-full min-w-0">
            {/* HERO */}
            <section className="group relative overflow-hidden rounded-[28px] border border-[#263951] bg-gradient-to-br from-[#0b1423] via-[#101d30] to-[#162a40] shadow-[0_22px_55px_rgba(10,27,48,0.18)]">
              <div className="pointer-events-none absolute -right-28 -top-32 h-[390px] w-[390px] rounded-full border border-[#54bce5]/20 transition-transform duration-700 group-hover:scale-110" />
              <div className="pointer-events-none absolute right-10 top-16 h-44 w-44 rounded-full border border-[#54bce5]/10" />

              <div className="relative z-10 grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:p-10">
                <div className="min-w-0">
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#54bce5]/30 bg-[#54bce5]/10 px-3.5 py-1.5 text-[11px] font-semibold text-[#76d0f1]">
                    <UserRound size={14} />
                    Faculty Profile
                  </div>

                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <Avatar user={user} initials={initials} size="hero" />
                    <div className="min-w-0">
                      <h1 className="font-serif text-[34px] font-bold leading-tight tracking-[-0.03em] text-white sm:text-[44px]">
                        {facultyName}
                      </h1>
                      <p className="mt-1 text-[14px] font-medium text-[#9fb1c4]">{designation}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <StatusPill icon={<ShieldCheck size={13} />} text={approvalStatus} />
                        <DarkPill icon={<BriefcaseBusiness size={13} />} text={facultyRole} />
                        <DarkPill icon={<Building2 size={13} />} text={department} />
                      </div>
                    </div>
                  </div>

                  <p className="mt-6 max-w-3xl text-[13px] leading-6 text-[#a7b7c9]">
                    Manage your professional identity, teaching information, contact details and faculty account information from one centralized workspace.
                  </p>
                </div>

                <div className="flex flex-col items-start justify-end gap-3 lg:items-end">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-xl">
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#71879e]">Faculty ID</p>
                    <p className="mt-1 font-mono text-[17px] font-bold text-white">{facultyId}</p>
                  </div>
                  <button
                    type="button"
                    onClick={openEditor}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#54bce5] px-5 text-xs font-bold text-white shadow-[0_10px_25px_rgba(84,188,229,0.25)] transition duration-300 hover:-translate-y-1 hover:bg-[#3eabd7] hover:shadow-[0_15px_30px_rgba(84,188,229,0.35)]"
                  >
                    <Edit3 size={16} />
                    Edit Profile
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </section>

            {success && (
              <Alert tone="success" icon={<CheckCircle2 size={17} />} text={success} />
            )}
            {error && !editing && (
              <Alert tone="error" icon={<X size={17} />} text={error} />
            )}

            {/* SUMMARY CARDS */}
            <section className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard icon={<GraduationCap size={21} />} label="Teaching Role" value={designation} />
              <SummaryCard icon={<Award size={21} />} label="Qualification" value={user.qualification || "Not added yet"} />
              <SummaryCard icon={<Building2 size={21} />} label="Specialization" value={user.specialization || "Not added yet"} />
              <SummaryCard icon={<CalendarCheck2 size={21} />} label="Joining Date" value={user.joiningDate || "Not added yet"} />
            </section>

            {/* PANELS */}
            <section className="mt-6 space-y-6">
              <Panel
                eyebrow="Identity"
                title="Personal Information"
                description="Your primary identity and contact details."
                icon={<UserRound size={19} />}
              >
                <div className="info-grid">
                  <InfoItem icon={<UserRound size={17} />} label="Full Name" value={facultyName} />
                  <InfoItem icon={<Mail size={17} />} label="Official Email" value={facultyEmail} />
                  <InfoItem icon={<UserCircle size={17} />} label="Faculty ID" value={facultyId} />
                  <InfoItem icon={<Phone size={17} />} label="Phone Number" value={user.phone || "Not added yet"} />
                  <div className="info-grid-full">
                    <InfoItem icon={<MapPin size={17} />} label="Address" value={user.address || "Not added yet"} />
                  </div>
                  <div className="info-grid-full">
                    <InfoItem
                      icon={<MapPin size={17} />}
                      label="Location"
                      value={[user.city, user.state].filter(Boolean).join(", ") || "Not added yet"}
                    />
                  </div>
                </div>
              </Panel>

              <Panel
                eyebrow="Career"
                title="Professional Information"
                description="Your teaching, academic and office information."
                icon={<BriefcaseBusiness size={19} />}
              >
                <div className="info-grid">
                  <InfoItem icon={<Building2 size={17} />} label="Department" value={department} />
                  <InfoItem icon={<BriefcaseBusiness size={17} />} label="Designation" value={designation} />
                  <InfoItem icon={<GraduationCap size={17} />} label="Qualification" value={user.qualification || "Not added yet"} />
                  <InfoItem icon={<Award size={17} />} label="Specialization" value={user.specialization || "Not added yet"} />
                  <InfoItem icon={<CalendarCheck2 size={17} />} label="Joining Date" value={user.joiningDate || "Not added yet"} />
                  <InfoItem icon={<Clock3 size={17} />} label="Office Hours" value={user.officeHours || "Not added yet"} />
                </div>
              </Panel>

              {/* PROFILE HEALTH */}
              <Panel
                eyebrow="Profile Health"
                title="Profile Completion"
                description="Keep your professional and contact information complete."
                icon={<Activity size={19} />}
              >
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[auto_1fr_auto] lg:items-center">
                  <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-8 border-[#e8f3f8] bg-[#f8fcfe] shadow-[0_8px_25px_rgba(65,137,176,0.08)]">
                    <div className="text-center">
                      <p className="font-serif text-xl font-bold text-[#142238]">{completion}%</p>
                      <p className="text-[8px] font-bold uppercase tracking-wider text-[#7f94a8]">Complete</p>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <p className="text-xs font-semibold text-[#40566e]">Faculty profile progress</p>
                      <span className="rounded-full bg-[#edf7fc] px-2.5 py-1 text-[10px] font-bold text-[#3989b7]">{completion}%</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-[#e7eef4]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#54bce5] to-[#3c94c0] transition-all duration-700"
                        style={{ width: `${completion}%` }}
                      />
                    </div>
                    <p className="mt-3 text-[11px] leading-5 text-[#72849a]">
                      Add missing contact and professional details to improve your faculty profile.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={openEditor}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#d8e3ed] bg-[#f8fbfd] px-4 text-xs font-bold text-[#526b84] transition duration-300 hover:-translate-y-0.5 hover:border-[#9bcbe4] hover:bg-[#edf7fc] hover:text-[#3989b7] hover:shadow-[0_8px_20px_rgba(84,188,229,0.12)]"
                  >
                    <Edit3 size={15} />
                    Complete Profile
                    <ChevronRight size={14} />
                  </button>
                </div>
              </Panel>

              {/* ACCOUNT SECURITY */}
              <section className="group relative overflow-hidden rounded-[24px] border border-[#263951] bg-gradient-to-br from-[#0b1423] via-[#101d30] to-[#162a40] p-6 text-white shadow-[0_18px_45px_rgba(10,27,48,0.16)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_55px_rgba(10,27,48,0.22)] sm:p-7">
                <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full border border-[#54bce5]/15 transition-transform duration-700 group-hover:scale-110" />
                <div className="pointer-events-none absolute -bottom-32 left-1/3 h-56 w-56 rounded-full border border-white/[0.04]" />
                <div className="relative">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#54bce5]/10 text-[#65c9ed] ring-1 ring-[#54bce5]/10">
                        <KeyRound size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7190a8]">Account Security</p>
                        <h2 className="mt-1 font-serif text-[22px] font-bold">Update Password</h2>
                      </div>
                    </div>
                    <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold text-emerald-300">
                      <ShieldCheck size={13} />
                      Secure Faculty Account
                    </span>
                  </div>

                  <p className="mt-4 max-w-2xl text-[11px] leading-5 text-[#a8b7c8]">
                    Change your Faculty Portal password. Your current password is required for verification.
                  </p>

                  <form onSubmit={updatePassword} className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <PasswordField label="Current Password" value={currentPassword} onChange={setCurrentPassword} visible={showCurrentPassword} onToggle={() => setShowCurrentPassword((value) => !value)} disabled={passwordSaving} />
                    <PasswordField label="New Password" value={newPassword} onChange={setNewPassword} visible={showNewPassword} onToggle={() => setShowNewPassword((value) => !value)} disabled={passwordSaving} />
                    <PasswordField label="Confirm New Password" value={confirmNewPassword} onChange={setConfirmNewPassword} visible={showConfirmNewPassword} onToggle={() => setShowConfirmNewPassword((value) => !value)} disabled={passwordSaving} />

                    <div className="flex flex-col gap-3 pt-1 lg:col-span-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-[10px] font-semibold text-[#a8b7c8]">Password protection</p>
                        <p className="mt-0.5 text-[10px] text-[#8295aa]">Minimum 8 characters.</p>
                      </div>
                      <button
                        type="submit"
                        disabled={passwordSaving}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#54bce5] px-6 text-xs font-bold text-white shadow-[0_10px_25px_rgba(84,188,229,0.2)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#3eabd7] hover:shadow-[0_15px_30px_rgba(84,188,229,0.3)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {passwordSaving ? (
                          <>
                            <Spinner />
                            Updating...
                          </>
                        ) : (
                          <>
                            <KeyRound size={16} />
                            Update Password
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </section>

              {(securityMessage || securityError) && (
                <Alert
                  tone={securityError ? "error" : "success"}
                  icon={securityError ? <X size={17} /> : <CheckCircle2 size={17} />}
                  text={securityError || securityMessage}
                />
              )}
            </section>
          </div>
        </main>
      </div>

      {editing && (
        <EditProfileModal
          user={user}
          initials={initials}
          facultyName={facultyName}
          facultyId={facultyId}
          facultyEmail={facultyEmail}
          form={form}
          saving={saving}
          photoPreview={photoPreview}
          photoChanged={photoChanged}
          photoReading={photoReading}
          error={error}
          onClose={closeEditor}
          onSubmit={saveProfile}
          onChange={updateForm}
          onPhoto={selectPhoto}
          onRemovePhoto={removePhoto}
        />
      )}
    </div>
  );
}

function SidebarLink({
  item,
  active,
  onNavigate,
}: {
  item: (typeof navigation)[number];
  active: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`group relative flex h-11 w-full items-center gap-3 overflow-hidden rounded-xl px-3.5 text-[13px] font-medium transition-all duration-200 ${
        active
          ? "bg-[#17263a] text-[#64c8ee] shadow-[inset_3px_0_0_#54bce5]"
          : "text-[#9aabc0] hover:bg-[#142135] hover:text-white"
      }`}
    >
      <span className={`absolute inset-y-0 left-0 w-0 bg-[#54bce5]/10 transition-all duration-300 group-hover:w-full ${active ? "w-full" : ""}`} />
      <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-300 group-hover:bg-[#54bce5]/15">
        <Icon
          size={18}
          strokeWidth={1.8}
          className={active ? "text-[#63c9ef]" : "text-[#8195ad] transition group-hover:text-[#63c9ef]"}
        />
      </span>
      <span className="relative z-10">{item.title}</span>
      {active && <ChevronRight size={16} className="relative z-10 ml-auto text-[#63c9ef]" />}
    </Link>
  );
}

function Avatar({
  user,
  initials,
  size,
}: {
  user: FacultyUser;
  initials: string;
  size: "sm" | "md" | "hero" | "photo";
}) {
  const sizes = {
    sm: "h-10 w-10 rounded-full text-[12px]",
    md: "h-10 w-10 rounded-full text-[12px]",
    hero: "h-24 w-24 rounded-[25px] text-2xl sm:h-28 sm:w-28",
    photo: "h-32 w-32 rounded-[32px] text-3xl",
  };

  return (
    <div className={`relative flex shrink-0 items-center justify-center overflow-hidden border border-[#54bce5]/30 bg-gradient-to-br from-[#54bce5] to-[#3e89b7] font-bold text-white shadow-[0_15px_35px_rgba(61,137,183,0.22)] transition duration-500 ${sizes[size]}`}>
      {user.profileImage ? (
        <img src={user.profileImage} alt="" className="h-full w-full object-cover" />
      ) : (
        initials
      )}
      {(size === "hero" || size === "photo") && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
      )}
    </div>
  );
}

function StatusPill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#45bf8b]/25 bg-[#45bf8b]/10 px-3 py-1.5 text-[10px] font-semibold text-[#72d6aa]">
      {icon}
      {text}
    </span>
  );
}

function DarkPill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-medium text-[#b4c1d0]">
      {icon}
      <span className="truncate">{text}</span>
    </span>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="group relative min-w-0 overflow-hidden rounded-[22px] border border-[#d7e3ed] bg-white p-5 shadow-[0_8px_25px_rgba(30,60,90,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-[#a9d4e8] hover:shadow-[0_18px_38px_rgba(30,70,100,0.12)]">
      <div className="absolute -right-9 -top-9 h-28 w-28 rounded-full bg-[#e7f6fc] transition-transform duration-500 group-hover:scale-150" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf7fc] text-[#54bce5] transition-all duration-300 group-hover:bg-[#54bce5] group-hover:text-white group-hover:shadow-[0_8px_18px_rgba(84,188,229,0.25)]">
            {icon}
          </div>
          <Activity size={17} className="text-[#b7cad8] transition group-hover:text-[#54bce5]" />
        </div>
        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#8aa0b4]">{label}</p>
        <p className="mt-1 min-h-[29px] line-clamp-2 font-serif text-[19px] font-bold text-[#17263a]">{value}</p>
      </div>
    </div>
  );
}

function Panel({
  eyebrow,
  title,
  description,
  icon,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="group overflow-hidden rounded-[24px] border border-[#d7e3ed] bg-white shadow-[0_8px_25px_rgba(30,60,90,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#c2dcea] hover:shadow-[0_18px_42px_rgba(30,60,90,0.08)]">
      <div className="flex items-start justify-between gap-4 border-b border-[#e7edf3] px-5 py-5 sm:px-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#438bb8]">{eyebrow}</p>
          <h2 className="mt-1 font-serif text-[22px] font-bold text-[#142238]">{title}</h2>
          <p className="mt-1 text-[11px] text-[#72849a]">{description}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf7fc] text-[#54bce5] transition-all duration-300 group-hover:bg-[#54bce5] group-hover:text-white">
          {icon}
        </div>
      </div>
      <div className="panel-body">{children}</div>
    </section>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="info-field group/field">
      <div className="info-field-accent" />
      <div className="info-field-icon">
        {icon}
      </div>
      <div className="info-field-content">
        <p className="info-field-label">{label}</p>
        <p className="info-field-value">{value}</p>
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggle,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-[#b9c7d6]">{label}</label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          autoComplete={label === "Current Password" ? "current-password" : "new-password"}
          placeholder={`Enter ${label.toLowerCase()}`}
          className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 pr-12 text-sm text-white outline-none transition placeholder:text-[#667b91] hover:border-white/20 focus:border-[#54bce5]/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-[#54bce5]/10 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#7e94aa] transition hover:bg-white/10 hover:text-white"
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </div>
  );
}

function Alert({
  tone,
  icon,
  text,
}: {
  tone: "success" | "error";
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div
      className={`mt-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-sm ${
        tone === "success"
          ? "border-[#bde4cf] bg-[#f1faf5] text-[#31986d]"
          : "border-red-200 bg-red-50 text-red-600"
      }`}
    >
      {icon}
      {text}
    </div>
  );
}

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />;
}

function EditProfileModal({
  user,
  initials,
  facultyName,
  facultyId,
  facultyEmail,
  form,
  saving,
  photoPreview,
  photoChanged,
  photoReading,
  error,
  onClose,
  onSubmit,
  onChange,
  onPhoto,
  onRemovePhoto,
}: {
  user: FacultyUser;
  initials: string;
  facultyName: string;
  facultyId: string;
  facultyEmail: string;
  form: ProfileForm;
  saving: boolean;
  photoPreview: string | null;
  photoChanged: boolean;
  photoReading: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: (field: keyof ProfileForm, value: string) => void;
  onPhoto: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#07111f]/75 px-4 py-6 backdrop-blur-md">
      <div className="w-full max-w-4xl overflow-hidden rounded-[26px] border border-[#d8e3ed] bg-white shadow-[0_30px_80px_rgba(5,15,30,0.35)]">
        <div className="flex items-center justify-between border-b border-[#e3ebf2] px-5 py-5 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf7fc] text-[#54bce5]">
              <Edit3 size={20} />
            </div>
            <div>
              <h2 className="font-serif text-[21px] font-bold text-[#142238]">Edit Faculty Profile</h2>
              <p className="mt-0.5 text-[11px] text-[#72849a]">Update your available profile and contact information.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close edit profile"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#72849a] transition hover:bg-[#f2f6f9] hover:text-[#142238]"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="max-h-[calc(100vh-150px)] overflow-y-auto p-5 sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-2xl border border-[#d9e7f0] bg-gradient-to-br from-[#f8fcff] via-white to-[#edf7fc] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#438bb8]">Profile Preview</p>
              <div className="mt-5 flex flex-col items-center text-center">
                <Avatar user={{ ...user, profileImage: photoPreview }} initials={initials} size="photo" />
                <p className="mt-4 text-sm font-bold text-[#17263a]">{facultyName}</p>
                <p className="mt-1 text-[11px] text-[#72849a]">Faculty ID: {facultyId}</p>
                <p className="mt-0.5 break-all text-[11px] text-[#72849a]">{facultyEmail}</p>

                <label className="mt-5 inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#54bce5] px-4 text-xs font-bold text-white shadow-[0_8px_18px_rgba(84,188,229,0.2)] transition hover:-translate-y-0.5 hover:bg-[#3eabd7]">
                  {photoReading ? <Spinner /> : <Upload size={15} />}
                  {photoReading ? "Reading..." : "Choose Photo"}
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onPhoto} disabled={saving || photoReading} className="hidden" />
                </label>

                {photoChanged && photoPreview && (
                  <button
                    type="button"
                    onClick={onRemovePhoto}
                    disabled={saving || photoReading}
                    className="mt-2 inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-xs font-bold text-red-600 transition hover:bg-red-50"
                  >
                    <X size={15} />
                    Remove Photo
                  </button>
                )}

                <p className="mt-4 text-[10px] leading-5 text-[#7a8ea2]">
                  PNG, JPG/JPEG or WebP up to 2 MB.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <EditField label="Full Name" value={form.name} onChange={(value) => onChange("name", value)} placeholder="Enter full name" required />
              <EditField label="Phone Number" value={form.phone} onChange={(value) => onChange("phone", value)} placeholder="Enter phone number" />
              <EditField label="Designation" value={form.designation} onChange={(value) => onChange("designation", value)} placeholder="e.g. Assistant Professor, HOD" />
              <EditField label="Qualification" value={form.qualification} onChange={(value) => onChange("qualification", value)} placeholder="e.g. M.Tech, Ph.D." />
              <EditField label="Specialization" value={form.specialization} onChange={(value) => onChange("specialization", value)} placeholder="Enter specialization" />
              <EditField label="Office Hours" value={form.officeHours} onChange={(value) => onChange("officeHours", value)} placeholder="e.g. 10:00 AM - 4:00 PM" />
              <EditField label="City" value={form.city} onChange={(value) => onChange("city", value)} placeholder="Enter city" />
              <EditField label="State" value={form.state} onChange={(value) => onChange("state", value)} placeholder="Enter state" />

              <div className="sm:col-span-2">
                <label className="mb-2 block text-xs font-semibold text-[#40566e]">Address</label>
                <textarea
                  value={form.address}
                  onChange={(event) => onChange("address", event.target.value)}
                  rows={3}
                  placeholder="Enter complete address"
                  disabled={saving}
                  className="w-full resize-none rounded-xl border border-[#d8e3ed] bg-[#fafcfe] px-4 py-3 text-sm text-[#142238] outline-none transition placeholder:text-[#9aabba] hover:border-[#a9cfe2] focus:border-[#54bce5] focus:bg-[#f7fcff] focus:ring-4 focus:ring-[#54bce5]/10 disabled:opacity-60"
                />
              </div>

              <div className="sm:col-span-2 rounded-xl border border-[#dbe8f0] bg-[#f7fafc] px-4 py-3 text-[10px] leading-5 text-[#72849a]">
                Faculty ID, official email, department, and approval status remain controlled account information.
              </div>

              {error && (
                <div className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-600">
                  {error}
                </div>
              )}

              <div className="sm:col-span-2 flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="h-11 rounded-xl border border-[#d8e3ed] bg-white px-5 text-sm font-semibold text-[#526b84] transition hover:bg-[#f5f8fb]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#54bce5] px-6 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(84,188,229,0.2)] transition hover:-translate-y-0.5 hover:bg-[#3eabd7] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Spinner />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProfileLayoutStyles() {
  return (
    <style jsx global>{`
      .profile-panel {
        width: 100%;
        max-width: none;
        box-sizing: border-box;
      }

      .panel-body {
        width: 100%;
        box-sizing: border-box;
        padding: 24px 30px 30px;
      }

      .info-grid {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        grid-auto-rows: minmax(76px, auto);
        gap: 16px;
        box-sizing: border-box;
        min-width: 0;
      }

      .info-grid-full {
        grid-column: 1 / -1;
        min-width: 0;
      }

      .info-field {
        position: relative;
        width: 100%;
        min-width: 0;
        min-height: 76px;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: 14px;
        overflow: hidden;
        padding: 12px 16px;
        border: 1px solid #dce7ef;
        border-radius: 15px;
        background: #fbfdff;
        transition: background .2s ease, border-color .2s ease, box-shadow .2s ease, transform .2s ease;
      }

      .info-field:hover {
        background: #eef8fd;
        border-color: #70b7df;
        box-shadow: 0 10px 26px rgba(84,188,229,.13);
        transform: translateY(-2px);
      }

      .info-field-accent {
        position: absolute;
        inset: 0 auto 0 0;
        width: 3px;
        background: #70b7df;
        transform: scaleY(0);
        transform-origin: center;
        transition: transform .2s ease;
      }

      .info-field:hover .info-field-accent {
        transform: scaleY(1);
      }

      .info-field-icon {
        width: 42px;
        height: 42px;
        min-width: 42px;
        flex: 0 0 42px;
        display: grid;
        place-items: center;
        border-radius: 12px;
        color: #8aa0b4;
        background: #fff;
        border: 1px solid #e1eaf1;
        box-shadow: 0 2px 6px rgba(40,73,100,.07);
        transition: color .2s ease, background .2s ease, border-color .2s ease, transform .2s ease, box-shadow .2s ease;
      }

      .info-field:hover .info-field-icon {
        color: #fff;
        background: #70b7df;
        border-color: #70b7df;
        transform: scale(1.04);
        box-shadow: 0 8px 18px rgba(84,188,229,.25);
      }

      .info-field-content {
        min-width: 0;
        flex: 1;
      }

      .info-field-label {
        margin: 0 0 5px;
        color: #8aa0b4;
        font-size: 10px;
        line-height: 1;
        font-weight: 800;
        letter-spacing: .14em;
        text-transform: uppercase;
        transition: color .2s ease;
      }

      .info-field:hover .info-field-label { color: #3989b7; }

      .info-field-value {
        margin: 0;
        min-width: 0;
        color: #263a53;
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 14px;
        line-height: 1.35;
        font-weight: 700;
        overflow-wrap: anywhere;
      }

      @media (max-width: 680px) {
        .panel-body { padding: 18px; }
        .info-grid {
          grid-template-columns: minmax(0, 1fr);
          grid-auto-rows: minmax(72px, auto);
          gap: 12px;
        }
        .info-grid-full { grid-column: auto; }
      }
    `}</style>
  );
}

function EditField({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <div className="group">
      <label className="mb-2 block text-xs font-semibold text-[#40566e]">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-[#d8e3ed] bg-[#fafcfe] px-4 text-sm text-[#142238] outline-none transition placeholder:text-[#9aabba] hover:border-[#a9cfe2] hover:bg-[#f7fcff] focus:border-[#54bce5] focus:bg-white focus:ring-4 focus:ring-[#54bce5]/10"
      />
    </div>
  );
}