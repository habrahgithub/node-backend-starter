=== /home/habib/workspace/package.json ===
Project Name: swd-pulse
Project Root: .
Type: service

Scripts Summary:
- checkup:run: npm run checkup:runtime && npm run checkup:run:js && npm run checkup:run:dotnet
- checkup:run:dotnet: bash -lc "cd projects/DocSmith.Pulse && (dotnet build || ./.dotnet/dotnet build)"
- checkup:run:js: npm --prefix projects/docsmith-licensing-service run checkup:run && npm --prefix projects/docsmith-payment-gateway run checkup:run && npm --prefix projects/node-backend-starter run checkup:run && npm --prefix projects/node-backend-starter-v2 run checkup:run && npm --prefix projects/swd-docsmith-sif-extension run checkup:run && npm --prefix projects/swd-docsmith_brand-website run checkup:run && npm --prefix projects/swd-landing run checkup:run
- checkup:runtime: bash tools/check-runtime-contract.sh
- drill:sandbox: node scripts/drill-sandbox.js
- start: node index.js
- test: jest
- test:coverage: jest --coverage
- test:watch: jest --watch

Core Runtime Dependencies:
- @vercel/speed-insights: ^1.3.1
- express: ^5.2.1
- mongoose: ^9.2.1
- ollama: ^0.6.3

Dev Dependencies:
- jest: ^29.7.0
- supertest: ^7.2.2

Notable Tooling:
- @vercel/speed-insights
- express
- jest
- mongoose
- ollama
- supertest

---

=== /home/habib/workspace/projects/SWD-ARC/Lab Template/files/package.json ===
Project Name: arc-axis-adapter
Project Root: projects/SWD-ARC/Lab Template/files
Type: template

Scripts Summary:
- dev: node --watch src/server.js
- keygen: node scripts/keygen.js
- setup: node scripts/setup-secrets.js
- start: node src/server.js
- test: node tests/adapter.test.js

Core Runtime Dependencies:
- express: ^4.18.2
- openai: ^4.28.0

Dev Dependencies:
- none

Notable Tooling:
- express
- openai

---

=== /home/habib/workspace/projects/SWD-ARC/apps/controls-center/package.json ===
Project Name: swd-vault-dashboard
Project Root: projects/SWD-ARC/apps/controls-center
Type: application

Scripts Summary:
- build: next build
- checkup:regression: npm run test:axis-hardgate
- dev: next dev -p 4010
- smoke:chromium: node ./scripts/smoke-control-center.mjs --browser=chromium
- smoke:chromium:local: start-server-and-test dev http://localhost:4010 "npm run smoke:chromium"
- smoke:control-center: node ./scripts/smoke-control-center.mjs
- smoke:edge: node ./scripts/smoke-control-center.mjs --browser=edge
- smoke:edge:local: start-server-and-test dev http://localhost:4010 "npm run smoke:edge"
- start: next start -p 4010
- test:axis-hardgate: node ./scripts/axis-hard-gate-regression.mjs

Core Runtime Dependencies:
- better-sqlite3: ^11.8.1
- next: 15.5.10
- react: 18.3.1
- react-dom: 18.3.1

Dev Dependencies:
- @types/react: 19.2.14
- playwright: ^1.51.1
- start-server-and-test: ^2.0.11
- typescript: 5.9.3

Notable Tooling:
- @types/react
- better-sqlite3
- next
- playwright
- react
- react-dom
- start-server-and-test
- typescript

---

=== /home/habib/workspace/projects/SWD-ARC/mcp/server/package.json ===
Project Name: swd-mcp-server
Project Root: projects/SWD-ARC/mcp/server
Type: tooling

Scripts Summary:
- audit: npm audit
- audit:fix: npm audit fix
- ci: npm run lint && npm test && npm audit --audit-level=high
- dev: node --watch src/server.js
- format: prettier . --check
- format:fix: prettier . --write
- lint: eslint .
- lint:fix: eslint . --fix
- prepare: husky install || true
- start: node src/server.js
- test: vitest run
- test:watch: vitest

Core Runtime Dependencies:
- @modelcontextprotocol/sdk: ^1.27.0
- better-sqlite3: ^11.0.0

Dev Dependencies:
- @eslint/js: ^10.0.1
- @vitest/coverage-v8: ^2.0.0
- eslint: ^10.0.1
- eslint-config-prettier: ^9.0.0
- eslint-plugin-prettier: ^5.0.0
- husky: ^8.0.0
- lint-staged: ^15.0.0
- prettier: ^3.8.1
- vitest: ^2.0.0

Notable Tooling:
- @eslint/js
- @modelcontextprotocol/sdk
- @vitest/coverage-v8
- better-sqlite3
- eslint
- eslint-config-prettier
- eslint-plugin-prettier
- husky
- lint-staged
- prettier
- vitest

---

=== /home/habib/workspace/projects/_archive/2026-03-03-workspace-reorg/absorbed-projects/SWD-mcp-server/package.json ===
Project Name: swd-mcp-server
Project Root: projects/_archive/2026-03-03-workspace-reorg/absorbed-projects/SWD-mcp-server
Type: archive

Scripts Summary:
- audit: npm audit
- audit:fix: npm audit fix
- ci: npm run lint && npm test && npm audit --audit-level=high
- dev: node --watch src/server.js
- format: prettier . --check
- format:fix: prettier . --write
- lint: eslint .
- lint:fix: eslint . --fix
- prepare: husky install || true
- start: node src/server.js
- test: vitest run
- test:watch: vitest

Core Runtime Dependencies:
- @modelcontextprotocol/sdk: ^1.27.0
- better-sqlite3: ^11.0.0

Dev Dependencies:
- @eslint/js: ^10.0.1
- @vitest/coverage-v8: ^2.0.0
- eslint: ^10.0.1
- eslint-config-prettier: ^9.0.0
- eslint-plugin-prettier: ^5.0.0
- husky: ^8.0.0
- lint-staged: ^15.0.0
- prettier: ^3.8.1
- vitest: ^2.0.0

Notable Tooling:
- @eslint/js
- @modelcontextprotocol/sdk
- @vitest/coverage-v8
- better-sqlite3
- eslint
- eslint-config-prettier
- eslint-plugin-prettier
- husky
- lint-staged
- prettier
- vitest

---

=== /home/habib/workspace/projects/_archive/2026-03-03-workspace-reorg/user-requested/wps-sif-tool/package.json ===
Project Name: wps-sif-tool
Project Root: projects/_archive/2026-03-03-workspace-reorg/user-requested/wps-sif-tool
Type: archive

Scripts Summary:
- build: next build
- build:extension: vite build --config vite.extension.config.js
- dev: next dev
- lint: eslint .
- package:extension: npm run build:extension && powershell -Command "Compress-Archive -Path dist/extension/* -DestinationPath dist/docsmith-sif-extension.zip -Force"
- routing:fallback: node scripts/build-routing-fallback.js
- start: next start
- test: jest
- validate:bank-samples: jest __tests__/bankSamples.test.js
- verify: npm run lint && npm test && npm run validate:bank-samples && npm run build && npx playwright test

Core Runtime Dependencies:
- decimal.js: ^10.6.0
- next: ^16.1.6
- papaparse: ^5.5.3
- prop-types: ^15.8.1
- react: 19.2.3
- react-dom: 19.2.3
- xlsx: ^0.18.5
- zod: ^4.3.6

Dev Dependencies:
- @playwright/test: ^1.58.0
- @vitejs/plugin-react: ^5.1.2
- eslint: ^9.35.0
- eslint-config-next: ^16.1.6
- jest: ^29.7.0
- jest-environment-jsdom: ^29.7.0
- vite: ^6.3.5

Notable Tooling:
- @playwright/test
- @vitejs/plugin-react
- decimal.js
- eslint
- eslint-config-next
- jest
- jest-environment-jsdom
- next
- papaparse
- prop-types
- react
- react-dom
- vite
- xlsx
- zod

---

=== /home/habib/workspace/projects/docsmith-licensing-service/package.json ===
Project Name: docsmith-licensing-service
Project Root: projects/docsmith-licensing-service
Type: docs

Scripts Summary:
- build: next build
- checkup:full: npm run checkup:run && npm run checkup:regression && npm run checkup:integration
- checkup:integration: npm run test --if-present
- checkup:lint: npm run lint --if-present
- checkup:regression: npm run test --if-present
- checkup:run: npm run checkup:lint && npm run checkup:unit && npm run checkup:sanity
- checkup:sanity: npm run build --if-present
- checkup:unit: npm run test --if-present
- dev: next dev
- probe:contract: node scripts/probe-commercial-contract.mjs
- start: next start
- test:issue-concurrency: node scripts/issue-concurrency-sim.js

Core Runtime Dependencies:
- @azure/identity: ^4.13.0
- @microsoft/microsoft-graph-client: ^3.0.7
- isomorphic-fetch: ^3.0.0
- next: ^16.1.6
- pg: ^8.18.0
- react: 19.2.3
- react-dom: 19.2.3

Dev Dependencies:
- none

Notable Tooling:
- @azure/identity
- @microsoft/microsoft-graph-client
- isomorphic-fetch
- next
- pg
- react
- react-dom

---

=== /home/habib/workspace/projects/docsmith-payment-gateway/package.json ===
Project Name: docsmith-payment-gateway
Project Root: projects/docsmith-payment-gateway
Type: docs

Scripts Summary:
- build: next build
- check:licensing-auth: node scripts/check-licensing-auth.js
- checkup:full: npm run checkup:run && npm run checkup:regression && npm run checkup:integration
- checkup:integration: npm run test --if-present
- checkup:lint: npm run lint --if-present
- checkup:regression: npm run test --if-present
- checkup:run: npm run checkup:lint && npm run checkup:unit && npm run checkup:sanity
- checkup:sanity: npm run build --if-present
- checkup:unit: npm run test --if-present
- dev: next dev
- e2e:live: node scripts/require-env.js GATEWAY_BASE_URL && node scripts/e2e-live-test.mjs
- process:webhooks: node scripts/process-webhook-events.js
- start: next start
- test:worker-behavior: node scripts/process-webhook-events.behavior.test.js

Core Runtime Dependencies:
- next: ^16.1.6
- pg: ^8.18.0
- react: 19.2.3
- react-dom: 19.2.3

Dev Dependencies:
- none

Notable Tooling:
- next
- pg
- react
- react-dom

---

=== /home/habib/workspace/projects/node-backend-starter/package.json ===
Project Name: swd-pulse
Project Root: projects/node-backend-starter
Type: template

Scripts Summary:
- checkup:run: npm run checkup:run:js && npm run checkup:run:dotnet
- checkup:run:dotnet: bash -lc "cd projects/DocSmith.Pulse && (dotnet build || ./.dotnet/dotnet build)"
- checkup:run:js: npm --prefix projects/docsmith-licensing-service run checkup:run && npm --prefix projects/docsmith-payment-gateway run checkup:run && npm --prefix projects/node-backend-starter run checkup:run && npm --prefix projects/node-backend-starter-v2 run checkup:run && npm --prefix projects/swd-docsmith-sif-extension run checkup:run && npm --prefix projects/swd-docsmith_brand-website run checkup:run && npm --prefix projects/swd-landing run checkup:run
- start: node index.js

Core Runtime Dependencies:
- @vercel/speed-insights: ^1.3.1
- express: ^5.2.1
- mongoose: ^9.2.1

Dev Dependencies:
- supertest: ^7.2.2

Notable Tooling:
- @vercel/speed-insights
- express
- mongoose
- supertest

---

=== /home/habib/workspace/projects/node-backend-starter-v2/package.json ===
Project Name: node-backend-starter-v2
Project Root: projects/node-backend-starter-v2
Type: template

Scripts Summary:
- build: tsc && cp -R src/openapi dist/openapi
- checkup:full: npm run checkup:run && npm run checkup:regression && npm run checkup:integration
- checkup:integration: npm run test --if-present
- checkup:lint: npm run lint --if-present
- checkup:regression: npm run test --if-present
- checkup:run: npm run checkup:lint && npm run checkup:unit && npm run checkup:sanity
- checkup:sanity: npm run build --if-present
- checkup:unit: npm run test --if-present
- dev: tsx src/index.ts
- format: prettier --write .
- format:check: prettier --check .
- lint: eslint . --ext .ts
- openapi:lint: redocly lint src/openapi/openapi.yaml
- prisma:generate: prisma generate
- prisma:migrate:deploy: prisma migrate deploy
- prisma:migrate:dev: prisma migrate dev
- prisma:reset:test: prisma migrate reset --force --skip-generate
- prisma:seed: tsx prisma/seed.ts
- start: node dist/index.js
- test: vitest run

Core Runtime Dependencies:
- @prisma/client: ^5.11.0
- cors: ^2.8.5
- express: ^4.19.2
- express-rate-limit: ^7.4.0
- helmet: ^7.1.0
- js-yaml: ^4.1.0
- jsonwebtoken: ^9.0.2
- swagger-ui-express: ^5.0.1
- zod: ^3.23.8

Dev Dependencies:
- @redocly/cli: ^1.22.0
- @types/cors: ^2.8.17
- @types/express: ^4.17.21
- @types/js-yaml: ^4.0.9
- @types/jsonwebtoken: ^9.0.6
- @types/node: ^20.11.25
- @types/supertest: ^2.0.16
- @types/swagger-ui-express: ^4.1.6
- @typescript-eslint/eslint-plugin: ^7.6.0
- @typescript-eslint/parser: ^7.6.0
- eslint: ^8.57.0
- eslint-config-prettier: ^9.1.0
- prettier: ^3.2.5
- prisma: ^5.11.0
- supertest: ^6.3.4
- tsx: ^4.7.1
- typescript: ^5.4.5
- vitest: ^1.4.0

Notable Tooling:
- @prisma/client
- @types/cors
- @types/express
- @types/js-yaml
- @types/jsonwebtoken
- @types/node
- @types/supertest
- @types/swagger-ui-express
- @typescript-eslint/eslint-plugin
- @typescript-eslint/parser
- cors
- eslint
- eslint-config-prettier
- express
- express-rate-limit
- helmet
- js-yaml
- jsonwebtoken
- prettier
- swagger-ui-express
- zod

---

=== /home/habib/workspace/projects/swd-docsmith-sif-extension/package.json ===
Project Name: swd-docsmith-sif-extension
Project Root: projects/swd-docsmith-sif-extension
Type: extension

Scripts Summary:
- build: next build
- build:extension:chrome: vite build --config chrome/vite.extension.config.js
- build:extension:edge: vite build --config edge/vite.extension.config.js
- checkup:full: npm run checkup:run && npm run checkup:regression && npm run checkup:integration
- checkup:integration: npm run test --if-present
- checkup:lint: npm run lint --if-present
- checkup:regression: npm run test --if-present
- checkup:run: npm run checkup:lint && npm run checkup:unit && npm run checkup:sanity
- checkup:sanity: npm run build --if-present
- checkup:unit: npm run test --if-present
- dev: next dev
- goldenpack:3000: node scripts/generate-golden-pack-3000.js
- lint: eslint .
- pack: node scripts/pack-extensions.js
- precheck:store-list: npm run prestore-check
- prepare:cws: node scripts/prepare-cws-submission.js
- prestore-check: node scripts/prestore-check.js
- prod-health-check: node tools/prod-health-check.mjs
- routing:audit:md: node scripts/generate-routing-audit-md.js
- routing:fallback: node scripts/build-routing-fallback.js
- routing:validate: npm run routing:validate:report
- routing:validate:ci: node scripts/validate-routing-dataset.js --strict --fail-on hard
- routing:validate:report: node scripts/validate-routing-dataset.js --fail-on none
- routing:validate:strict: node scripts/validate-routing-dataset.js --strict --fail-on hard
- routing:verify:internet: node scripts/verify-routing-codes-internet.js
- start: next start
- template:classic:design: node scripts/generate-classic-template-design.js
- template:sync: node scripts/sync-enterprise-template.js
- test: jest
- test:e2e:stress: npm run build:extension:chrome && playwright test -c playwright.stress.config.js e2e/stress-3000-edr.spec.js
- validate:bank-samples: jest __tests__/bankSamples.test.js
- verify: npm run lint && npm test && npm run validate:bank-samples && npm run build && npx playwright test

Core Runtime Dependencies:
- decimal.js: ^10.6.0
- next: ^16.1.6
- papaparse: ^5.5.3
- prop-types: ^15.8.1
- react: 19.2.3
- react-dom: 19.2.3
- react-window: ^1.8.11
- xlsx: ^0.18.5
- zod: ^4.3.6

Dev Dependencies:
- @playwright/test: ^1.58.0
- @rollup/wasm-node: ^4.57.1
- @vitejs/plugin-react: ^5.1.2
- eslint: ^9.35.0
- eslint-config-next: ^16.1.6
- exceljs: ^4.4.0
- jest: ^29.7.0
- jest-environment-jsdom: ^29.7.0
- vite: ^6.3.5

Notable Tooling:
- @playwright/test
- @rollup/wasm-node
- @vitejs/plugin-react
- decimal.js
- eslint
- eslint-config-next
- exceljs
- jest
- jest-environment-jsdom
- next
- papaparse
- prop-types
- react
- react-dom
- react-window
- vite
- xlsx
- zod

---

=== /home/habib/workspace/projects/swd-docsmith_brand-website/package.json ===
Project Name: swd-docsmith_brand-website
Project Root: projects/swd-docsmith_brand-website
Type: application

Scripts Summary:
- build: next build
- checkup:full: npm run checkup:run && npm run checkup:regression && npm run checkup:integration
- checkup:integration: npm run test --if-present
- checkup:lint: npm run lint --if-present
- checkup:regression: npm run test --if-present
- checkup:run: npm run checkup:lint && npm run checkup:unit && npm run checkup:sanity
- checkup:sanity: npm run build --if-present
- checkup:unit: npm run test --if-present
- dev: next dev --webpack
- hero:serve: next dev --webpack --hostname 127.0.0.1 --port 3010
- hero:shot: node scripts/hero-screenshot.mjs
- lint: eslint .
- process:webhooks: node scripts/process-webhook-events.js
- sandbox:demo: node scripts/vercel-sandbox-demo.mjs
- start: next start
- test: jest
- validate:bank-samples: jest __tests__/bankSamples.test.js
- verify: npm run lint && npm test && npm run validate:bank-samples && npm run build

Core Runtime Dependencies:
- @vercel/analytics: ^1.6.1
- @vercel/sandbox: ^1.5.0
- @vercel/speed-insights: ^1.3.1
- decimal.js: ^10.6.0
- next: ^16.1.6
- papaparse: ^5.5.3
- pg: ^8.18.0
- prop-types: ^15.8.1
- react: 19.2.3
- react-dom: 19.2.3
- xlsx: ^0.18.5
- zod: ^4.3.6

Dev Dependencies:
- @playwright/test: ^1.58.0
- eslint: ^9.35.0
- eslint-config-next: ^16.1.6
- jest: ^29.7.0
- jest-environment-jsdom: ^29.7.0

Notable Tooling:
- @playwright/test
- @vercel/analytics
- @vercel/sandbox
- @vercel/speed-insights
- decimal.js
- eslint
- eslint-config-next
- jest
- jest-environment-jsdom
- next
- papaparse
- pg
- prop-types
- react
- react-dom
- xlsx
- zod

---

=== /home/habib/workspace/projects/swd-finstack/mcp/server/package.json ===
Project Name: swd-finstack-mcp-server
Project Root: projects/swd-finstack/mcp/server
Type: tooling

Scripts Summary:
- dev: nodemon server.js
- lint: eslint .
- lint:fix: eslint . --fix
- start: node server.js
- start:http: node server.js --transport=http
- start:stdio: node server.js --transport=stdio
- test: vitest run
- test:watch: vitest

Core Runtime Dependencies:
- @modelcontextprotocol/sdk: ^1.27.1
- axios: ^1.6.0
- dotenv: ^16.4.5
- winston: ^3.11.0

Dev Dependencies:
- eslint: ^8.56.0
- eslint-config-prettier: ^9.1.0
- nodemon: ^3.0.2
- vitest: ^1.2.2

Notable Tooling:
- @modelcontextprotocol/sdk
- axios
- dotenv
- eslint
- eslint-config-prettier
- nodemon
- vitest
- winston

---

=== /home/habib/workspace/projects/swd-landing/package.json ===
Project Name: swd-landing
Project Root: projects/swd-landing
Type: application

Scripts Summary:
- axis:agent: node scripts/axis-agent-bridge.mjs
- axis:token: node scripts/axis-broker-token.mjs
- axis:tunnel: ./scripts/axis-tunnel-launch.sh
- build: next build
- checkup:full: npm run checkup:run && npm run checkup:regression && npm run checkup:integration
- checkup:integration: npm run test --if-present
- checkup:lint: npm run lint --if-present
- checkup:regression: npm run test --if-present && npm run test:axis-hardgate
- checkup:run: npm run checkup:lint && npm run checkup:unit && npm run checkup:sanity
- checkup:sanity: npm run build --if-present
- checkup:unit: npm run test --if-present
- dev: next dev
- lint: eslint .
- start: next start
- test: jest --passWithNoTests
- test:axis-hardgate: node scripts/axis-hard-gate-regression.mjs
- test:mocha: node scripts/run-mocha.js

Core Runtime Dependencies:
- @fontsource/inter: latest
- framer-motion: 11.0.5
- next: ^16.1.6
- react: 18.3.1
- react-dom: 18.3.1

Dev Dependencies:
- @types/node: 25.2.1
- @types/react: 19.2.13
- autoprefixer: 10.4.20
- chai: ^6.2.2
- eslint: ^9.39.2
- eslint-plugin-react: ^7.37.5
- jest: ^30.2.0
- mocha: ^11.3.0
- postcss: 8.4.41
- tailwindcss: 3.4.10
- typescript: 5.9.3

Notable Tooling:
- @fontsource/inter
- @types/node
- @types/react
- autoprefixer
- chai
- eslint
- eslint-plugin-react
- framer-motion
- jest
- mocha
- next
- postcss
- react
- react-dom
- tailwindcss
- typescript

---

=== /home/habib/workspace/projects/wps-hr-core/package.json ===
Project Name: wps-hr-core
Project Root: projects/wps-hr-core
Type: service

Scripts Summary:
- build: next build
- dev: next dev
- lint: eslint
- start: next start

Core Runtime Dependencies:
- next: 16.1.6
- react: 19.2.3
- react-dom: 19.2.3

Dev Dependencies:
- @types/node: ^20
- @types/react: ^19
- @types/react-dom: ^19
- eslint: ^9
- eslint-config-next: 16.1.6
- typescript: ^5

Notable Tooling:
- @types/node
- @types/react
- @types/react-dom
- eslint
- eslint-config-next
- next
- react
- react-dom
- typescript

---

=== /home/habib/workspace/vault/dashboard/package.json ===
Project Name: swd-vault-dashboard
Project Root: vault/dashboard
Type: application

Scripts Summary:
- build: next build
- dev: next dev -p 4010
- start: next start -p 4010

Core Runtime Dependencies:
- better-sqlite3: ^11.8.1
- next: ^16.1.6
- react: ^19.2.3
- react-dom: ^19.2.3

Dev Dependencies:
- none

Notable Tooling:
- better-sqlite3
- next
- react
- react-dom

---

