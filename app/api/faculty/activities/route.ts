import {
  NextRequest,
  NextResponse,
} from "next/server";

import jwt, {
  JwtPayload,
} from "jsonwebtoken";

import { prisma } from "@/lib/prisma";

/* =========================================================
   CACHE
========================================================= */

const CACHE_HEADERS = {
  "Cache-Control":
    "private, no-store, max-age=0",
};

/* =========================================================
   JWT PAYLOAD
========================================================= */

type TokenPayload =
  JwtPayload & {
    id?: string;
    userId?: string;
    facultyId?: string;
    campusUserId?: string;
    email?: string;
    role?: string;
    isFaculty?: boolean;
  };

/* =========================================================
   ERROR RESPONSE
========================================================= */

function jsonError(
  message: string,
  status: number
) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    {
      status,
      headers:
        CACHE_HEADERS,
    },
  );
}

/* =========================================================
   TOKEN
========================================================= */

function getRequestToken(
  request: NextRequest
) {
  /* -------------------------------------------------------
     BEARER
  ------------------------------------------------------- */

  const authorization =
    request.headers.get(
      "authorization"
    ) || "";

  if (
    authorization
      .toLowerCase()
      .startsWith("bearer ")
  ) {
    const bearerToken =
      authorization
        .slice(7)
        .trim();

    if (bearerToken) {
      return bearerToken;
    }
  }

  /* -------------------------------------------------------
     FACULTY COOKIE
  ------------------------------------------------------- */

  const facultyToken =
    request.cookies.get(
      "facultyToken"
    )?.value || "";

  if (facultyToken) {
    return facultyToken;
  }

  /* -------------------------------------------------------
     NORMAL CAMPUSCONNECT TOKEN

     Faculty login currently uses this cookie.
  ------------------------------------------------------- */

  const token =
    request.cookies.get(
      "token"
    )?.value || "";

  if (token) {
    return token;
  }

  return "";
}

/* =========================================================
   FACULTY AUTH
========================================================= */

function getFacultyAuth(
  request: NextRequest
) {
  const token =
    getRequestToken(
      request
    );

  if (!token) {
    return {
      ok: false,
      status: 401,
      message:
        "Unauthorized. Faculty session not found.",
    } as const;
  }

  const secret =
    process.env.JWT_SECRET;

  if (!secret) {
    console.error(
      "FACULTY ACTIVITIES: JWT_SECRET is missing."
    );

    return {
      ok: false,
      status: 500,
      message:
        "JWT_SECRET is not configured.",
    } as const;
  }

  try {
    const decoded =
      jwt.verify(
        token,
        secret
      ) as TokenPayload;

    const normalizedRole =
      String(
        decoded.role || ""
      )
        .trim()
        .replace(/[\s-]+/g, "_")
        .toUpperCase();

    /*
      Accept the normal enum value plus the common
      faculty role forms used by older CampusConnect
      login payloads.
    */

    const roleIsFaculty =
      normalizedRole ===
        "FACULTY" ||
      normalizedRole ===
        "FACULTY_MEMBER" ||
      decoded.isFaculty ===
        true;

    if (!roleIsFaculty) {
      console.error(
        "FACULTY ACTIVITIES ROLE CHECK FAILED:",
        {
          role:
            decoded.role,
          normalizedRole,
          id:
            decoded.id,
          userId:
            decoded.userId,
          facultyId:
            decoded.facultyId,
          email:
            decoded.email,
        }
      );

      return {
        ok: false,
        status: 403,
        message:
          "Faculty access is required.",
      } as const;
    }

    return {
      ok: true,
      decoded,
    } as const;
  } catch (error) {
    console.error(
      "FACULTY ACTIVITIES JWT VERIFY ERROR:",
      error
    );

    return {
      ok: false,
      status: 401,
      message:
        "Invalid or expired faculty session.",
    } as const;
  }
}

/* =========================================================
   DATE
========================================================= */

function parseActivityDate(
  value: unknown
) {
  const dateString =
    String(
      value ?? ""
    ).trim();

  if (!dateString) {
    return null;
  }

  const date =
    new Date(
      dateString
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
}

/* =========================================================
   GET
========================================================= */

export async function GET(
  request: NextRequest
) {
  const auth =
    getFacultyAuth(
      request
    );

  if (!auth.ok) {
    return jsonError(
      auth.message,
      auth.status
    );
  }

  const id =
    request.nextUrl
      .searchParams
      .get("id")
      ?.trim();

  try {

    /* -----------------------------------------------------
       SINGLE ACTIVITY
    ----------------------------------------------------- */

    if (id) {
      const activity =
        await prisma.activity.findUnique(
          {
            where: {
              id,
            },
          }
        );

      if (!activity) {
        return jsonError(
          "Activity not found.",
          404
        );
      }

      return NextResponse.json(
        {
          success:
            true,
          activity,
        },
        {
          status: 200,
          headers:
            CACHE_HEADERS,
        }
      );
    }

    /* -----------------------------------------------------
       ALL ACTIVITIES
    ----------------------------------------------------- */

    const activities =
      await prisma.activity.findMany(
        {
          orderBy: {
            activityDate:
              "asc",
          },
        }
      );

    return NextResponse.json(
      {
        success:
          true,
        activities,
        count:
          activities.length,
      },
      {
        status: 200,
        headers:
          CACHE_HEADERS,
      }
    );

  } catch (error) {

    console.error(
      "GET FACULTY ACTIVITIES ERROR:",
      error
    );

    return jsonError(
      "Failed to fetch activities.",
      500
    );
  }
}

/* =========================================================
   POST
========================================================= */

export async function POST(
  request: NextRequest
) {
  const auth =
    getFacultyAuth(
      request
    );

  if (!auth.ok) {
    return jsonError(
      auth.message,
      auth.status
    );
  }

  try {

    const body =
      await request.json();

    const title =
      String(
        body?.title || ""
      ).trim();

    const description =
      String(
        body?.description ||
          ""
      ).trim();

    const venue =
      String(
        body?.venue || ""
      ).trim();

    const activityDate =
      parseActivityDate(
        body?.activityDate
      );

    /* -----------------------------------------------------
       VALIDATION
    ----------------------------------------------------- */

    if (!title) {
      return jsonError(
        "Activity title is required.",
        400
      );
    }

    if (!description) {
      return jsonError(
        "Activity description is required.",
        400
      );
    }

    if (!venue) {
      return jsonError(
        "Activity venue is required.",
        400
      );
    }

    if (!activityDate) {
      return jsonError(
        "A valid activity date and time are required.",
        400
      );
    }

    /* -----------------------------------------------------
       CREATE

       SAME Activity table used by Admin + Student.
    ----------------------------------------------------- */

    const activity =
      await prisma.activity.create(
        {
          data: {
            title,
            description,
            venue,
            activityDate,
          },
        }
      );

    return NextResponse.json(
      {
        success:
          true,
        message:
          "Activity created successfully.",
        activity,
      },
      {
        status: 201,
        headers:
          CACHE_HEADERS,
      }
    );

  } catch (error) {

    console.error(
      "CREATE FACULTY ACTIVITY ERROR:",
      error
    );

    return jsonError(
      "Failed to create activity.",
      500
    );
  }
}

/* =========================================================
   PUT
========================================================= */

export async function PUT(
  request: NextRequest
) {
  const auth =
    getFacultyAuth(
      request
    );

  if (!auth.ok) {
    return jsonError(
      auth.message,
      auth.status
    );
  }

  const id =
    request.nextUrl
      .searchParams
      .get("id")
      ?.trim();

  if (!id) {
    return jsonError(
      "Activity id is required.",
      400
    );
  }

  try {

    const body =
      await request.json();

    const title =
      String(
        body?.title || ""
      ).trim();

    const description =
      String(
        body?.description ||
          ""
      ).trim();

    const venue =
      String(
        body?.venue || ""
      ).trim();

    const activityDate =
      parseActivityDate(
        body?.activityDate
      );

    /* -----------------------------------------------------
       VALIDATION
    ----------------------------------------------------- */

    if (!title) {
      return jsonError(
        "Activity title is required.",
        400
      );
    }

    if (!description) {
      return jsonError(
        "Activity description is required.",
        400
      );
    }

    if (!venue) {
      return jsonError(
        "Activity venue is required.",
        400
      );
    }

    if (!activityDate) {
      return jsonError(
        "A valid activity date and time are required.",
        400
      );
    }

    /* -----------------------------------------------------
       EXISTING ACTIVITY
    ----------------------------------------------------- */

    const existingActivity =
      await prisma.activity.findUnique(
        {
          where: {
            id,
          },
          select: {
            id: true,
          },
        }
      );

    if (!existingActivity) {
      return jsonError(
        "Activity not found.",
        404
      );
    }

    /* -----------------------------------------------------
       UPDATE
    ----------------------------------------------------- */

    const activity =
      await prisma.activity.update(
        {
          where: {
            id,
          },
          data: {
            title,
            description,
            venue,
            activityDate,
          },
        }
      );

    return NextResponse.json(
      {
        success:
          true,
        message:
          "Activity updated successfully.",
        activity,
      },
      {
        status: 200,
        headers:
          CACHE_HEADERS,
      }
    );

  } catch (error) {

    console.error(
      "UPDATE FACULTY ACTIVITY ERROR:",
      error
    );

    return jsonError(
      "Failed to update activity.",
      500
    );
  }
}

/* =========================================================
   DELETE
========================================================= */

export async function DELETE(
  request: NextRequest
) {
  const auth =
    getFacultyAuth(
      request
    );

  if (!auth.ok) {
    return jsonError(
      auth.message,
      auth.status
    );
  }

  const id =
    request.nextUrl
      .searchParams
      .get("id")
      ?.trim();

  if (!id) {
    return jsonError(
      "Activity id is required.",
      400
    );
  }

  try {

    /* -----------------------------------------------------
       FIND
    ----------------------------------------------------- */

    const existingActivity =
      await prisma.activity.findUnique(
        {
          where: {
            id,
          },
          select: {
            id: true,
            title: true,
          },
        }
      );

    if (!existingActivity) {
      return jsonError(
        "Activity not found.",
        404
      );
    }

    /* -----------------------------------------------------
       DELETE
    ----------------------------------------------------- */

    await prisma.activity.delete(
      {
        where: {
          id,
        },
      }
    );

    return NextResponse.json(
      {
        success:
          true,
        message:
          `Activity "${existingActivity.title}" deleted successfully.`,
      },
      {
        status: 200,
        headers:
          CACHE_HEADERS,
      }
    );

  } catch (error) {

    console.error(
      "DELETE FACULTY ACTIVITY ERROR:",
      error
    );

    return jsonError(
      "Failed to delete activity.",
      500
    );
  }
}