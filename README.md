# AfriJournal Citation Index (AJCI)
### Open Continental Indexing, Bibliometric Authority & Standardized Peer Review Portal for African Scholarship

[![Next.js](https://img.shields.io/badge/Next.js-16.2.10-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.8.0-2d3748?logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-Proprietary%20%2F%20KENPRO-16a34a)](#license)

**AfriJournal Citation Index (AJCI)**, developed in collaboration with the **Kenya Projects Organization (KENPRO)**, is the premier open continental scholarly indexing repository, bibliometric evaluation authority, and double-blind peer review infrastructure dedicated to advancing and validating peer-reviewed academic research originating from Africa.

---

## Table of Contents

- [Core Platform Capabilities](#core-platform-capabilities)
  - [1. Continental Bibliometric Citation Engine](#1-continental-bibliometric-citation-engine)
  - [2. Automated Journal Compliance & Accreditation](#2-automated-journal-compliance--accreditation)
  - [3. Pan-African Peer Review Suite](#3-pan-african-peer-review-suite)
  - [4. Scholar Profiles & Academic Portfolios](#4-scholar-profiles--academic-portfolios)
  - [5. Institutional Research Intelligence](#5-institutional-research-intelligence)
  - [6. Continental Scholarly Community & Forum](#6-continental-scholarly-community--forum)
- [System Architecture & Technology Stack](#system-architecture--technology-stack)
- [Directory Structure](#directory-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Installation](#local-installation)
  - [Database Setup](#database-setup)
  - [Development & Production Build](#development--production-build)
- [Automation & Background Crons](#automation--background-crons)
- [Production Deployment](#production-deployment)
- [Contributing & Governance](#contributing--governance)
- [License & Institutional Attribution](#license--institutional-attribution)

---

## Core Platform Capabilities

### 1. Continental Bibliometric Citation Engine
* **2-Year AJCI Citation Score**: Mathematically calculated citation metric based on verified citations received in an evaluation period divided by eligible citable articles published in the preceding two calendar years.
* **Regional Representation Quotient (RRQ)**: A standalone diversity and provenance score measuring the ratio of pan-African institutional citations versus global cross-continental references.
* **Cartel Defense & Citation Integrity Screening**: Graph-based reciprocal citation audits that detect anomalous citation stacking rings, circular reciprocal cartels, and coercive editor citations, preserving scientific integrity without synthetic manipulation.
* **Discipline Leaderboards**: Real-time ranking across all scientific disciplines, featuring authentic percentiles and category quartiles.

### 2. Automated Journal Compliance & Accreditation
* **6-Point Standards Check**: Automated ingestion verifying active ISSN/eISSN checksums, SSL/HTTPS endpoints, editorial periodicity, Crossref DOI registration coverage, peer review policy disclosures, and DOAJ compliance.
* **OAI-PMH & Crossref Harvesting Engine**: Deep back-catalog ingestion using standard OAI-PMH `resumptionToken` loops, metadata harvesting, and PDF link discovery.
* **Dynamic Accreditation Badges**: Real-time vector SVG badges (`/api/badge/[id].svg`) that editors embed on journal websites to display verified indexing status.
* **12-Page Institutional Vector PDF Dossier**: Client-side generation of comprehensive institutional accreditation dossiers including mathematical score ledgers, Scopus CSAB pre-audit checklists, and OJS technical remediation recipes.

### 3. Pan-African Peer Review Suite
* **Manuscript Lodging & Concept Matching**: NLP concept extraction from titles and abstracts matching against active African researchers cataloged across OpenAlex and regional indices.
* **Conflict of Interest (COI) Firewall**: Enforces ethical screening by eliminating scholars sharing institutional affiliations or documented co-authorships with the submitting author.
* **48-Hour Sequential Auto-Cascade**: Automatic sequential dispatching of review invitations. If an invited referee fails to respond within 48 hours, the system advances automatically to the next matched candidate in the queue.
* **Tokenized Direct Reviewer Portal (`/reviewer/invite/[token]`)**: Secure, 1-click accept/decline landing route allowing external referees to accept evaluations, report COPE-compliant conflicts, or nominate alternate colleagues without authentication friction.
* **Author Revision Workflow (`/review/track/[code]`)**: Track double-blind evaluation progress in real time, view formal evaluation rubrics across 5 standard pillars, and submit revised manuscripts alongside author rebuttals.
* **Cryptographic Verification & Review Certificates**: Generates verifiable digital peer review certificates with CPD credentials and logs authenticated contributions directly to the referee's public scholar profile.

### 4. Scholar Profiles & Academic Portfolios
* **Disambiguated Scholar Profiles**: Aggregated profiles displaying authenticated h-index, i10-index, total citation counts, and verified ORCID links.
* **Comprehensive Academic Dossiers**: Portfolios showcasing published books and monographs, technical consultancies, registered patents and innovations, and academic media appearances.
* **Word (.docx) Portfolio Parser**: Automated client-side extraction of curriculum vitae documents, allowing scholars to populate their complete research ledger in seconds.
* **Verified Peer Reviewer Ledger**: Transparent public verification of completed double-blind reviews for indexed African publications.

### 5. Institutional Research Intelligence
* **Continental University Leaderboard**: Aggregated bibliometric rankings of African universities and national research institutes.
* **Automated Institutional Crest & Domain Mapping**: Resolves institutional websites, verifies domains, and aggregates research faculty outputs under singular university profiles.

### 6. Continental Scholarly Community & Forum
* **Peer Community Exchange**: Categorized academic discussion boards covering journal publishing standards, predatory warning alerts, peer review ethics, and research grants.
* **Multilingual Localization**: Native dynamic localization across five major continental languages: English, Swahili, French, Arabic, and Portuguese.

---

## System Architecture & Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | Next.js 16.2 (App Router), React 19.2, Node.js 18+ |
| **Language** | TypeScript 5.0 (Strict mode enabled) |
| **Styling & UI** | Custom Responsive CSS (Clean, standardized system adhering to non-AI editorial styling) |
| **Database & ORM** | Prisma ORM 7.8 with dual driver support: `@prisma/adapter-mariadb` / `@prisma/adapter-pg` |
| **External Bibliometrics** | Crossref REST API, OpenAlex API, DOAJ Registry, DataCite, OAI-PMH protocols |
| **Payment Gateway** | IntaSend API with cryptographic server-to-server webhook verification |
| **Document Processing** | `jspdf` (12-Page Institutional Dossiers), `mammoth` (Word .docx CV extraction) |
| **Mailing Infrastructure** | Nodemailer with DKIM/SPF configured SMTP transport |

---

## Directory Structure

```
afrijournalindex/
├── prisma/
│   ├── schema.prisma                  → Central database schema & relations
│   └── migrations/                    → Production database migration history
├── public/
│   ├── badges/                        → Static vector assets & accreditation seals
│   ├── locales/                       → Static i18n JSON translation bundles (en, fr, ar, sw, pt)
│   └── llms.txt                       → Standard discovery file for machine consumers
├── scripts/
│   ├── build-zip.js                   → Production incremental packaging script for cPanel
│   ├── generate-locales.js            → Multilingual localization synchronizer
│   └── harvest-*.js                   → OpenAlex, Crossref, and OAI-PMH harvesting scripts
├── src/
│   ├── app/
│   │   ├── admin/                     → Publisher oversight, DOI minting & administrative control
│   │   ├── api/                       → Backend REST endpoints & server handlers
│   │   │   ├── cron/                  → Automated cascading review cron handlers
│   │   │   ├── harvester/             → OAI-PMH & Crossref data ingestion endpoints
│   │   │   ├── payments/              → IntaSend transaction & webhook handlers
│   │   │   └── review/                → Peer review submission, matching & invitation routes
│   │   ├── browse/                    → Country and discipline faceted journal catalog
│   │   ├── forum/                     → Pan-African scholarly discussion boards
│   │   ├── institution/               → University research intelligence console
│   │   ├── journal/[id]/              → Journal profile, compliance scorecards & dossier views
│   │   ├── rankings/                  → AJCI citation leaderboards and percentile ranks
│   │   ├── referee-finder/            → Standalone reviewer matching tool
│   │   ├── researcher/                → Scholar profile management & dossier editor
│   │   ├── review/
│   │   │   ├── submit/                → Manuscript peer review intake & candidate queue
│   │   │   └── track/[code]/          → Double-blind evaluation tracker & revision portal
│   │   ├── reviewer/
│   │   │   ├── invite/[token]/        → 1-click external referee response landing route
│   │   │   ├── verify/[code]/         → Certificate authentication & verification portal
│   │   │   └── workspace/[id]/        → Double-blind referee evaluation rubric workspace
│   │   ├── scholars/                  → Continental directory of African researchers
│   │   └── services/                  → Accreditation consulting & indexing advisory
│   ├── components/                    → Reusable UI components (CookieConsent, Header, Footer)
│   └── lib/
│       ├── campaign-mailer.ts         → Transactional editorial notifications
│       ├── dossier-pdf.ts             → Vector 12-page institutional report generator
│       ├── journal-detail.ts          → Bibliometric algorithms & SSOT metric aggregations
│       ├── prisma.ts                  → Edge/server singleton Prisma database client
│       └── review-service.ts          → Peer review cascading engine & email dispatchers
└── package.json
```

---

## Getting Started

### Prerequisites
* **Node.js**: `v18.17.0` or higher
* **Package Manager**: `npm`
* **Database**: MariaDB 10.5+, MySQL 8.0+, or PostgreSQL 14+

### Local Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/kenpro/afrijournalindex.git
   cd afrijournalindex
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the project root:
   ```env
   # Database connection string
   DATABASE_URL="mysql://db_user:db_password@localhost:3306/afrijournal_db"

   # Base URL
   NEXT_PUBLIC_APP_URL="http://localhost:3000"

   # IntaSend Payments (Production / Sandbox)
   INTASEND_PUBLISHABLE_KEY="ISPubKey_..."
   INTASEND_SECRET_KEY="ISSecretKey_..."
   INTASEND_TEST_MODE="true"

   # SMTP Transactional Mailer
   SMTP_HOST="mail.afrijournalindexing.org"
   SMTP_PORT="465"
   SMTP_SECURE="true"
   SMTP_USER="notifications@afrijournalindexing.org"
   SMTP_PASS="your_secure_password"
   SMTP_FROM="AfriJournal Indexing <notifications@afrijournalindexing.org>"

   # Administrative Access Token / Cron Key
   CRON_SECRET="your_secure_cron_passphrase"
   ```

### Database Setup

Run Prisma migrations to initialize the schema:
```bash
npx prisma migrate deploy
npx prisma generate
```

### Development & Production Build

* **Run local development server**:
  ```bash
  npm run dev
  ```
  Visit [http://localhost:3000](http://localhost:3000) in your browser.

* **Run strict TypeScript verification**:
  ```bash
  npx tsc --noEmit
  ```

* **Execute production build**:
  ```bash
  npm run build
  ```

---

## Automation & Background Crons

The platform includes background cron endpoints designed to be scheduled via cPanel Cron Jobs or external task runners:

* **Sequential Peer Review Cascade**:
  Dispatches follow-up invitations and auto-cascades assignments when reviewers exceed the 48-hour response window:
  ```bash
  curl -X POST https://afrijournalindexing.org/api/cron/cascade-reviews \
       -H "Authorization: Bearer YOUR_CRON_SECRET"
  ```
  *Recommended schedule: Every 2 to 4 hours (`0 */2 * * *`).*

---

## Production Deployment

This project is deployed live on a cPanel Node.js environment. To deploy incremental updates without downtime:

1. **Build and package**:
   ```bash
   npm run build
   node scripts/build-zip.js
   ```
   This generates an optimized **`deploy-package.zip`** (excluding `node_modules`, `.git`, and development caches).

2. **Upload and extract**:
   - In cPanel File Manager, upload `deploy-package.zip` to your application root.
   - Extract the archive in place, replacing older build files.

3. **Restart application**:
   - In the cPanel **Setup Node.js App** interface, click **Restart Application**.

---

## Contributing & Governance

AfriJournal Indexing strictly adheres to scientific integrity benchmarks:
* **Zero Synthetic or Mock Records**: Contributions introducing synthetic citations, mock journals, or speculative bibliometrics will be rejected.
* **COPE Ethical Standards**: All peer review processes adhere to the Committee on Publication Ethics (COPE) ethical guidelines for peer reviewers.
* **Code Standards**: All UI contributions must preserve standard, clean academic presentation without artificial promotional embellishments or non-standard accents.

---

## License & Institutional Attribution

Proprietary Software © 2024–2026 **Kenya Projects Organization (KENPRO)**. All rights reserved.  
Scientific indexing algorithms, RRQ computations, and institutional verification dossiers are intellectual property of AfriJournal Indexing & KENPRO.
