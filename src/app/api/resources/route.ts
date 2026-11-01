import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const category = searchParams.get("category");

    if (slug) {
      const resource = await prisma.resource.findFirst({
        where: {
          slug,
          isPublished: true
        }
      });

      if (!resource) {
        return NextResponse.json({ success: false, error: "Resource not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, resource });
    }

    const where: any = { isPublished: true };
    if (category && category !== "all") {
      where.category = category;
    }

    const resources = await prisma.resource.findMany({
      where,
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, resources });
  } catch (error: any) {
    console.error("Public fetch resources error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
