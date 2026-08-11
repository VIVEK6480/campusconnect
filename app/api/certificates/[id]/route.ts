import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =========================================
// GET SINGLE CERTIFICATE
// =========================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const certificate = await prisma.certificate.findUnique({
      where: {
        id: decodeURIComponent(id).trim(),
      },
      include: {
        user: true,
      },
    });

    if (!certificate) {
      return NextResponse.json(
        {
          success: false,
          message: "Certificate not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        certificate,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET CERTIFICATE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}

// =========================================
// UPDATE CERTIFICATE
// =========================================
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await req.json();

    const { title, fileUrl } = body;

    const updatedCertificate = await prisma.certificate.update({
      where: {
        id: decodeURIComponent(id).trim(),
      },
      data: {
        ...(title && { title }),
        ...(fileUrl && { fileUrl }),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Certificate updated successfully",
        certificate: updatedCertificate,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("UPDATE CERTIFICATE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update certificate",
      },
      { status: 500 }
    );
  }
}

// =========================================
// DELETE CERTIFICATE
// =========================================
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.certificate.delete({
      where: {
        id: decodeURIComponent(id).trim(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Certificate deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE CERTIFICATE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete certificate",
      },
      { status: 500 }
    );
  }
}