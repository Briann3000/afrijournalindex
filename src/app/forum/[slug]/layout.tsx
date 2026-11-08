import type { Metadata } from "next";
import { prisma } from "../../../lib/db";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const topic = await prisma.forumTopic.findUnique({
      where: { slug: decodeURIComponent(slug) },
      include: {
        author: {
          select: { name: true, institution: true },
        },
        category: {
          select: { name: true },
        },
      },
    });

    if (!topic) {
      return {
        title: "Discussion Topic | AfriScholarChat Forum",
        description: "Academic discussion on African scholarly publishing, open access, and research.",
      };
    }

    const cleanTitle = `${topic.title} | AfriScholarChat`;
    const snippet = topic.content
      ? topic.content.slice(0, 160).replace(/\s+/g, " ").trim() + "..."
      : `Discussion topic in ${topic.category.name} on AfriScholarChat Forum.`;

    const topicUrl = `https://afrijournalindexing.org/forum/${encodeURIComponent(topic.slug)}`;

    return {
      title: cleanTitle,
      description: snippet,
      openGraph: {
        title: cleanTitle,
        description: snippet,
        url: topicUrl,
        type: "article",
        publishedTime: topic.createdAt.toISOString(),
        modifiedTime: topic.updatedAt.toISOString(),
        authors: topic.author?.name ? [topic.author.name] : [],
      },
      alternates: {
        canonical: topicUrl,
      },
    };
  } catch {
    return {
      title: "Discussion Topic | AfriScholarChat Forum",
      description: "Academic discussion on African scholarly publishing, open access, and research.",
    };
  }
}

export default async function ThreadLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let jsonLd: any = null;

  try {
    const topic = await prisma.forumTopic.findUnique({
      where: { slug: decodeURIComponent(slug) },
      include: {
        author: {
          select: { name: true },
        },
        replies: {
          select: { id: true },
        },
      },
    });

    if (topic) {
      const canonicalUrl = `https://afrijournalindexing.org/forum/${encodeURIComponent(topic.slug)}`;
      const snippet = topic.content ? topic.content.slice(0, 200).replace(/\s+/g, " ").trim() : "";

      jsonLd = {
        "@context": "https://schema.org",
        "@type": "DiscussionForumPosting",
        "@id": canonicalUrl,
        headline: topic.title,
        articleBody: snippet,
        datePublished: topic.createdAt.toISOString(),
        dateModified: topic.updatedAt.toISOString(),
        author: {
          "@type": "Person",
          name: topic.author?.name || "Verified Scholar",
        },
        interactionStatistic: {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/CommentAction",
          userInteractionCount: topic.replies.length,
        },
      };
    }
  } catch {
    // Fail silently for crawler JSON-LD fallback
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
