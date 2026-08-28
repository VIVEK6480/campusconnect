import nodemailer from "nodemailer";

// ======================================================
// SMTP TRANSPORTER
// ======================================================

const transporter = nodemailer.createTransport({
  host: process.env.STUDENT_SMTP_HOST,
  port: Number(process.env.STUDENT_SMTP_PORT || 465),
  secure: true,
  auth: {
    user: process.env.STUDENT_SMTP_USER,
    pass: process.env.STUDENT_SMTP_PASSWORD,
  },
});

// ======================================================
// TYPE
// ======================================================

type FacultyApprovalEmailProps = {
  name: string;
  email: string;
  phone?: string | null;
  department?: string | null;

  // Faculty ID generated after approval
  userId: string;

  approved: boolean;

  rejectionReason?: string | null;

  // Optional academic assignment details
  semester?: number | string | null;
  section?: string | null;
  subjects?: string[] | null;
};

// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ======================================================
// SUBJECT HTML
// ======================================================

function createSubjectsHtml(
  subjects?: string[] | null
): string {
  if (!subjects || subjects.length === 0) {
    return `
      <p
        style="
          margin:7px 0;
          color:#64748b;
          font-size:14px;
        "
      >
        <strong>Subjects:</strong>
        Not Assigned
      </p>
    `;
  }

  const subjectList = subjects
    .map(
      (subject) => `
        <li
          style="
            margin:6px 0;
            color:#475569;
            font-size:14px;
          "
        >
          ${escapeHtml(subject)}
        </li>
      `
    )
    .join("");

  return `
    <div style="margin-top:10px;">
      <p
        style="
          margin:7px 0;
          color:#475569;
          font-size:14px;
        "
      >
        <strong>Subjects:</strong>
      </p>

      <ul
        style="
          margin:8px 0 0;
          padding-left:22px;
        "
      >
        ${subjectList}
      </ul>
    </div>
  `;
}

// ======================================================
// SEND FACULTY APPROVAL EMAIL
// ======================================================

export async function sendFacultyApprovalEmail({
  name,
  email,
  phone,
  department,
  userId,
  approved,
  rejectionReason,
  semester,
  section,
  subjects,
}: FacultyApprovalEmailProps) {
  // ====================================================
  // SAFE VALUES
  // ====================================================

  const safeName = escapeHtml(
    name || "Faculty Member"
  );

  const safeEmail = escapeHtml(
    email || ""
  );

  const safePhone = escapeHtml(
    phone || "Not provided"
  );

  const safeDepartment = escapeHtml(
    department || "Not provided"
  );

  const safeUserId = escapeHtml(
    userId || "Not assigned"
  );

  const safeSemester =
    semester !== null &&
    semester !== undefined &&
    String(semester).trim() !== ""
      ? escapeHtml(String(semester))
      : "Not Assigned";

  const safeSection =
    section &&
    section.trim().length > 0
      ? escapeHtml(section)
      : "Not Assigned";

  const safeReason =
    rejectionReason &&
    rejectionReason.trim().length > 0
      ? escapeHtml(rejectionReason)
      : "";

  const subjectsHtml =
    createSubjectsHtml(subjects);

  // ====================================================
  // APPROVED EMAIL
  // ====================================================

  if (approved) {
    const subject =
      "CampusConnect - Faculty Account Approved";

    const html = `
<!DOCTYPE html>
<html>

<head>
  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>Faculty Account Approved</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#eef4f8;
    font-family:Arial,Helvetica,sans-serif;
    color:#172033;
  "
>

  <div
    style="
      width:100%;
      padding:45px 15px;
      box-sizing:border-box;
    "
  >

    <div
      style="
        max-width:650px;
        margin:0 auto;
        background:#ffffff;
        border-radius:20px;
        overflow:hidden;
        box-shadow:0 12px 40px rgba(15,23,42,0.12);
      "
    >

      <!-- HEADER -->

      <div
        style="
          background:linear-gradient(
            135deg,
            #0891b2,
            #0284c7
          );
          padding:32px 35px;
          text-align:center;
        "
      >

        <div
          style="
            width:64px;
            height:64px;
            margin:0 auto 14px;
            border-radius:18px;
            background:rgba(255,255,255,0.18);
            line-height:64px;
            font-size:30px;
          "
        >
          🎓
        </div>

        <h1
          style="
            margin:0;
            color:#ffffff;
            font-size:25px;
          "
        >
          CampusConnect
        </h1>

        <p
          style="
            margin:8px 0 0;
            color:rgba(255,255,255,0.85);
            font-size:13px;
          "
        >
          Smart Campus Management
        </p>

      </div>

      <!-- CONTENT -->

      <div style="padding:35px;">

        <!-- APPROVED BADGE -->

        <div
          style="
            text-align:center;
            margin-bottom:28px;
          "
        >

          <div
            style="
              display:inline-block;
              padding:8px 15px;
              border-radius:30px;
              background:#dcfce7;
              color:#15803d;
              font-size:12px;
              font-weight:bold;
            "
          >
            ✓ ACCOUNT APPROVED
          </div>

          <h2
            style="
              margin:18px 0 8px;
              font-size:26px;
              color:#111827;
            "
          >
            Faculty Account Approved
          </h2>

          <p
            style="
              margin:0;
              color:#64748b;
              font-size:14px;
              line-height:1.7;
            "
          >
            Hello <strong>${safeName}</strong>,
            your CampusConnect faculty registration
            has been approved by the administration.
          </p>

        </div>

        <!-- SUCCESS MESSAGE -->

        <div
          style="
            background:#ecfdf5;
            border:1px solid #bbf7d0;
            border-radius:14px;
            padding:18px;
            margin-bottom:25px;
          "
        >

          <p
            style="
              margin:0;
              color:#166534;
              font-size:14px;
              line-height:1.7;
            "
          >
            Congratulations! Your faculty account has
            been successfully approved. Your Faculty User
            ID is now active and you can use your registered
            credentials to access the CampusConnect Faculty Portal.
          </p>

        </div>

        <!-- ACCOUNT DETAILS -->

        <h3
          style="
            margin:0 0 14px;
            color:#111827;
            font-size:16px;
          "
        >
          Faculty Account Details
        </h3>

        <div
          style="
            border:1px solid #e2e8f0;
            border-radius:15px;
            overflow:hidden;
            margin-bottom:25px;
          "
        >

          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            style="
              border-collapse:collapse;
              font-size:14px;
            "
          >

            <tr>

              <td
                style="
                  padding:13px 16px;
                  background:#f8fafc;
                  color:#64748b;
                  width:42%;
                  border-bottom:1px solid #e2e8f0;
                "
              >
                Faculty User ID
              </td>

              <td
                style="
                  padding:13px 16px;
                  font-weight:bold;
                  color:#0284c7;
                  border-bottom:1px solid #e2e8f0;
                "
              >
                ${safeUserId}
              </td>

            </tr>

            <tr>

              <td
                style="
                  padding:13px 16px;
                  background:#f8fafc;
                  color:#64748b;
                  border-bottom:1px solid #e2e8f0;
                "
              >
                Full Name
              </td>

              <td
                style="
                  padding:13px 16px;
                  color:#1e293b;
                  border-bottom:1px solid #e2e8f0;
                "
              >
                ${safeName}
              </td>

            </tr>

            <tr>

              <td
                style="
                  padding:13px 16px;
                  background:#f8fafc;
                  color:#64748b;
                  border-bottom:1px solid #e2e8f0;
                "
              >
                Email
              </td>

              <td
                style="
                  padding:13px 16px;
                  color:#1e293b;
                  border-bottom:1px solid #e2e8f0;
                "
              >
                ${safeEmail}
              </td>

            </tr>

            <tr>

              <td
                style="
                  padding:13px 16px;
                  background:#f8fafc;
                  color:#64748b;
                  border-bottom:1px solid #e2e8f0;
                "
              >
                Phone
              </td>

              <td
                style="
                  padding:13px 16px;
                  color:#1e293b;
                  border-bottom:1px solid #e2e8f0;
                "
              >
                ${safePhone}
              </td>

            </tr>

            <tr>

              <td
                style="
                  padding:13px 16px;
                  background:#f8fafc;
                  color:#64748b;
                  border-bottom:1px solid #e2e8f0;
                "
              >
                Department
              </td>

              <td
                style="
                  padding:13px 16px;
                  color:#1e293b;
                  border-bottom:1px solid #e2e8f0;
                "
              >
                ${safeDepartment}
              </td>

            </tr>

            <tr>

              <td
                style="
                  padding:13px 16px;
                  background:#f8fafc;
                  color:#64748b;
                  border-bottom:1px solid #e2e8f0;
                "
              >
                Role
              </td>

              <td
                style="
                  padding:13px 16px;
                  color:#1e293b;
                  border-bottom:1px solid #e2e8f0;
                "
              >
                Faculty
              </td>

            </tr>

            <tr>

              <td
                style="
                  padding:13px 16px;
                  background:#f8fafc;
                  color:#64748b;
                "
              >
                Account Status
              </td>

              <td
                style="
                  padding:13px 16px;
                  color:#16a34a;
                  font-weight:bold;
                "
              >
                APPROVED
              </td>

            </tr>

          </table>

        </div>

        <!-- ACADEMIC ASSIGNMENT -->

        <h3
          style="
            margin:0 0 14px;
            color:#111827;
            font-size:16px;
          "
        >
          Academic Assignment
        </h3>

        <div
          style="
            background:#f8fafc;
            border:1px solid #e2e8f0;
            border-radius:15px;
            padding:18px;
            margin-bottom:25px;
          "
        >

          <p
            style="
              margin:7px 0;
              color:#475569;
              font-size:14px;
            "
          >
            <strong>Semester:</strong>
            ${safeSemester}
          </p>

          <p
            style="
              margin:7px 0;
              color:#475569;
              font-size:14px;
            "
          >
            <strong>Class / Section:</strong>
            ${safeSection}
          </p>

          ${subjectsHtml}

          ${
            (!subjects ||
              subjects.length === 0) &&
            (!semester ||
              semester === null ||
              semester === undefined)
              ? `
                <p
                  style="
                    margin:14px 0 0;
                    color:#64748b;
                    font-size:12px;
                    line-height:1.6;
                  "
                >
                  Academic classes and subjects have not
                  been assigned yet. They can be assigned
                  separately by the administration.
                </p>
              `
              : ""
          }

        </div>

        <!-- PORTAL ACCESS -->

        <div
          style="
            background:#eff6ff;
            border:1px solid #bfdbfe;
            border-radius:15px;
            padding:20px;
            margin-bottom:25px;
          "
        >

          <h3
            style="
              margin:0 0 10px;
              color:#1e40af;
              font-size:16px;
            "
          >
            Faculty Portal Access
          </h3>

          <p
            style="
              margin:0;
              color:#475569;
              font-size:14px;
              line-height:1.7;
            "
          >
            You can now log in to the CampusConnect
            Faculty Portal using your registered email
            address and password.
          </p>

        </div>

        <p
          style="
            margin:0;
            color:#64748b;
            font-size:14px;
            line-height:1.7;
          "
        >
          Welcome to CampusConnect. We look forward
          to having you as part of the campus community.
        </p>

      </div>

      <!-- FOOTER -->

      <div
        style="
          border-top:1px solid #e2e8f0;
          padding:20px 35px;
          text-align:center;
          background:#f8fafc;
        "
      >

        <p
          style="
            margin:0;
            color:#94a3b8;
            font-size:12px;
          "
        >
          This is an automated email from CampusConnect.
        </p>

        <p
          style="
            margin:6px 0 0;
            color:#cbd5e1;
            font-size:11px;
          "
        >
          Please do not reply to this email.
        </p>

      </div>

    </div>

  </div>

</body>

</html>
`;

    await transporter.sendMail({
      from:
        process.env.STUDENT_SMTP_FROM ||
        process.env.STUDENT_SMTP_USER,

      to: email,

      subject,

      html,
    });

    return;
  }

  // ====================================================
  // REJECTED EMAIL
  // ====================================================

  const subject =
    "CampusConnect - Faculty Account Rejected";

  const html = `
<!DOCTYPE html>
<html>

<head>

  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>Faculty Registration Update</title>

</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f1f5f9;
    font-family:Arial,Helvetica,sans-serif;
    color:#172033;
  "
>

  <div
    style="
      width:100%;
      padding:45px 15px;
      box-sizing:border-box;
    "
  >

    <div
      style="
        max-width:650px;
        margin:0 auto;
        background:#ffffff;
        border-radius:20px;
        overflow:hidden;
        box-shadow:0 12px 40px rgba(15,23,42,0.12);
      "
    >

      <!-- HEADER -->

      <div
        style="
          background:linear-gradient(
            135deg,
            #475569,
            #334155
          );
          padding:32px 35px;
          text-align:center;
        "
      >

        <div
          style="
            width:64px;
            height:64px;
            margin:0 auto 14px;
            border-radius:18px;
            background:rgba(255,255,255,0.15);
            line-height:64px;
            font-size:30px;
          "
        >
          🎓
        </div>

        <h1
          style="
            margin:0;
            color:#ffffff;
            font-size:25px;
          "
        >
          CampusConnect
        </h1>

        <p
          style="
            margin:8px 0 0;
            color:rgba(255,255,255,0.85);
            font-size:13px;
          "
        >
          Faculty Portal
        </p>

      </div>

      <!-- CONTENT -->

      <div style="padding:35px;">

        <div
          style="
            text-align:center;
            margin-bottom:28px;
          "
        >

          <div
            style="
              display:inline-block;
              padding:8px 15px;
              border-radius:30px;
              background:#fee2e2;
              color:#b91c1c;
              font-size:12px;
              font-weight:bold;
            "
          >
            REGISTRATION UPDATE
          </div>

          <h2
            style="
              margin:18px 0 8px;
              color:#111827;
              font-size:26px;
            "
          >
            Faculty Registration Not Approved
          </h2>

          <p
            style="
              margin:0;
              color:#64748b;
              font-size:14px;
              line-height:1.7;
            "
          >
            Hello <strong>${safeName}</strong>,
            your faculty registration request
            was not approved by the administration.
          </p>

        </div>

        <!-- DETAILS -->

        <div
          style="
            background:#fef2f2;
            border:1px solid #fecaca;
            border-radius:15px;
            padding:20px;
            margin-bottom:25px;
          "
        >

          <p
            style="
              margin:7px 0;
              font-size:14px;
              color:#475569;
            "
          >
            <strong>Name:</strong>
            ${safeName}
          </p>

          <p
            style="
              margin:7px 0;
              font-size:14px;
              color:#475569;
            "
          >
            <strong>Email:</strong>
            ${safeEmail}
          </p>

          <p
            style="
              margin:7px 0;
              font-size:14px;
              color:#475569;
            "
          >
            <strong>Phone:</strong>
            ${safePhone}
          </p>

          <p
            style="
              margin:7px 0;
              font-size:14px;
              color:#475569;
            "
          >
            <strong>Department:</strong>
            ${safeDepartment}
          </p>

          <p
            style="
              margin:7px 0;
              font-size:14px;
              color:#dc2626;
            "
          >
            <strong>Status:</strong>
            REJECTED
          </p>

        </div>

        ${
          safeReason
            ? `
              <div
                style="
                  background:#fff7ed;
                  border:1px solid #fed7aa;
                  border-radius:15px;
                  padding:20px;
                  margin-bottom:25px;
                "
              >

                <h3
                  style="
                    margin:0 0 9px;
                    color:#9a3412;
                    font-size:16px;
                  "
                >
                  Reason for Rejection
                </h3>

                <p
                  style="
                    margin:0;
                    color:#7c2d12;
                    font-size:14px;
                    line-height:1.7;
                  "
                >
                  ${safeReason}
                </p>

              </div>
            `
            : ""
        }

        <p
          style="
            margin:0;
            color:#64748b;
            font-size:14px;
            line-height:1.7;
          "
        >
          If you believe this decision was made in error,
          please contact the CampusConnect administration
          for further assistance.
        </p>

      </div>

      <!-- FOOTER -->

      <div
        style="
          border-top:1px solid #e2e8f0;
          padding:20px 35px;
          text-align:center;
          background:#f8fafc;
        "
      >

        <p
          style="
            margin:0;
            color:#94a3b8;
            font-size:12px;
          "
        >
          This is an automated email from CampusConnect.
        </p>

        <p
          style="
            margin:6px 0 0;
            color:#cbd5e1;
            font-size:11px;
          "
        >
          Please do not reply to this email.
        </p>

      </div>

    </div>

  </div>

</body>

</html>
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