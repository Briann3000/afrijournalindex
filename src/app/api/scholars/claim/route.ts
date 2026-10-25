import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "../../../../lib/db";
import { sendEmail } from "../../../../lib/email";
import { hashPassword, createSessionToken } from "../../../../lib/auth";
import { normalizeOrcid, verifyOrcidWithRegistry } from "../../../../lib/orcid";

export const dynamic = "force-dynamic";

function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "academic email";
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

// GET: Query claiming status and masked contact details for a scholar profile
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scholarId = searchParams.get("scholarId");

    if (!scholarId) {
      return NextResponse.json({ success: false, error: "Scholar ID is required." }, { status: 400 });
    }

    const scholar = await prisma.user.findUnique({
      where: { id: scholarId },
      select: {
        id: true,
        name: true,
        email: true,
        institution: true,
        department: true,
        orcid: true,
        isClaimed: true,
        totalCitations: true,
        hIndex: true,
        googleScholarUrl: true
      }
    });

    if (!scholar) {
      return NextResponse.json({ success: false, error: "Scholar profile not found." }, { status: 404 });
    }

    const emailDomain = scholar.email.includes("@") ? scholar.email.split("@")[1] : "";

    return NextResponse.json({
      success: true,
      scholar: {
        id: scholar.id,
        name: scholar.name,
        institution: scholar.institution || "African Institution",
        department: scholar.department,
        maskedEmail: maskEmail(scholar.email),
        emailDomain,
        orcid: scholar.orcid,
        hasOrcid: Boolean(scholar.orcid),
        isClaimed: scholar.isClaimed,
        totalCitations: scholar.totalCitations,
        hIndex: scholar.hIndex
      }
    });
  } catch (error: any) {
    console.error("Check scholar claim status error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Profile Claiming actions (request_otp, verify_otp, claim_orcid)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, scholarId } = body;

    if (!scholarId) {
      return NextResponse.json({ success: false, error: "Scholar ID is required." }, { status: 400 });
    }

    const scholar = await prisma.user.findUnique({
      where: { id: scholarId }
    });

    if (!scholar) {
      return NextResponse.json({ success: false, error: "Scholar profile not found." }, { status: 404 });
    }

    if (scholar.isClaimed) {
      return NextResponse.json({
        success: false,
        error: "This profile has already been verified and claimed by its researcher. If you believe this is in error, please contact support."
      }, { status: 400 });
    }

    // ACTION 1: Request 6-digit OTP via Institutional Email
    if (action === "request_otp") {
      const inputEmail = (body.email || "").trim().toLowerCase();

      // Verify email matches either the registered address or official institutional domain
      const registeredEmail = scholar.email.toLowerCase();
      const registeredDomain = registeredEmail.includes("@") ? registeredEmail.split("@")[1] : "";
      const inputDomain = inputEmail.includes("@") ? inputEmail.split("@")[1] : "";

      const domainMatches = registeredDomain && inputDomain === registeredDomain;
      const exactMatches = inputEmail === registeredEmail;

      if (!domainMatches && !exactMatches) {
        return NextResponse.json({
          success: false,
          error: `Email address must belong to your verified institution domain (@${registeredDomain || "university.ac"}).`
        }, { status: 400 });
      }

      // Generate secure 6-digit OTP
      const otp = crypto.randomInt(100000, 999999).toString();
      const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await prisma.user.update({
        where: { id: scholar.id },
        data: {
          claimToken: otp,
          claimTokenExpiry: expiry
        }
      });

      // Send verification email
      const targetEmail = exactMatches ? scholar.email : inputEmail;
      const origin = request.headers.get("origin") || process.env.NEXTAUTH_URL || "https://afrijournalindexing.org";
      const directClaimUrl = `${origin}/researcher?id=${scholar.id}&claim=true&otp=${otp}`;

      const mailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a; margin-top: 0;">Claim Your AfriJournal Index Profile</h2>
          <p>Hello <strong>${scholar.name}</strong>,</p>
          <p>You requested to claim and activate your pre-indexed researcher profile for <strong>${scholar.institution || "your institution"}</strong> on the AfriJournal Index platform.</p>
          <div style="background: #f1f5f9; padding: 18px; border-radius: 8px; text-align: center; margin: 24px 0;">
            <div style="font-size: 13px; color: #64748b; margin-bottom: 6px; text-transform: uppercase; font-weight: bold;">Your One-Time Passcode</div>
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0284c7;">${otp}</span>
          </div>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${directClaimUrl}" style="background: #0284c7; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block;">
              Activate Profile Now →
            </a>
          </div>
          <p style="color: #64748b; font-size: 14px; line-height: 1.5;">Click the activation button above or enter the code on the profile page. This one-time code expires in 15 minutes.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 12px; color: #94a3b8;">If you did not initiate this request, no action is required.</p>
        </div>
      `;

      await sendEmail({
        to: targetEmail,
        subject: `Your AfriJournal Index Profile Claim Code: ${otp}`,
        html: mailHtml,
        text: `Your verification code to claim your AfriJournal Index profile is: ${otp}. You can activate directly here: ${directClaimUrl}`
      });

      return NextResponse.json({
        success: true,
        message: `A 6-digit verification code has been dispatched to ${maskEmail(targetEmail)}.`,
        targetEmail: maskEmail(targetEmail)
      });
    }

    // ACTION 2: Verify OTP and Claim Profile
    if (action === "verify_otp") {
      const { otp, newPassword, newEmail } = body;

      if (!otp || !newPassword) {
        return NextResponse.json({ success: false, error: "Verification code and new password are required." }, { status: 400 });
      }

      if (newPassword.length < 8) {
        return NextResponse.json({ success: false, error: "Password must be at least 8 characters long." }, { status: 400 });
      }

      if (!scholar.claimToken || !scholar.claimTokenExpiry || new Date() > scholar.claimTokenExpiry) {
        return NextResponse.json({ success: false, error: "Verification code has expired. Please request a new one." }, { status: 400 });
      }

      if (scholar.claimToken.trim() !== otp.trim()) {
        return NextResponse.json({ success: false, error: "Invalid verification code. Please check and retry." }, { status: 400 });
      }

      // Hash new permanent password
      const passwordHash = hashPassword(newPassword);

      // Check if new email is provided and unique
      let updateEmail = scholar.email;
      if (newEmail && newEmail.trim() && newEmail.trim().toLowerCase() !== scholar.email.toLowerCase()) {
        const cleanNewEmail = newEmail.trim().toLowerCase();
        const existingEmail = await prisma.user.findUnique({ where: { email: cleanNewEmail } });
        if (!existingEmail) {
          updateEmail = cleanNewEmail;
        }
      }

      const updatedScholar = await prisma.user.update({
        where: { id: scholar.id },
        data: {
          email: updateEmail,
          passwordHash,
          isClaimed: true,
          claimToken: null,
          claimTokenExpiry: null
        },
        select: {
          id: true,
          name: true,
          email: true,
          orcid: true,
          institution: true,
          role: true,
          isClaimed: true
        }
      });

      // Issue signed session token for immediate login
      const sessionToken = createSessionToken(updatedScholar.id);
      const response = NextResponse.json({
        success: true,
        message: "Profile claimed successfully! Welcome to your AfriJournal researcher portal.",
        user: updatedScholar
      });

      response.cookies.set("afriJournalSession", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: "lax"
      });

      return response;
    }

    // ACTION 3: Claim via Verified ORCID
    if (action === "claim_orcid") {
      const { orcid, newPassword } = body;

      if (!orcid) {
        return NextResponse.json({ success: false, error: "ORCID iD is required." }, { status: 400 });
      }

      const cleanOrcid = normalizeOrcid(orcid);
      if (!cleanOrcid) {
        return NextResponse.json({ success: false, error: "Invalid ORCID iD format (use 16 digits, e.g. 0000-0002-1825-0097)." }, { status: 400 });
      }

      // Verify ORCID with live registry
      const regCheck = await verifyOrcidWithRegistry(cleanOrcid);
      if (!regCheck.exists) {
        return NextResponse.json({ success: false, error: regCheck.error || "ORCID could not be verified in the official registry." }, { status: 400 });
      }

      // Check match against scholar's recorded ORCID or name
      const orcidMatches = scholar.orcid && scholar.orcid === cleanOrcid;
      
      const scholarNameLower = scholar.name.toLowerCase().trim();
      const regNameLower = (regCheck.name || "").toLowerCase().trim();
      const nameParts = scholarNameLower.split(/\s+/).filter(p => p.length > 2);
      const nameMatches = nameParts.some(p => regNameLower.includes(p));

      if (!orcidMatches && !nameMatches) {
        return NextResponse.json({
          success: false,
          error: `The registered name for ORCID ${cleanOrcid} ("${regCheck.name}") does not match profile name ("${scholar.name}").`
        }, { status: 400 });
      }

      const updateData: any = {
        orcid: cleanOrcid,
        isClaimed: true,
        claimToken: null,
        claimTokenExpiry: null
      };

      if (newPassword && newPassword.length >= 8) {
        updateData.passwordHash = hashPassword(newPassword);
      }

      const updatedScholar = await prisma.user.update({
        where: { id: scholar.id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          orcid: true,
          institution: true,
          role: true,
          isClaimed: true
        }
      });

      const sessionToken = createSessionToken(updatedScholar.id);
      const response = NextResponse.json({
        success: true,
        message: `Profile verified and claimed via official ORCID registry (${cleanOrcid}).`,
        user: updatedScholar
      });

      response.cookies.set("afriJournalSession", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax"
      });

      return response;
    }

    return NextResponse.json({ success: false, error: "Invalid action. Supported: request_otp, verify_otp, claim_orcid." }, { status: 400 });

  } catch (error: any) {
    console.error("Claim scholar profile error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
