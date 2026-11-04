/**
 * Official Pan-African Editorial Invitation Templates
 * Supports 5 languages: English, French, Swahili, Arabic, Portuguese
 */

export interface EmailTemplateParams {
  journalName: string;
  editorName: string;
  institutionName?: string;
  country: string;
  discipline: string;
  inviteToken: string;
  track: "FREE_INDEXING" | "INDEXED_CLAIM" | "OJS_INCUBATION";
  journalId?: string;
  baseUrl?: string;
}

export function generateInvitationEmail(params: EmailTemplateParams, lang: "en" | "fr" | "sw" | "ar" | "pt" = "en") {
  const base = params.baseUrl || "https://afrijournal.org";
  const applyUrl = `${base}/submit?invite=${params.inviteToken}`;
  const claimUrl = params.journalId ? `${base}/journal/${params.journalId}?claim=true` : `${base}/pricing`;
  const incubationUrl = `${base}/services?service=ojs-incubation&invite=${params.inviteToken}`;
  const unsubscribeUrl = `${base}/api/campaigns/unsubscribe?token=${params.inviteToken}`;

  // Track C: For ALREADY INDEXED African Journals (Claim & Metrics Access)
  if (params.track === "INDEXED_CLAIM") {
    const subjectMap = {
      en: `Your Journal "${params.journalName}" is Officially Indexed in AfriJournal Index (Access Citation Metrics)`,
      fr: `Votre revue "${params.journalName}" est officiellement indexée dans AfriJournal Index`,
      sw: `Jarida Lako la "${params.journalName}" Limeorodheshwa Rasmi kwenye AfriJournal Index`,
      ar: `تم إدراج مجلتكم "${params.journalName}" رسمياً في كشاف المجلات الأفريقية`,
      pt: `Sua revista "${params.journalName}" está oficialmente indexada no AfriJournal Index`
    };

    return {
      subject: subjectMap[lang] || subjectMap.en,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
          <div style="border-bottom: 2px solid #16a34a; padding-bottom: 16px; margin-bottom: 20px;">
            <h2 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 800;">AFRIJOURNAL INDEX & KENPRO</h2>
            <p style="color: #16a34a; margin: 4px 0 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Official Indexation Notice & Metrics Advisory</p>
          </div>

          <p style="font-size: 15px; line-height: 1.6;">Dear <strong>${params.editorName || "Editor-in-Chief & Publisher"}</strong>,</p>

          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            We are writing to confirm that <strong>${params.journalName}</strong> (${params.country}) is officially cataloged and indexed in the continental <strong>AfriJournal Citation Index (AJCI)</strong>.
          </p>

          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 14px 18px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; font-weight: 700; color: #14532d;">Live Features for Your Journal:</p>
            <ul style="margin: 8px 0 0; padding-left: 20px; font-size: 13px; color: #166534; line-height: 1.6;">
              <li><strong>Continental Citation Engine:</strong> Real-time citation graphs and mathematical 2-Year AJCI calculations.</li>
              <li><strong>Verified Publisher Portal:</strong> Claim your journal's administrative desk to update editorial boards and upload issues.</li>
              <li><strong>Official Accreditation Seals:</strong> Download certified vector badges and official indexing certificates for university accreditation.</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${claimUrl}" style="background: #16a34a; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">
              Access Citation Metrics & Claim Publisher Portal &rarr;
            </a>
          </div>

          <p style="font-size: 13px; line-height: 1.6; color: #64748b;">
            If you need assistance integrating automated OAI-PMH harvesting or issuing Crossref/Zenodo DOIs for back issues, our technical team is available.
          </p>

          <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
            <p style="margin: 0;"><strong>AfriJournal Editorial Directorate</strong> | Kenya Projects Organization (KENPRO)</p>
            <p style="margin: 4px 0 0;">Nairobi, Kenya • <a href="https://afrijournal.org" style="color: #16a34a; text-decoration: none;">afrijournal.org</a></p>
            <p style="margin: 8px 0 0;"><a href="${unsubscribeUrl}" style="color: #94a3b8; text-decoration: underline;">Unsubscribe from editorial notifications</a></p>
          </div>
        </div>
      `
    };
  }

  if (params.track === "OJS_INCUBATION") {
    // Track B: For institutions looking to setup/incubate an online journal
    return {
      subject: `Partnership Invitation: University Journal Setup & OJS Incubation - ${params.institutionName || params.journalName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
          <div style="border-bottom: 2px solid #0d9488; padding-bottom: 16px; margin-bottom: 20px;">
            <h2 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 800;">AFRIJOURNAL INDEX & KENPRO</h2>
            <p style="color: #0d9488; margin: 4px 0 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Pan-African Academic Indexing & Scholarly Infrastructure</p>
          </div>

          <p style="font-size: 15px; line-height: 1.6;">Dear <strong>${params.editorName || "Director of Research / University Leadership"}</strong>,</p>

          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            On behalf of the <strong>Kenya Projects Organization (KENPRO)</strong> and the <strong>AfriJournal Indexing Directorate</strong>, we are reaching out regarding academic publication infrastructure at <strong>${params.institutionName || params.country}</strong>.
          </p>

          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            Our continental audit shows that many African departments possess immense research output, yet lack a secure, internationally visible peer-review platform. Through our <strong>University Journal Setup & Online Incubation Service</strong>, we assist higher education institutions to:
          </p>

          <ul style="font-size: 14px; line-height: 1.6; color: #334155; padding-left: 20px;">
            <li>Deploy and host custom <strong>Open Journal Systems (OJS)</strong> platforms under your university domain.</li>
            <li>Train internal editors on double-blind peer-review, Crossref/Zenodo DOI assignment, and ethical compliance.</li>
            <li>Fast-track institutional publications for official continental indexing and citation matrix calculation.</li>
          </ul>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${incubationUrl}" style="background: #0d9488; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">
              Explore University Journal Setup & Incubation
            </a>
          </div>

          <p style="font-size: 13px; line-height: 1.6; color: #64748b;">
            We would be honored to schedule a virtual consultative session with your academic board or Directorate of Research to discuss incubation support.
          </p>

          <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
            <p style="margin: 0;"><strong>AfriJournal Indexing Directorate</strong> | Kenya Projects Organization (KENPRO)</p>
            <p style="margin: 4px 0 0;">Nairobi, Kenya • <a href="https://afrijournal.org" style="color: #0d9488; text-decoration: none;">afrijournal.org</a></p>
            <p style="margin: 8px 0 0;"><a href="${unsubscribeUrl}" style="color: #94a3b8; text-decoration: underline;">Unsubscribe from editorial notifications</a></p>
          </div>
        </div>
      `
    };
  }

  // Track A: Free Indexing Invitation for Existing Academic Journals
  const subjectMap = {
    en: `Official Invitation: Index "${params.journalName}" on AfriJournal Index (Free Listing)`,
    fr: `Invitation Officielle : Indexez "${params.journalName}" sur AfriJournal Index (Gratuit)`,
    sw: `Mwaliko Rasmi: Orodhesha na Uthibitishe Jarida la "${params.journalName}" kwenye AfriJournal Index (Bure)`,
    ar: `دعوة رسمية: إدراج مجلة "${params.journalName}" في كشاف المجلات الأفريقية (مجاناً)`,
    pt: `Convite Oficial: Indexe "${params.journalName}" no AfriJournal Index (Gratuito)`
  };

  return {
    subject: subjectMap[lang] || subjectMap.en,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
        <div style="border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 800;">AFRIJOURNAL CITATION INDEX</h2>
          <p style="color: #2563eb; margin: 4px 0 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Pan-African Scholarly Directory & Impact Engine</p>
        </div>

        <p style="font-size: 15px; line-height: 1.6;">Dear <strong>${params.editorName || "Editor-in-Chief & Editorial Board"}</strong>,</p>

        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
          We are pleased to invite <strong>${params.journalName}</strong> (published in <strong>${params.country}</strong>) to apply for official listing and indexing in the <strong>AfriJournal Citation Index (AJCI)</strong>.
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px 18px; margin: 20px 0; border-radius: 8px;">
          <p style="margin: 0; font-size: 14px; font-weight: 700; color: #0f172a;">Why Index with AfriJournal?</p>
          <ul style="margin: 8px 0 0; padding-left: 20px; font-size: 13px; color: #475569; line-height: 1.6;">
            <li><strong>100% Free Core Indexing:</strong> Listing, metadata ingestion, and mathematical 2-Year AJCI calculation carry zero fee.</li>
            <li><strong>Continental Visibility:</strong> Discovered by over 35,000 African scholars, research deans, and university librarians.</li>
            <li><strong>Disambiguated Author Citation Metrics:</strong> Real-time citation graphs linking your authors directly to verified Scholar IDs.</li>
          </ul>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
          Your editorial team can complete the formal application dossier in under 5 minutes using your direct editorial invitation link below:
        </p>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${applyUrl}" style="background: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">
            Index Your Journal for Free &rarr;
          </a>
        </div>

        <p style="font-size: 13px; line-height: 1.6; color: #64748b;">
          If <em>${params.journalName}</em> requires assistance meeting international criteria for Scopus, Web of Science, or DOAJ, our technical advisory desk is available to assist your editorial committee.
        </p>

        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
          <p style="margin: 0;"><strong>AfriJournal Editorial Directorate</strong> | Kenya Projects Organization (KENPRO)</p>
          <p style="margin: 4px 0 0;">Official Academic Secretariat • <a href="https://afrijournal.org" style="color: #2563eb; text-decoration: none;">afrijournal.org</a></p>
          <p style="margin: 8px 0 0;"><a href="${unsubscribeUrl}" style="color: #94a3b8; text-decoration: underline;">Unsubscribe from editorial notifications</a></p>
        </div>
      </div>
    `
  };
}
