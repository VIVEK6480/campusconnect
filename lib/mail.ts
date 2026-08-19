import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.STUDENT_SMTP_HOST,
  port: Number(process.env.STUDENT_SMTP_PORT || 465),
  secure: true,
  auth: {
    user: process.env.STUDENT_SMTP_USER,
    pass: process.env.STUDENT_SMTP_PASSWORD,
  },
});

type StudentApprovalEmailProps = {
  name: string;
  email: string;
  userId: string;
  approved: boolean;
  rejectionReason?: string | null;
};

export async function sendStudentApprovalEmail({
  name,
  email,
  userId,
  approved,
  rejectionReason,
}: StudentApprovalEmailProps) {
  const subject = approved
    ? "CampusConnect - Student Account Approved"
    : "CampusConnect - Student Account Rejected";

  const html = approved
    ? `
      <div style="font-family: Arial, sans-serif; background:#f4f7fb; padding:40px;">
        <div style="max-width:600px; margin:auto; background:white; border-radius:16px; padding:32px;">

          <h2 style="color:#2563eb; margin-bottom:8px;">
            CampusConnect
          </h2>

          <h1 style="color:#111827;">
            Student Account Approved
          </h1>

          <p style="color:#4b5563; font-size:15px;">
            Hello <strong>${name}</strong>,
          </p>

          <p style="color:#4b5563; font-size:15px; line-height:1.6;">
            Your student registration request has been approved by
            the CampusConnect administration.
          </p>

          <div style="background:#eff6ff; border-radius:12px; padding:20px; margin:24px 0;">
            <p style="margin:8px 0;">
              <strong>User ID:</strong> ${userId}
            </p>

            <p style="margin:8px 0;">
              <strong>Email:</strong> ${email}
            </p>

            <p style="margin:8px 0;">
              <strong>Status:</strong>
              <span style="color:#16a34a; font-weight:bold;">
                APPROVED
              </span>
            </p>
          </div>

          <p style="color:#4b5563; font-size:15px; line-height:1.6;">
            You can now log in to your CampusConnect student account
            using your registered credentials.
          </p>

          <p style="margin-top:30px; color:#6b7280; font-size:13px;">
            This is an automated email from CampusConnect.
            Please do not reply to this email.
          </p>

        </div>
      </div>
    `
    : `
      <div style="font-family: Arial, sans-serif; background:#f4f7fb; padding:40px;">
        <div style="max-width:600px; margin:auto; background:white; border-radius:16px; padding:32px;">

          <h2 style="color:#2563eb; margin-bottom:8px;">
            CampusConnect
          </h2>

          <h1 style="color:#111827;">
            Student Registration Update
          </h1>

          <p style="color:#4b5563; font-size:15px;">
            Hello <strong>${name}</strong>,
          </p>

          <p style="color:#4b5563; font-size:15px; line-height:1.6;">
            Your student registration request has not been approved
            by the CampusConnect administration.
          </p>

          <div style="background:#fef2f2; border-radius:12px; padding:20px; margin:24px 0;">

            <p style="margin:8px 0;">
              <strong>User ID:</strong> ${userId}
            </p>

            <p style="margin:8px 0;">
              <strong>Email:</strong> ${email}
            </p>

            <p style="margin:8px 0;">
              <strong>Status:</strong>
              <span style="color:#dc2626; font-weight:bold;">
                REJECTED
              </span>
            </p>

            ${
              rejectionReason
                ? `
                  <p style="margin:14px 0 0;">
                    <strong>Reason:</strong> ${rejectionReason}
                  </p>
                `
                : ""
            }

          </div>

          <p style="color:#6b7280; font-size:13px;">
            This is an automated email from CampusConnect.
            Please do not reply to this email.
          </p>

        </div>
      </div>
    `;

  await transporter.sendMail({
    from:
      process.env.STUDENT_SMTP_FROM ||
      process.env.STUDENT_SMTP_USER,
    to: email,
    subject,
    html,
  });
  
}
type FacultyApprovalEmailProps = {
  name: string;
  email: string;
  userId: string;
  approved: boolean;
  rejectionReason?: string | null;
};

export async function sendFacultyApprovalEmail({
  name,
  email,
  userId,
  approved,
  rejectionReason,
}: FacultyApprovalEmailProps) {
  const subject = approved
    ? "CampusConnect - Faculty Account Approved"
    : "CampusConnect - Faculty Account Rejected";

  const html = approved
    ? `
      <div style="font-family:Arial,sans-serif;background:#f4f7fb;padding:40px;">
        <div style="max-width:600px;margin:auto;background:white;border-radius:16px;padding:32px;">

          <h2 style="color:#2563eb;">CampusConnect</h2>

          <h1 style="color:#111827;">
            Faculty Account Approved
          </h1>

          <p style="color:#4b5563;">
            Hello <strong>${name}</strong>,
          </p>

          <p style="color:#4b5563;line-height:1.6;">
            Your faculty registration request has been approved
            by the CampusConnect administration.
          </p>

          <div style="background:#eff6ff;border-radius:12px;padding:20px;margin:24px 0;">

            <p>
              <strong>Faculty User ID:</strong> ${userId}
            </p>

            <p>
              <strong>Email:</strong> ${email}
            </p>

            <p>
              <strong>Status:</strong>
              <span style="color:#16a34a;font-weight:bold;">
                APPROVED
              </span>
            </p>

          </div>

          <p style="color:#4b5563;line-height:1.6;">
            You can now log in to your CampusConnect faculty account
            using your registered credentials.
          </p>

          <p style="color:#6b7280;font-size:13px;margin-top:30px;">
            This is an automated email from CampusConnect.
          </p>

        </div>
      </div>
    `
    : `
      <div style="font-family:Arial,sans-serif;background:#f4f7fb;padding:40px;">
        <div style="max-width:600px;margin:auto;background:white;border-radius:16px;padding:32px;">

          <h2 style="color:#2563eb;">CampusConnect</h2>

          <h1 style="color:#111827;">
            Faculty Registration Update
          </h1>

          <p style="color:#4b5563;">
            Hello <strong>${name}</strong>,
          </p>

          <p style="color:#4b5563;line-height:1.6;">
            Your faculty registration request has been rejected
            by the CampusConnect administration.
          </p>

          <div style="background:#fef2f2;border-radius:12px;padding:20px;margin:24px 0;">

            <p>
              <strong>Faculty User ID:</strong> ${userId}
            </p>

            <p>
              <strong>Email:</strong> ${email}
            </p>

            <p>
              <strong>Status:</strong>
              <span style="color:#dc2626;font-weight:bold;">
                REJECTED
              </span>
            </p>

            ${
              rejectionReason
                ? `<p><strong>Reason:</strong> ${rejectionReason}</p>`
                : ""
            }

          </div>

          <p style="color:#6b7280;font-size:13px;">
            This is an automated email from CampusConnect.
          </p>

        </div>
      </div>
    `;

  await transporter.sendMail({
    from:
      process.env.STUDENT_SMTP_FROM ||
      process.env.STUDENT_SMTP_USER,
    to: email,
    subject,
    html,
  });
}