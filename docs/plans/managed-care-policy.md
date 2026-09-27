# Managed hosting and bounded care

**Draft commercial policy, not legal approval or operational subscription billing.** Review the contract wording professionally before publication. `src/content/service-policy.ts` is the configurable source for new-offer disclosures and frozen new-contract paragraphs.

## Agreed offer

| Hosting profile | Fee | Included small requests / total time per period |
| --- | --- | --- |
| Landing | USD 40 every 3 months | 1 / 30 minutes |
| Simple catalog, WhatsApp or payment links | USD 60/month | 1 / 60 minutes |
| Complete | USD 90/month | 2 / 90 minutes |
| Commerce care (not a new large-commerce build offer) | USD 150/month | 3 / 150 minutes |
| Custom systems | From USD 250/month, written scope/quote | One scoped batch / up to 180 minutes |

Limits are conservative defaults, not unlimited support or redesign. Unused allowance does not accumulate. Development price remains separate. Larger requests and exceptional infrastructure usage require prior written quotation, not surprise charges. Response-time SLAs and guaranteed uptime are not promised by this policy.

The provider pays agreed Vercel/Supabase infrastructure from the recurring fee. The customer owns and renews the domain annually and pays every AI/API consumption charge, third-party license and merchant fee separately. Initial 30-day hosting and defect warranty start at delivery; they do not include those customer costs. Continued managed hosting needs explicit paid-plan opt-in and an agreed start date, or planned transfer. No automatic enrollment, annual lock-in/debt, automatic deletion or site shutdown is authorized.

The customer owns paid project-specific deliverables, can request source, and retains those rights while the provider holds an operational copy. Requesting source does not cancel hosting. Transfer dates, data export and any migration assistance must be agreed in writing.

## Cost rationale

USD 40 × 4 = **USD 160 per year**, not USD 40 per month. Vercel Pro's USD 20/month base and Supabase Pro's USD 25/month organization base (with additional project compute starting around USD 10/month) are infrastructure planning inputs, not a profitability guarantee. Usage, taxes, backups, email, isolation requirements and labor may add costs. A low-volume landing may share provider-level base costs, but customer data/access must remain isolated; never budget every client as if dedicated paid projects cost zero. Recheck [Vercel pricing](https://vercel.com/pricing) and [Supabase pricing](https://supabase.com/pricing) before quoting. A new dedicated Supabase project can materially change this unit economics calculation.

## Operational status (2026-09-26)

The managed-care UI and authenticated API now support a manually operated offer, exact-revision client acceptance, activation, period creation, payment confirmation, bounded requests, cancellation/transfer, and source-copy requests. This is **not** a payment gateway or an automatic billing/hosting shutdown system. The administrator must inspect the deployment and agree the scope and start date before offering care. Payment must be confirmed against the exact amount and a unique external reference before marking a period paid.

The operator reports migrations 046–051 applied and pushed; the application/production database and deployed revision were **not independently inspected** in this work unit. Migrations 046–049 must not be edited. Migration 050 qualifies the period ordering column and blocks retroactive or unpaid renewal periods. Migration 051 adds history-preserving agreement generations, immutable old periods/requests/events, and fresh-acceptance reentry. The full `supabase/tests/049_managed_care.sql` fixture passed on the isolated disposable PostgreSQL database `care_051_verify_20260926_3` (exit 0, `Managed care assertions passed`). Never run that fixture against application data.

Renewal is allowed only on the exact end date of a fully paid period. If that day is missed, do not backfill empty periods or invent debt; inspect the project and prepare a new offer with a newly agreed start date and fresh client acceptance. The same process applies after closure. The previous agreement snapshot, periods, payments, requests and events stay auditable under their generation; old paid periods never unlock the new generation's allowance. Open care and source-copy requests must be resolved before reentry. Old unpaid period records are preserved, not silently forgiven or charged again. Cancellation and transfer never shut down hosting automatically; arrange handover and any service change separately. Source-copy resolution is distinct from cancellation.

## Implementation boundary and next step

Public offers exclude large custom stores and stock extras, while historical lookup remains intact. AI consumption inclusion claims are removed. Existing immutable contract revisions are read verbatim; only newly generated revisions receive policy paragraphs. Legacy monthly totals are not repurposed for a quarterly price.

Automatic recurring checkout remains held. Subscription state, manual periods, and admin transitions are implemented; the isolated SQL fixture passed, while production smoke and full end-to-end validation remain pending. There are no automatic charges. Existing orders and signed agreements require explicit migration decisions, never silent reinterpretation.
