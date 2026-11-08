import { MetadataRoute } from "next";
import { prisma } from "../lib/db";
import { ALL_AFRICAN_COUNTRIES } from "./data/african-countries";
import { slugify, TOP_DISCIPLINE_SLUGS } from "./data/seo-slugs";

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
    // Fetch all indexed journals from the database
    const journals = await prisma.journal.findMany({
      where: {
        isIndexed: true,
      },
      select: {
        id: true,
        updatedAt: true,
      },
    });

    const journalRoutes: MetadataRoute.Sitemap = journals.map((j) => ({
      url: `${baseUrl}/journal/${j.id}`,
      lastModified: j.updatedAt || new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    }));

    // Fetch all scholars with an AfriScholar ID
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
      url: `${baseUrl}/scholar/${s.afriScholarId}`,
      lastModified: s.updatedAt || new Date(),
      changeFrequency: "weekly",
      priority: 0.85,
    }));

    // Generate crawlable paginated scholar directory routes
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

    return [...staticRoutes, ...countryRoutes, ...disciplineRoutes, ...journalRoutes, ...directoryRoutes, ...scholarRoutes];
  } catch {
    return [...staticRoutes, ...countryRoutes, ...disciplineRoutes];
  }
}
