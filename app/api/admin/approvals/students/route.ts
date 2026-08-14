import { NextResponse } from "next/server"; 
import { prisma } from "@/lib/prisma"; 
import { sendStudentApprovalEmail } from "@/lib/mail"; 
 
interface ApprovalRequestBody { 
  userId?: string; 
  action?: "APPROVE" | "REJECT"; 
  rejectionReason?: string; 
} 
 
export async function GET() { 
  try { 
    const students = await prisma.user.findMany({ 
      where: { 
        role: "STUDENT", 
      }, 
      orderBy: { 
        createdAt: "desc", 
      }, 
      select: { 
        id: true, 
        campusUserId: true,
        name: true, 
        email: true, 
        profileImage: true, 
        role: true, 
        createdAt: true, 
        approvalStatus: true, 
        approvedAt: true, 
        rejectionReason: true, 
      }, 
    }); 
 
    const pending = students.filter( 
      (student) => student.approvalStatus === "PENDING" 
    ); 
 
    const approved = students.filter( 
      (student) => student.approvalStatus === "APPROVED" 
    ); 
 
    const rejected = students.filter( 
      (student) => student.approvalStatus === "REJECTED" 
    ); 
 
    return NextResponse.json({ 
      success: true, 
      students, 
      stats: { 
        pending: pending.length, 
        approved: approved.length, 
        rejected: rejected.length, 
        total: students.length, 
      }, 
    }); 
  } catch (error) { 
    console.error("STUDENT APPROVAL GET ERROR:", error); 
 
    return NextResponse.json( 
      { 
        success: false, 
        message: "Unable to load student approval requests.", 
      }, 
      { 
        status: 500, 
      } 
    ); 
  } 
} 
 
export async function POST(request: Request) { 
  try { 
    const body = (await request.json()) as ApprovalRequestBody; 
 
    const userId = body.userId; 
    const action = body.action; 
    const rejectionReason = body.rejectionReason?.trim(); 
 
    if (!userId) { 
      return NextResponse.json( 
        { 
          success: false, 
          message: "User ID is required.", 
        }, 
        { 
          status: 400, 
        } 
      ); 
    } 
 
    if (action !== "APPROVE" && action !== "REJECT") { 
      return NextResponse.json( 
        { 
          success: false, 
          message: "Invalid approval action.", 
        }, 
        { 
          status: 400, 
        } 
      ); 
    } 
 
    if (action === "REJECT" && !rejectionReason) { 
      return NextResponse.json( 
        { 
          success: false, 
          message: "Rejection reason is required.", 
        }, 
        { 
          status: 400 
        } 
      ); 
    } 
 
    const existingStudent = await prisma.user.findUnique({ 
      where: { 
        id: userId, 
      }, 
      select: { 
        id: true, 
        campusUserId: true,
        name: true, 
        email: true, 
        role: true, 
        approvalStatus: true, 
      }, 
    }); 
 
    if (!existingStudent) { 
      return NextResponse.json( 
        { 
          success: false, 
          message: "Student not found.", 
        }, 
        { 
          status: 404, 
        } 
      ); 
    } 
 
    if (existingStudent.role !== "STUDENT") { 
      return NextResponse.json( 
        { 
          success: false, 
          message: "Selected user is not a student.", 
        }, 
        { 
          status: 400, 
        } 
      ); 
    } 
 
    const updatedStudent = await prisma.user.update({ 
      where: { 
        id: userId, 
      }, 
      data: { 
        approvalStatus: 
          action === "APPROVE" ? "APPROVED" : "REJECTED", 
 
        approvedAt: 
          action === "APPROVE" ? new Date() : null, 
 
        rejectionReason: 
          action === "REJECT" 
            ? rejectionReason 
            : null, 
      }, 
      select: { 
        id: true, 
        campusUserId: true,
        name: true, 
        email: true, 
        profileImage: true, 
        role: true, 
        createdAt: true, 
        approvalStatus: true, 
        approvedAt: true, 
        rejectionReason: true, 
      }, 
    }); 
 
    // --------------------------------------------------------- 
    // SEND CONFIRMATION EMAIL THROUGH GMAIL SMTP 
    // --------------------------------------------------------- 
 
    let emailSent = false; 
 
    try { 
      await sendStudentApprovalEmail({ 
        name: updatedStudent.name, 
        email: updatedStudent.email, 
        userId: updatedStudent.campusUserId!, 
        approved: action === "APPROVE", 
        rejectionReason: updatedStudent.rejectionReason, 
      }); 
 
      emailSent = true; 
 
      console.log( 
        `STUDENT ${action} EMAIL SENT: ${updatedStudent.email}` 
      ); 
    } catch (emailError) { 
      // Database approval should remain successful 
      // even if the email temporarily fails. 
      console.error( 
        "STUDENT APPROVAL EMAIL ERROR:", 
        emailError 
      ); 
    } 
 
    return NextResponse.json({ 
      success: true, 
 
      message: 
        action === "APPROVE" 
          ? "Student approved successfully." 
          : "Student rejected successfully.", 
 
      emailSent, 
 
      student: updatedStudent, 
    }); 
  } catch (error) { 
    console.error("STUDENT APPROVAL POST ERROR:", error); 
 
    return NextResponse.json( 
      { 
        success: false, 
        message: "Unable to update student approval.", 
      }, 
      { 
        status: 500, 
      } 
    ); 
  } 
}