"use client";

import {
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import StudentLayout from "@/components/student/StudentLayout";

type StudentProfile = {
  id: string;
  campusUserId?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  department?: string | null;
  qualification?: string | null;
  specialization?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  profileImage?: string | null;
  role?: string;
  approvalStatus?: string | null;
  createdAt?: string;
};

type AcademicInfo = {
  semester: number;
  section: string;
  subjects: string[];
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  student?: StudentProfile;
  academic?: AcademicInfo;
};

export default function StudentSettingsPage() {
  const [profile, setProfile] =
    useState<StudentProfile | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [qualification, setQualification] =
    useState("");
  const [specialization, setSpecialization] =
    useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  const [profileImage, setProfileImage] =
    useState<string | null>(null);

  const [academic, setAcademic] =
    useState<AcademicInfo | null>(null);

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showCurrent, setShowCurrent] =
    useState(false);

  const [showNew, setShowNew] =
    useState(false);

  const [showConfirm, setShowConfirm] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [changingPassword, setChangingPassword] =
    useState(false);

  const [photoReading, setPhotoReading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  /* ============================================================
     TOKEN
  ============================================================ */

  const getToken = () => {
    try {
      return localStorage.getItem("token") || "";
    } catch {
      return "";
    }
  };

  /* ============================================================
     COMMON HEADERS
  ============================================================ */

  const getAuthHeaders = (): HeadersInit => {
    const token = getToken();

    if (!token) {
      return {};
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  /* ============================================================
     LOAD PROFILE
  ============================================================ */

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/student/profile",
        {
          method: "GET",
          headers: {
            ...getAuthHeaders(),
          },
          credentials: "include",
          cache: "no-store",
        }
      );

      const data: ApiResponse =
        await response.json().catch(
          () => ({})
        );

      if (
        !response.ok ||
        !data.success ||
        !data.student
      ) {
        throw new Error(
          data.message ||
            "Unable to load student profile."
        );
      }

      const student = data.student;

      setProfile(student);

      setName(student.name || "");
      setEmail(student.email || "");
      setPhone(student.phone || "");
      setDepartment(
        student.department || ""
      );
      setQualification(
        student.qualification || ""
      );
      setSpecialization(
        student.specialization || ""
      );
      setAddress(student.address || "");
      setCity(student.city || "");
      setState(student.state || "");

      setProfileImage(
        student.profileImage || null
      );

      setAcademic(
        data.academic || null
      );

      /* Sync lightweight client-side student data (excluding heavy base64 image to prevent quota overflow) */
      try {
        const storedUser =
          localStorage.getItem("user");

        const oldUser = storedUser
          ? JSON.parse(storedUser)
          : {};

        localStorage.setItem(
          "user",
          JSON.stringify({
            ...oldUser,
            id: student.id,
            name: student.name,
            email: student.email,
            role: student.role,
          })
        );

        window.dispatchEvent(
          new Event(
            "student-profile-updated"
          )
        );

        window.dispatchEvent(
          new Event(
            "campusconnect-profile-updated"
          )
        );
      } catch (syncError) {
        console.error(
          "STUDENT LOCAL PROFILE SYNC ERROR:",
          syncError
        );
      }
    } catch (loadError) {
      console.error(
        "LOAD STUDENT PROFILE ERROR:",
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load student profile."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     INITIAL LOAD
  ============================================================ */

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void loadProfile();
      }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  /* ============================================================
     PROFILE PHOTO
  ============================================================ */

  const handlePhotoChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    setError("");
    setSuccess("");

    if (
      !/^image\/(png|jpeg|jpg|webp)$/i.test(
        file.type
      )
    ) {
      setError(
        "Please select a PNG, JPG/JPEG or WebP image."
      );
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError(
        "Profile photo must be 2 MB or smaller."
      );
      return;
    }

    setPhotoReading(true);

    const reader =
      new FileReader();

    reader.onload = () => {
      const result =
        typeof reader.result === "string"
          ? reader.result
          : "";

      if (!result) {
        setError(
          "Unable to read the selected image."
        );
        setPhotoReading(false);
        return;
      }

      setProfileImage(result);
      setPhotoReading(false);
    };

    reader.onerror = () => {
      setPhotoReading(false);

      setError(
        "Unable to read the selected image."
      );
    };

    reader.readAsDataURL(file);
  };

  /* ============================================================
     REMOVE PHOTO
  ============================================================ */

  const removePhoto = () => {
    setProfileImage(null);
    setError("");
    setSuccess("");
  };

  /* ============================================================
     SAVE PROFILE
  ============================================================ */

  const saveProfile = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError(
        "Please enter your full name."
      );
      return;
    }

    if (!email.trim()) {
      setError(
        "Please enter your email address."
      );
      return;
    }

    try {
      setSaving(true);

      const response =
        await fetch(
          "/api/student/profile",
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
              ...getAuthHeaders(),
            },
            credentials: "include",
            cache: "no-store",
            body: JSON.stringify({
              name: name.trim(),
              email:
                email.trim().toLowerCase(),
              phone: phone.trim(),
              department:
                department.trim(),
              qualification:
                qualification.trim(),
              specialization:
                specialization.trim(),
              address:
                address.trim(),
              city: city.trim(),
              state: state.trim(),
              profileImage:
                profileImage || null,
            }),
          }
        );

      const data: ApiResponse =
        await response.json().catch(
          () => ({})
        );

      if (
        !response.ok ||
        !data.success ||
        !data.student
      ) {
        throw new Error(
          data.message ||
            "Unable to update profile."
        );
      }

      const updated =
        data.student;

      setProfile(updated);

      setName(updated.name || "");
      setEmail(updated.email || "");
      setPhone(updated.phone || "");
      setDepartment(
        updated.department || ""
      );
      setQualification(
        updated.qualification || ""
      );
      setSpecialization(
        updated.specialization || ""
      );
      setAddress(
        updated.address || ""
      );
      setCity(updated.city || "");
      setState(updated.state || "");

      setProfileImage(
        updated.profileImage || null
      );

      /* Update localStorage safely */
      try {
        const storedUser =
          localStorage.getItem("user");

        const oldUser = storedUser
          ? JSON.parse(storedUser)
          : {};

        localStorage.setItem(
          "user",
          JSON.stringify({
            ...oldUser,
            id: updated.id,
            name: updated.name,
            email: updated.email,
            role: updated.role,
          })
        );

        window.dispatchEvent(
          new Event(
            "student-profile-updated"
          )
        );

        window.dispatchEvent(
          new Event(
            "campusconnect-profile-updated"
          )
        );
      } catch (syncError) {
        console.error(
          "PROFILE LOCAL STORAGE SYNC ERROR:",
          syncError
        );
      }

      setSuccess(
        "Profile information updated successfully."
      );
    } catch (saveError) {
      console.error(
        "SAVE STUDENT PROFILE ERROR:",
        saveError
      );

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ============================================================
     CHANGE PASSWORD
  ============================================================ */

  const changePassword = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (changingPassword) {
      return;
    }

    setError("");
    setSuccess("");

    if (!currentPassword) {
      setError(
        "Please enter your current password."
      );
      return;
    }

    if (newPassword.length < 6) {
      setError(
        "New password must contain at least 6 characters."
      );
      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setError(
        "New password and confirm password do not match."
      );
      return;
    }

    if (
      currentPassword ===
      newPassword
    ) {
      setError(
        "New password must be different from the current password."
      );
      return;
    }

    try {
      setChangingPassword(true);

      const response =
        await fetch(
          "/api/student/profile/password",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              ...getAuthHeaders(),
            },
            credentials: "include",
            cache: "no-store",
            body: JSON.stringify({
              currentPassword,
              newPassword,
              confirmPassword,
            }),
          }
        );

      const data =
        await response.json().catch(
          () => ({})
        );

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to change password."
        );
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setSuccess(
        "Password changed successfully."
      );
    } catch (passwordError) {
      console.error(
        "STUDENT PASSWORD ERROR:",
        passwordError
      );

      setError(
        passwordError instanceof Error
          ? passwordError.message
          : "Unable to change password."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  /* ============================================================
     INITIALS
  ============================================================ */

  const initials = useMemo(() => {
    const value =
      name.trim() || "Student";

    return value
      .split(/\s+/)
      .slice(0, 2)
      .map(
        (part) =>
          part
            .charAt(0)
            .toUpperCase()
      )
      .join("");
  }, [name]);

  /* ============================================================
     DISPLAY
  ============================================================ */

  const displaySemester =
    academic?.semester
      ? `Semester ${academic.semester}`
      : "Not assigned";

  const displaySection =
    academic?.section || "Not assigned";

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <StudentLayout>
        <div className="min-h-screen bg-[#f5f8f7]">
          <div className="flex min-h-[70vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
                <Loader2
                  size={27}
                  className="animate-spin"
                />
              </div>

              <h2 className="mt-4 text-lg font-bold text-slate-800">
                Loading your profile...
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Please wait while we fetch your student information.
              </p>
            </div>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="min-h-screen bg-[#f5f8f7] text-slate-900">
        <main className="w-full px-5 py-7 sm:px-7 lg:px-8 xl:px-9">
          {/* ======================================================
              HERO
          ======================================================= */}

          <section className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b2d22] via-[#0e3b2d] to-[#124a3b] p-7 text-white shadow-xl shadow-emerald-900/10 sm:p-9">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-teal-300/10 blur-3xl" />

            <div className="relative z-10 flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
                  <GraduationCap size={14} />
                  Student Account
                </div>

                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Your profile.
                  <span className="block text-emerald-300">
                    Your campus identity.
                  </span>
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  Manage your personal information, academic details and account password from one place.
                </p>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={name || "Student"}
                    className="h-14 w-14 rounded-2xl object-cover ring-2 ring-emerald-300/30"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-lg font-bold">
                    {initials}
                  </div>
                )}

                <div>
                  <p className="text-base font-bold">
                    {name || "Student"}
                  </p>

                  <p className="mt-0.5 text-xs text-slate-400">
                    {email || "Campus Member"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ======================================================
              MESSAGES
          ======================================================= */}

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-500">
                <X size={18} />
              </div>

              <div>
                <p className="text-sm font-semibold text-red-700">
                  Something went wrong
                </p>

                <p className="mt-1 text-xs leading-5 text-red-600">
                  {error}
                </p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={18} />
              </div>

              <div>
                <p className="text-sm font-semibold text-emerald-700">
                  Success
                </p>

                <p className="mt-1 text-xs text-emerald-600">
                  {success}
                </p>
              </div>
            </div>
          )}

          {/* ======================================================
              PROFILE INFORMATION
          ======================================================= */}

          <form
            onSubmit={saveProfile}
            className="space-y-7"
          >
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                    <UserRound size={21} />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Personal Information
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Keep your student profile information up to date.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 p-6 sm:p-7 lg:grid-cols-[230px_1fr]">
                {/* PHOTO */}

                <div className="flex flex-col items-center">
                  <div className="relative">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt={name || "Student"}
                        className="h-36 w-36 rounded-3xl object-cover ring-4 ring-emerald-50"
                      />
                    ) : (
                      <div className="flex h-36 w-36 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 text-4xl font-bold text-white ring-4 ring-emerald-50">
                        {initials}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      disabled={photoReading}
                      className="absolute -bottom-3 -right-3 flex h-11 w-11 items-center justify-center rounded-xl border-4 border-white bg-emerald-500 text-white shadow-lg transition hover:bg-emerald-600 disabled:opacity-60"
                      aria-label="Choose profile photo"
                    >
                      {photoReading ? (
                        <Loader2
                          size={18}
                          className="animate-spin"
                        />
                      ) : (
                        <Camera size={18} />
                      )}
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    className="mt-7 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-100"
                  >
                    <Camera size={15} />
                    Choose Photo
                  </button>

                  {profileImage && (
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="mt-2 text-xs font-medium text-slate-400 transition hover:text-red-500"
                    >
                      Remove photo
                    </button>
                  )}

                  <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">
                    PNG, JPG/JPEG or WebP
                    <br />
                    Maximum 2 MB
                  </p>
                </div>

                {/* FIELDS */}

                <div className="grid gap-5 sm:grid-cols-2">
                  <InputField
                    label="Full Name"
                    value={name}
                    onChange={setName}
                    icon={<UserRound size={16} />}
                    required
                  />

                  <InputField
                    label="Email Address"
                    value={email}
                    onChange={setEmail}
                    icon={<Mail size={16} />}
                    type="email"
                    required
                  />

                  <InputField
                    label="Phone Number"
                    value={phone}
                    onChange={setPhone}
                    icon={<Phone size={16} />}
                  />

                  <ReadOnlyField
                    label="Campus User ID"
                    value={
                      profile?.campusUserId ||
                      "Not assigned"
                    }
                  />

                  <InputField
                    label="Department"
                    value={department}
                    onChange={setDepartment}
                  />

                  <InputField
                    label="Qualification"
                    value={qualification}
                    onChange={setQualification}
                  />

                  <InputField
                    label="Specialization"
                    value={specialization}
                    onChange={setSpecialization}
                  />

                  <InputField
                    label="City"
                    value={city}
                    onChange={setCity}
                    icon={<MapPin size={16} />}
                  />

                  <InputField
                    label="State"
                    value={state}
                    onChange={setState}
                  />

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-xs font-semibold text-slate-600">
                      Address
                    </label>

                    <textarea
                      value={address}
                      onChange={(event) =>
                        setAddress(
                          event.target.value
                        )
                      }
                      rows={3}
                      placeholder="Enter your address"
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-100 px-6 py-5 sm:px-7">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Save size={17} />
                  )}

                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </section>
          </form>

          {/* ======================================================
              ACADEMIC INFORMATION
          ======================================================= */}

          <section className="mt-7 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                  <GraduationCap size={21} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Academic Information
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Your registered academic details.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-3 sm:p-7">
              <AcademicBox
                label="Semester"
                value={displaySemester}
              />

              <AcademicBox
                label="Section"
                value={displaySection}
              />

              <AcademicBox
                label="Registered Subjects"
                value={String(
                  academic?.subjects?.length || 0
                )}
              />
            </div>

            {academic?.subjects &&
              academic.subjects.length > 0 && (
                <div className="border-t border-slate-100 px-6 py-5 sm:px-7">
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
                    Subjects
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {academic.subjects.map(
                      (subject) => (
                        <span
                          key={subject}
                          className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
                        >
                          {subject}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
          </section>

          {/* ======================================================
              PASSWORD
          ======================================================= */}

          <form
            onSubmit={changePassword}
            className="mt-7"
          >
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                    <ShieldCheck size={21} />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Password & Security
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Change your CampusConnect login password.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 p-6 sm:p-7 lg:grid-cols-3">
                <PasswordField
                  label="Current Password"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  visible={showCurrent}
                  onToggle={() =>
                    setShowCurrent(
                      (value) => !value
                    )
                  }
                />

                <PasswordField
                  label="New Password"
                  value={newPassword}
                  onChange={setNewPassword}
                  visible={showNew}
                  onToggle={() =>
                    setShowNew(
                      (value) => !value
                    )
                  }
                />

                <PasswordField
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  visible={showConfirm}
                  onToggle={() =>
                    setShowConfirm(
                      (value) => !value
                    )
                  }
                />
              </div>

              <div className="flex flex-col justify-between gap-4 border-t border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:px-7">
                <div className="flex items-start gap-3">
                  <KeyRound
                    size={17}
                    className="mt-0.5 shrink-0 text-emerald-500"
                  />

                  <p className="max-w-xl text-xs leading-5 text-slate-400">
                    Use a password containing at least 6 characters. Your current password is required before changing it.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={changingPassword}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {changingPassword ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <KeyRound size={17} />
                  )}

                  {changingPassword
                    ? "Changing..."
                    : "Change Password"}
                </button>
              </div>
            </section>
          </form>

          {/* ======================================================
              FOOTER
          ======================================================= */}

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
        </main>
      </div>
    </StudentLayout>
  );
}

/* ============================================================
   INPUT FIELD
============================================================ */

function InputField({
  label,
  value,
  onChange,
  icon,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-slate-600">
        {label}
        {required && (
          <span className="ml-1 text-emerald-500">
            *
          </span>
        )}
      </label>

      <div className="relative">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}

        <input
          type={type}
          value={value}
          required={required}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          className={`h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 ${
            icon
              ? "pl-11"
              : "pl-4"
          }`}
        />
      </div>
    </div>
  );
}

/* ============================================================
   READ ONLY
============================================================ */

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-slate-600">
        {label}
      </label>

      <input
        value={value}
        readOnly
        className="h-12 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 text-sm font-medium text-slate-500 outline-none"
      />
    </div>
  );
}

/* ============================================================
   PASSWORD
============================================================ */

function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-slate-600">
        {label}
      </label>

      <div className="relative">
        <KeyRound
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type={
            visible
              ? "text"
              : "password"
          }
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-11 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-500"
        >
          {visible ? (
            <EyeOff size={17} />
          ) : (
            <Eye size={17} />
          )}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   ACADEMIC BOX
============================================================ */

function AcademicBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-emerald-200 hover:bg-emerald-50/40">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-base font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}