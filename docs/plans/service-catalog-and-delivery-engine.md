# Service catalog first, isolated client delivery next

**Status:** Phase 1 partially implemented after explicit user authorization; later phases remain planned.
**Recorded:** 2026-09-24.
**Sequence:** Stabilize the portfolio purchase flow, clarify the offer, implement one complete service pilot, then build the separate delivery engine.

The goal is a self-service purchase that explains what the customer receives, owns, and pays before signing, followed by repeatable delivery of independently operated client projects. The portfolio remains the sales and operations control plane; it must not become a shared production application containing every customer's website and data.

## Quick path

1. Resolve commercial responsibilities and repair the existing purchase-flow defects.
2. Introduce one validated configuration model and immutable purchase snapshot.
3. Redesign the catalog and connect configuration through contracts, payment, materials, and administration.
4. Validate the Web/Landing pilot before extending other services.
5. Separately approve and build the reusable template/delivery engine; generate isolated customer repositories and deployments.

Unchecked items below describe future work; checked items record verified implementation. Current prices are evidence of the existing catalog, not newly approved pricing or infrastructure budgets. Provider plans, eligibility, costs, and legal requirements must be checked when implementation is approved.

## Current system and scope

The current path is service catalog → package/questions/extras → order → customer details → contract/signature → transfer/payment notice → manual payment confirmation → materials → delivery administration. An uploaded receipt is not proof of settlement. Recurring amounts exist as data and contract text, not a demonstrated automatic subscription engine.

### Existing packages

Source of truth for this inventory: `src/content/servicios.ts`.

| Service | Existing package slugs | Delivery family proposal |
| --- | --- | --- |
| Lead-generating website | `landing`, `web-cinco-secciones`, `web-con-blog` | Marketing/content starter |
| Online sales | `catalogo-whatsapp`, `catalogo-cobro`, `tienda-a-medida` | Catalog/commerce starter |
| Management system | No fixed packages; scoped quotation | Modular business application starter |
| AI automation | `una-automatizacion`, `tres-automatizaciones` | Workflow/integration starter |
| Technical audit | `auditoria-web`, `auditoria-sistema` | Diagnostic delivery kit |
| Care plan | `cuidado-basico`, `cuidado-completo`, `cuidado-comercio` | Operations kit, shared with diagnostic tooling |

There are 13 packages across six services. Audit and care packages need complete operational kits, not artificial new customer applications. Preserve custom quotation for management systems, custom stores, system audits, and unsupported automation inputs. Do not invent three fixed-price packages solely to fill a three-column layout.

### Existing implementation seams

| Concern | Existing paths |
| --- | --- |
| Catalog and service pages | `src/content/servicios.ts`, `src/components/site/ServiceCatalog.tsx`, `src/components/site/PackageCard.tsx`, `src/app/[locale]/services/[slug]/page.tsx` |
| Order creation and steps | `src/app/api/pedido/route.ts`, `src/app/api/pedido/[id]/`, `src/app/[locale]/pedido/[id]/`, `src/components/pedido/` |
| Contract and stored evidence | `src/content/contrato.ts`, `src/content/alcance-contractual.ts`, `src/lib/contrato-pdf.ts` |
| Materials and client access | `src/content/kickoff.ts`, `src/components/pedido/AccesoGate.tsx`, `src/lib/leads/acceso-cliente.ts` |
| Administration and budget | `src/app/admin/leads/[id]/page.tsx`, `src/components/admin/leads/CatalogPicker.tsx`, `src/lib/leads/presupuesto.ts` |
| Existing persistence | `supabase/migrations/036_pedido_snapshot.sql`, `supabase/migrations/038_pedidos.sql` |

## Phase 1 — Establish a safe and explicit offer

### Purchase-flow repairs

- [x] Enforce material authorization before loading or serializing protected data. The server checks the order-specific session before fetching lead materials; the locked gate receives no material or plan props. Successful OTP refreshes the server response before displaying the form.
  - Verified 2026-09-25: regression RED (five expected failures), then 18 passing page/gate/session tests and 24 passing existing access/material API tests; `npm run typecheck` and ESLint on the four changed TS/TSX files passed. Checks use mocks, not production email/database or a deployed browser session. Remaining Phase 1 items are still pending.
- [ ] Correct monthly package display and first-payment behavior.
  - [x] Catalog recurring price now uses the recurring amount (USD 40/90/150), not the zero upfront total. One-time and recurring extras are displayed separately.
  - [ ] First-payment/activation policy remains unresolved: existing monthly contract starts charges at delivery, while generic payment terms request a deposit and the flow waits for payment before delivery. Do not substitute the monthly fee as an upfront charge without an approved rule. New monthly-only purchases are now held for activation review; existing zero-upfront orders show an explanation instead of transfer instructions, and preparation/signature/payment endpoints reject unsafe new zero-payment progression. This is a safety hold, not completed recurring billing.
- [x] Enforce catalog qualification and extra rules server-side: require valid in-scope answers, reject unknown question keys, malformed selections and extras outside the service, and deduplicate extras. No new cross-module business rules were invented.
  - [x] Required automation monitoring (USD 60/month) is selected and locked in the catalog, included by server-side new-order normalization, and charged once even for duplicate IDs. Optional new-order extras are deduplicated too. Historical reconstruction is unchanged.
  - Verified 2026-09-25: eight expected RED failures; 57 passing catalog/UI/API tests after repair. Typecheck and scoped ESLint verification recorded by the implementation handoff. Additional verification below includes qualification and incompatible/unknown-choice rejection.
- [x] Implement idempotent contract preparation per order (local verification complete; user reports migration 047 applied).
  - Atomic RPC creates/links a buyer under an order lock; normalized same-buyer retries reuse the existing lead, while different identities return 409. Stored order amounts remain authoritative.
  - External contract links are reused. A persisted route-level claim prevents concurrent/retried provisioning after an uncertain result; failed metadata writes do not report success. Claims with unknown provider outcome require manual reconciliation, not automatic reset. This does not establish exactly-once external delivery; the existing provider adapter has its own fallback behavior.
  - Evidence: 11 expected RED failures, then 21 passing route tests. Disposable PostgreSQL 16 verified rollback, normalization, conflicts, amounts, RPC permissions, and simultaneous same/different buyer requests with one buyer/claim.
  - Deployment: user reports migrations 046, 047 and 048 applied; this has not been independently verified. Required order is 046 → 047 → 048 before deploying the changed routes. No application database was modified by this implementation.
- [x] Implement atomic signature/state persistence and recoverable retries (local implementation verified; deployment pending).
  - `046_atomic_order_signature.sql` locks the order/lead, preserves original evidence on retries, and updates both states in one transaction. The signing route fails on archival/RPC errors, uses non-overwriting PDF paths and avoids sending losing concurrent evidence.
  - Verification: five expected RED failures, then 21 passing signing-route tests; typecheck and scoped ESLint passed. Disposable PostgreSQL 16 assertions verified rollback on final-write failure, retry, evidence retention, partial-state repair, advanced-state preservation and RPC permissions.
  - **Deployment prerequisite:** migrations 046–048 must exist in the target database before deploying the changed routes. The user reports all three applied; no application database was inspected or migrated by this implementation. Concurrent crash/failed RPC may leave an unreferenced private PDF; durable notification retries/outbox are not implemented. Contract preparation is implemented separately by migration 047, with its own deployment prerequisite.
- [x] Implement verified email before local signing and bind the reviewed frozen revision.
  - A dedicated OTP-only cookie gates the signing page and endpoint; legacy signature-issued access cookies cannot substitute for email proof. Conditional OTP consumption rejects lost races/write errors before issuing proof.
  - Stored clauses, contract data, text and revision are shared by display, signature evidence and PDF generation. The submitted revision is checked in the route and migration 048 transaction wrapper; catalog changes cannot silently replace an already displayed stored contract.
  - External preparation responses no longer expose signing tokens; the verified page handles the signing step. Historical signed evidence is retained.

### Latest technical verification and remaining completion gates

- Scoped regression log: **23 files, 269 tests passed** (30.96 seconds), covering order configuration, access, preparation, signing, materials, payment and related UI/PDF helpers.
- Final bounded `npm run typecheck`: **exit 0**. Scoped ESLint across changed TypeScript files: **exit 0**. `git diff --check`: passed.
- Migration 048 received structural review: invoker rights, empty search path, order ownership/row lock, revision/evidence matching, original-snapshot retention and service-role-only function grants. **No disposable PostgreSQL runtime result for 048 is available**: the prior escalation was interrupted. Runtime tests for 046 and 047 were completed earlier.
- Migrations 046/047/048 are user-reported applied, not independently verified. No deployment or production smoke test was performed; real email, browser and provider integration remain to be checked in a controlled environment.
- **Phase 1 is not commercially complete:** approve the matrix below and the monthly activation rule, then implement/release recurring activation. The safety hold must not be presented as an operational subscription service.

**Smallest proposed billing decision (not implemented or approved):** for standalone care plans, charge the existing published monthly amount at an explicitly agreed activation date, in advance for the next service month. Keep development payments separate. For project add-on operation, start the monthly term at agreed delivery/activation. Define cancellation notice, included support and provider costs before lifting the hold; do not rewrite existing signed agreements.

### Commercial matrix to approve

**2026-09-26 policy update:** The user selected provider-managed Vercel/Supabase hosting, customer-owned/paid domain renewals and customer-paid AI/API usage. New-offer disclosures and newly frozen contracts now consume `src/content/service-policy.ts`. Landing care is USD 40 per quarter with one small request capped at 30 minutes; higher care tiers have explicit total-time/request caps. Initial hosting and defect warranty cover 30 days from delivery; paid continuation requires express opt-in or planned transfer. Source-copy requests do not cancel hosting or remove customer ownership. See `docs/plans/managed-care-policy.md` for defaults, assumptions and exclusions.

**Managed-care implementation checkpoint:** A manual care offer/acceptance/payment/request UI and API now exist, backed by 049 plus additive 050 and 051. The operator reported 046–049 applied; deploy 050 and 051 in order before code. The full 049–051 fixture passed in disposable PostgreSQL (`care_051_verify_20260926_3`, exit 0, `Managed care assertions passed`); 050/051 remain unapplied to the application/production database and no code was deployed. Renewal requires an exactly due, paid prior period. A missed day or return after closure requires an inspected new offer and fresh acceptance, while old agreement generations remain auditable and cannot grant new allowance. There is no automatic charging, retroactive debt creation, or automatic hosting shutdown. See the managed-care runbook for the rollout gate and limitations.

**Implementation boundary:** Catalog, contract/PDF/DOCX policy transport and retired-offer guards are implemented and locally checked (114 focused tests, types and scoped lint). Recurring checkout remains held: accepted-plan/version persistence, activation, period/payment tracking and customer/admin cancellation/transfer workflow are not implemented. This is not a completed subscription service or legal approval. Preserve historical frozen contracts. No new migration or production deployment was performed for this policy unit.

For every package, define: deliverables, exclusions, revisions, delivery prerequisites, upfront charge, recurring charges, third-party costs, responsibilities, ownership, support scope, cancellation, and handover.

| Decision | Required clarification before publishing |
| --- | --- |
| Domain | Existing or new; customer registrant; who purchases, pays, renews, and manages DNS; extension availability and transfer procedure |
| Hosting and database | Managed by provider or held directly by customer; included allowance, provider limits, overages, renewal and outage responsibilities |
| Monthly/annual charges | Amount or explicit quotation, currency, payer, payee, start event, due date, renewal and price-change notice |
| Payment processing | Customer merchant account; gateway fees separate from development fees; reconciliation and refund responsibility |
| Maintenance | Changes included, response window, backup scope, exclusions, and whether infrastructure fees are included or separate |
| External tools | Email, scheduling, plugins, AI/API usage and licensed media; owner, license terms and quotas |
| Exit | Notice, final charges, export formats, source/assets/data handover, access revocation, migration assistance and retention |

Do not assume that a fixed development payment includes hosting forever. Do not deduct domain renewal silently from development fees. Contract wording and consumer/tax obligations require appropriate professional review; this plan is not a legal opinion.

**Acceptance:** Before signing, a nontechnical buyer can explain what is paid now, monthly, annually, directly to third parties, and what happens when service ends. Unknown costs block a fixed-price checkout or trigger a clearly scoped quote; they are never represented as zero.

## Phase 2 — One configuration model and immutable agreement

- [ ] Extract a pure configuration resolver shared by catalog UI, server checkout and admin quoting; the server remains authoritative.
- [ ] Model requirements, exclusions, compatibility, answer-dependent branches, delivery effects and required material as data rather than scattered UI conditions.
- [ ] Model each charge with concept, amount/quotation status, currency, cadence, payer, payee, inclusion, start event and renewal terms. Distinguish first payment from project total and later recurring charges.
- [ ] Model resource responsibilities separately: domain, hosting, database, storage, merchant account, calendar and email.
- [ ] Store a versioned immutable purchase snapshot on the order: labels and IDs, selected answers/extras/demo, scope, exclusions, charge schedule, ownership/responsibilities, delivery prerequisites, catalog version and contract revision.
- [ ] Keep operational status and actual payments separate from contractual commitments. A paid invoice, a provisioned domain and an agreed hosting fee are different facts.
- [ ] Treat a post-signature change as a new revision/change agreement, not an overwrite.

**Conditional examples:** A new domain creates registration/ownership tasks; an existing domain creates DNS-access tasks. A content panel activates CMS/data requirements. Integrated payments activate merchant onboarding and webhook configuration; a payment link alone does not imply a full commerce system.

**Acceptance:** The same configuration yields the same valid scope and charge breakdown everywhere. Tampering with a browser amount or omitting a mandatory option cannot alter the server result. Updating or removing a catalog package cannot change an existing agreement.

## Phase 3 — Wider, compact and selectable service pages

- [ ] Retain existing service URLs, locale handling and historical aliases.
- [ ] Use a service-specific wide layout. Move the current audience sidebar out of the space needed by package comparison; do not widen unrelated portfolio pages accidentally.
- [ ] Present a compact service introduction, demo gallery, package comparison, selected-package configuration, costs/responsibilities summary and one clear checkout action.
- [ ] Separate editorial recommendation from customer selection: recommendation badge remains fixed; selected border/check and configuration follow the selected radio option.
- [ ] Keep one selected package in shared state, instead of independent checkout forms in each card.
- [ ] On package changes, preserve compatible choices only and explicitly explain removed or newly required options.
- [ ] Support mobile layouts, keyboard operation, visible focus, screen-reader selection announcements, contrast and reduced motion. Do not make horizontal swiping the only way to discover plans.

### Demonstrations

- [ ] Maintain a versioned demo manifest linked to service/package capabilities, image, preview URL and availability.
- [ ] Mark demonstrations as examples, not additional contracted scope; selecting a design must not silently add paid functionality.
- [ ] Prefer optimized image previews; load interactive demos explicitly, isolated from the portfolio and without production credentials or customer data.
- [ ] Give preview dialogs proper focus handling, Escape dismissal and return focus.

**Acceptance:** Selecting any package visibly moves selection without moving the recommendation badge. The summary updates consistently; previewing a demo does not accidentally change the order or trap focus.

## Phase 4 — Contract, payment, materials and admin continuity

- [ ] Make `PedidoLayout`, checkout, contract rendering/PDF, email and admin display consume the frozen purchase projection.
- [ ] Show upfront, monthly, annual and third-party costs separately through every step.
- [ ] Derive kickoff questions and operational tasks from the selected branches; do not ask customers to repeat known answers.
- [ ] Add admin views for contracted scope, resource ownership, responsible payer, provider, renewal dates, provisioning status and delivery evidence.
- [ ] Keep quoted configuration distinct from the immutable signed purchase.
- [ ] Define a client-safe projection for a future portal, with authorization on every sensitive server read/write; do not build the entire portal prematurely.
- [ ] If recurring collection remains manual, identify that explicitly. Automatic subscriptions require a separately approved billing slice covering scheduling, failed payments, reconciliation, notices, cancellation and refunds.

**Acceptance:** One pilot order can be traced from service choice to delivery with identical agreed scope/costs and all branch-specific tasks visible to both authorized customer and operator. Payment approval reflects verified settlement, not OCR output alone.

## Phase 5 — Preserve existing purchases and release one pilot

- [ ] Use additive, versioned migrations and compatible readers while old and new records coexist.
- [ ] Preserve current fields while consumers migrate; retain order links and stored signature evidence.
- [ ] For legacy records, use existing stored totals and documents. Do not reconstruct historical promises from today's catalog or invent missing ownership/renewal terms.
- [ ] Mark incomplete historical data as unknown and route necessary clarifications to an explicit amendment.
- [ ] Pilot Web/Landing end to end before expanding commerce, automation, audits and care.
- [ ] Add regression coverage for monthly pricing, dependencies, request tampering, duplicate submissions, failed persistence, signature revision binding and private-data serialization.
- [ ] Add responsive/accessibility and end-to-end checks in isolated test environments; external providers use sandbox/test accounts where supported.

**Acceptance:** Old orders still open with unchanged agreements, the pilot passes functional/security/accessibility checks, and deployment rollback has been rehearsed without touching real customer payments or data.

## Phase 6 — Build the separate delivery engine later

This phase requires its own approval after the portfolio pilot. It is not a reason to mix client applications into the portfolio repository now.

### Three boundaries

| Boundary | Owns | Must not own |
| --- | --- | --- |
| Portfolio control plane | Catalog, offers, orders, agreements, operations metadata, links to customer deployments | Every customer's application code, database contents or broadly shared production secrets |
| Template/engine source | Versioned starters, shared modules, generator, validation and deployment adapters | Live customer data or automatic authority to modify all customer production deployments |
| Independent customer output | Complete generated repository, pinned dependencies, configuration, tests, documentation and deployment definitions | Mutable dependency on the engine's latest branch or another customer's resources |

Proposed starter families are marketing/content, catalog/commerce, business applications, workflows/integrations, and operations/diagnostics. Each package has its own complete generated folder/output backed by a versioned manifest, rather than thirteen independently copied source applications. A future visible section links each package to its demo and capabilities.

- [ ] Create starter manifests with supported modules, configuration schema, engine version and compatibility constraints.
- [ ] Generate complete customer output with code, example environment variable names, migrations where needed, tests, deployment guidance and handover documentation; never embed credentials.
- [ ] Create a private repository and separate hosting project per customer. Isolate data, storage, access and secrets according to service risk; do not silently introduce shared multi-tenancy.
- [ ] Record the generated template version and dependency lockfiles. Shared modules must be pinned to released versions or copied through an explicit generation step, not fetched from a mutable branch at runtime.
- [ ] Connect Git deployment only to that customer's repository/project and approved production branch. Protect branches and require checks/approval before production promotion.
- [ ] Limit engine permissions to explicit provisioning actions and narrowly scoped identities. No central credential should grant unnecessary read/write access to all customers.
- [ ] Track generation/provisioning steps idempotently and recover partial failures without duplicate repositories or resources.

**Acceptance:** Generating two clients produces independent repositories/deployments. Changing the engine or client A cannot deploy to client B. An output can be built and maintained from its own repository without the generator running in production.

### Updates, environments and recovery

| Concern | Proposed operating rule |
| --- | --- |
| Template upgrades | Explicit per-customer upgrade PR with changelog, compatibility check, tests and approval; no automatic propagation from engine commits |
| Security maintenance | Dependency monitoring and a documented update policy; automation may open PRs, not bypass production safeguards |
| Development | Local/test data and developer-scoped credentials; no copied production database by default |
| Staging/previews | Separate secrets and data; test payment credentials and non-delivering or controlled email behavior |
| Production | Customer-scoped credentials, least privilege, restricted deploy access and audited operational changes |
| Rollback | Restore a known-good application deployment; confirm schema compatibility before rolling application code back |
| Backups | Separate recovery for databases, uploaded files, CMS content and configuration; Git is not a database backup |
| Recovery | Set and approve recovery objectives per plan; rehearse restore and document who can execute it |

Prefer backward-compatible migrations and a staged expand/contract process. A previous deployment does not undo a destructive database migration. Backups without tested restoration are not adequate delivery evidence.

### Ownership and handover

The default proposal is customer domain ownership and independent customer assets with delegated operator access. Whether hosting/database accounts are customer-held or provider-managed remains a commercial decision, not an assumption.

For managed accounts, define charges, included capacity, overages, access, renewal, suspension notices and exit procedure before sale. On handover, verify source/data/assets exports, provider transfer limitations, licenses, domain/DNS control, deployment instructions, backup ownership and secret rotation. Cancellation must not silently erase data or revoke a fully paid deliverable; retention and final deletion follow the agreed policy and applicable obligations.

**Acceptance:** A customer can receive and operate the agreed deliverable without access to other clients or private engine internals. Both parties know ongoing charges and the procedure for ending management.

## Risks and unresolved decisions

| Risk or open decision | Required outcome |
| --- | --- |
| Undefined recurring infrastructure costs | Approve each plan's payer, limits, start event and renewal policy before publishing |
| Broad promise of included AI consumption | Establish allowance, excess behavior and approval path |
| Commerce commission wording | Separate provider service fees from payment processor fees |
| Monthly reports bundled into a one-time project | Define duration, required accounts and responsibility after handover |
| WordPress/WooCommerce versus custom implementation | Choose by editing/commerce needs and maintenance capability; document hosting/plugin licenses rather than forcing one stack |
| CMS and client editing | Decide whether editing is included, an extra or managed content work |
| Custom services versus three-package presentation | Preserve quotation boundaries; approve any newly productized scope first |
| Centralized engine blast radius | Customer-scoped access, explicit upgrades and independent resources |
| Legacy records missing agreement detail | Preserve existing evidence; flag unknowns without retroactive charges |

## Prior project: LANIN

The user confirmed that the referenced project is the sibling directory `../lanin` (not a project named `landing`). Its `AGENTS.md`, `README.md`, `package.json` and the opening sections of `referencia/PLAN-DEFINITIVO.md` were inspected read-only; no secrets were inspected.

The current implementation is a Next.js/React/TypeScript/Tailwind frontend replica with `/`, `/crear`, `/muestra` and `/paletas`. Its documentation explicitly excludes implemented generation, database, payments and real publication. Do not present the generator as already built.

The reference plan describes a future landing-only HTML generator, payment-webhook publication, email/ZIP delivery and customer-purchased domains. It explicitly excludes full applications and real appointment management. That scope is narrower than this portfolio's commerce, business systems and automation services. Its current seven-question frontend and the reference plan's eight-step flow also need reconciliation before reuse.

Treat LANIN as a candidate reference and potentially a landing-specific delivery adapter, not automatically the universal engine or a source to copy wholesale. Reconcile its approved visual identity, zero-spend constraint, roadmap and delivery model before any separate implementation there. The private-repository-per-client proposal in this document must be evaluated separately against LANIN's generated-HTML publishing model; neither silently replaces the other.

## Next implementation boundary

Approve the commercial matrix and a bounded Phase 1/2 work unit first. Keep future engine provisioning, client repository creation, paid subscriptions and production deployment out of that first implementation scope. This document is a passive plan, not an execution script, SDD artifact or authorization to create external resources.
