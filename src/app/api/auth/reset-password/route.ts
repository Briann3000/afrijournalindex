import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { hashPassword } from "../../../../lib/auth";

export async function POST(request: Request) {
  try {
    const { token, email, password } = await request.json();

    if (!token || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Token, email, and new password are required." },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user || user.resetToken !== token) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired password reset link." },
        { status: 400 }
      );
    }

    if (!user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
      return NextResponse.json(
        { success: false, error: "This password reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Hash the new password and clear the reset token
    const newPasswordHash = hashPassword(password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    return NextResponse.json({
      success: true,
      message: "Password has been successfully updated. You may now sign in."
    });
  } catch (error: any) {
    console.error("Reset password API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error occurred while resetting password." },
      { status: 500 }
    );
  }
}
