# Sell the outcome, show the work, keep the costs clear

**Status:** Web/Landing implementation authorized and in progress; production deployment not performed.
**Recorded:** 2026-09-27.
**First slice:** Benefits-led Web/Landing service page and fictional Bruma preview/demo adapted from the LANIN editorial design reference.

Help visitors recognize their problem, see a credible example, understand the benefit and choose a package without reading a contract first. Detailed terms remain easy to find and readable; development price and necessary ongoing costs remain visible before purchase. This complements the [delivery roadmap](service-catalog-and-delivery-engine.md), not a replacement for its safety, frozen-order or pilot gates.

## Implementation evidence — 2026-09-27

Implemented in portfolio: bilingual Web marketing composition, local `/demo/es/bruma` and `/demo/en/bruma` routes with noindex/nofollow, inline preview, display-only `src/content/service-showcase.ts` manifest and MIT provenance/asset inventory. Bruma uses new fictional identity/content and an original local vector illustration, not the reference business name, data, photographs, fonts, testimonials or runtime. No LANIN file was changed. A vector preview replaces the initially proposed photographic capture; browser screenshots are acceptance evidence, not a claimed real-client result.

Material care price/cadence/allowance, customer-paid domain and third-party costs, 30-day initial hosting/warranty and opt-in/transfer conditions remain outside disclosure. Full hosting/ownership terms are in keyboard-operable native disclosure at readable size. Public catalog projection and hero package anchors apply across services; the full benefits/proof/process/FAQ redesign applies **only to Web**. Other service-family examples remain future work.

Local verification: Web/UI/page 4 files / 21 tests passed; broad downstream 28 files / 303 tests passed; call/admin/showcase 10 files / 93 tests passed (overlapping suites, not additive totals). Final typecheck and scoped ESLint passed after standalone demo route isolation. Consultation fallback now saves manual call requests, package-only links retain service context, and admin shows archived commercial facts before full details. Browser checks are in `src/test/e2e/service-showcase.spec.ts`; final desktop/mobile result remains pending. No real email, payment settlement, production schema/revision, delivery engine or deployed end-to-end flow is established by these tests. See the [consolidated seven-point acceptance](service-catalog-and-delivery-engine.md#consolidated-seven-point-acceptance--implementation-checkpoint-2026-09-27).

The sections below retain the original planning rationale; this dated checkpoint supersedes the old plan-only boundary for the implemented local slice, not for external resources or deployment.

## Quick path

1. Design one Web/Landing page using the section order below and current catalog/policy data.
2. Prepare a clearly labeled conceptual Brooklyn example, starting with sanitized desktop/mobile screenshots; add an isolated interactive demo only after its safety checks.
3. Verify clarity, responsive layout, accessible disclosure and unchanged order semantics before extending the pattern to other services.

The user authorizes reuse of LANIN designs and engine code as reference/showcase material. LANIN remains read-only. This implementation adapts design reference only; do not copy its runtime, create new prices, manufacture proof or imply that concept examples are delivered customer projects. The separate engine is deferred by the user.

## What exists today

### Portfolio: improve the hierarchy, not the purchase rules

| Evidence | Current reality | Planned change |
| --- | --- | --- |
| `src/content/servicios.ts` | Six service families; `PUBLIC_SERVICIOS` filters retired packages/extras, while historical lookup remains intact | Derive marketing content from public offers, not the historical inventory |
| `src/components/site/ServiceCatalog.tsx` | Already begins with customer problems and prices | Add a compact visual cue and outcome; check public-offer projection rather than exposing retired inventory through `SERVICIOS` |
| `src/app/[locale]/services/[slug]/page.tsx` | Problem/promise hero, qualification, package configurator and referrals | Insert visual proof, concrete benefits, delivery steps and FAQ; preserve localized routes and aliases |
| `src/components/site/PackageCard.tsx` | Price, policy paragraphs, inclusions/exclusions, questions and extras compete in one card | Separate package comparison, selected configuration and readable detailed terms; avoid repeating the full policy in every sales card |
| `src/components/site/ServicePackageConfigurator.tsx` | Package selection already exists | Preserve selection/recommendation distinction, qualification and one valid continuation CTA |
| `src/content/service-policy.ts`, [managed-care policy](managed-care-policy.md) | Configurable care fees/cadence, hosting, ownership and customer-paid external costs | Compact public summary from the same facts, not a second conflicting pricing source |

The current hero is already problem-led. The gap is credible visual evidence and benefit/process hierarchy before dense package details, not a lack of business-oriented copy everywhere. No actual showcase manifest is verified in this inspection; the current scope schematic is not a delivered-project demo.

### LANIN: current source is more than a frontend

All LANIN paths below are relative to `/home/silvano/dev/lanin`. Its `AGENTS.md` requires phased work and preserves its own approved identity; read-only reuse planning does not authorize changes to that product.

| Boundary | Source evidence | Reuse interpretation |
| --- | --- | --- |
| Handcrafted React demos | `apps/sitios/app/demo/modelos.ts`; routes `app/demo/{brooklyn,fox,altamira}/page.tsx`; models under `apps/sitios/modelos/` | Three actual selectable designs exist; useful visual reference, not three proven client deliveries |
| Content generation | `packages/motor/src/generar.ts`, `validar.ts`, `componer.ts`, `modelo-anthropic.ts` | Validated content pipeline supports deterministic template content, model calls and fallback; AI does not generate the HTML/CSS |
| HTML renderer | `packages/plantillas/src/render.ts`, `persona.ts`, `servir.ts` | Renderer currently dispatches only `persona`; other skeletons throw. React demo breadth does not establish universal engine coverage |
| Published-site routing/data | `apps/sitios/middleware.ts`, `packages/db/`, `packages/slug/` | Shared host-based publication infrastructure exists; not the portfolio roadmap's independent customer repository/deployment generator |
| Payment/editor/email work | `apps/web/lib/cobro.ts`, `pedido.ts`, `editor.ts`, `envios.ts`, `packages/pagos/`; `docs/MAPA.md` | Integration code exists; roadmap still lists test-buyer payment closure pending. No payment/provider/production test was run here |

**Present:** demos, content engine, template renderer and integration code. **Not established:** complete template coverage, production readiness, independently generated client outputs, or reusable commerce/automation delivery for portfolio packages. Neither stale “frontend-only” descriptions nor claims of a complete delivery engine should guide this plan.

## Page structure and visual direction

Use an **editorial studio/showcase** direction: generous spacing, decisive headings, restrained portfolio brand accents and one large, convincing example. Keep portfolio typography/tokens in the sales shell; allow the demo to retain its contrasting design identity. Avoid a wall of cards, decorative feature badges, incessant motion or carousels hiding essential information.

| Order | Section | Content and action |
| --- | --- | --- |
| 1 | Outcome hero | One customer problem, one concrete benefit, primary “See packages” anchor and secondary “View example”; custom services use the existing consultation path |
| 2 | Credible visual example | Desktop/mobile image with a short capability caption and persistent concept label; optional isolated demo link, not an unlabeled mockup |
| 3 | Benefits | Three concise problem → capability → practical result statements, tied to included scope; no invented conversion uplift |
| 4 | How delivery works | Three steps: agree scope/materials → build/review → deliver/handover; respect existing prerequisites and package delivery ranges |
| 5 | Packages and prices | Existing public packages, clear upfront price and essential ongoing-cost summary; selected configuration holds questions/extras and total |
| 6 | FAQ and scope/terms | Short buying questions, then accessible expandable scope, responsibilities, ownership and full terms; links remain available without configuring a purchase |
| 7 | Final CTA | Repeat the next appropriate action: configure an eligible package or request a scoped quote; no misleading immediate activation |

Hero wording is a content brief, not newly approved production copy. Preserve Spanish/English parity using the existing localized content model. One short sentence per benefit, one caption per visual and a small FAQ are defaults; do not duplicate the contract across sections. Detailed terms must not become faint, tiny text: readable body size/contrast, keyboard-operable headings, visible focus, clear expanded state and anchored links. A separate details page is acceptable when longer than an accordion can reasonably hold.

## Benefits and proof by actual service

These are proposed messaging angles, not guaranteed business outcomes. Draw final claims from the selected package's actual inclusions/exclusions.

| Public offer | Problem → benefit | Appropriate visual proof | Buying boundary |
| --- | --- | --- | --- |
| Web: `landing`, `web-cinco-secciones`, `web-con-blog` | Visitors cannot understand the offer or find the next step → clear explanation and contact path; content sections/blog only when included | Sanitized Brooklyn landing first; desktop/mobile view plus annotated navigation/contact capability | Do not imply one landing package includes every section/feature in the full source demo |
| Catalog: `catalogo-whatsapp` | Repeating product answers manually → browsable products and a structured inquiry | Synthetic product cards → safe simulated WhatsApp handoff | No stock management, logistics platform or large-shop promise |
| Catalog: `catalogo-cobro` | Buyers ask how to pay → products with a clear merchant payment-link path | Synthetic product → inert payment-link explanation; no real checkout | Merchant fees/account responsibilities remain visible; no proof of a full store or payment settlement |
| Automation: `una-automatizacion`, `tres-automatizaciones` | Repetitive handoffs between tools → specified workflow with reviewable steps | Synthetic input → processing → output diagram or controlled replay | Show current required monitoring separately and API/AI usage paid by customer; unsupported integrations remain quoted |
| Custom system: `sistema` | Scattered process/data → a scoped workspace for the agreed workflow | Fictional workflow/wireframe, explicitly conceptual; not a generic LANIN landing sold as system proof | Consultation and written scope; no new fixed-price package or unsupported ready-made system claim |
| Audit: `auditoria-web`, `auditoria-sistema` | Unclear technical problems/priorities → evidence and prioritized recommendations | Sanitized illustrative report excerpt with sample findings/action ordering | Findings are examples, not actual customer results; system audit retains scoped quotation |
| Care: existing public care packages | Unclear ongoing responsibility → managed hosting and bounded changes with agreed handover | Conceptual care checklist/request-status sample, without admin/customer data | Manual agreement/activation remains explicit; no automatic subscriptions, unlimited support or invented SLA |

No WordPress offering, retired `tienda-a-medida`, `stock` extra or large-commerce build enters this plan. Existing commerce-care coverage is not a new commerce-build offer. Testimonials, client names, ratings, customer counts, revenue/conversion results and performance numbers require real, attributable evidence and permission; otherwise omit them.

## Choose one real design to reuse first

| Candidate | Concrete sources | Strength | Tradeoff |
| --- | --- | --- | --- |
| **Brooklyn — recommended first** | `apps/sitios/app/demo/brooklyn/page.tsx`; `modelos/brooklyn/components/sections/{hero,menu,orders,gallery}.tsx`; `content/site.ts`, `content/sections.ts`, `imagenes/` | Warm editorial café design, split/full hero, strong imagery, legible menu/contact story; approachable small-business landing example | Full source also has loyalty/enterprise, ratings/testimonials and outside links; trim/sanitize rather than claim everything is in `landing` |
| Fox — later visual variation | `apps/sitios/app/demo/fox/page.tsx`; `modelos/fox/components/{Hero,Services,Plans,Gallery,WhatsAppFloat}.tsx`; `modelos/fox/lib/data.ts` | High-contrast gym design and prominent conversion hierarchy | Motion/counters, plan carousel and WhatsApp contact need accessibility/safety treatment; fictional figures must not become portfolio proof |
| Altamira — later, selective only | `apps/sitios/app/demo/altamira/page.tsx`; `modelos/altamira/secciones.tsx`, `contenido.ts`, `ui.tsx` | Strong project-card composition and benefit/process sections | Investment returns, cases and calculator introduce avoidable unsupported financial/result claims; do not reuse those claims or calculator as service proof |

Start with Brooklyn's hero plus a short offering/contact sequence, not its entire production-style composition. Remove testimonial/rating/statistic claims, commercial menus/prices that could be confused with portfolio fees, identifiable business/contact data and unrelated extras. If a richer complete example is later shown, distinguish “design possibilities” from the capabilities included in the selected package.

## Safe showcase architecture

**Default first release: static, sanitized screenshots in the portfolio.** They show real design work without importing LANIN's application/database or running its business actions. They must come from sanitized source/fixtures, not screenshots that still contain fake customer proof. Add a synthetic interactive demonstration only when needed to understand a capability.

- Keep reusable source outside the portfolio production sales app. No workspace dependency or symlink to LANIN; no LANIN database, middleware, checkout, editor tokens, emails or model/API calls in the showcase. Do not fork/copy the full monorepo for a single image.
- Later interactive preview: a separate static/demo deployment with its own fixed fixtures and no production credentials or shared customer data. Use a normal labeled link, not an embedded full app in the package selector; preserve easy return to the portfolio. Add noindex metadata/headers and verify them rather than assuming LANIN's host routing supplies them.
- Demo CTA actions remain in-page or explain a simulated action. Remove real `wa.me`, `mailto:`, `tel:`, payment links, form submissions, maps that send visitors to actual contacts, business JSON-LD ratings and external lead endpoints. Do not put personal information into fixture data, URLs or storage.
- Portfolio alone owns purchase initiation. Opening a showcase never changes the selected package, creates an order, activates care or submits customer details. Do not use shared auth cookies or analytics identifiers across demo and checkout.
- Proposed minimal demo manifest (not yet created): ID, public package association, concept label, sanitized screenshot paths/alt text, optional isolated URL, source revision, asset/license inventory and verified capabilities. Keep it display metadata, not a second scope/pricing source.
- Source provenance and licenses travel with substantial reused code. LANIN's root `LICENSE` is MIT with a copyright/permission notice requirement; user reuse authorization does not waive notices or third-party asset/font rights. Check model-specific reference/assets separately. `banco-imagenes/catalogo.json` documents Unsplash/AI provenance, but is not proof that every `modelos/*/imagenes` asset is covered. Record each reused file's origin/license; replace uncertain assets before publication.
- Check dependency/font notices and size only for selected components. `apps/sitios/package.json` uses Next 15, Tailwind 4 and model-specific font/motion packages; portfolio `package.json` uses Next 16, Tailwind 3. Do not transplant CSS aliases/configuration or dependency versions blindly. Screenshot-first avoids that runtime coupling; a later port reads local Next guides and scopes styles before implementation.
- Do not read/copy `.env` files, private databases, provider account configuration or editor/payment tokens. Review imported files/public assets for embedded contact data and secrets before reuse. A screenshot is public content and needs the same privacy check.

This showcase is not the independent delivery engine. Engine extraction, generation manifests and per-client deployment remain separately approved work in the master roadmap.

## Clear price, concise obligations

Keep a short **“Price and ongoing costs”** summary beside the selected package and immediately before checkout. Render facts from current configuration and `service-policy.ts`, preserving the frozen order downstream:

1. **Development:** current package/selected-extra upfront amount, or scoped quote; do not substitute a recurring fee for development.
2. **Hosting/care continuation:** applicable amount **and exact cadence**, included bounded allowance, 30-day initial hosting/defect warranty, then explicit paid continuation or agreed transfer. Hosting included in a care fee must not also appear as an invented second infrastructure charge.
3. **Paid separately by customer:** domain purchase/annual renewal, API/AI usage, required external licenses and merchant fees where applicable; provider/usage-dependent amounts are explicitly quoted/variable, never zero or silently included.
4. **Important limits:** selected scope/extras, required monitoring where applicable and no automatic activation/charging; detailed responsibilities and handover are one clear link away.

This is progressive disclosure of clauses, NOT concealment of costs. Required costs, payer, cadence and start/opt-in conditions stay outside accordions. Include applicable setup/annual/usage charges in the configuration summary if present; do not invent new tariffs. Any existing mismatch between care policy and order-recurring amounts needs the master roadmap's commercial/continuity resolution, not a marketing-only workaround. Monthly-only purchases currently held for activation review must keep that explanation and consultation path.

Full cancellation, capacity, export, source-copy, renewal and handover clauses remain accessible in FAQ/details and contract review at normal readable size. Preserve historical signed revisions; moving public presentation does not rewrite contractual evidence.

## Minimal measurement, no new tracking stack

`package.json` already lists `@vercel/analytics`; a source search did not find an `Analytics` component or custom `track` call. Dependency presence does not prove live telemetry. Confirm actual deployed instrumentation and account capability before implementing events; do not claim a current baseline.

Proposed event vocabulary: `service_example_opened`, `service_package_selected`, `service_checkout_started`, `service_consultation_clicked`. Use only service/package/demo IDs, locale and CTA placement. Record checkout-start only when the real continuation succeeds, not a disabled-button click; a consultation click is not a booked call.

Use the existing analytics tool only if configured and eligible; otherwise defer custom events and use available page views plus existing aggregate order/lead records. No new vendor, purchase or independent visitor database is required. Never transmit buyer names/emails, order IDs/tokens, form answers, contact messages or third-party checkout URLs. Reconcile any instrumentation with the current privacy notice before enabling it. Evaluate example engagement and purchase/consultation progression descriptively; do not invent conversion targets or attribute business outcomes to a demo without evidence.

## Bounded rollout and acceptance

### Slice 1 — Web/Landing only

- [x] Implemented Web hero/example/benefits/steps/packages/FAQ/final-CTA with existing portfolio tokens and bilingual content.
- [x] Inventoried the design reference and recorded source revision/MIT provenance; excluded uncertain photographs/fonts/business data and authored a new Bruma vector illustration.
- [ ] Produce one desktop and one mobile conceptual screenshot; an interactive deployment is optional later, not a prerequisite.
- [x] Associated display-only Bruma manifest with `landing`; only static responsive content/navigation/FAQ are represented, no testimonials/statistics/client-delivery claims.
- [x] Material ongoing/external costs remain outside disclosure; existing qualification, recommended/selected behavior and checkout holds are preserved and locally tested.
- [ ] Structural/source readback now; when implementation is authorized, verify mobile/desktop overflow, keyboard/focus, reduced motion, alt text, readable terms and return navigation.
- [ ] During implementation, verify no demo network mutation, real contact/payment destinations, shared cookies or sensitive client data; regress configuration/API totals and frozen-order behavior.

### Slice 2 — Expand only after the first page is reviewed

Apply the same hierarchy to catalog WhatsApp/payment links, automation, custom systems, audit and care. Give each a service-appropriate conceptual visual, not the same landing screenshot relabeled as proof of unrelated capabilities. Add Fox or selective Altamira visuals only if they clarify an actual offer. Keep engine extraction, full portal/billing work and new service/pricing decisions outside this marketing slice.

**Next action:** finish browser acceptance of the implemented Web/Bruma slice, then complete downstream snapshot consumers and controlled connected-flow evidence before extending to other service families. Local presentation code is now implemented; LANIN, prices, tracking and production resources remain unchanged.
