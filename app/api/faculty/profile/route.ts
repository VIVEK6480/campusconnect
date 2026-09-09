import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

type TokenPayload = JwtPayload & {
  id?: string;
  userId?: string;
  facultyId?: string;
  role?: string;
};

/*
 * IMPORTANT
 * ----------
 * This select MUST match the current Prisma User model.
 *
 * The supplied schema does NOT contain department or designation,
 * so those fields must not be selected from Prisma.
 */
const facultySelect = {
  id: true,
  name: true,
  email: true,
  campusUserId: true,
  role: true,
  approvalStatus: true,
  phone: true,
  qualification: true,
  specialization: true,
  joiningDate: true,
  address: true,
  city: true,
  state: true,
  officeRoom: true,
  officeHours: true,
  profileImage: true,
} as const;

/* =========================================================
   AUTH
   ========================================================= */

function getFacultyId(request: NextRequest): string | null {
  const authorization = request.headers.get("authorization") || "";

  const bearer = authorization.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7).trim()
    : "";

  const token = request.cookies.get("token")?.value || bearer;

  if (!token || !process.env.JWT_SECRET) {
    return null;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    ) as TokenPayload;

    const role = String(decoded.role ?? "")
      .trim()
      .toUpperCase();

    if (role && role !== "FACULTY") {
      return null;
    }

    return (
      (typeof decoded.id === "string" && decoded.id) ||
      (typeof decoded.userId === "string" && decoded.userId) ||
      (typeof decoded.facultyId === "string" && decoded.facultyId) ||
      (typeof decoded.sub === "string" && decoded.sub) ||
      null
    );
  } catch (error) {
    console.error("FACULTY PROFILE JWT ERROR:", error);
    return null;
  }
}

async function requireFaculty(request: NextRequest) {
  const facultyId = getFacultyId(request);

  if (!facultyId) {
    return {
      facultyId: null,
      response: NextResponse.json(
        {
          success: false,
          message: "Unauthorized faculty account.",
        },
        { status: 401 }
      ),
    };
  }

  const faculty = await prisma.user.findUnique({
    where: {
      id: facultyId,
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (
    !faculty ||
    String(faculty.role).trim().toUpperCase() !== "FACULTY"
  ) {
    return {
      facultyId: null,
      response: NextResponse.json(
        {
          success: false,
          message: "Faculty account not found.",
        },
        { status: 404 }
      ),
    };
  }

  return {
    facultyId,
    response: null,
  };
}

/* =========================================================
   HELPERS
   ========================================================= */

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/*
 * Validate a base64 data URL.
 *
 * The browser already limits the selected file to 2 MB.
 * The API validates again so the limit cannot be bypassed.
 */
function validateProfileImage(profileImage: string): string | null {
  if (!profileImage) {
    return "Profile image is required.";
  }

  const match = profileImage.match(
    /^data:image\/(png|jpe?g|webp);base64,(.+)$/i
  );

  if (!match) {
    return "Only PNG, JPG/JPEG and WebP images are supported.";
  }

  const base64 = match[2];

  try {
    const byteLength = Buffer.from(base64, "base64").byteLength;

    if (byteLength > 2 * 1024 * 1024) {
      return "Profile image is too large. Please use an image below 2 MB.";
    }
  } catch {
    return "Invalid profile image data.";
  }

  return null;
}

function responseHeaders() {
  return {
    "Cache-Control": "no-store, max-age=0",
  };
}

/* =========================================================
   GET
   LOAD COMPLETE FACULTY PROFILE
   ========================================================= */

export async function GET(request: NextRequest) {
  try {
    const auth = await requireFaculty(request);

    if (auth.response) {
      return auth.response;
    }

    const faculty = await prisma.user.findUnique({
      where: {
        id: auth.facultyId!,
      },
      select: facultySelect,
    });

    if (!faculty) {
      return NextResponse.json(
        {
          success: false,
          message: "Faculty account not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        faculty,
      },
      {
        status: 200,
        headers: responseHeaders(),
      }
    );
  } catch (error) {
    console.error("FACULTY PROFILE GET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load faculty profile.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PATCH
   =========================================================
   update-profile
   ----------------
   Updates all editable faculty profile information.

   profileImage is OPTIONAL in this same request:
   - property omitted -> keep current photo
   - property is a data URL -> replace current photo
   - property is null -> remove current photo

   update-photo is kept only for backward compatibility with
   any older page/API caller. The new Faculty Profile page uses
   update-profile for everything.
   ========================================================= */

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireFaculty(request);

    if (auth.response) {
      return auth.response;
    }

    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    const action =
      typeof body.action === "string"
        ? body.action
        : "update-profile";

    const hasProfileImage = Object.prototype.hasOwnProperty.call(
      body,
      "profileImage"
    );

    if (
      action !== "update-profile" &&
      action !== "update-photo"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid profile update action.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       LEGACY PHOTO-ONLY UPDATE
       ===================================================== */

    if (action === "update-photo") {
      if (!hasProfileImage) {
        return NextResponse.json(
          {
            success: false,
            message: "Profile image is required.",
          },
          { status: 400 }
        );
      }

      /*
       * null is intentionally supported here as well, so an
       * older photo editor can remove the photo.
       */
      if (body.profileImage === null) {
        const updatedFaculty = await prisma.user.update({
          where: {
            id: auth.facultyId!,
          },
          data: {
            profileImage: null,
          },
          select: facultySelect,
        });

        return NextResponse.json(
          {
            success: true,
            message: "Profile photo removed successfully.",
            profileImage: null,
            faculty: updatedFaculty,
          },
          {
            status: 200,
            headers: responseHeaders(),
          }
        );
      }

      const profileImage = clean(body.profileImage);
      const imageError = validateProfileImage(profileImage);

      if (imageError) {
        return NextResponse.json(
          {
            success: false,
            message: imageError,
          },
          {
            status: imageError.includes("too large") ? 413 : 400,
          }
        );
      }

      const updatedFaculty = await prisma.user.update({
        where: {
          id: auth.facultyId!,
        },
        data: {
          profileImage,
        },
        select: facultySelect,
      });

      return NextResponse.json(
        {
          success: true,
          message: "Profile photo updated successfully.",
          profileImage: updatedFaculty.profileImage,
          faculty: updatedFaculty,
        },
        {
          status: 200,
          headers: responseHeaders(),
        }
      );
    }

    /* =====================================================
       NORMAL PROFILE UPDATE
       ===================================================== */

    const name = clean(body.name);

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter your full name.",
        },
        { status: 400 }
      );
    }

    /*
     * Start with ONLY fields that actually exist in the
     * supplied Prisma User model.
     */
    const data: {
      name: string;
      phone: string;
      qualification: string;
      specialization: string;
      address: string;
      city: string;
      state: string;
      officeRoom: string;
      officeHours: string;
      profileImage?: string | null;
    } = {
      name,
      phone: clean(body.phone),
      qualification: clean(body.qualification),
      specialization: clean(body.specialization),
      address: clean(body.address),
      city: clean(body.city),
      state: clean(body.state),
      officeRoom: clean(body.officeRoom),
      officeHours: clean(body.officeHours),
    };

    /*
     * PHOTO IS PART OF THE SAME PROFILE SAVE.
     *
     * This fixes the old problem where:
     *   Save Changes -> profileImage: null
     *   -> route said "Profile image is required."
     *
     * Now:
     *   undefined -> keep old image
     *   data URL  -> replace image
     *   null      -> remove image
     */
    if (hasProfileImage) {
      if (body.profileImage === null) {
        data.profileImage = null;
      } else if (typeof body.profileImage === "string") {
        const profileImage = body.profileImage.trim();
        const imageError = validateProfileImage(profileImage);

        if (imageError) {
          return NextResponse.json(
            {
              success: false,
              message: imageError,
            },
            {
              status: imageError.includes("too large")
                ? 413
                : 400,
            }
          );
        }

        data.profileImage = profileImage;
      } else {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid profile image.",
          },
          { status: 400 }
        );
      }
    }

    const updatedFaculty = await prisma.user.update({
      where: {
        id: auth.facultyId!,
      },
      data,
      select: facultySelect,
    });

    return NextResponse.json(
      {
        success: true,
        message: hasProfileImage
          ? data.profileImage === null
            ? "Faculty profile and photo removal completed successfully."
            : "Faculty profile and photo updated successfully."
          : "Profile information updated successfully.",
        faculty: updatedFaculty,
        profileImage: updatedFaculty.profileImage,
      },
      {
        status: 200,
        headers: responseHeaders(),
      }
    );
  } catch (error) {
    console.error("FACULTY PROFILE UPDATE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update faculty profile.",
      },
      { status: 500 }
    );
  }
}
