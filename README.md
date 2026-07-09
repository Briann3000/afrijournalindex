# AfriJournal Index (AJIF)

**The open academic indexing engine built for Africa.**

AfriJournal Index is a production-ready, full-stack web platform that catalogs, ranks and tracks citation metrics for peer-reviewed academic journals and researchers across the African continent. It fills a critical gap left by Western-centric indexing databases by providing a transparent, automated and regionally weighted impact factor system built from the ground up.

---

## The Problem We Solve

African academic journals are consistently underrepresented in global indexing databases like Scopus and Web of Science. The result: groundbreaking research from African institutions goes uncited, unranked and undiscovered.

AfriJournal Index changes that. Our automated indexing engine evaluates journals on open compliance standards, assigns transparent impact scores and provides researchers with real-time citation analytics and institutional leaderboards — all without paywalls.

---

## Features

### Automated Journal Compliance Engine
Journals submitted for indexing are put through an automated compliance crawl that checks:
- HTTPS encryption on the journal's domain
- Homepage reachability and response status
- Peer-review policy detection
- Open Access compliance markers
- Publication frequency consistency

The evaluation runs asynchronously and streams a full compliance report log to the submitter in real time. Journals can be accepted, placed under review, or rejected with detailed reasons.

### AJIF Impact Factor Scoring
Every indexed journal receives an **AfriJournal Impact Factor (AJIF)** score computed from:
- A **standard 2-year citation window** score aligned with global IF methodology
- A **regional Africa-weighted score** that accounts for publication volume and open access availability within the continent

These scores feed a live **Rankings Leaderboard** that any user can browse and filter by country.

### Researcher Profiles & h-index
Registered researchers get a dynamic profile page that computes:
- Live **h-index** from their indexed publication record
- **Total citation count** across all authored articles
- A **citation distribution bar chart** — a visual analytics panel showing relative citation weight per paper

### Institutional Dashboards
Universities and research institutions get their own aggregated console showing:
- Combined researcher h-index pool
- Total publications and citations from affiliated researchers
- Direct links to individual researcher profiles

An anonymously accessible **Quick Search** on the Rankings page lets any visitor look up any institution's metrics.

### Peer Review Community Forum
Every journal's evaluation page hosts a live discussion thread where authenticated researchers can:
- Post review notes and indexing observations
- Raise citation disputes
- Share open access links

Authentication is tied to the researcher's ORCID iD and institutional affiliation.

### Multi-language Interface
The full platform UI is internationalized across **5 languages**:
- 🇬🇧 English
- 🇫🇷 French (Français)
- 🇵🇹 Portuguese (Português)
- 🇸🇦 Arabic (العربية)
- 🌍 Kiswahili

Language preference is persisted across sessions and applied globally via a context provider.

### Progressive Web App (PWA)
AfriJournal Index is installable as a native-like app on both mobile and desktop, with a full Web App Manifest and offline-capable architecture.

### IntaSend Payment Integration
Publishers seeking fast-track premium indexing evaluation can pay directly in-app via the integrated **IntaSend** payment gateway — supporting M-Pesa and card payments common across East Africa.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | Prisma v7 |
| Styling | Vanilla CSS (Glassmorphic dark theme) |
| Auth | Cookie-based session with bcrypt hashing |
| Payments | IntaSend Inline SDK |
| Runtime | React 19 |

---

## Database Schema

The data model maps the full academic publishing lifecycle — from researcher registration through submission, evaluation, indexing, citation tracking and peer review.

```
User
 ├── journals[]          → Journals this publisher manages
 ├── submissions[]       → Indexing applications submitted
 ├── articles[]          → Peer-reviewed papers authored
 └── comments[]          → Peer review forum posts

Journal
 ├── submissions[]       → Indexing requests for this journal
 ├── articles[]          → Papers published in this journal
 ├── reports[]           → Annual Impact Factor reports
 └── comments[]          → Community discussion threads

Article
 ├── authors[]           → Linked researcher User accounts
 ├── citations[]         → References this article cites
 └── citedBy[]           → Inbound citation records

ImpactFactorReport
 ├── standardScore       → 2-year window global IF score
 ├── regionalScore       → Africa-weighted AJIF score
 ├── citationCount       → Citations counted in window
 └── articleCount        → Articles published in window
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new researcher or publisher |
| `POST` | `/api/auth/login` | Authenticate and create session cookie |
| `GET` | `/api/auth/me` | Validate active session |
| `POST` | `/api/evaluate` | Submit a journal for compliance crawl |
| `GET` | `/api/evaluate/lookup` | Look up submission by ISSN or journal name |
| `GET` | `/api/evaluate/status` | Retrieve full evaluation report by submission ID |
| `GET` | `/api/journals/rankings` | Fetch ranked journal leaderboard (filterable by country) |
| `GET` | `/api/journals/list` | List all indexed journals |
| `GET` | `/api/researcher/profile` | Fetch researcher profile with h-index and metrics |
| `GET` | `/api/institutions/metrics` | Fetch aggregated university dashboard metrics |
| `GET` | `/api/comments` | Retrieve peer review comments for a journal |
| `POST` | `/api/comments` | Post a new authenticated peer review comment |
| `POST` | `/api/payments/callback` | Handle IntaSend payment webhook callback |

---

## Getting Started

### Prerequisites
- Node.js v18+
- PostgreSQL (local or hosted instance)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/afrijournalindex.git
cd afrijournalindex

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env and set your DATABASE_URL

# 4. Run database migrations
npx prisma migrate dev --name init

# 5. Generate Prisma client
npx prisma generate

# 6. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/afrijournalindex?schema=public"
```

---

## Project Structure

```
src/app/
 ├── page.tsx                  → Home / Hero landing page
 ├── about/                    → Platform mission and methodology
 ├── browse/                   → Journal catalog with search and filters
 ├── rankings/                 → Live AJIF impact factor leaderboard
 ├── submit/                   → Journal submission wizard (3-step form)
 │   └── status/               → Evaluation status dashboard & forum
 ├── pricing/                  → Free vs. premium indexing tiers
 ├── researcher/               → Researcher profile with h-index analytics
 ├── institution/              → Institutional metrics aggregation console
 ├── login/                    → Researcher authentication
 ├── register/                 → New researcher/publisher registration
 ├── methodology/              → Transparent scoring methodology docs
 ├── contact/                  → Contact and support page
 ├── api/                      → All server-side API route handlers
 ├── Header.tsx                → Unified global navigation component
 └── LangContext.tsx           → Multi-language i18n context provider
```

---

## Roadmap

- [ ] DOI resolver and CrossRef citation auto-import
- [ ] Bulk journal seeding via Excel/CSV upload pipeline
- [ ] Email notification system for evaluation status changes
- [ ] PDF Impact Factor Report generation and download
- [ ] Admin panel for manual journal verification override
- [ ] Public API with rate-limited access keys for institutional integrations

---

## Contributing

Contributions are welcome. Please open an issue first to discuss what you would like to change, then submit a pull request with a clear description of your changes.

---

## License

MIT License © 2025 Kenya Projects Organization (KENPRO)
