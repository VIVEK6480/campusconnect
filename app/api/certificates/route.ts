import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ==============================
// GET ALL CERTIFICATES
// ==============================
export async function GET() {
  try {
    const certificates = await prisma.certificate.findMany({
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        certificates,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET CERTIFICATES ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch certificates",
      },
      { status: 500 }
    );
  }
}

// ==============================
// CREATE CERTIFICATE
// ==============================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { title, fileUrl, userId } = body;

    if (!title || !fileUrl || !userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Title, File URL and User ID are required",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    const certificate = await prisma.certificate.create({
      data: {
        title,
        fileUrl,
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Certificate created successfully",
        certificate,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE CERTIFICATE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}