import nodemailer from "nodemailer";

// ======================================================
// STUDENT / FACULTY SMTP TRANSPORTER
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
// STUDENT APPROVAL EMAIL PROPS
// ======================================================

type StudentApprovalEmailProps = {
  name: string;
  email: string;

  // Campus ID is generated after admin approval
  userId: string | null;

  approved: boolean;

  rejectionReason?: string | null;

  semester?: number | null;

  section?: string | null;

  subjects?: string[];
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
// SEND STUDENT APPROVAL / REJECTION EMAIL
// ======================================================

export async function sendStudentApprovalEmail({
  name,
  email,
  userId,
  approved,
  rejectionReason,
  semester,
  section,
  subjects = [],
}: StudentApprovalEmailProps) {
  // ====================================================
  // SAFE VALUES
  // ====================================================

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);

  const safeUserId = userId
    ? escapeHtml(userId)
    : "Not assigned";

  const safeSection = section
    ? escapeHtml(section)
    : "Not available";

  const safeRejectionReason =
    rejectionReason
      ? escapeHtml(rejectionReason)
      : "";

  // ====================================================
  // SUBJECT
  // ====================================================

  const subject = approved
    ? "CampusConnect - Student Account Approved"
    : "CampusConnect - Student Registration Update";

  // ====================================================
  // SEMESTER TEXT
  // ====================================================

  const semesterText =
    semester !== null &&
    semester !== undefined
      ? `Semester ${semester}`
      : "Not available";

  // ====================================================
  // SUBJECT LIST
  // ====================================================

  const subjectListHtml =
    subjects.length > 0
      ? `
        <div
          style="
            background:#f8fafc;
            border-radius:12px;
            padding:20px;
            margin:24px 0;
            border:1px solid #e5e7eb;
          "
        >

          <h3
            style="
              margin:0 0 14px;
              color:#111827;
              font-size:17px;
              font-family:Arial,sans-serif;
            "
          >
            Assigned Subjects
          </h3>

          <ol
            style="
              margin:0;
              padding-left:22px;
              color:#374151;
              line-height:1.8;
              font-family:Arial,sans-serif;
            "
          >

            ${subjects
              .map(
                (studentSubject) => `
                  <li>
                    ${escapeHtml(studentSubject)}
                  </li>
                `
              )
              .join("")}

          </ol>

        </div>
      `
      : `
        <div
          style="
            background:#f8fafc;
            border-radius:12px;
            padding:18px;
            margin:24px 0;
            border:1px solid #e5e7eb;
          "
        >

          <p
            style="
              margin:0;
              color:#6b7280;
              font-size:14px;
              font-family:Arial,sans-serif;
            "
          >
            No subject information was available.
          </p>

        </div>
      `;

  // ====================================================
  // APPROVED EMAIL
  // ====================================================

  const approvedHtml = `
    <!DOCTYPE html>

    <html>
      <head>
        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>
          CampusConnect - Student Account Approved
        </title>
      </head>

      <body
        style="
          margin:0;
          padding:0;
          background:#f4f7fb;
          font-family:Arial,sans-serif;
        "
      >

        <div
          style="
            background:#f4f7fb;
            padding:40px 20px;
          "
        >

          <div
            style="
              max-width:650px;
              margin:auto;
              background:white;
              border-radius:16px;
              padding:32px;
              box-shadow:0 4px 18px rgba(0,0,0,0.06);
            "
          >

            <!-- BRAND -->

            <h2
              style="
                color:#2563eb;
                margin:0 0 8px;
                font-size:24px;
              "
            >
              CampusConnect
            </h2>

            <!-- TITLE -->

            <h1
              style="
                color:#111827;
                margin:0 0 20px;
                font-size:28px;
              "
            >
              Student Account Approved
            </h1>

            <!-- GREETING -->

            <p
              style="
                color:#4b5563;
                font-size:15px;
                line-height:1.7;
              "
            >
              Hello
              <strong>${safeName}</strong>,
            </p>

            <!-- MESSAGE -->

            <p
              style="
                color:#4b5563;
                font-size:15px;
                line-height:1.7;
              "
            >
              Congratulations! Your CampusConnect student
              registration has been approved by the
              CampusConnect administration.
            </p>

            <!-- ACCOUNT DETAILS -->

            <div
              style="
                background:#eff6ff;
                border-radius:12px;
                padding:20px;
                margin:24px 0;
                border:1px solid #dbeafe;
              "
            >

              <h3
                style="
                  margin:0 0 16px;
                  color:#1e3a8a;
                  font-size:18px;
                "
              >
                Student Account Details
              </h3>

              <!-- CAMPUS ID -->

              <p
                style="
                  margin:9px 0;
                  color:#374151;
                  font-size:14px;
                "
              >
                <strong>
                  Campus User ID:
                </strong>

                ${safeUserId}
              </p>

              <!-- NAME -->

              <p
                style="
                  margin:9px 0;
                  color:#374151;
                  font-size:14px;
                "
              >
                <strong>
                  Name:
                </strong>

                ${safeName}
              </p>

              <!-- EMAIL -->

              <p
                style="
                  margin:9px 0;
                  color:#374151;
                  font-size:14px;
                "
              >
                <strong>
                  Email:
                </strong>

                ${safeEmail}
              </p>

              <!-- SEMESTER -->

              <p
                style="
                  margin:9px 0;
                  color:#374151;
                  font-size:14px;
                "
              >
                <strong>
                  Semester:
                </strong>

                ${semesterText}
              </p>

              <!-- SECTION -->

              <p
                style="
                  margin:9px 0;
                  color:#374151;
                  font-size:14px;
                "
              >
                <strong>
                  Class / Section:
                </strong>

                ${safeSection}
              </p>

              <!-- STATUS -->

              <p
                style="
                  margin:9px 0;
                  color:#374151;
                  font-size:14px;
                "
              >
                <strong>
                  Account Status:
                </strong>

                <span
                  style="
                    color:#16a34a;
                    font-weight:bold;
                  "
                >
                  APPROVED
                </span>
              </p>

            </div>

            <!-- SUBJECTS -->

            ${subjectListHtml}

            <!-- LOGIN MESSAGE -->

            <div
              style="
                background:#f0fdf4;
                border:1px solid #bbf7d0;
                border-radius:12px;
                padding:18px;
                margin:24px 0;
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
                <strong>
                  Your student account is now active.
                </strong>
                You can log in to the CampusConnect
                Student Portal using your registered
                email and password.
              </p>

            </div>

            <!-- IMPORTANT -->

            <p
              style="
                color:#4b5563;
                font-size:14px;
                line-height:1.7;
              "
            >
              Please keep your Campus User ID safe.
              You may need it for future CampusConnect
              student services.
            </p>

            <!-- FOOTER -->

            <p
              style="
                color:#6b7280;
                font-size:13px;
                line-height:1.6;
                margin-top:30px;
              "
            >
              This is an automated email from
              CampusConnect.
              Please do not reply to this email.
            </p>

          </div>

        </div>

      </body>
    </html>
  `;

  // ====================================================
  // REJECTED EMAIL
  // ====================================================

  const rejectedHtml = `
    <!DOCTYPE html>

    <html>
      <head>
        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>
          CampusConnect - Student Registration Update
        </title>
      </head>

      <body
        style="
          margin:0;
          padding:0;
          background:#f4f7fb;
          font-family:Arial,sans-serif;
        "
      >

        <div
          style="
            background:#f4f7fb;
            padding:40px 20px;
          "
        >

          <div
            style="
              max-width:650px;
              margin:auto;
              background:white;
              border-radius:16px;
              padding:32px;
              box-shadow:0 4px 18px rgba(0,0,0,0.06);
            "
          >

            <!-- BRAND -->

            <h2
              style="
                color:#2563eb;
                margin:0 0 8px;
                font-size:24px;
              "
            >
              CampusConnect
            </h2>

            <!-- TITLE -->

            <h1
              style="
                color:#111827;
                margin:0 0 20px;
                font-size:28px;
              "
            >
              Student Registration Update
            </h1>

            <!-- GREETING -->

            <p
              style="
                color:#4b5563;
                font-size:15px;
                line-height:1.7;
              "
            >
              Hello
              <strong>${safeName}</strong>,
            </p>

            <!-- MESSAGE -->

            <p
              style="
                color:#4b5563;
                font-size:15px;
                line-height:1.7;
              "
            >
              Your CampusConnect student registration
              request has been rejected by the
              CampusConnect administration.
            </p>

            <!-- REGISTRATION DETAILS -->

            <div
              style="
                background:#fef2f2;
                border-radius:12px;
                padding:20px;
                margin:24px 0;
                border:1px solid #fecaca;
              "
            >

              <h3
                style="
                  margin:0 0 16px;
                  color:#991b1b;
                  font-size:18px;
                "
              >
                Registration Details
              </h3>

              <!-- NAME -->

              <p
                style="
                  margin:9px 0;
                  color:#374151;
                  font-size:14px;
                "
              >
                <strong>
                  Name:
                </strong>

                ${safeName}
              </p>

              <!-- EMAIL -->

              <p
                style="
                  margin:9px 0;
                  color:#374151;
                  font-size:14px;
                "
              >
                <strong>
                  Email:
                </strong>

                ${safeEmail}
              </p>

              <!-- SEMESTER -->

              <p
                style="
                  margin:9px 0;
                  color:#374151;
                  font-size:14px;
                "
              >
                <strong>
                  Semester:
                </strong>

                ${semesterText}
              </p>

              <!-- SECTION -->

              <p
                style="
                  margin:9px 0;
                  color:#374151;
                  font-size:14px;
                "
              >
                <strong>
                  Class / Section:
                </strong>

                ${safeSection}
              </p>

              <!-- STATUS -->

              <p
                style="
                  margin:9px 0;
                  color:#374151;
                  font-size:14px;
                "
              >
                <strong>
                  Account Status:
                </strong>

                <span
                  style="
                    color:#dc2626;
                    font-weight:bold;
                  "
                >
                  REJECTED
                </span>
              </p>

              ${
                safeRejectionReason
                  ? `
                    <div
                      style="
                        margin-top:18px;
                        padding:14px;
                        background:#ffffff;
                        border-radius:8px;
                        border:1px solid #fecaca;
                      "
                    >

                      <p
                        style="
                          margin:0 0 7px;
                          color:#991b1b;
                          font-weight:bold;
                          font-size:14px;
                        "
                      >
                        Rejection Reason
                      </p>

                      <p
                        style="
                          margin:0;
                          color:#4b5563;
                          line-height:1.6;
                          font-size:14px;
                        "
                      >
                        ${safeRejectionReason}
                      </p>

                    </div>
                  `
                  : ""
              }

            </div>

            <!-- SUBJECTS -->

            ${subjectListHtml}

            <!-- MESSAGE -->

            <p
              style="
                color:#4b5563;
                font-size:14px;
                line-height:1.7;
              "
            >
              Please contact the CampusConnect
              administration if you require further
              information regarding your registration.
            </p>

            <!-- FOOTER -->

            <p
              style="
                color:#6b7280;
                font-size:13px;
                line-height:1.6;
                margin-top:30px;
              "
            >
              This is an automated email from
              CampusConnect.
              Please do not reply to this email.
            </p>

          </div>

        </div>

      </body>
    </html>
  `;

  // ====================================================
  // SELECT EMAIL TEMPLATE
  // ====================================================

  const html = approved
    ? approvedHtml
    : rejectedHtml;

  // ====================================================
  // SEND STUDENT EMAIL
  // ====================================================

  await transporter.sendMail({
    from:
      process.env.STUDENT_SMTP_FROM ||
      process.env.STUDENT_SMTP_USER,

    to: email,

    subject,

    html,
  });
}

// ======================================================
// FACULTY APPROVAL EMAIL PROPS
// ======================================================

type FacultyApprovalEmailProps = {
  name: string;

  email: string;

  userId: string;

  approved: boolean;

  rejectionReason?: string | null;
};

// ======================================================
// SEND FACULTY APPROVAL / REJECTION EMAIL
// ======================================================

export async function sendFacultyApprovalEmail({
  name,
  email,
  userId,
  approved,
  rejectionReason,
}: FacultyApprovalEmailProps) {
  // ====================================================
  // SUBJECT
  // ====================================================

  const subject = approved
    ? "CampusConnect - Faculty Account Approved"
    : "CampusConnect - Faculty Account Rejected";

  // ====================================================
  // SAFE VALUES
  // ====================================================

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeUserId = escapeHtml(userId);

  const safeRejectionReason =
    rejectionReason
      ? escapeHtml(rejectionReason)
      : "";

  // ====================================================
  // APPROVED FACULTY EMAIL
  // ====================================================

  const approvedHtml = `
    <!DOCTYPE html>

    <html>
      <head>
        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>
          CampusConnect - Faculty Account Approved
        </title>
      </head>

      <body
        style="
          margin:0;
          padding:0;
          background:#f4f7fb;
          font-family:Arial,sans-serif;
        "
      >

        <div
          style="
            background:#f4f7fb;
            padding:40px;
          "
        >

          <div
            style="
              max-width:600px;
              margin:auto;
              background:white;
              border-radius:16px;
              padding:32px;
            "
          >

            <h2
              style="
                color:#2563eb;
                margin:0 0 8px;
              "
            >
              CampusConnect
            </h2>

            <h1
              style="
                color:#111827;
              "
            >
              Faculty Account Approved
            </h1>

            <p
              style="
                color:#4b5563;
                line-height:1.6;
              "
            >
              Hello
              <strong>${safeName}</strong>,
            </p>

            <p
              style="
                color:#4b5563;
                line-height:1.6;
              "
            >
              Your faculty registration request has
              been approved by the CampusConnect
              administration.
            </p>

            <div
              style="
                background:#eff6ff;
                border-radius:12px;
                padding:20px;
                margin:24px 0;
              "
            >

              <p
                style="
                  color:#374151;
                "
              >
                <strong>
                  Faculty User ID:
                </strong>

                ${safeUserId}
              </p>

              <p
                style="
                  color:#374151;
                "
              >
                <strong>
                  Name:
                </strong>

                ${safeName}
              </p>

              <p
                style="
                  color:#374151;
                "
              >
                <strong>
                  Email:
                </strong>

                ${safeEmail}
              </p>

              <p
                style="
                  color:#374151;
                "
              >
                <strong>
                  Status:
                </strong>

                <span
                  style="
                    color:#16a34a;
                    font-weight:bold;
                  "
                >
                  APPROVED
                </span>
              </p>

            </div>

            <p
              style="
                color:#4b5563;
                line-height:1.6;
              "
            >
              You can now log in to your CampusConnect
              faculty account using your registered
              credentials.
            </p>

            <p
              style="
                color:#6b7280;
                font-size:13px;
                margin-top:30px;
              "
            >
              This is an automated email from
              CampusConnect.
              Please do not reply to this email.
            </p>

          </div>

        </div>

      </body>
    </html>
  `;

  // ====================================================
  // REJECTED FACULTY EMAIL
  // ====================================================

  const rejectedHtml = `
    <!DOCTYPE html>

    <html>
      <head>
        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>
          CampusConnect - Faculty Registration Update
        </title>
      </head>

      <body
        style="
          margin:0;
          padding:0;
          background:#f4f7fb;
          font-family:Arial,sans-serif;
        "
      >

        <div
          style="
            background:#f4f7fb;
            padding:40px;
          "
        >

          <div
            style="
              max-width:600px;
              margin:auto;
              background:white;
              border-radius:16px;
              padding:32px;
            "
          >

            <h2
              style="
                color:#2563eb;
              "
            >
              CampusConnect
            </h2>

            <h1
              style="
                color:#111827;
              "
            >
              Faculty Registration Update
            </h1>

            <p
              style="
                color:#4b5563;
              "
            >
              Hello
              <strong>${safeName}</strong>,
            </p>

            <p
              style="
                color:#4b5563;
                line-height:1.6;
              "
            >
              Your faculty registration request has
              been rejected by the CampusConnect
              administration.
            </p>

            <div
              style="
                background:#fef2f2;
                border-radius:12px;
                padding:20px;
                margin:24px 0;
              "
            >

              <p>
                <strong>
                  Faculty User ID:
                </strong>

                ${safeUserId}
              </p>

              <p>
                <strong>
                  Name:
                </strong>

                ${safeName}
              </p>

              <p>
                <strong>
                  Email:
                </strong>

                ${safeEmail}
              </p>

              <p>
                <strong>
                  Status:
                </strong>

                <span
                  style="
                    color:#dc2626;
                    font-weight:bold;
                  "
                >
                  REJECTED
                </span>
              </p>

              ${
                safeRejectionReason
                  ? `
                    <div
                      style="
                        margin-top:16px;
                        padding:14px;
                        background:#ffffff;
                        border-radius:8px;
                        border:1px solid #fecaca;
                      "
                    >

                      <p
                        style="
                          margin:0 0 6px;
                          color:#991b1b;
                          font-weight:bold;
                        "
                      >
                        Rejection Reason
                      </p>

                      <p
                        style="
                          margin:0;
                          color:#4b5563;
                          line-height:1.6;
                        "
                      >
                        ${safeRejectionReason}
                      </p>

                    </div>
                  `
                  : ""
              }

            </div>

            <p
              style="
                color:#6b7280;
                font-size:13px;
              "
            >
              This is an automated email from
              CampusConnect.
              Please do not reply to this email.
            </p>

          </div>

        </div>

      </body>
    </html>
  `;

  // ====================================================
  // SELECT FACULTY TEMPLATE
  // ====================================================

  const html = approved
    ? approvedHtml
    : rejectedHtml;

  // ====================================================
  // SEND FACULTY EMAIL
  // ====================================================

  await transporter.sendMail({
    from:
      process.env.STUDENT_SMTP_FROM ||
      process.env.STUDENT_SMTP_USER,

    to: email,

    subject,

    html,
  });
}