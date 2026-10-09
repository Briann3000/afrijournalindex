/**
 * OAI-PMH & Open Journal Systems (PKP OJS) Automated Harvester
 * Parses Dublin Core and CrossRef XML streams from academic university repositories.
 */

export interface OaiIdentifyResult {
  repositoryName: string;
  baseURL: string;
  protocolVersion: string;
  adminEmail?: string;
}

export interface OaiHarvestedRecord {
  identifier: string;
  title: string;
  creators: string[];
  description: string;
  publishDate: string;
  doi?: string;
  url?: string;
  publisher?: string;
  language?: string;
}

export interface OaiHarvestResult {
  success: boolean;
  repositoryName: string;
  records: OaiHarvestedRecord[];
  error?: string;
}

/**
 * Extract text between XML tags safely
 */
function extractTagContent(xml: string, tagName: string): string[] {
  // Matches both <dc:title>...</dc:title> and <title>...</title>
  const escapedTag = tagName.replace(':', '\\:');
  const regex = new RegExp(`<(?:[a-zA-Z0-9_-]+:)?${escapedTag}[^>]*>([\\s\\S]*?)<\\/(?:[a-zA-Z0-9_-]+:)?${escapedTag}>`, 'gi');
  const results: string[] = [];
  let match;

  while ((match = regex.exec(xml)) !== null) {
    let text = match[1]
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
    if (text) {
      results.push(text);
    }
  }

  return results;
}

/**
 * Identify an OAI-PMH endpoint
 */
export async function identifyOaiRepository(rawUrl: string): Promise<OaiIdentifyResult | null> {
  try {
    const url = new URL(rawUrl);
    url.searchParams.set('verb', 'Identify');

    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'AfriJournalIndex-Harvester/2.0 (African Scholarly Registry; https://afrijournalindex.org)'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) return null;
    const xml = await res.text();

    const repoNames = extractTagContent(xml, 'repositoryName');
    const baseUrls = extractTagContent(xml, 'baseURL');
    const protocolVersions = extractTagContent(xml, 'protocolVersion');
    const emails = extractTagContent(xml, 'adminEmail');

    return {
      repositoryName: repoNames[0] || 'OJS Academic Repository',
      baseURL: baseUrls[0] || rawUrl,
      protocolVersion: protocolVersions[0] || '2.0',
      adminEmail: emails[0]
    };
  } catch (error) {
    console.error('OAI Identify error:', error);
    return null;
  }
}

/**
 * Harvest records from an OAI-PMH / OJS repository
 */
export async function harvestOaiRecords(rawUrl: string, maxRecords = 50): Promise<OaiHarvestResult> {
  try {
    const identify = await identifyOaiRepository(rawUrl);
    const repoName = identify?.repositoryName || 'OJS Journal Repository';

    const url = new URL(rawUrl);
    url.searchParams.set('verb', 'ListRecords');
    url.searchParams.set('metadataPrefix', 'oai_dc');

    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'AfriJournalIndex-Harvester/2.0 (African Scholarly Registry; https://afrijournalindex.org)'
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!res.ok) {
      return {
        success: false,
        repositoryName: repoName,
        records: [],
        error: `OAI endpoint returned HTTP ${res.status}`
      };
    }

    const xml = await res.text();

    // Split by <record>...</record>
    const recordMatches = xml.match(/<record[\s\S]*?<\/record>/gi) || [];
    const harvested: OaiHarvestedRecord[] = [];

    for (let i = 0; i < Math.min(recordMatches.length, maxRecords); i++) {
      const recXml = recordMatches[i];

      // Check if deleted
      if (recXml.includes('status="deleted"')) continue;

      const identifiers = extractTagContent(recXml, 'identifier');
      const titles = extractTagContent(recXml, 'title');
      const creators = extractTagContent(recXml, 'creator');
      const descriptions = extractTagContent(recXml, 'description');
      const dates = extractTagContent(recXml, 'date');
      const publishers = extractTagContent(recXml, 'publisher');
      const languages = extractTagContent(recXml, 'language');

      if (titles.length === 0) continue;

      // Extract DOI or URL from identifiers
      let doi: string | undefined;
      let articleUrl: string | undefined;

      for (const id of identifiers) {
        if (id.includes('10.') && id.includes('/')) {
          const doiMatch = id.match(/10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/);
          if (doiMatch) doi = doiMatch[0];
        }
        if (id.startsWith('http://') || id.startsWith('https://')) {
          articleUrl = id;
        }
      }

      harvested.push({
        identifier: identifiers[0] || `oai-rec-${i + 1}`,
        title: titles[0],
        creators,
        description: descriptions[0] || '',
        publishDate: dates[0] || new Date().toISOString(),
        doi,
        url: articleUrl,
        publisher: publishers[0],
        language: languages[0] || 'en'
      });
    }

    return {
      success: true,
      repositoryName: repoName,
      records: harvested
    };
  } catch (error: any) {
    console.error('OAI Harvest error:', error);
    return {
      success: false,
      repositoryName: 'Unknown OJS Repository',
      records: [],
      error: error.message || 'Failed to harvest OAI endpoint.'
    };
  }
}
