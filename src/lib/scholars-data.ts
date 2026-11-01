import { prisma } from "./db";
import { ALL_AFRICAN_COUNTRIES } from "../app/data/african-countries";

export interface InitialScholarsData {
  scholars: any[];
  totalCount: number;
}

export async function getInitialScholars(limit = 15): Promise<InitialScholarsData> {
  try {
    const scholars = await prisma.user.findMany({
      where: {
        role: "RESEARCHER",
        totalCitations: { gt: 0 }
      },
      take: limit,
      orderBy: {
        totalCitations: "desc"
      },
      select: {
        id: true,
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

    const totalCount = await prisma.user.count({
      where: { role: "RESEARCHER" }
    });

    return {
      scholars,
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
