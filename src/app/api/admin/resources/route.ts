import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/db";
import { verifySessionToken } from "../../../../lib/auth";

// Helper: Ensure current user is an authorized admin
async function getAuthorizedAdmin() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("afriJournalSession");
  if (!sessionCookie || !sessionCookie.value) return null;

  const userId = verifySessionToken(sessionCookie.value);
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true }
  });

  if (!user) return null;
  const isSuperEmail = user.email.toLowerCase().includes("wanjohi@kenpro.org") || user.email.toLowerCase().includes("admin@afrijournalindexing.org");
  if (user.role === "ADMIN" || isSuperEmail) {
    return user;
  }
  return null;
}

// GET: List all resources (Admin sees all; public sees only isPublished)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const admin = await getAuthorizedAdmin();

    const where: any = {};
    if (!admin) {
      where.isPublished = true;
    }
    if (category && category !== "all") {
      where.category = category;
    }

    const resources = await prisma.resource.findMany({
      where,
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, resources });
  } catch (error: any) {
    console.error("Fetch resources error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Create a new resource (Admin only)
export async function POST(request: Request) {
  try {
    const admin = await getAuthorizedAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const body = await request.json();
    const { title, slug, category, summary, content, isPublished, fileUrl, fileName, readingTime } = body;

    if (!title || !content) {
      return NextResponse.json({ success: false, error: "Title and content are required." }, { status: 400 });
    }

    const cleanSlug = slug && slug.trim() 
      ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
      : title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    const newResource = await prisma.resource.create({
      data: {
        title: title.trim(),
        slug: cleanSlug,
        category: category || "Ethics",
        summary: summary || "",
        content,
        isPublished: isPublished !== false,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        readingTime: readingTime || "5 min read"
      }
    });

    return NextResponse.json({ success: true, resource: newResource });
  } catch (error: any) {
    console.error("Create resource error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Update an existing resource
export async function PUT(request: Request) {
  try {
    const admin = await getAuthorizedAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const body = await request.json();
    const { id, title, slug, category, summary, content, isPublished, fileUrl, fileName, readingTime } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Resource ID is required." }, { status: 400 });
    }

    const updated = await prisma.resource.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        slug: slug !== undefined ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") : undefined,
        category: category !== undefined ? category : undefined,
        summary: summary !== undefined ? summary : undefined,
        content: content !== undefined ? content : undefined,
        isPublished: isPublished !== undefined ? isPublished : undefined,
        fileUrl: fileUrl !== undefined ? fileUrl : undefined,
        fileName: fileName !== undefined ? fileName : undefined,
        readingTime: readingTime !== undefined ? readingTime : undefined
      }
    });

    return NextResponse.json({ success: true, resource: updated });
  } catch (error: any) {
    console.error("Update resource error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Remove a resource
export async function DELETE(request: Request) {
  try {
    const admin = await getAuthorizedAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Resource ID is required." }, { status: 400 });
    }

    await prisma.resource.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Resource deleted successfully." });
  } catch (error: any) {
    console.error("Delete resource error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
