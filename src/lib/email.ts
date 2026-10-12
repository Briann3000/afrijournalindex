import nodemailer from "nodemailer";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: EmailPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || '"AfriJournal Index" <noreply@afrijournalindex.org>';

    // If SMTP is not yet configured in production, log the dispatch securely to console
    if (!host || !user || !pass) {
      console.log(`\n==================================================`);
      console.log(`[EMAIL SIMULATION / DISPATCH FALLBACK]`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`HTML Payload:\n${html}`);
      console.log(`==================================================\n`);
      return { success: true, messageId: "simulated-dispatch" };
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass
      }
    });

    const rawFrom = process.env.SMTP_FROM || "onboarding@resend.dev";
    const formattedFrom = rawFrom.includes("<") ? rawFrom : `AfriJournal Index <${rawFrom}>`;

    const replyTo = process.env.SMTP_REPLY_TO || "afrijournalindex@gmail.com";

    const info = await transporter.sendMail({
      from: formattedFrom,
      to,
      replyTo,
      subject,
      text: text || html.replace(/<[^>]*>/g, ""),
      html
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("[Mail Dispatch Error]:", error);
    return { success: false, error: error.message || "Failed to send email" };
  }
}
