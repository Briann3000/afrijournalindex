import { prisma } from "./db";
import { ALL_AFRICAN_COUNTRIES } from "../app/data/african-countries";

export interface InitialScholarsData {
  scholars: any[];
  totalCount: number;
}

export async function getInitialScholars(
  limit = 15,
  page = 1,
  search = "",
  country = "",
  interest = ""
): Promise<InitialScholarsData> {
  try {
    const skip = Math.max(0, (page - 1) * limit);

    const where: any = {
      role: "RESEARCHER",
      totalCitations: { gt: 0 }
    };

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { institution: { contains: q } },
        { department: { contains: q } },
        { bio: { contains: q } },
        { afriScholarId: { contains: q } }
      ];
    }

    if (country && country.trim()) {
      where.institution = { contains: country.trim() };
    }

    if (interest && interest.trim()) {
      where.bio = { contains: interest.trim() };
    }

    const scholars = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        totalCitations: "desc"
      },
      select: {
        id: true,
        afriScholarId: true,
        legacyAsid: true,
        name: true,
        orcid: true,
        institution: true,
        department: true,
        bio: true,
        totalCitations: true,
        hIndex: true,
        i10Index: true,
        citations5Yr: true,
        hIndex5Yr: true,
        i10Index5Yr: true,
        googleScholarUrl: true,
        isClaimed: true
      }
    });

    const totalCount = await prisma.user.count({ where });

    const mappedScholars = scholars.map(s => {
      // Parse interests from bio if encoded as [Interests: ...]
      let parsedInterests: string[] = [];
      const match = s.bio?.match(/\[Interests:\s*([^\]]+)\]/i);
      if (match && match[1]) {
        parsedInterests = match[1].split(",").map((t: string) => t.trim()).filter(Boolean);
      }

      // Parse broad discipline from bio if encoded as [Discipline: ...]
      let disc = "Health Sciences";
      const discMatch = s.bio?.match(/\[Discipline:\s*([^\]]+)\]/i);
      if (discMatch && discMatch[1]) {
        disc = discMatch[1].trim();
      }

      return {
        ...s,
        researchInterests: parsedInterests,
        broadDiscipline: disc,
        articlesCount: Math.max(1, Math.round((s.hIndex || 1) * 2.5))
      };
    });

    return {
      scholars: mappedScholars,
      totalCount
    };
  } catch (err) {
    console.error("Error fetching initial scholars:", err);
    return {
      scholars: [],
      totalCount: 0
    };
  }
}
