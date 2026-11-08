import { MetadataRoute } from "next";
import { prisma } from "../lib/db";
import { ALL_AFRICAN_COUNTRIES } from "./data/african-countries";
import { slugify, TOP_DISCIPLINE_SLUGS } from "./data/seo-slugs";
import { getJournalUrl } from "../lib/journal-utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://afrijournalindexing.org";

  // Static high-priority pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/browse`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/rankings`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/scholars`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/institution`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/methodology`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/referee-finder`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/posts`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: `${baseUrl}/submit`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];

  // Country programmatic hubs (54 African Nations)
  const countryRoutes: MetadataRoute.Sitemap = ALL_AFRICAN_COUNTRIES.map((c) => ({
    url: `${baseUrl}/browse/${slugify(c.name)}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.88,
  }));

  // Discipline programmatic hubs
  const disciplineRoutes: MetadataRoute.Sitemap = Object.keys(TOP_DISCIPLINE_SLUGS).map((slug) => ({
    url: `${baseUrl}/rankings/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.88,
  }));

  try {
    // 1. Fetch all indexed journals from the database using canonical URLs
    const journals = await prisma.journal.findMany({
      where: {
        isIndexed: true,
      },
      select: {
        id: true,
        issn: true,
        eissn: true,
        updatedAt: true,
      },
    });

    const journalRoutes: MetadataRoute.Sitemap = journals.map((j) => ({
      url: `${baseUrl}${getJournalUrl(j)}`,
      lastModified: j.updatedAt || new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    }));

    // 2. Fetch all verified African institutions
    const institutions = await prisma.institution.findMany({
      select: {
        name: true,
        updatedAt: true,
      },
      orderBy: { totalPublications: "desc" },
    });

    const institutionRoutes: MetadataRoute.Sitemap = institutions.map((inst) => ({
      url: `${baseUrl}/institution?name=${encodeURIComponent(inst.name)}`,
      lastModified: inst.updatedAt || new Date(),
      changeFrequency: "weekly",
      priority: 0.86,
    }));

    // 3. Fetch all scholars with an AfriScholar ID
    const scholars = await prisma.user.findMany({
      where: {
        afriScholarId: { not: null },
      },
      select: {
        afriScholarId: true,
        updatedAt: true,
      },
      take: 5000,
    });

    const scholarRoutes: MetadataRoute.Sitemap = scholars.map((s) => ({
      url: `${baseUrl}/scholar/${encodeURIComponent(s.afriScholarId!)}`,
      lastModified: s.updatedAt || new Date(),
      changeFrequency: "weekly",
      priority: 0.85,
    }));

    // 4. Generate crawlable paginated scholar directory routes
    const totalPages = Math.ceil(scholars.length / 15);
    const directoryRoutes: MetadataRoute.Sitemap = [];
    for (let p = 2; p <= Math.min(totalPages, 160); p++) {
      directoryRoutes.push({
        url: `${baseUrl}/scholars?page=${p}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.8,
      });
    }

    // 5. Fetch high-impact and citable articles across indexed journals
    const articles = await prisma.article.findMany({
      select: {
        id: true,
        publishDate: true,
        createdAt: true,
      },
      orderBy: [
        { citationCount: "desc" },
        { publishDate: "desc" },
      ],
      take: 12000,
    });

    const articleRoutes: MetadataRoute.Sitemap = articles.map((a) => ({
      url: `${baseUrl}/article/${a.id}`,
      lastModified: a.publishDate || a.createdAt || new Date(),
      changeFrequency: "monthly",
      priority: 0.72,
    }));

    return [
      ...staticRoutes,
      ...countryRoutes,
      ...disciplineRoutes,
      ...journalRoutes,
      ...institutionRoutes,
      ...scholarRoutes,
      ...directoryRoutes,
      ...articleRoutes,
    ];
  } catch {
    return [...staticRoutes, ...countryRoutes, ...disciplineRoutes];
  }
}
