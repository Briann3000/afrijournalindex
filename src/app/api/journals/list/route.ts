import { NextResponse } from "next/server";
import { pool } from "../../../../lib/db";

// In-memory cache for full journals list (15 minutes TTL)
let cachedFullList: any[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 15 * 60 * 1000;

export async function GET(request: Request) {
  let conn: any = null;
  try {
    const { searchParams } = new URL(request.url);
    const hasPagination = searchParams.has("page") || searchParams.has("limit");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
    const skip = (page - 1) * limit;
    const country = searchParams.get("country");
    const search = searchParams.get("q")?.trim();
    const forceRefresh = searchParams.get("refresh") === "true";

    // 1. Full unpaginated request (used by Browse page with client-side filters)
    if (!hasPagination && !country && !search) {
      const now = Date.now();
      if (!forceRefresh && cachedFullList && (now - lastCacheTime < CACHE_TTL_MS)) {
        return NextResponse.json({
          success: true,
          total: cachedFullList.length,
          journals: cachedFullList
        }, {
          headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" }
        });
      }

      conn = await pool.getConnection();
      const rows = await conn.query(`
        SELECT 
          j.id, j.name, j.issn, j.eissn, j.publisherName, j.country, j.frequency,
          j.websiteUrl, j.isIndexed, j.isScopusIndexed, j.isWosIndexed, j.description,
          r.standardScore AS score
        FROM journal j
        LEFT JOIN (
          SELECT journalId, standardScore
          FROM impactfactorreport
          WHERE (journalId, year) IN (
            SELECT journalId, MAX(year) FROM impactfactorreport GROUP BY journalId
          )
        ) r ON j.id = r.journalId
        ORDER BY j.name ASC
      `);

      cachedFullList = rows;
      lastCacheTime = now;

      return NextResponse.json({
        success: true,
        total: rows.length,
        journals: rows
      }, {
        headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" }
      });
    }

    // 2. Paginated or filtered request
    conn = await pool.getConnection();
    const whereClauses: string[] = [];
    const params: any[] = [];

    if (country) {
      whereClauses.push("LOWER(j.country) = LOWER(?)");
      params.push(country);
    }
    if (search) {
      whereClauses.push("(j.name LIKE ? OR j.issn LIKE ? OR j.eissn LIKE ? OR j.publisherName LIKE ?)");
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    if (hasPagination) {
      const countResult = await conn.query(`SELECT COUNT(*) AS total FROM journal j ${whereSql}`, params);
      const total = Number(countResult[0]?.total || 0);

      const pageParams = [...params, skip, limit];
      const rows = await conn.query(`
        SELECT 
          j.id, j.name, j.issn, j.eissn, j.publisherName, j.country, j.frequency,
          j.websiteUrl, j.isIndexed, j.isScopusIndexed, j.isWosIndexed, j.description,
          r.standardScore AS score
        FROM journal j
        LEFT JOIN (
          SELECT journalId, standardScore
          FROM impactfactorreport
          WHERE (journalId, year) IN (
            SELECT journalId, MAX(year) FROM impactfactorreport GROUP BY journalId
          )
        ) r ON j.id = r.journalId
        ${whereSql}
        ORDER BY j.name ASC
        LIMIT ?, ?
      `, pageParams);

      return NextResponse.json({
        success: true,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        journals: rows
      }, {
        headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800" }
      });
    }

    const rows = await conn.query(`
      SELECT 
        j.id, j.name, j.issn, j.eissn, j.publisherName, j.country, j.frequency,
        j.websiteUrl, j.isIndexed, j.isScopusIndexed, j.isWosIndexed, j.description,
        r.standardScore AS score
      FROM journal j
      LEFT JOIN (
        SELECT journalId, standardScore
        FROM impactfactorreport
        WHERE (journalId, year) IN (
          SELECT journalId, MAX(year) FROM impactfactorreport GROUP BY journalId
        )
      ) r ON j.id = r.journalId
      ${whereSql}
      ORDER BY j.name ASC
    `, params);

    return NextResponse.json({
      success: true,
      total: rows.length,
      journals: rows
    }, {
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800" }
    });
  } catch (error: any) {
    console.error("List journals error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}
