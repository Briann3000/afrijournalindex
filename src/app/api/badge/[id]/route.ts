import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const theme = searchParams.get("theme") || "dark";

    const label = "AFRIJOURNAL INDEXING";
    let scoreText = "INDEXED";
    let rightBg = "#d97706";
    let rightText = "#0a0a0f";

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
        
        // Use precomputed quartile or derive directly
        const myQuartile = latest?.quartile || (score >= 0.5 ? "Q1" : score >= 0.25 ? "Q2" : score >= 0.08 ? "Q3" : score > 0 ? "Q4" : "Unrated");

        scoreText = `AJCI ${score.toFixed(2)} • ${myQuartile}`;

        if (myQuartile === "Q1") {
          rightBg = "#f59e0b"; // Warm Amber Gold
          rightText = "#0a0a0f";
        } else if (myQuartile === "Q2") {
          rightBg = "#2563eb"; // Royal Blue
          rightText = "#ffffff";
        } else if (myQuartile === "Q3") {
          rightBg = "#0284c7"; // Sky Blue
          rightText = "#ffffff";
        } else {
          rightBg = "#475569"; // Slate
          rightText = "#ffffff";
        }
      }
    }

    const leftBg = theme === "light" ? "#1e293b" : "#0f172a";
    const leftWidth = 176;
    const rightWidth = Math.max(76, Math.round(scoreText.length * 7.5 + 24));
    const totalWidth = leftWidth + rightWidth;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="26" viewBox="0 0 ${totalWidth} 26" role="img" aria-label="${label}: ${scoreText}">
  <defs>
    <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <clipPath id="r">
      <rect width="${totalWidth}" height="26" rx="5" fill="#fff"/>
    </clipPath>
  </defs>
  <g clip-path="url(#r)">
    <rect width="${leftWidth}" height="26" fill="${leftBg}"/>
    <rect x="${leftWidth}" width="${rightWidth}" height="26" fill="${rightBg}"/>
  </g>
  <!-- Official Circular AJI Logo Mark -->
  <g transform="translate(6, 4)">
    <circle cx="9" cy="9" r="9" fill="url(#amberGrad)" />
    <text x="9" y="12.5" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="7.5" font-weight="900" letter-spacing="-0.3" text-anchor="middle" fill="#121217">AJI</text>
  </g>
  <!-- Badge Labels -->
  <g font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" text-rendering="geometricPrecision" font-size="10" font-weight="700">
    <text x="30" y="16.5" fill="#f8fafc" letter-spacing="0.6">${label}</text>
    <text x="${leftWidth + rightWidth / 2}" y="16.5" fill="${rightText}" text-anchor="middle">${scoreText}</text>
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
    const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="26" viewBox="0 0 180 26">
      <rect width="180" height="26" rx="5" fill="#0f172a"/>
      <text x="90" y="16.5" fill="#f8fafc" font-size="10" font-weight="700" font-family="sans-serif" text-anchor="middle">AFRIJOURNAL INDEXING</text>
    </svg>`;
    return new Response(fallbackSvg, {
      headers: { "Content-Type": "image/svg+xml; charset=utf-8" }
    });
  }
}
