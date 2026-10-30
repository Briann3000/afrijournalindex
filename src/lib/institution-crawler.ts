/**
 * Institutional Website Crawler & Metadata Extractor
 * Automatically inspects an institutional domain/URL to extract:
 * - Institutional Crest / Logo (via OpenGraph, Twitter card, apple-touch-icon, standard favicon, or logo classes)
 * - Formal Institution Name and Meta Description
 * - Contact points / Emails / Phone
 * - Hosted Journal and Repository Portals (OJS, DSpace, EPrints)
 */

import https from "https";
import http from "http";

export interface MappedInstitutionData {
  url: string;
  domain: string;
  title: string | null;
  description: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  contactEmail: string | null;
  journalPortals: string[];
}

function resolveUrl(baseUrl: string, relativePath: string | null): string | null {
  if (!relativePath) return null;
  try {
    const trimmed = relativePath.trim();
    if (trimmed.startsWith("data:")) return null; // Avoid massive inline data URIs
    return new URL(trimmed, baseUrl).href;
  } catch {
    return null;
  }
}

async function fetchHtmlWithSslFallback(targetUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const isHttps = targetUrl.startsWith("https://");
    const client = isHttps ? https : http;

    const req = client.get(
      targetUrl,
      {
        rejectUnauthorized: false, // Handle expired or self-signed academic certificates gracefully
        headers: {
          "User-Agent": "AfriJournal-Institutional-Crawler/1.0 (+https://afrijournal.org)",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        },
        timeout: 8000
      },
      (res) => {
        // Handle redirect
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const redirectUrl = resolveUrl(targetUrl, res.headers.location);
          if (redirectUrl) {
            return resolve(fetchHtmlWithSslFallback(redirectUrl));
          }
        }

        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      }
    );

    req.on("error", (err) => {
      // If HTTPS fails, try HTTP fallback
      if (isHttps) {
        const httpUrl = targetUrl.replace("https://", "http://");
        http
          .get(
            httpUrl,
            {
              headers: {
                "User-Agent": "AfriJournal-Institutional-Crawler/1.0 (+https://afrijournal.org)"
              },
              timeout: 8000
            },
            (res) => {
              let data = "";
              res.on("data", (chunk) => (data += chunk));
              res.on("end", () => resolve(data));
            }
          )
          .on("error", () => reject(err));
      } else {
        reject(err);
      }
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out connecting to institution website."));
    });
  });
}

export async function crawlInstitutionalWebsite(targetUrl: string): Promise<MappedInstitutionData> {
  let url = targetUrl.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }

  const parsedUrl = new URL(url);
  const domain = parsedUrl.hostname.replace(/^www\./, "").toLowerCase();

  try {
    const html = await fetchHtmlWithSslFallback(url);

    // 1. Title Extraction
    let title: string | null = null;
    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
                         html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:title["']/i);
    if (ogTitleMatch) {
      title = ogTitleMatch[1];
    } else {
      const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleTag) title = titleTag[1].trim();
    }

    // Clean title
    if (title) {
      title = title.replace(/\s*[|\-–—]\s*(Home|Official Website|Portal|Index).*$/i, "").trim();
    }

    // 2. Description Extraction
    let description: string | null = null;
    const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
                        html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ||
                        html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i);
    if (ogDescMatch) {
      description = ogDescMatch[1].trim();
    }

    // 3. Logo & Crest Extraction (Prioritized)
    let logoUrl: string | null = null;

    // Check OpenGraph Image
    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                         html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
    if (ogImageMatch) {
      logoUrl = resolveUrl(url, ogImageMatch[1]);
    }

    // Check Schema.org logo in JSON-LD
    if (!logoUrl) {
      const jsonLdMatches = html.match(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
      if (jsonLdMatches) {
        for (const scriptTag of jsonLdMatches) {
          try {
            const raw = scriptTag.replace(/<script[^>]*>|<\/script>/gi, "");
            const parsed = JSON.parse(raw);
            const candidate = parsed.logo?.url || parsed.logo || (Array.isArray(parsed["@graph"]) ? parsed["@graph"].find((g: any) => g.logo)?.logo?.url : null);
            if (candidate && typeof candidate === "string") {
              logoUrl = resolveUrl(url, candidate);
              break;
            }
          } catch {}
        }
      }
    }

    // Check specific <img> with id/class containing "logo" or "crest"
    if (!logoUrl) {
      const logoImgMatch = html.match(/<img[^>]+(?:class|id)=["'][^"']*(?:logo|crest|emblem)[^"']*["'][^>]+src=["']([^"']+)["']/i) ||
                           html.match(/<img[^>]+src=["']([^"']+)["'][^>]+(?:class|id)=["'][^"']*(?:logo|crest|emblem)[^"']*["']/i);
      if (logoImgMatch) {
        logoUrl = resolveUrl(url, logoImgMatch[1]);
      }
    }

    // 4. Apple Touch Icon / Large Favicon
    let faviconUrl: string | null = null;
    const appleIconMatch = html.match(/<link\s+[^>]*rel=["'](?:apple-touch-icon|icon)["'][^>]+href=["']([^"']+)["']/i) ||
                           html.match(/<link\s+[^>]*href=["']([^"']+)["'][^>]+rel=["'](?:apple-touch-icon|icon)["']/i);
    if (appleIconMatch) {
      faviconUrl = resolveUrl(url, appleIconMatch[1]);
    } else {
      faviconUrl = resolveUrl(url, "/favicon.ico");
    }

    if (!logoUrl) {
      logoUrl = faviconUrl;
    }

    // 5. Contact Email Extraction
    let contactEmail: string | null = null;
    const mailtoMatch = html.match(/href=["']mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})["']/i);
    if (mailtoMatch) {
      contactEmail = mailtoMatch[1].toLowerCase();
    } else {
      const rawEmailMatch = html.match(/\b([a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)*${domain.replace('.', '\\.')})\b/i);
      if (rawEmailMatch) {
        contactEmail = rawEmailMatch[1].toLowerCase();
      }
    }

    // 6. Hosted Journal & Repository Portals
    const journalPortals: string[] = [];
    const linkMatches = html.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi);
    for (const match of linkMatches) {
      const target = match[1].toLowerCase();
      if (
        (target.includes("/journal") || target.includes("/ojs") || target.includes("/repository") || target.includes("arjess.org")) &&
        !journalPortals.includes(match[1]) &&
        journalPortals.length < 5
      ) {
        journalPortals.push(match[1]);
      }
    }

    return {
      url,
      domain,
      title,
      description,
      logoUrl,
      faviconUrl,
      contactEmail,
      journalPortals
    };

  } catch (error: any) {
    throw new Error(`Could not map website ${url}: ${error.message}`);
  }
}
