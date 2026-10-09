import { NextResponse } from "next/server";
import { harvestOaiRecords, identifyOaiRepository } from "../../../../lib/oai-harvester";
import { prisma } from "../../../../lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { oaiUrl, journalId, autoSave } = body;

    if (!oaiUrl || typeof oaiUrl !== "string") {
      return NextResponse.json(
        { success: false, error: "Valid OAI-PMH Base URL is required." },
        { status: 400 }
      );
    }

    // 1. Identify repository
    const identify = await identifyOaiRepository(oaiUrl);
    if (!identify) {
      return NextResponse.json(
        { success: false, error: "Could not connect to OAI-PMH endpoint. Ensure the server supports OAI-PMH v2.0." },
        { status: 422 }
      );
    }

    // 2. Harvest records
    const harvest = await harvestOaiRecords(oaiUrl, 50);

    if (!harvest.success) {
      return NextResponse.json(
        { success: false, error: harvest.error || "Failed to harvest records." },
        { status: 500 }
      );
    }

    let savedCount = 0;

    // 3. Optional auto-save if journalId is passed
    if (autoSave && journalId && harvest.records.length > 0) {
      for (const rec of harvest.records) {
        try {
          const doi = rec.doi || `10.59235/oai.${journalId.substring(0, 6)}.${encodeURIComponent(rec.identifier.substring(0, 20))}`;
          const existing = await prisma.article.findUnique({ where: { doi } });
          if (!existing) {
            await prisma.article.create({
              data: {
                title: rec.title,
                doi,
                publishDate: new Date(rec.publishDate || Date.now()),
                journalId
              }
            });
            savedCount++;
          }
        } catch {
          // Skip on conflict
        }
      }
    }

    return NextResponse.json({
      success: true,
      repository: identify,
      totalHarvested: harvest.records.length,
      savedCount,
      articles: harvest.records
    });
  } catch (error: any) {
    console.error("OAI Harvesting API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error." },
      { status: 500 }
    );
  }
}
