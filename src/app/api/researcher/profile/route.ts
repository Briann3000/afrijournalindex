import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/db";
import { verifySessionToken, verifyPassword, hashPassword } from "../../../../lib/auth";
import { normalizeOrcid, verifyOrcidWithRegistry } from "../../../../lib/orcid";
import { normalizeAfriScholarId } from "../../../../lib/afrischolar-id";
import { ALL_AFRICAN_COUNTRIES } from "../../../data/african-countries";
import { getScholarScientometrics, getAuthenticPublicationVenue } from "../../../../lib/scholar-metrics";
import { fetchScholarProfile } from "../../../../lib/scholar-service";

const AFRICAN_COUNTRY_SET = new Set(ALL_AFRICAN_COUNTRIES.map(c => c.name.toLowerCase()));

const AFRICAN_INSTITUTIONS_MAP: Record<string, string> = {
  // South Africa
  "cape town": "South Africa",
  "witwatersrand": "South Africa",
  "stellenbosch": "South Africa",
  "pretoria": "South Africa",
  "kwazulu": "South Africa",
  "south african medical research council": "South Africa",
  "johannesburg": "South Africa",
  "rhodes": "South Africa",
  "western cape": "South Africa",
  "north-west": "South Africa",
  "free state": "South Africa",
  "unisa": "South Africa",
  "fort hare": "South Africa",
  // Kenya
  "nairobi": "Kenya",
  "kenyatta": "Kenya",
  "jkuat": "Kenya",
  "moi": "Kenya",
  "strathmore": "Kenya",
  "kemri": "Kenya",
  "kenya medical research institute": "Kenya",
  "aga khan": "Kenya",
  "egerton": "Kenya",
  "maseno": "Kenya",
  // Nigeria
  "ibadan": "Nigeria",
  "lagos": "Nigeria",
  "ahmadu bello": "Nigeria",
  "obafemi awolowo": "Nigeria",
  "university of nigeria": "Nigeria",
  "benin": "Nigeria",
  "covenant": "Nigeria",
  "ilorin": "Nigeria",
  "port harcourt": "Nigeria",
  // Egypt
  "cairo": "Egypt",
  "ain shams": "Egypt",
  "alexandria": "Egypt",
  "mansoura": "Egypt",
  "assiut": "Egypt",
  "al-azhar": "Egypt",
  "zagazig": "Egypt",
  // Uganda
  "makerere": "Uganda",
  "mbarara": "Uganda",
  "kyambogo": "Uganda",
  // Ghana
  "university of ghana": "Ghana",
  "knust": "Ghana",
  "kwame nkrumah": "Ghana",
  "cape coast": "Ghana",
  // Ethiopia
  "addis ababa": "Ethiopia",
  "jimma": "Ethiopia",
  "hawassa": "Ethiopia",
  "gondar": "Ethiopia",
  // Tanzania
  "dar es salaam": "Tanzania",
  "muhimbili": "Tanzania",
  "sokoine": "Tanzania",
  // Rwanda
  "university of rwanda": "Rwanda",
  // Zimbabwe
  "university of zimbabwe": "Zimbabwe",
  // Zambia
  "university of zambia": "Zambia",
  // Botswana
  "university of botswana": "Botswana",
  // Senegal
  "cheikh anta diop": "Senegal",
  // Cameroon
  "yaounde": "Cameroon",
  "yaoundé": "Cameroon",
  // Morocco
  "mohammed v": "Morocco",
  "cadi ayyad": "Morocco",
  // Tunisia
  "tunis": "Tunisia",
  "monastir": "Tunisia"
};

function resolveInstitution(institutionName: string, email: string, bioText: string = "", scholarName: string = ""): { country: string; originCountry?: string; isAfrican: boolean; isDiaspora: boolean } {
  const inst = (institutionName || "").trim().toLowerCase();
  const mail = (email || "").trim().toLowerCase();
  const bioLower = (bioText || "").toLowerCase();
  const nameLower = (scholarName || "").toLowerCase();

  for (const [key, cName] of Object.entries(AFRICAN_INSTITUTIONS_MAP)) {
    if (inst.includes(key)) {
      return { country: cName, originCountry: cName, isAfrican: true, isDiaspora: false };
    }
  }

  for (const ac of ALL_AFRICAN_COUNTRIES) {
    if (inst.includes(ac.name.toLowerCase())) {
      return { country: ac.name, originCountry: ac.name, isAfrican: true, isDiaspora: false };
    }
  }

  if (mail.includes(".ke") || mail.includes(".ac.ke")) return { country: "Kenya", originCountry: "Kenya", isAfrican: true, isDiaspora: false };
  if (mail.includes(".za") || mail.includes(".ac.za")) return { country: "South Africa", originCountry: "South Africa", isAfrican: true, isDiaspora: false };
  if (mail.includes(".ng") || mail.includes(".edu.ng")) return { country: "Nigeria", originCountry: "Nigeria", isAfrican: true, isDiaspora: false };
  if (mail.includes(".eg") || mail.includes(".edu.eg")) return { country: "Egypt", originCountry: "Egypt", isAfrican: true, isDiaspora: false };
  if (mail.includes(".ug") || mail.includes(".ac.ug")) return { country: "Uganda", originCountry: "Uganda", isAfrican: true, isDiaspora: false };
  if (mail.includes(".gh") || mail.includes(".edu.gh")) return { country: "Ghana", originCountry: "Ghana", isAfrican: true, isDiaspora: false };
  if (mail.includes(".et") || mail.includes(".edu.et")) return { country: "Ethiopia", originCountry: "Ethiopia", isAfrican: true, isDiaspora: false };

  // Known International Institutions where African Diaspora researchers reside
  if (inst.includes("washington state") || inst.includes("wsu") || inst.includes("harvard") || inst.includes("chicago") || inst.includes("johns hopkins") || inst.includes("oxford") || inst.includes("cambridge") || inst.includes("toronto") || inst.includes("mcgill") || inst.includes("london") || inst.includes("imperial") || mail.includes("diaspora.afrijournal")) {
    let originCountry = "African Diaspora";
    if (nameLower.includes("njenga") || bioLower.includes("kenyan") || bioLower.includes("kenya")) {
      originCountry = "Kenya";
    } else if (nameLower.includes("olopade") || bioLower.includes("nigerian") || bioLower.includes("nigeria")) {
      originCountry = "Nigeria";
    } else {
      for (const ac of ALL_AFRICAN_COUNTRIES) {
        if (bioLower.includes(ac.name.toLowerCase())) {
          originCountry = ac.name;
          break;
        }
      }
    }
    return { country: originCountry !== "African Diaspora" ? originCountry : "African Diaspora", originCountry, isAfrican: false, isDiaspora: true };
  }

  return { country: "International Collaborator", originCountry: "Unspecified", isAfrican: false, isDiaspora: false };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const orcidParam = searchParams.get("orcid");

    // Real-time ORCID verification check
    if (action === "verify-orcid" && orcidParam) {
      const verification = await verifyOrcidWithRegistry(orcidParam);
      if (!verification.isValid || !verification.exists) {
        return NextResponse.json({ 
          success: false, 
          error: verification.error || "ORCID could not be verified." 
        }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        orcid: verification.orcid,
        registeredName: verification.registeredName,
        givenNames: verification.givenNames,
        familyName: verification.familyName
      });
    }

    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Researcher ID is required." }, { status: 400 });
    }

    const data = await fetchScholarProfile(id);
    if (!data) {
      return NextResponse.json({ success: false, error: "Scholar profile not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error("Get researcher profile error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    let targetUserId = body.id;

    if (!targetUserId) {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get("afriJournalSession");
      if (sessionCookie?.value) {
        targetUserId = verifySessionToken(sessionCookie.value);
      }
    }

    if (!targetUserId) {
      return NextResponse.json({ success: false, error: "User ID is required." }, { status: 400 });
    }

    const { orcid, institution, researchFocus } = body;
    const updateData: any = {};
    if (body.name !== undefined && body.name.trim()) updateData.name = body.name.trim();

    if (orcid !== undefined) {
      if (!orcid || !orcid.trim()) {
        updateData.orcid = null;
      } else {
        const cleanOrcid = normalizeOrcid(orcid);
        if (!cleanOrcid) {
          return NextResponse.json({ 
            success: false, 
            error: "Invalid ORCID iD format. Format must be 16 characters separated by hyphens (e.g. 0000-0002-1825-0097)." 
          }, { status: 400 });
        }

        const registryCheck = await verifyOrcidWithRegistry(cleanOrcid);
        if (registryCheck.exists === false) {
          return NextResponse.json({
            success: false,
            error: registryCheck.error || `ORCID iD "${cleanOrcid}" does not exist in the official ORCID registry.`
          }, { status: 400 });
        }

        updateData.orcid = cleanOrcid;
      }
    }

    if (institution !== undefined) updateData.institution = institution ? institution.trim() : null;
    
    // Handle bio and embedded researchFocus tags
    let rawBio = body.bio !== undefined ? (body.bio ? body.bio.trim() : "") : null;
    if (rawBio !== null || researchFocus !== undefined) {
      // If updating bio or researchFocus, fetch current user bio if needed
      let baseBio = rawBio !== null ? rawBio : "";
      if (rawBio === null) {
        const existing = await prisma.user.findUnique({ where: { id: targetUserId }, select: { bio: true } });
        baseBio = (existing?.bio || "").replace(/\[Interests:\s*.*?\]/, "").trim();
      } else {
        baseBio = baseBio.replace(/\[Interests:\s*.*?\]/, "").trim();
      }

      if (researchFocus !== undefined) {
        const tags = Array.isArray(researchFocus) 
          ? researchFocus 
          : String(researchFocus).split(",").map(t => t.trim()).filter(Boolean);
        if (tags.length > 0) {
          updateData.bio = `${baseBio}\n\n[Interests: ${tags.join(", ")}]`.trim();
        } else {
          updateData.bio = baseBio || null;
        }
      } else if (rawBio !== null) {
        updateData.bio = baseBio || null;
      }
    }

    if (body.department !== undefined) {
      updateData.department = body.department ? body.department.trim() : null;
    }
    if (body.googleScholarUrl !== undefined) {
      const gsUrl = body.googleScholarUrl ? body.googleScholarUrl.trim() : null;
      updateData.googleScholarUrl = gsUrl;
      if (gsUrl) {
        const userMatch = gsUrl.match(/[?&]user=([a-zA-Z0-9_-]+)/);
        if (userMatch && userMatch[1]) {
          updateData.googleScholarId = userMatch[1];
        }
      } else {
        updateData.googleScholarId = null;
      }
    }
    if (body.cvPdfUrl !== undefined) {
      updateData.cvPdfUrl = body.cvPdfUrl ? body.cvPdfUrl.trim() : null;
    }
    if (body.dossierData !== undefined) {
      if (typeof body.dossierData === "object" && body.dossierData !== null) {
        updateData.dossierData = JSON.stringify(body.dossierData);
      } else if (typeof body.dossierData === "string") {
        updateData.dossierData = body.dossierData.trim() || null;
      }
    }

    // Handle Password Update securely
    if (body.newPassword !== undefined && body.newPassword !== null && String(body.newPassword).trim() !== "") {
      const newPassword = String(body.newPassword).trim();
      if (newPassword.length < 8) {
        return NextResponse.json({
          success: false,
          error: "New password must be at least 8 characters long."
        }, { status: 400 });
      }

      // Check current password if user already has one and is updating their own account
      const currentUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { passwordHash: true }
      });

      if (currentUser?.passwordHash) {
        const currentPassword = String(body.currentPassword || "").trim();
        if (!currentPassword) {
          return NextResponse.json({
            success: false,
            error: "Current password is required to set a new password."
          }, { status: 400 });
        }
        const isMatch = verifyPassword(currentPassword, currentUser.passwordHash);
        if (!isMatch) {
          return NextResponse.json({
            success: false,
            error: "Incorrect current password."
          }, { status: 400 });
        }
      }

      updateData.passwordHash = hashPassword(newPassword);
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: updateData,
      select: {
        id: true,
        afriScholarId: true,
        email: true,
        name: true,
        orcid: true,
        institution: true,
        department: true,
        bio: true,
        role: true,
        googleScholarUrl: true,
        cvPdfUrl: true,
        dossierData: true
      }
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      user: updatedUser
    });

  } catch (error: any) {
    console.error("Update researcher profile error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
