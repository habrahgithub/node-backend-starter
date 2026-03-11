# Technology Stack Analysis

## Languages
- JavaScript/TypeScript: 16 package-backed projects

## Frameworks
- Next.js: 9
- React: 9
- Express: 4
- Playwright: 3
- Mongoose: 2
- Prisma: 1

## Databases
- MongoDB via Mongoose
- PostgreSQL/Prisma (inferred)
- SQLite (inferred)

## Testing Tools
- Jest
- Playwright
- Supertest

## Build and Package Tools
- npm
- Next.js build pipeline
- TypeScript
- Vite

## AI Tooling
- Ollama
- Vercel developer tooling

## Security / Config Patterns
- .gitignore and .aiexclude present at workspace root
- Sensitive env files are flagged in inventory when present but not printed

## Missing Infrastructure Patterns
- No root-level Docker or CI workflow detected
- No Terraform detected in scoped workspace scan
