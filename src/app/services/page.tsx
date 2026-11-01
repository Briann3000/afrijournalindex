"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Header from "../Header";
import Footer from "../Footer";
import { useLang } from "../LangContext";

interface ServiceItem {
  id: string;
  title: string;
  category: "University & Press" | "Scholar & Author";
  badge: string;
  icon: string;
  desc: string;
  timeline: string;
  deliverables: string[];
  idealFor: string;
  requirements: string[];
}

export default function ServicesPage() {
  const { t } = useLang();

  const services: ServiceItem[] = [
    {
      id: "ojs_setup",
      title: "University Journal Setup & Online OJS Incubation",
      category: "University & Press",
      badge: "Turnkey Infrastructure",
      icon: "fa-solid fa-server",
      desc: "Complete deployment of Open Journal Systems (OJS 3.4+) on institutional cloud servers, custom responsive academic theme branding, and complete editorial workflow configuration for African universities and presses.",
      timeline: "2 to 3 Weeks",
      deliverables: [
        "Full OJS installation, database tuning & SSL domain mapping (e.g. journal.university.ac.ke)",
        "Custom academic branding with clean responsive layout for desktop and mobile",
        "Editorial board, author submission, and double-blind peer review pipeline configuration",
        "Automated Crossref DOI deposit plugin integration and XML generation",
        "Staff training workshops for Chief Editors, Section Editors, and Layout Copyeditors"
      ],
      idealFor: "African universities, faculty research directorates, and scientific societies launching new or digitizing print-only journals.",
      requirements: [
        "Domain name and institutional server credentials (or cloud hosting through our managed servers)",
        "Journal editorial board member roster and aims/scope documentation",
        "Author guidelines, peer review policy, and publication ethics statement"
      ]
    },
    {
      id: "indexing_ajci",
      title: "Journal Indexing & AJCI Citation Matrix Audit",
      category: "University & Press",
      badge: "Continental Accreditation",
      icon: "fa-solid fa-chart-line",
      desc: "Evaluation and official indexing into the African Journal Citation Index (AJCI), providing 2-Year Standard AJCI scoring, 3-Year Citation Average (3-YCA), and regional citation provenance audits.",
      timeline: "5 to 10 Business Days",
      deliverables: [
        "Complete 36-point editorial compliance & peer review audit",
        "Calculation of verified annual AJCI standard scores and quartiles (Q1–Q4)",
        "Automated OAI-PMH metadata harvesting into continental repositories",
        "Official Indexing Certificate and embeddable quality badge for journal website"
      ],
      idealFor: "Active African journals seeking transparent, bias-free regional citation recognition and increased continental visibility.",
      requirements: [
        "Minimum 2 consecutive years of published issues",
        "Functional journal website with persistent open-access full-text PDFs",
        "Published publication ethics statement and active editorial board list"
      ]
    },
    {
      id: "scopus_prep",
      title: "Accreditation Dossier: Scopus, Web of Science & DOAJ",
      category: "University & Press",
      badge: "Global Indexing",
      icon: "fa-solid fa-award",
      desc: "Specialized editorial advisory and application dossier preparation for African journals targeting admission to Scopus (CSAB), Clarivate Web of Science (ESCI), and the Directory of Open Access Journals (DOAJ Seal).",
      timeline: "4 to 6 Weeks",
      deliverables: [
        "Pre-application gap analysis against Scopus Content Selection & Advisory Board criteria",
        "Editorial board geographic diversity optimization & international referee recruitment",
        "Reference linking, Crossref XML validation, and citation audit",
        "Drafting and submitting the official CSAB application portfolio"
      ],
      idealFor: "Established African journals ready to compete on international ranking indices.",
      requirements: [
        "Registered ISSN with confirmed publication history of at least 3 years",
        "English abstracts and titles for all published articles",
        "Digital Object Identifiers (DOIs) minted on all published papers"
      ]
    },
    {
      id: "rankings_advisory",
      title: "Institutional Research Rankings & Bibliometric Advisory",
      category: "University & Press",
      badge: "University Leadership",
      icon: "fa-solid fa-ranking-star",
      desc: "Comprehensive scientometric benchmarking for university vice-chancellors, deputy vice-chancellors of research, and directors of intellectual property across African institutions.",
      timeline: "Custom Consultation",
      deliverables: [
        "Institutional publication volume, citation impact, and h-index audits",
        "Benchmarking against top African university research consortia",
        "Strategic roadmap to improve Times Higher Education (THE) and QS Africa rankings",
        "Faculty publication incentives and research output optimization framework"
      ],
      idealFor: "University executive leadership, DVCs of Research & Innovation, and Institutional Planning Directorates.",
      requirements: [
        "List of faculties, departmental affiliations, and active research centers",
        "Historical research output reports or institutional repository access"
      ]
    },
    {
      id: "afrischolar_id",
      title: "AfriScholar Indexing & Verified ID (ASID)",
      category: "Scholar & Author",
      badge: "Scholar Registry",
      icon: "fa-solid fa-id-card-clip",
      desc: "Continental academic researcher verification linking your ORCID, published papers, institutional affiliations, and scientometrics into a single verified scholar profile.",
      timeline: "24 to 48 Hours",
      deliverables: [
        "Unique continental ASID identifier and verified researcher badge",
        "Automated citation tracking across OpenAlex, Google Scholar, and AJCI",
        "Public researcher portfolio showcase for grant committees and fellowship applications",
        "Instant notification when your research is cited by other African scholars"
      ],
      idealFor: "Postgraduate researchers, lecturers, and professors across African universities.",
      requirements: [
        "Active institutional email address or ORCID iD",
        "List of published papers or Google Scholar profile URL"
      ]
    },
    {
      id: "peer_review",
      title: "Independent Pre-Submission Peer Review & Referee Matching",
      category: "Scholar & Author",
      badge: "Quality Assurance",
      icon: "fa-solid fa-user-check",
      desc: "Connect with verified African doctoral referees and international subject editors for rigorous double-blind critique before submitting to top-tier indexed journals.",
      timeline: "10 to 14 Business Days",
      deliverables: [
        "Comprehensive 4-part referee critique report",
        "Methodological soundness, statistical validity, and literature gap analysis",
        "Copyediting recommendations for academic clarity and syntax",
        "Clear recommendation on target journal fit and indexing tier"
      ],
      idealFor: "Researchers, PhD candidates, and faculty members seeking constructive feedback prior to high-stakes journal submission.",
      requirements: [
        "Complete blinded manuscript (without author names or institutional identifiers)",
        "Declared subject discipline and target journal list"
      ]
    },
    {
      id: "author_training",
      title: "Scholarly Writing & High-Impact Publication Workshops",
      category: "Scholar & Author",
      badge: "Capacity Building",
      icon: "fa-solid fa-chalkboard-user",
      desc: "Hands-on virtual and on-campus training modules for university faculty, postgraduate students, and editorial teams on navigating international indexing, avoiding predatory publishers, and writing high-impact papers.",
      timeline: "1 to 3 Day Sessions",
      deliverables: [
        "Interactive workshops on IMRaD manuscript structure and research argumentation",
        "Hands-on guide to Scopus and WoS acceptance criteria",
        "Training on Open Access APC waiver applications and Creative Commons licensing",
        "Certificate of Academic Publishing Training for all attendees"
      ],
      idealFor: "University graduate schools, academic departments, research institutes, and university presses.",
      requirements: [
        "Target audience headcount and preferred format (Virtual via Zoom/Teams or In-Person)"
      ]
    }
  ];

  const [activeServiceId, setActiveServiceId] = useState<string>("ojs_setup");

  // Sync hash with active service on load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (hash && services.some(s => s.id === hash)) {
        setActiveServiceId(hash);
      }
    }
  }, []);

  const activeService = services.find(s => s.id === activeServiceId) || services[0];

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    institution: "",
    journalOrDept: "",
    notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSelectService = (id: string) => {
    setActiveServiceId(id);
    setIsSubmitted(false);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${id}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({
        name: "",
        email: "",
        institution: "",
        journalOrDept: "",
        notes: ""
      });
    }, 600);
  };

  return (
    <div className="page-wrapper" style={{ padding: 0 }}>
      <Header activePage="services" />

      <main className="container reading-container" style={{ padding: "3rem clamp(1rem, 2vw, 1.5rem) 5rem", maxWidth: "1200px" }}>
        {/* Breadcrumb Navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
          <Link href="/" style={{ color: "var(--color-primary)", textDecoration: "none" }}>{t?.nav?.home || "Home"}</Link>
          <span>/</span>
          <span style={{ color: "var(--color-text-main)", fontWeight: 600 }}>{t?.nav?.services || "Services"}</span>
        </div>

        {/* Page Header */}
        <header style={{ marginBottom: "2.5rem", borderBottom: "1px solid var(--color-border)", paddingBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.3rem)", fontWeight: 800, margin: "0 0 0.5rem", color: "var(--color-navy)", letterSpacing: "-0.01em" }}>
            Academic Publishing &amp; Research Advisory Services
          </h1>
          <p style={{ fontSize: "0.98rem", color: "var(--color-text-muted)", maxWidth: "820px", margin: 0, lineHeight: 1.6 }}>
            Specialized solutions for African universities, research presses, and authors—from turnkey OJS journal incubation and Crossref DOI minting to Scopus accreditation and pre-submission peer review.
          </p>
        </header>

        {/* Sidebar + Adjacent Content Master-Detail Layout */}
        <div className="services-master-grid">
          
          {/* LEFT SIDEBAR: SERVICES MENU */}
          <aside style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ background: "#ffffff", padding: "1.25rem 1rem", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", color: "var(--color-primary)", letterSpacing: "0.06em", padding: "0 0.5rem 0.6rem" }}>
                Institutional Solutions
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {services.filter(s => s.category === "University & Press").map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectService(s.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "0.6rem 0.75rem",
                      borderRadius: "6px",
                      border: "none",
                      background: activeServiceId === s.id ? "#f1f5f9" : "transparent",
                      color: activeServiceId === s.id ? "var(--color-navy)" : "#475569",
                      fontWeight: activeServiceId === s.id ? 700 : 500,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.15s ease",
                      borderLeft: activeServiceId === s.id ? "3px solid var(--color-primary)" : "3px solid transparent"
                    }}
                  >
                    <i className={s.icon} style={{ width: "16px", color: activeServiceId === s.id ? "var(--color-primary)" : "#94a3b8", fontSize: "0.85rem", textAlign: "center" }}></i>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</span>
                  </button>
                ))}
              </div>

              <div style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", color: "var(--color-primary)", letterSpacing: "0.06em", padding: "1.25rem 0.5rem 0.6rem" }}>
                Author &amp; Scholar Solutions
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {services.filter(s => s.category === "Scholar & Author").map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectService(s.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "0.6rem 0.75rem",
                      borderRadius: "6px",
                      border: "none",
                      background: activeServiceId === s.id ? "#f1f5f9" : "transparent",
                      color: activeServiceId === s.id ? "var(--color-navy)" : "#475569",
                      fontWeight: activeServiceId === s.id ? 700 : 500,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.15s ease",
                      borderLeft: activeServiceId === s.id ? "3px solid var(--color-primary)" : "3px solid transparent"
                    }}
                  >
                    <i className={s.icon} style={{ width: "16px", color: activeServiceId === s.id ? "var(--color-primary)" : "#94a3b8", fontSize: "0.85rem", textAlign: "center" }}></i>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Contact Info */}
            <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-navy)", marginBottom: "0.35rem" }}>
                Need Custom Advisory?
              </div>
              <p style={{ fontSize: "0.8rem", color: "#64748b", lineHeight: 1.5, margin: "0 0 0.75rem" }}>
                Contact the AfriJournal editorial team directly for bespoke institutional partnerships.
              </p>
              <a href="mailto:afrijournalindex@gmail.com" style={{ fontSize: "0.82rem", color: "var(--color-primary)", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <i className="fa-solid fa-envelope"></i>
                afrijournalindex@gmail.com
              </a>
            </div>
          </aside>

          {/* ADJACENT MAIN PANEL: ACTIVE SERVICE DETAILS & FORM */}
          <section style={{ background: "#ffffff", padding: "2rem", borderRadius: "10px", border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            {/* Service Header */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-primary)", letterSpacing: "0.04em" }}>
                  {activeService.category}
                </span>
                <span style={{ fontSize: "0.75rem", color: "#475569", background: "#f1f5f9", padding: "0.2rem 0.65rem", borderRadius: "4px", fontWeight: 600 }}>
                  <i className="fa-regular fa-clock" style={{ marginRight: "4px" }}></i> Est. Timeline: {activeService.timeline}
                </span>
              </div>

              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-navy)", margin: "0 0 0.85rem", lineHeight: 1.3 }}>
                {activeService.title}
              </h2>

              <p style={{ fontSize: "0.98rem", color: "#334155", lineHeight: 1.7, margin: 0 }}>
                {activeService.desc}
              </p>
            </div>

            {/* Target Audience & Deliverables */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-navy)", marginBottom: "0.6rem" }}>
                  Key Deliverables &amp; Scope of Work
                </h3>
                <ul style={{ paddingLeft: "1.25rem", margin: 0, display: "flex", flexDirection: "column", gap: "0.45rem", fontSize: "0.92rem", color: "#334155", lineHeight: 1.65 }}>
                  {activeService.deliverables.map((d, idx) => (
                    <li key={idx}>{d}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-navy)", marginBottom: "0.4rem" }}>
                  Ideal For
                </h3>
                <p style={{ margin: 0, fontSize: "0.92rem", color: "#475569", lineHeight: 1.6 }}>
                  {activeService.idealFor}
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-navy)", marginBottom: "0.5rem" }}>
                  Requirements to Initiate
                </h3>
                <ul style={{ paddingLeft: "1.25rem", margin: 0, display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.9rem", color: "#475569" }}>
                  {activeService.requirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* In-Panel Request / Consultation Form */}
            <div style={{ marginTop: "1rem", paddingTop: "1.5rem", borderTop: "1px solid var(--color-border)" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-navy)", margin: "0 0 0.4rem" }}>
                Request Consultation for this Service
              </h3>
              <p style={{ fontSize: "0.88rem", color: "var(--color-text-muted)", margin: "0 0 1.25rem" }}>
                Submit your project specifications. An AfriJournal senior publishing advisor will review your requirements and reach out within 24 business hours.
              </p>

              {isSubmitted ? (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "1.25rem", borderRadius: "8px", color: "#166534" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.25rem" }}>
                    <i className="fa-solid fa-circle-check" style={{ marginRight: "6px" }}></i>
                    Inquiry Received Successfully
                  </div>
                  <p style={{ fontSize: "0.85rem", margin: 0, lineHeight: 1.5 }}>
                    Thank you, your request regarding <strong>{activeService.title}</strong> has been logged. Our advisory desk will contact you at your institutional email.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--color-navy)", marginBottom: "4px" }}>
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Prof. / Dr. / Author Name"
                        style={{
                          width: "100%",
                          padding: "0.55rem 0.75rem",
                          borderRadius: "6px",
                          border: "1px solid var(--color-border)",
                          fontSize: "0.9rem",
                          outline: "none"
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--color-navy)", marginBottom: "4px" }}>
                        Institutional Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="name@university.ac.ke"
                        style={{
                          width: "100%",
                          padding: "0.55rem 0.75rem",
                          borderRadius: "6px",
                          border: "1px solid var(--color-border)",
                          fontSize: "0.9rem",
                          outline: "none"
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--color-navy)", marginBottom: "4px" }}>
                        University / Institution *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.institution}
                        onChange={e => setFormData({ ...formData, institution: e.target.value })}
                        placeholder="e.g. University of Nairobi, Makerere, UCT"
                        style={{
                          width: "100%",
                          padding: "0.55rem 0.75rem",
                          borderRadius: "6px",
                          border: "1px solid var(--color-border)",
                          fontSize: "0.9rem",
                          outline: "none"
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--color-navy)", marginBottom: "4px" }}>
                        Journal Title / Department
                      </label>
                      <input
                        type="text"
                        value={formData.journalOrDept}
                        onChange={e => setFormData({ ...formData, journalOrDept: e.target.value })}
                        placeholder="e.g. African Journal of Social Sciences"
                        style={{
                          width: "100%",
                          padding: "0.55rem 0.75rem",
                          borderRadius: "6px",
                          border: "1px solid var(--color-border)",
                          fontSize: "0.9rem",
                          outline: "none"
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--color-navy)", marginBottom: "4px" }}>
                      Project Scope &amp; Specific Requirements
                    </label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Describe your current status, timeline, or key objectives..."
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        borderRadius: "6px",
                        border: "1px solid var(--color-border)",
                        fontSize: "0.9rem",
                        outline: "none",
                        fontFamily: "inherit"
                      }}
                    />
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      style={{
                        padding: "0.6rem 1.5rem",
                        background: "var(--color-primary)",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "0.88rem",
                        fontWeight: 700,
                        cursor: isSubmitting ? "wait" : "pointer"
                      }}
                    >
                      {isSubmitting ? "Transmitting Request..." : `Submit Request for ${activeService.title}`}
                    </button>
                  </div>
                </form>
              )}
            </div>

          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
