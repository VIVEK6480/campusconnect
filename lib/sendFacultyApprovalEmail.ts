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

          <p style="color:#4b5563;font-size:15px;">
            Hello <strong>${name}</strong>,
          </p>

          <p style="color:#4b5563;font-size:15px;line-height:1.6;">
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

          <p style="color:#4b5563;font-size:15px;line-height:1.6;">
            Your faculty account is now active.
            You can use your registered email and password
            to log in to CampusConnect.
          </p>

          <p style="margin-top:30px;color:#6b7280;font-size:13px;">
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

          <p style="color:#4b5563;font-size:15px;">
            Hello <strong>${name}</strong>,
          </p>

          <p style="color:#4b5563;font-size:15px;line-height:1.6;">
            Your faculty registration request was not approved
            by the CampusConnect administration.
          </p>

          <div style="background:#fef2f2;border-radius:12px;padding:20px;margin:24px 0;">

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
                ? `
                  <p>
                    <strong>Reason:</strong> ${rejectionReason}
                  </p>
                `
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