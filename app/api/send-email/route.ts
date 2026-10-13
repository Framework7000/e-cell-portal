import { NextRequest, NextResponse } from 'next/server';
import nodemailer, { type Transporter } from 'nodemailer';
import { updateApplicationStatusInSheet, ApplicationRecord } from '@/lib/google-sheets';
import { getLinkForDomain, DomainWhatsAppLinks } from '@/lib/whatsapp-links';

export const dynamic = 'force-dynamic';

function getEmailHtml(name: string, domain: string, whatsappLink: string): string {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Congratulations from E-Cell JEC</title>
<style>
  body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b; }
  .wrapper { width: 100%; max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
  .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 36px 30px; text-align: center; }
  .logo-text { font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
  .logo-highlight { color: #EA580C; }
  .sub-tag { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; margin-top: 4px; }
  .content { padding: 36px 32px; }
  .badge { display: inline-block; background-color: #fef3c7; color: #b45309; padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
  h1 { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0; line-height: 1.3; }
  p { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 18px 0; }
  .highlight-card { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #EA580C; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
  .highlight-card strong { color: #0f172a; }
  .btn-container { text-align: center; margin: 32px 0 24px 0; }
  .btn-whatsapp { display: inline-block; background: #25D366; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 14px rgba(37,211,102,0.35); }
  .btn-whatsapp:hover { background: #1eb855; }
  .link-backup { font-size: 11px; color: #94a3b8; word-break: break-all; margin-top: 10px; }
  .link-backup a { color: #2563eb; }
  .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 30px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="logo-text">E-CELL <span class="logo-highlight">JEC</span></div>
    <div class="sub-tag">Entrepreneurship Cell • Jabalpur Engineering College</div>
  </div>
  <div class="content">
    <div class="badge">Shortlisted / Selected Candidate</div>
    <h1>Congratulations, ${name}! 🎉</h1>
    <p>We are delighted to inform you that your application for the <strong>E-Cell JEC Recruitment Drive</strong> has been reviewed and approved for the next stage.</p>
    
    <div class="highlight-card">
      <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Assigned Domain</div>
      <div style="font-size: 18px; font-weight: 800; color: #EA580C;">${domain}</div>
      <div style="font-size: 12px; color: #475569; margin-top: 4px;">Welcome to the specialized domain team for the upcoming tenure.</div>
    </div>

    <p>To coordinate the induction, task discussions, and orientation schedules, please join your official domain WhatsApp group using the direct link below:</p>

    <div class="btn-container">
      <a href="${whatsappLink}" class="btn-whatsapp" target="_blank">
        📲 Join ${domain} WhatsApp Group
      </a>
      <div class="link-backup">
        Link not clicking? Open directly: <br>
        <a href="${whatsappLink}">${whatsappLink}</a>
      </div>
    </div>

    <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
      <em>Note: Please join promptly using your registered mobile number so the team leads can welcome you and share important announcements.</em>
    </p>

    <p style="margin-top: 24px; font-weight: 600; color: #0f172a;">
      Best regards,<br>
      <span style="color: #EA580C;">E-Cell JEC Core Team</span><br>
      <span style="font-size: 12px; color: #64748b; font-weight: normal;">Jabalpur Engineering College, Jabalpur (M.P.)</span>
    </p>
  </div>
  <div class="footer">
    This is an automated communication sent from the E-Cell JEC Recruitment Management Portal.<br>
    © ${new Date().getFullYear()} Entrepreneurship Cell, Jabalpur Engineering College. All rights reserved.
  </div>
</div>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { candidates, whatsappLinks, note } = body as {
            candidates: ApplicationRecord[];
            whatsappLinks?: DomainWhatsAppLinks;
            note?: string;
        };

        if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No candidates provided for email delivery' },
                { status: 400 }
            );
        }

        // Configure Nodemailer transporter if SMTP credentials are provided
        const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.GMAIL_USER;
        const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;
        const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
        const smtpPort = Number(process.env.SMTP_PORT) || 465;

        let transporter: Transporter | null = null;
        let isConfigured = Boolean(smtpUser && smtpPass);

        if (isConfigured) {
            transporter = nodemailer.createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: smtpPort === 465,
                auth: {
                    user: smtpUser,
                    pass: smtpPass,
                },
            });
        }

        const results: Array<{ candidateId: string; email: string; success: boolean; error?: string }> = [];
        const timestamp = new Date().toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });

        for (const candidate of candidates) {
            if (!candidate.email) {
                results.push({ candidateId: candidate.id, email: '', success: false, error: 'Candidate has no email address' });
                continue;
            }

            const targetWaLink = getLinkForDomain(candidate.domain, whatsappLinks);
            const htmlContent = getEmailHtml(candidate.name, candidate.domain, targetWaLink);
            const subject = `🎉 Congratulations ${candidate.name}! You're Selected for E-Cell JEC (${candidate.domain})`;

            let emailSent = false;
            let sendError = '';

            if (transporter && smtpUser) {
                try {
                    await transporter.sendMail({
                        from: `"E-Cell JEC Recruitment" <${smtpUser}>`,
                        to: candidate.email,
                        subject,
                        html: htmlContent,
                    });
                    emailSent = true;
                } catch (err: any) {
                    console.error(`Error sending email to ${candidate.email}:`, err);
                    sendError = err?.message || 'SMTP delivery failed';
                }
            } else {
                // Simulated mode (allows testing and works even if user has not yet configured SMTP in .env)
                emailSent = true;
            }

            // Move the candidate to 'selected' status in Google Sheet with note
            if (candidate.rowIndex) {
                try {
                    const statusNote = note || `Email & ${candidate.domain} WhatsApp link sent on ${timestamp}`;
                    await updateApplicationStatusInSheet(candidate.rowIndex, 'selected', statusNote);
                } catch (sheetErr: any) {
                    console.error(`Error updating sheet status for row ${candidate.rowIndex}:`, sheetErr);
                }
            }

            results.push({
                candidateId: candidate.id,
                email: candidate.email,
                success: emailSent,
                error: sendError || undefined,
            });
        }

        const successCount = results.filter((r) => r.success).length;

        return NextResponse.json({
            success: true,
            sentCount: successCount,
            totalRequested: candidates.length,
            isLiveSmtp: isConfigured,
            message: isConfigured
                ? `Successfully sent ${successCount} emails with domain WhatsApp links and moved to Selected Candidates table.`
                : `Processed ${successCount} candidates (Simulation mode: credentials not in .env). Candidates updated to Selected Candidates table. Add SMTP_USER and SMTP_PASS in .env.local for live SMTP delivery.`,
            results,
        });
    } catch (err: any) {
        console.error('API /api/send-email error:', err);
        return NextResponse.json(
            { success: false, error: err?.message || 'Failed to automate email sending' },
            { status: 500 }
        );
    }
}
