// ============================================
// BREVO TRANSACTIONAL EMAIL HELPERS
// ============================================
// Uses the Brevo (formerly Sendinblue) API v3
// Falls back to simulation when API key is absent.

const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY || '';
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const FROM_EMAIL = 'noreply@stethonotes.store';
const FROM_NAME = 'StethoNotes';

interface BrevoPayload {
  sender: { name: string; email: string };
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
}

async function sendBrevoEmail(payload: BrevoPayload): Promise<boolean> {
  if (!BREVO_API_KEY) {
    console.info('[Brevo Simulation] Email would be sent:', {
      to: payload.to,
      subject: payload.subject,
    });
    await new Promise((r) => setTimeout(r, 600));
    return true;
  }

  try {
    if (!BREVO_API_URL) {
      throw new Error("BREVO_API_URL is undefined");
    }
    console.log("Request URL:", BREVO_API_URL);
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch (err) {
    console.error('[Brevo] Email send failed:', err);
    return false;
  }
}

// ============================================
// SELLER APPLICATION RECEIVED
// ============================================

export async function sendSellerApplicationReceivedEmail(
  email: string,
  name: string
): Promise<boolean> {
  return sendBrevoEmail({
    sender: { name: FROM_NAME, email: FROM_EMAIL },
    to: [{ email, name }],
    subject: 'StethoNotes — Seller Application Received',
    htmlContent: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#f9fafb;padding:40px 24px;">
        <div style="background:#fff;border-radius:16px;padding:32px;box-shadow:0 2px 12px rgba(0,0,0,.07);">
          <img src="https://stethonotes.store/favicon.svg" alt="StethoNotes" style="width:48px;margin-bottom:16px;" />
          <h2 style="color:#0f172a;font-size:22px;margin-bottom:8px;">Application Received!</h2>
          <p style="color:#64748b;font-size:15px;line-height:1.6;">
            Hi <strong>${name}</strong>, we've received your seller application for <strong>StethoNotes</strong>.
          </p>
          <p style="color:#64748b;font-size:15px;line-height:1.6;">
            Our team will review your profile within <strong>24–48 hours</strong>. You'll receive an email once your account is approved.
          </p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin:24px 0;">
            <p style="color:#166534;font-size:13px;margin:0;">📋 Your application is currently <strong>under review</strong>.</p>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin-top:24px;">You can track your status by logging in at <a href="https://stethonotes.store/seller/login" style="color:#16a34a;">stethonotes.store/seller/login</a></p>
        </div>
      </div>
    `,
  });
}

// ============================================
// SELLER APPROVED
// ============================================

export async function sendSellerApprovalEmail(
  email: string,
  name: string
): Promise<boolean> {
  return sendBrevoEmail({
    sender: { name: FROM_NAME, email: FROM_EMAIL },
    to: [{ email, name }],
    subject: 'Congratulations! Your StethoNotes Seller Account is Approved 🎉',
    htmlContent: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#f9fafb;padding:40px 24px;">
        <div style="background:#fff;border-radius:16px;padding:32px;box-shadow:0 2px 12px rgba(0,0,0,.07);">
          <h2 style="color:#0f172a;font-size:22px;margin-bottom:8px;">🎉 Seller Account Approved!</h2>
          <p style="color:#64748b;font-size:15px;line-height:1.6;">
            Hi <strong>${name}</strong>,<br/>Congratulations! Your <strong>StethoNotes Seller account</strong> has been approved.
          </p>
          <p style="color:#64748b;font-size:15px;line-height:1.6;">
            You can now log in and start uploading your study notes.
          </p>
          <a href="https://stethonotes.store/seller/login"
             style="display:inline-block;background:#16a34a;color:#fff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;margin:20px 0;">
            Go to Seller Dashboard →
          </a>
          <p style="color:#94a3b8;font-size:12px;margin-top:24px;">
            Login at: <a href="https://stethonotes.store/seller/login" style="color:#16a34a;">stethonotes.store/seller/login</a>
          </p>
        </div>
      </div>
    `,
  });
}

// ============================================
// SELLER REJECTED
// ============================================

export async function sendSellerRejectionEmail(
  email: string,
  name: string,
  rejectionReason?: string
): Promise<boolean> {
  const reasonHtml = rejectionReason
    ? `<div style="background:#f8fafc;border-left:4px solid #ef4444;padding:16px;margin:20px 0;border-radius:0 8px 8px 0;">
         <p style="color:#475569;font-size:14px;margin:0;font-weight:600;">Rejection Reason:</p>
         <p style="color:#64748b;font-size:14px;margin:4px 0 0 0;font-style:italic;">"${rejectionReason}"</p>
       </div>`
    : '';

  return sendBrevoEmail({
    sender: { name: FROM_NAME, email: FROM_EMAIL },
    to: [{ email, name }],
    subject: 'StethoNotes — Seller Application Update',
    htmlContent: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#f9fafb;padding:40px 24px;">
        <div style="background:#fff;border-radius:16px;padding:32px;box-shadow:0 2px 12px rgba(0,0,0,.07);">
          <h2 style="color:#0f172a;font-size:22px;margin-bottom:8px;">Seller Application Status</h2>
          <p style="color:#64748b;font-size:15px;line-height:1.6;">
            Hi <strong>${name}</strong>,<br/>Thank you for applying to become a seller on StethoNotes.
          </p>
          <p style="color:#64748b;font-size:15px;line-height:1.6;">
            After reviewing your application, we're unable to approve your seller account at this time.
          </p>
          ${reasonHtml}
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;margin:24px 0;">
            <p style="color:#991b1b;font-size:13px;margin:0;">If you believe this is an error, please contact us at <a href="mailto:support@stethonotes.store" style="color:#dc2626;">support@stethonotes.store</a></p>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin-top:24px;">You can still use StethoNotes as a student at <a href="https://stethonotes.store/login" style="color:#0891b2;">stethonotes.store/login</a></p>
        </div>
      </div>
    `,
  });
}
