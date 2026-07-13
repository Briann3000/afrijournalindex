This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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
