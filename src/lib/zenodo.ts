/**
 * Zenodo Automated DOI Minting Engine (CERN / DataCite)
 * 
 * Supports both Sandbox (staging) and Live (production) environments.
 * Strictly adheres to DataCite metadata schemas for peer-reviewed journal publications.
 */

export interface ZenodoCreator {
  name: string; // "FamilyName, GivenName" or "FullName"
  affiliation?: string;
  orcid?: string;
}

export interface ZenodoArticleMetadata {
  title: string;
  description: string; // Abstract or detailed summary (supports clean HTML / text)
  publication_date: string; // YYYY-MM-DD
  creators: ZenodoCreator[];
  journal_title: string;
  journal_volume?: string;
  journal_issue?: string;
  journal_pages?: string;
  journal_issn?: string;
  keywords?: string[];
  community_slug?: string; // e.g. "arjess" or "afrijournal-index"
  access_right?: "open" | "closed" | "embargoed" | "restricted";
  license?: string; // e.g. "cc-by-4.0"
}

export interface ZenodoDepositionResult {
  success: boolean;
  depositionId?: number;
  doi?: string;
  conceptDoi?: string;
  recordUrl?: string;
  doiUrl?: string;
  error?: string;
}

export class ZenodoClient {
  private baseUrl: string;
  private token: string;
  private isSandbox: boolean;

  constructor(options?: { useSandbox?: boolean; token?: string }) {
    this.isSandbox = options?.useSandbox ?? (process.env.ZENODO_USE_SANDBOX === "true");
    this.token = options?.token || (this.isSandbox 
      ? (process.env.ZENODO_SANDBOX_TOKEN || "") 
      : (process.env.ZENODO_LIVE_TOKEN || ""));

    this.baseUrl = this.isSandbox
      ? "https://sandbox.zenodo.org/api"
      : "https://zenodo.org/api";

    if (!this.token) {
      console.warn(`[ZenodoClient] Warning: No token configured for ${this.isSandbox ? "Sandbox" : "Production"} environment.`);
    }
  }

  getEnvironment() {
    return {
      isSandbox: this.isSandbox,
      baseUrl: this.baseUrl
    };
  }

  private getHeaders(extra?: Record<string, string>): Record<string, string> {
    return {
      "Authorization": `Bearer ${this.token}`,
      "User-Agent": "AfriJournalIndexBot/1.0 (+https://afrijournalindexing.org)",
      ...extra
    };
  }

  /**
   * Step 1: Create an empty draft deposition
   */
  async createDraft(): Promise<{ id: number; bucketUrl: string; reservedDoi?: string }> {
    const res = await fetch(`${this.baseUrl}/deposit/depositions`, {
      method: "POST",
      headers: this.getHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({})
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Zenodo createDraft failed (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return {
      id: data.id,
      bucketUrl: data.links?.bucket,
      reservedDoi: data.metadata?.prereserve_doi?.doi
    };
  }

  /**
   * Step 2: Stream PDF file from URL or Buffer into Zenodo bucket
   */
  async uploadFileFromUrl(bucketUrl: string, filename: string, fileUrl: string): Promise<any> {
    // 1. Fetch binary content
    const response = await fetch(fileUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AfriJournalBot/1.0"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to download article PDF from source URL (${response.status}): ${fileUrl}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Clean safe filename
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");

    // 2. Upload to Zenodo bucket via PUT
    // Zenodo InvenioRDM files API strictly requires application/octet-stream
    const uploadRes = await fetch(`${bucketUrl}/${encodeURIComponent(safeName)}`, {
      method: "PUT",
      headers: this.getHeaders({
        "Content-Type": "application/octet-stream",
        "Content-Length": buffer.length.toString()
      }),
      body: buffer
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`Zenodo bucket file upload failed (${uploadRes.status}): ${errText}`);
    }

    return await uploadRes.json();
  }

  /**
   * Step 3: Populate deposition metadata complying with DataCite Schema
   */
  async setMetadata(depositionId: number, meta: ZenodoArticleMetadata): Promise<any> {
    const creators = (meta.creators && meta.creators.length > 0)
      ? meta.creators.map(c => ({
          name: c.name,
          affiliation: c.affiliation || undefined,
          orcid: c.orcid || undefined
        }))
      : [{ name: "AfriJournal Author, Unspecified", affiliation: meta.journal_title }];

    const payload: any = {
      metadata: {
        title: meta.title,
        upload_type: "publication",
        publication_type: "article",
        description: meta.description || `<p>Research article published in <strong>${meta.journal_title}</strong>.</p>`,
        publication_date: meta.publication_date,
        creators,
        access_right: meta.access_right || "open",
        license: meta.license || "cc-by-4.0",
        keywords: meta.keywords || [meta.journal_title, "African Research", "Scholarly Publication"],
        journal_title: meta.journal_title
      }
    };

    if (meta.journal_volume) payload.metadata.journal_volume = meta.journal_volume;
    if (meta.journal_issue) payload.metadata.journal_issue = meta.journal_issue;
    if (meta.journal_pages) payload.metadata.journal_pages = meta.journal_pages;
    if (meta.journal_issn) payload.metadata.journal_issn = meta.journal_issn;

    if (meta.community_slug) {
      payload.metadata.communities = [{ identifier: meta.community_slug }];
    }

    const res = await fetch(`${this.baseUrl}/deposit/depositions/${depositionId}`, {
      method: "PUT",
      headers: this.getHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Zenodo setMetadata failed (${res.status}): ${errText}`);
    }

    return await res.json();
  }

  /**
   * Step 4: Publish deposition and finalize persistent DOI
   */
  async publish(depositionId: number): Promise<{ id: number; doi: string; conceptDoi?: string; recordUrl: string; doiUrl: string }> {
    const res = await fetch(`${this.baseUrl}/deposit/depositions/${depositionId}/actions/publish`, {
      method: "POST",
      headers: this.getHeaders({ "Content-Type": "application/json" })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Zenodo publish action failed (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const doi = data.doi || data.metadata?.doi;
    const host = this.isSandbox ? "https://sandbox.zenodo.org" : "https://zenodo.org";

    return {
      id: data.id,
      doi,
      conceptDoi: data.conceptdoi,
      recordUrl: `${host}/record/${data.id}`,
      doiUrl: `https://doi.org/${doi}`
    };
  }

  /**
   * Discard/Delete an unpublished draft deposition
   */
  async deleteDraft(depositionId: number): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/deposit/depositions/${depositionId}`, {
        method: "DELETE",
        headers: this.getHeaders()
      });
      return res.status === 204;
    } catch {
      return false;
    }
  }

  /**
   * End-to-End Minting Pipeline for an Article
   */
  async mintArticleDoi(params: {
    pdfUrl: string;
    filename?: string;
    metadata: ZenodoArticleMetadata;
    autoPublish?: boolean;
  }): Promise<ZenodoDepositionResult> {
    let depositionId: number | undefined;

    try {
      // 1. Create Draft
      const draft = await this.createDraft();
      depositionId = draft.id;

      // 2. Upload PDF
      const defaultFilename = `${params.metadata.title.slice(0, 50).toLowerCase().replace(/[^a-z0-9]/g, "-")}.pdf`;
      await this.uploadFileFromUrl(draft.bucketUrl, params.filename || defaultFilename, params.pdfUrl);

      // 3. Set Bibliographic Metadata
      await this.setMetadata(depositionId, params.metadata);

      // 4. Publish (or keep draft if autoPublish = false)
      if (params.autoPublish !== false) {
        const pub = await this.publish(depositionId);
        return {
          success: true,
          depositionId: pub.id,
          doi: pub.doi,
          conceptDoi: pub.conceptDoi,
          recordUrl: pub.recordUrl,
          doiUrl: pub.doiUrl
        };
      } else {
        const host = this.isSandbox ? "https://sandbox.zenodo.org" : "https://zenodo.org";
        return {
          success: true,
          depositionId,
          doi: draft.reservedDoi,
          recordUrl: `${host}/deposit/${depositionId}`
        };
      }
    } catch (err: any) {
      console.error("[ZenodoClient] Minting failed:", err);
      // Attempt clean up of draft on failure
      if (depositionId) {
        await this.deleteDraft(depositionId).catch(() => {});
      }
      return {
        success: false,
        depositionId,
        error: err.message || "Unknown error during Zenodo minting"
      };
    }
  }
}
