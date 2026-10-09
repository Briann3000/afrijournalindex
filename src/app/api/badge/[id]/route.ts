import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { getDisciplines, assignQuartiles } from "../../../../lib/metrics";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const theme = searchParams.get("theme") || "dark";

    let label = "AFRIJOURNAL";
    let scoreText = "INDEXED";
    let rightBg = "#d4a04a";
    let rightText = "#000000";

    if (id) {
      const cleanId = id.replace(".svg", "").trim();
      const journal = await prisma.journal.findFirst({
        where: {
          OR: [
            { id: cleanId },
            { issn: cleanId },
            { eissn: cleanId },
            { name: { contains: cleanId } }
          ]
        },
        include: {
          reports: {
            orderBy: { year: "desc" },
            take: 1
          }
        }
      });

      if (journal) {
        const latest = journal.reports[0];
        const score = latest ? latest.standardScore : 0;
        
        // Compute quartile
        const primaryDisc = getDisciplines(journal.name, journal.description || "")[0] || "Multidisciplinary";
        const peerJournals = await prisma.journal.findMany({
          include: { reports: { orderBy: { year: "desc" }, take: 1 } }
        });
        const peers = peerJournals
          .filter(p => getDisciplines(p.name, p.description || "").includes(primaryDisc))
          .map(p => ({ id: p.id, score: p.reports[0]?.standardScore || 0 }));
        
        const ranked = assignQuartiles(peers.length > 0 ? peers : [{ id: journal.id, score }]);
        const myQuartile = ranked.find(r => r.id === journal.id)?.quartile || "Q2";

        scoreText = `AJIF ${score.toFixed(2)} • ${myQuartile}`;

        if (myQuartile === "Q1") {
          rightBg = "#d4a04a"; // Gold
          rightText = "#0a0a0f";
        } else if (myQuartile === "Q2") {
          rightBg = "#2563eb"; // Sapphire Blue
          rightText = "#ffffff";
        } else if (myQuartile === "Q3") {
          rightBg = "#059669"; // Emerald Green
          rightText = "#ffffff";
        } else {
          rightBg = "#4b5563"; // Slate
          rightText = "#ffffff";
        }
      }
    }

    const leftBg = theme === "light" ? "#2d3748" : "#111827";
    const leftWidth = 100;
    const rightWidth = scoreText.length * 8.5 + 20;
    const totalWidth = leftWidth + rightWidth;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="24" viewBox="0 0 ${totalWidth} 24" role="img" aria-label="${label}: ${scoreText}">
  <clipPath id="r">
    <rect width="${totalWidth}" height="24" rx="4" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${leftWidth}" height="24" fill="${leftBg}"/>
    <rect x="${leftWidth}" width="${rightWidth}" height="24" fill="${rightBg}"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif" text-rendering="geometricPrecision" font-size="11" font-weight="700">
    <text x="${leftWidth / 2 + 5}" y="16" fill="#f8f9fa" letter-spacing="0.5">${label}</text>
    <path d="M 12 6 L 16 8 L 16 13 C 16 15.5 14 17.5 12 18.5 C 10 17.5 8 15.5 8 13 L 8 8 Z" fill="#d4a04a"/>
    <text x="${leftWidth + rightWidth / 2}" y="16" fill="${rightText}">${scoreText}</text>
  </g>
</svg>`;

    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400"
      }
    });
  } catch (error) {
    console.error("Badge generation error:", error);
    const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="24" viewBox="0 0 160 24">
      <rect width="160" height="24" rx="4" fill="#1e293b"/>
      <text x="80" y="16" fill="#f8f9fa" font-size="11" font-family="sans-serif" text-anchor="middle">AFRIJOURNAL INDEX</text>
    </svg>`;
    return new Response(fallbackSvg, {
      headers: { "Content-Type": "image/svg+xml; charset=utf-8" }
    });
  }
}
