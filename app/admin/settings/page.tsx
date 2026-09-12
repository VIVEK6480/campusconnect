"use client";

import {
  Camera,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { ChangeEvent, FormEvent, MouseEvent, useEffect, useMemo, useState } from "react";

type AdminProfile = {
  id: string;
  campusUserId?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  department?: string | null;
  designation?: string | null;
  profileImage?: string | null;
  role: string;
};

type ApiResponse = { success?: boolean; message?: string; user?: AdminProfile };

type CursorEffect = {
  id: string;
  x: number;
  y: number;
};

export default function AdminSettingsPage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cursorEffect, setCursorEffect] = useState<CursorEffect | null>(null);

  const initials = useMemo(() => {
    const value = name.trim() || "Admin";
    return value.split(/\s+/).slice(0, 2).map((x) => x[0]?.toUpperCase()).join("");
  }, [name]);

  async function loadProfile() {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/settings", { credentials: "include", cache: "no-store" });
      const data: ApiResponse = await response.json().catch(() => ({}));
      if (!response.ok || !data.success || !data.user) throw new Error(data.message || "Unable to load admin profile.");
      setProfile(data.user);
      setName(data.user.name || "");
      setEmail(data.user.email || "");
      setPhone(data.user.phone || "");
      setDepartment(data.user.department || "");
      setDesignation(data.user.designation || "");
      setProfileImage(data.user.profileImage || "");
      setError("");
    } catch (error) {
      console.error("ADMIN SETTINGS LOAD ERROR:", error);
      setError(error instanceof Error ? error.message : "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProfile();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select a valid image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Profile image must be smaller than 5 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === "string") { setProfileImage(reader.result); setError(""); } };
    reader.onerror = () => setError("Unable to read the selected image.");
    reader.readAsDataURL(file);
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setSuccess("");
    if (!name.trim() || !email.trim()) { setError("Name and email are required."); return; }
    try {
      setSaving(true);
      const response = await fetch("/api/admin/settings", {
        method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, department, designation, profileImage: profileImage || null }),
      });
      const data: ApiResponse = await response.json().catch(() => ({}));
      if (!response.ok || !data.success || !data.user) { setError(data.message || "Unable to update profile."); return; }
      setProfile(data.user); setName(data.user.name); setEmail(data.user.email); setPhone(data.user.phone || ""); setDepartment(data.user.department || ""); setDesignation(data.user.designation || ""); setProfileImage(data.user.profileImage || "");
      setSuccess("Profile information updated successfully.");
    } catch (error) { console.error("ADMIN PROFILE UPDATE ERROR:", error); setError("Unable to connect to the server."); }
    finally { setSaving(false); }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setSuccess("");
    if (!currentPassword || !newPassword || !confirmPassword) { setError("Please fill all password fields."); return; }
    if (newPassword.length < 6) { setError("New password must contain at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setError("New password and confirm password do not match."); return; }
    try {
      setChangingPassword(true);
      const response = await fetch("/api/admin/settings", {
        method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data: ApiResponse = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) { setError(data.message || "Unable to change password."); return; }
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setSuccess("Password changed successfully.");
    } catch (error) { console.error("ADMIN PASSWORD UPDATE ERROR:", error); setError("Unable to connect to the server."); }
    finally { setChangingPassword(false); }
  }

  function handleCursorMove(event: MouseEvent<HTMLElement>, id: string) {
    const rect = event.currentTarget.getBoundingClientRect();

    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

    setCursorEffect({ id, x, y });
  }

  function getCursorStyle(id: string) {
    const effect = cursorEffect?.id === id ? cursorEffect : null;

    if (!effect) {
      return undefined;
    }

    return {
      transform: `perspective(1100px) translate3d(${effect.x * 0.35}px, ${effect.y * 0.35 - 1}px, 0) rotateX(${effect.y * -0.15}deg) rotateY(${effect.x * 0.15}deg)`,
      boxShadow: 
        "0 10px 24px rgba(30,91,128,0.08), 0 0 0 1px rgba(79,70,229,0.04)",
    };
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#f4f7fb] px-4 py-5 md:px-6 lg:px-8">
      <div className="w-full">
        <section
          className="relative mb-6 h-[280px] overflow-hidden rounded-[26px] bg-gradient-to-br from-[#07132f] via-[#102a62] to-[#1d4ed8] px-7 py-8 text-white shadow-[0_20px_50px_rgba(30,64,175,0.18)] transition-all duration-300 will-change-transform sm:px-9"
          onMouseMove={(event) => handleCursorMove(event, "hero")}
          onMouseLeave={() => setCursorEffect(null)}
          style={getCursorStyle("hero")}
        >
          <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-blue-300/10 blur-3xl" />
          <div className="relative z-10 flex h-full items-center">
            <div className="max-w-4xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-semibold text-white/95 backdrop-blur-sm">
                <ShieldCheck size={14} />
                Administrative Settings Center
              </div>
              <h1 className="font-serif text-3xl font-black leading-[1.05] tracking-tight text-white sm:text-4xl lg:text-[42px]">Admin Profile Settings</h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-blue-100 sm:text-[15px]">Manage your profile information, contact details, profile picture, and account password from one secure workspace.</p>
            </div>
          </div>
        </section>

        {error && <Alert text={error} type="error" onClose={() => setError("")} />}
        {success && <Alert text={success} type="success" onClose={() => setSuccess("")} />}

        {loading ? (
          <div className="flex h-[360px] items-center justify-center rounded-[24px] border border-slate-200 bg-white shadow-sm"><Loader2 size={22} className="animate-spin text-[#1d4ed8]" /></div>
        ) : (
          <div className="grid w-full gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.75fr)]">
            <section
              className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 will-change-transform sm:p-7"
              onMouseMove={(event) => handleCursorMove(event, "profile-card")}
              onMouseLeave={() => setCursorEffect(null)}
              style={getCursorStyle("profile-card")}
            >
              <div className="mb-7 flex flex-col gap-3 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
                <div><div className="flex items-center gap-2"><UserRound size={18} className="text-[#1d4ed8]" /><h2 className="text-lg font-bold text-[#0b1428]">Personal Information</h2></div><p className="mt-1 text-sm text-slate-500">Update the details shown across your admin account.</p></div>
                <span className="rounded-xl bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600">{profile?.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}</span>
              </div>

              <form onSubmit={saveProfile} className="space-y-6">
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-[#f8faff] p-5 sm:flex-row sm:items-center">
                  <div className="relative shrink-0">
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-blue-100 text-2xl font-black text-[#1d4ed8] shadow-md">{profileImage ? <img src={profileImage} alt="Admin profile" className="h-full w-full object-cover" /> : initials}</div>
                    <label htmlFor="profile-image" className="absolute -bottom-2 -right-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-4 border-white bg-[#1d4ed8] text-white shadow-lg transition hover:bg-[#173ea9]"><Camera size={16} /></label>
                    <input id="profile-image" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </div>
                  <div><p className="text-sm font-bold text-[#0b1428]">Profile Picture</p><p className="mt-1 text-xs leading-5 text-slate-500">Upload an image up to 5 MB.</p>{profileImage && <button type="button" onClick={() => setProfileImage("")} className="mt-2 text-xs font-semibold text-red-600">Remove current picture</button>}</div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Full Name" icon={<UserRound size={17} />} value={name} onChange={setName} placeholder="Enter your full name" />
                  <Field label="Email Address" icon={<Mail size={17} />} value={email} onChange={setEmail} type="email" placeholder="admin@example.com" />
                  <Field label="Phone Number" icon={<Phone size={17} />} value={phone} onChange={setPhone} type="tel" placeholder="Enter phone number" />
                  <Field label="Department" value={department} onChange={setDepartment} placeholder="Enter department" />
                  <div className="md:col-span-2"><Field label="Designation" value={designation} onChange={setDesignation} placeholder="Enter designation" /></div>
                </div>

                <div className="flex justify-end border-t border-slate-100 pt-5"><button disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1d4ed8] px-5 text-sm font-bold text-white transition hover:bg-[#173ea9] disabled:opacity-60">{saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}{saving ? "Saving..." : "Save Profile"}</button></div>
              </form>
            </section>

            <section
              className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 will-change-transform sm:p-7"
              onMouseMove={(event) => handleCursorMove(event, "security-card")}
              onMouseLeave={() => setCursorEffect(null)}
              style={getCursorStyle("security-card")}
            >
              <div className="mb-7 border-b border-slate-100 pb-6"><div className="flex items-center gap-2"><KeyRound size={18} className="text-[#1d4ed8]" /><h2 className="text-lg font-bold text-[#0b1428]">Security</h2></div><p className="mt-1 text-sm text-slate-500">Change your admin account password securely.</p></div>
              <form onSubmit={changePassword} className="space-y-5">
                <PasswordField label="Current Password" value={currentPassword} setValue={setCurrentPassword} visible={showCurrent} toggle={() => setShowCurrent(!showCurrent)} />
                <PasswordField label="New Password" value={newPassword} setValue={setNewPassword} visible={showNew} toggle={() => setShowNew(!showNew)} />
                <PasswordField label="Confirm New Password" value={confirmPassword} setValue={setConfirmPassword} visible={showConfirm} toggle={() => setShowConfirm(!showConfirm)} />
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4"><div className="flex gap-3"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#1d4ed8]" /><p className="text-xs leading-5 text-slate-600">Use a strong password with letters, numbers, and special characters.</p></div></div>
                <button disabled={changingPassword} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0b1428] px-5 text-sm font-bold text-white transition hover:bg-[#152342] disabled:opacity-60">{changingPassword ? <Loader2 size={17} className="animate-spin" /> : <KeyRound size={17} />}{changingPassword ? "Updating..." : "Change Password"}</button>
              </form>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", icon }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string; icon?: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span><div className="relative">{icon && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}<input value={value} onChange={(e) => onChange(e.target.value)} type={type} placeholder={placeholder} className={`h-12 w-full rounded-xl border border-slate-200 bg-white ${icon ? "pl-11" : "px-4"} pr-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1d4ed8] focus:ring-4 focus:ring-blue-50`} /></div></label>;
}

function PasswordField({ label, value, setValue, visible, toggle }: { label: string; value: string; setValue: (value: string) => void; visible: boolean; toggle: () => void }) {
  return <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span><div className="relative"><KeyRound size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input value={value} onChange={(e) => setValue(e.target.value)} type={visible ? "text" : "password"} autoComplete="new-password" placeholder="Enter password" className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-12 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1d4ed8] focus:ring-4 focus:ring-blue-50" /><button type="button" onClick={toggle} className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label={visible ? "Hide password" : "Show password"}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>;
}

function Alert({ text, type, onClose }: { text: string; type: "error" | "success"; onClose: () => void }) {
  const classes = type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700";
  return <div className={`mb-5 flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-sm ${classes}`}><span>{text}</span><button type="button" onClick={onClose} className="rounded-lg p-1"><X size={16} /></button></div>;
}
