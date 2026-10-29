import { UNIVERSITY_INFO } from "@/lib/constants";

export interface StudentClaimEmailParams {
  studentName: string;
  studentId: string;
  recipientEmail: string;
  claimUrl: string;
  expiresAt: Date | string;
}

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  error?: string;
  simulated?: boolean;
}

/**
 * Generates the clean plain-text version of the official DDU DCMS account claim email.
 */
export function generateClaimEmailPlainText(params: StudentClaimEmailParams): string {
  const expiryFormatted = new Date(params.expiresAt).toUTCString();

  return `Dire Dawa University — Digital Clearance Management System (DCMS)
Official Student Account Activation

Dear ${params.studentName},

Your official student account for the Dire Dawa University Digital Clearance Management System (DCMS) has been provisioned under Student ID: ${params.studentId}.

To activate your account and establish your secure password, visit the following activation link:
${params.claimUrl}

IMPORTANT SECURITY NOTICE:
- This activation link will expire in exactly 72 hours (Expires: ${expiryFormatted}).
- This link is single-use and will be permanently invalidated once consumed.
- Do not forward or share this link with anyone.

If you did not expect this communication or have reason to believe it was delivered in error, please consult the Office of the University Registrar or ICT Directorate through Dire Dawa University's established on-campus administrative channels.

Sincerely,
Office of the University Registrar & Directorate for ICT
${UNIVERSITY_INFO.name}
${UNIVERSITY_INFO.location}
${UNIVERSITY_INFO.pobox}
`;
}

/**
 * Generates the responsive HTML version of the official DDU DCMS account claim email.
 */
export function generateClaimEmailHtml(params: StudentClaimEmailParams): string {
  const expiryFormatted = new Date(params.expiresAt).toUTCString();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Activate Your DDU DCMS Student Account</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #0f172a; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background-color: #0b1a2e; padding: 28px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
    .header p { margin: 4px 0 0 0; font-size: 12px; color: #94a3b8; }
    .content { padding: 32px 28px; font-size: 14px; line-height: 1.6; color: #334155; }
    .button-container { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; letter-spacing: 0.02em; }
    .notice { background-color: #f8fafc; border-left: 4px solid #0d9488; padding: 12px 16px; margin: 20px 0; border-radius: 0 8px 8px 0; font-size: 12px; color: #475569; }
    .url-fallback { word-break: break-all; font-family: monospace; font-size: 11px; background-color: #f8fafc; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px; color: #1e293b; }
    .footer { background-color: #07111e; padding: 20px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Dire Dawa University</h1>
      <p>Digital Clearance Management System (DCMS)</p>
    </div>
    <div class="content">
      <p>Dear <strong>${params.studentName}</strong>,</p>
      <p>An official student account for the Dire Dawa University Digital Clearance Management System has been provisioned for you under Student ID <strong>${params.studentId}</strong>.</p>
      <p>Please click the button below to claim your account and establish your secure password:</p>
      <div class="button-container">
        <a href="${params.claimUrl}" class="btn" target="_blank" rel="noopener noreferrer">Activate My Student Account</a>
      </div>
      <div class="notice">
        <strong>Important Account Security Rules:</strong>
        <ul style="margin: 6px 0 0 0; padding-left: 18px;">
          <li>This link is valid for <strong>exactly 72 hours</strong> (Expires: ${expiryFormatted}).</li>
          <li>This link is single-use and will be permanently consumed upon password creation.</li>
          <li>Never share or forward this email with anyone.</li>
        </ul>
      </div>
      <p style="font-size: 12px; color: #64748b;">If the button above does not work, copy and paste the following URL into your browser:</p>
      <div class="url-fallback">${params.claimUrl}</div>
      <p style="font-size: 12px; color: #64748b; margin-top: 24px;">If you did not expect this communication, please contact the Office of the University Registrar or ICT Directorate through Dire Dawa University's official on-campus channels.</p>
    </div>
    <div class="footer">
      <p style="margin: 0;">${UNIVERSITY_INFO.registrarOffice}</p>
      <p style="margin: 4px 0 0 0;">${UNIVERSITY_INFO.name} • ${UNIVERSITY_INFO.pobox} • ${UNIVERSITY_INFO.location}</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Dispatches the student claim email or safely records delivery status.
 * If SMTP or Resend credentials are not configured, safely logs the transmission
 * in local development while maintaining recoverable state tracking.
 */
export async function sendStudentClaimEmail(
  params: StudentClaimEmailParams
): Promise<EmailDispatchResult> {
  const plainText = generateClaimEmailPlainText(params);
  const subject = `Dire Dawa University DCMS — Activate Your Student Account (${params.studentId})`;

  // Check if an external email delivery provider is configured (e.g., RESEND_API_KEY)
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "DDU DCMS <clearance@ddu.edu.et>",
          to: [params.recipientEmail],
          subject: subject,
          text: plainText,
          html: generateClaimEmailHtml(params),
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Resend delivery failed:", errorBody);
        return {
          success: false,
          error: `Email provider error: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.id,
      };
    } catch (err) {
      console.error("Email dispatch network error:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Email provider transmission failure.",
      };
    }
  }

  // Development / sandbox fallback: Log delivery safely without printing secrets
  if (process.env.NODE_ENV === "development") {
    console.info(`[DDU DCMS Email] Simulated claim link dispatched to: ${params.recipientEmail}`);
  }

  return {
    success: true,
    simulated: true,
    messageId: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
  };
}
