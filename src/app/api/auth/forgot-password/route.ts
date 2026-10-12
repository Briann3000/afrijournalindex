import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "../../../../lib/db";
import { sendEmail } from "../../../../lib/email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "A valid email address is required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    // To prevent email enumeration attacks, always respond with success even if user not found
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account exists with that email, a password reset link has been dispatched."
      });
    }

    // Generate secure random token valid for 1 hour
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    const origin = process.env.NEXTAUTH_URL || "https://afrijournalindex.org";
    const resetUrl = `${origin}/reset-password?token=${resetToken}&email=${encodeURIComponent(cleanEmail)}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #0f172a; margin: 0 0 6px;">AfriJournal Index</h2>
          <p style="color: #64748b; font-size: 14px; margin: 0;">African Academic Indexing &amp; Citation Registry</p>
        </div>

        <div style="margin-bottom: 24px; color: #334155; font-size: 15px; line-height: 1.6;">
          <p>Hello <strong>${user.name || "Colleague"}</strong>,</p>
          <p>We received a request to reset the password for your AfriJournal Index account associated with <strong>${cleanEmail}</strong>.</p>
          <p>Click the button below to choose a new password. This link is valid for <strong>1 hour</strong>.</p>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background-color: #b45309; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
            Reset Your Password
          </a>
        </div>

        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #f1f5f9; color: #64748b; font-size: 13px; line-height: 1.5;">
          <p>If you did not request this password reset, please ignore this email or contact support if you have concerns.</p>
          <p style="word-break: break-all;">Link not clickable? Copy and paste this URL into your browser:<br/><a href="${resetUrl}" style="color: #0284c7;">${resetUrl}</a></p>
        </div>
      </div>
    `;

    await sendEmail({
      to: cleanEmail,
      subject: "Password Reset Request — AfriJournal Index",
      html
    });

    return NextResponse.json({
      success: true,
      message: "If an account exists with that email, a password reset link has been dispatched."
    });
  } catch (error: any) {
    console.error("Forgot password API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error occurred while processing request." },
      { status: 500 }
    );
  }
}
