# Navigation Map

> Defines the screen structure of the system, how screens connect to each other, and what routes
> exist. It is the reference when frontend and backend discuss what endpoints exist
> or how to reach a feature.

---

## Scope note

This map describes the implemented QA-tested content now promoted to main in the [verification summary](../15-project-control/documentation-verification.md#four-story-delivery-and-acceptance--2026-11-04). Infra QA and all eight main promotion PRs are merged. Their publication is distinct from a new full main runtime execution. Earlier release citations retain their own historical scope. Host owns routing/session/transport; each portal owns its screens. The historical Corte 1 user-picker/PDF is not current authentication evidence. HU-AUTH-18/#297 adds a bounded, paginated user search table to the existing Users screen (contract: `POST /auth/users/search`); user edit/delete/recovery and token list-all remain unsupported UI scope. AUTH-17 adds issuance/known-ID metadata lookup in QA, with main approval pending.

## Frontend route structure

```text
/ -> /dashboard                   Host redirect; session gate applies
/login                           Auth Login through Host authentication capability
/dashboard                       Host role links; Sales summary for ADMIN/SALESPERSON
/customers                       Angular list (ADMIN, SALESPERSON)
/customers/new                   Angular create
/customers/:id                   Angular detail
/customers/:id/edit              Angular replacement edit
/products                        React catalog/categories/stock adjustment (ADMIN, INVENTORY)
/stock                           React read-only stock (SALESPERSON)
/stock-alerts                    React read-only alert view (ADMIN, INVENTORY)
/sales                           React history plus registration panel (ADMIN, SALESPERSON)
/sales/:id                       React composed detail
/sales/reports[/daily|/monthly|/top-products]  Sales reports (ADMIN/SALESPERSON); base = daily
/users                           Auth ADMIN create, known-ID lookup + bounded search table (HU-AUTH-18/#297)
/service-tokens                  Auth issuance + known-ID metadata lookup (ADMIN, QA; AUTH-17/#302)
unknown Host path                Host NotFound; nested remote behavior is owner-specific
```

Customers unmatched child routes show its own not-found view. Products accepts its exact three paths (optional trailing slash); Sales accepts history, daily/monthly/top-products report routes or one detail segment; unsupported report names return no screen. Host route-prefix ownership does not invent a remote page. All roles land on `/dashboard`; an authorized local requested route can be restored after login. Access denial redirects to dashboard before mounting the unauthorized remote.

---

## Route ownership

| Owner | Routes | Responsibility |
|---|---|---|
| Host | /, /login routing, /dashboard, unknown Host paths and portal prefixes | BrowserRouter, navigation/guards, session/HTTP, lazy asset loading and failure boundary |
| Auth portal | Login component; App mounted at /users and /service-tokens | Login uses shell/authentication; /users uses Host client/session for create, known-ID lookup and bounded search (HU-AUTH-18/#297); /service-tokens uses ADMIN issue/known-ID metadata lookup (QA) |
| Customers portal | Four routes under /customers | Angular Router/custom element with exact ShellContract v1; Host navigation, no second transport/token store |
| Products portal | /products, /stock, /stock-alerts | Catalog/category dialogs, manual delta adjustments, lookup and read-only alert list |
| Sales portal | /sales, /sales/:id, /sales/reports and its daily/monthly/top-products children | History/registration/detail, report screens and federated DashboardSummary |

Source: [Host App](https://github.com/code-corhuila/synkro-front/blob/2b3b39a5b378bb4b9573fabd7abac528c36d2149/src/app/App.tsx), [registry](https://github.com/code-corhuila/synkro-front/blob/2b3b39a5b378bb4b9573fabd7abac528c36d2149/src/remotes/registry.ts), [Customers routes](https://github.com/code-corhuila/synkro-customers-portal/blob/4208839dad3ccfb8eeb4feff12352c8e4cd73695/src/app/customers/customers.routes.ts), [Products routes](https://github.com/code-corhuila/synkro-products-portal/blob/b407475b363b9ac7fcbe3512852ba4146a96dadf/src/routes.tsx), [Sales routes](https://github.com/code-corhuila/synkro-sales-portal/blob/5da98e5d936b7a6a366164cd786c4efcc9ec6884/src/routes.tsx).

### Current QA additions — 2026-11-08

AUTH-18 adds bounded user search; FE-10 adds range presets and daily/monthly trends. VEN-18 exports all authorized filtered pages to Excel, refusing partial downloads on failure. VEN-19 creates non-fiscal PDF/XML from an authorized saved sale, preserving frozen amounts and the seller scope. FE-11 adds light/dark/system preference and responsive role navigation, retained across portals/logout without persisting credentials. See [exact source, execution and pending main gates](../15-project-control/documentation-verification.md#docs-98-consolidated-reconciliation--2026-11-08). The older source links below retain their earlier delivery scope.

### Dashboard ownership

Host renders role-authorized link cards from the same access matrix as its guard. ADMIN/SALESPERSON also mount `salesPortal/DashboardSummary` for the newest daily group, newest monthly group and top three products; the API enforces own-sale scope. INVENTORY makes no Sales report request. No profit, user-count or stock-total widget is added. Users and Service tokens are excluded from these shortcut cards; ADMIN reaches the implemented Users screen through the existing Host navigation.

---

## Screen map

| Screen | Route | Component | Portal | Framework | Minimum role | Target microservice (ADR-001, ADR-010) | Delivery status — Week 12 |
|--------|-------|-----------|--------|-----------|--------------|--------------------------------------|--------------------------|
| Login | /login | Login | Auth, mounted by Host | React | Public | Auth | Delivered; Host owns authentication/session |
| Dashboard | /dashboard | Dashboard + Sales DashboardSummary | Host/Sales | React | Signed in; Sales summary ADMIN/SALESPERSON | Sales reports | Implemented and merged into main; execution scope is recorded separately |
| Customer list | /customers | CustomersPageComponent list | Customers | Angular | ADMIN, SALESPERSON | Customers | Delivered; real R8 routing evidence |
| Customer create | /customers/new | CustomersPageComponent new | Customers | Angular | ADMIN, SALESPERSON | Customers | Delivered; uncertain retry preserves key/payload |
| Customer detail/edit | /customers/:id; /customers/:id/edit | CustomersPageComponent detail/edit | Customers | Angular | ADMIN, SALESPERSON | Customers | Delivered; inactive/missing resource handling |
| Products/categories | /products | ProductsPage | Products | React | ADMIN, INVENTORY | Products | Delivered; modals inside route, no separate category route |
| Stock lookup | /stock | StockLookupPage | Products | React | SALESPERSON | Products | Delivered, read-only |
| Stock alerts | /stock-alerts | StockAlertsPage | Products | React | ADMIN, INVENTORY | Products | Delivered read-only UI/API; real Worker producer/resolver has separately scoped acceptance evidence |
| Sales history/registration | /sales | SalesPage/NewSalePanel | Sales | React | ADMIN, SALESPERSON | Sales plus Workflow/lookup APIs | Real QA browser registration/history/detail passed; RUNNING is controlled-fixture evidence; main gates remain |
| Sale detail | /sales/:id | SaleDetailPage | Sales | React | ADMIN, SALESPERSON | Sales; optional Customers/Products metadata | Delivered, frozen amounts survive metadata failure |
| Users | /users | UsersPage | Auth | React | ADMIN | POST auth/register; GET auth/users/{id}; POST auth/users/search | Create, known-ID lookup and bounded/paginated search table delivered by HU-AUTH-18/#297; still not an unfiltered list-all dump |
| Sales reports | /sales/reports/{daily,monthly,top-products} | ReportsPage | Sales | React | ADMIN, SALESPERSON | Sales reports | Four states, UTC filters and grouped pagination; main merged |
| Service tokens | /service-tokens | ServiceTokensPage | Auth | React | ADMIN | Auth issue and known-ID metadata APIs | AUTH-17/#302 integrated in QA; main pending; no token list-all |

**Access matrix**

| Screen | ADMIN | SALESPERSON | INVENTORY |
|--------|:---:|:---:|:---:|
| Dashboard role links / Sales summary | Yes | Yes, own sales | Links only; no Sales summary |
| Customers four routes | Yes | Yes | No |
| Products/categories | Yes | No | Yes |
| Stock lookup | No | Yes | No |
| Stock alerts | Yes | No | Yes |
| Sales/history/detail | Yes | Own sales | No |
| Users / service-token administration | Yes | No | No |

The [Host access table](https://github.com/code-corhuila/synkro-front/blob/2b3b39a5b378bb4b9573fabd7abac528c36d2149/src/layout/navigation.ts) drives menus and guards; each API still authorizes independently. A visible placeholder/menu entry is not implemented business UI. Sales ownership comes from the server, never a browser filter alone.

---

## Endpoints per screen

| Screen | Endpoint(s) | Contract |
|---|---|---|
| Login/session | POST /api/v1/auth/login, /refresh, /logout through Host capability/client | Auth |
| Customers | GET/POST /api/v1/customers; GET/PUT/DELETE /api/v1/customers/{id}; exact identityDocument filter | Customers |
| Products/categories | GET/POST /api/v1/products; GET/PUT/DELETE /api/v1/products/{id}; GET/POST /api/v1/products/categories; PUT/DELETE /api/v1/products/categories/{id} | Products |
| Manual stock | POST /api/v1/products/{id}/stock-adjustments, delta/reason with one intent key | Products |
| Stock lookup | GET /api/v1/products, read-only | Products |
| Stock alerts | GET /api/v1/stock-alerts with status/page filters; no human create/resolve action | Products |
| New sale | GET Customer/Product selectors, POST /api/v1/sagas/register-sale, GET /api/v1/sagas/{id} | Customers/Products/Workflow |
| History/detail | GET /api/v1/sales and /api/v1/sales/{id}; optional owning metadata GETs | Sales/Customers/Products |
| Reports and dashboard Sales summary | GET /api/v1/sales/reports/daily, /monthly, /top-products | Sales; UTC inclusive day filters, grouped pagination, integer cents |
| Users create / known-ID lookup / search | POST /api/v1/auth/register; GET /api/v1/auth/users/{id}; POST /api/v1/auth/users/search | ADMIN only; Host client/session; search is bounded and paginated (HU-AUTH-18/#297), not an unfiltered list-all |
| Service-token issue / known-ID lookup | POST /api/v1/auth/service-tokens; GET /api/v1/auth/service-tokens/{id} | ADMIN; credential displayed only at issuance, metadata lookup never recovers it (AUTH-17/#302, QA) |

Exact fields/statuses/security remain canonical in [OpenAPI](../07-api/contracts/openapi/) and [authentication](../07-api/authentication.md); no endpoint is created here. Sales POST is a SERVICE-authorized saga step, never the browser's sale-creation call. Worker alert writes are implemented SERVICE calls, not buttons on the alert screen. The three report endpoints do not imply a separate reporting service/store. HU-AUTH-18/#297 adds a bounded, filtered and paginated user search (POST, body-only filters, so a name or email search term never reaches the gateway's logged URL); it does not add an unfiltered list-all dump. Service-token list-all remains unsupported and unconfirmed, not inferred from a bot review or missing UI.

---

## Main user flows

### Flow 1 — Register a sale

1. Authorized ADMIN/SALESPERSON enters `/sales`. History has loading/error/empty/data states; SALESPERSON reads only own sales. Opening NewSalePanel adds no route.
2. Select active Customer and Product identifiers through the shared Host client. Client-side quantity/amount preview is advisory; request contains customerId and productId/quantity lines, never trusted prices/totals. There is no continuously live stock guarantee while editing (Q-003).
3. Before explicit POST, Sales persists original key, canonical fingerprint and original 24-hour deadline, scoped to subject/sessionId. Missing capabilities or storage failure blocks submission. Double submit is prevented; no automatic POST retry occurs.
4. Workflow validates the person, preserves caller/input replay privacy, then uses its SERVICE token for Customer validation, atomic stock reservation/frozen prices and Sale registration. Only validated permitted rejection can justify compensation; ambiguity retains stock under Accepted ADR-015.
5. RUNNING starts bounded observation while this screen is active: waits 1/2/3/5 seconds (then 5), a 120-second observation budget checked before each next GET and at most three consecutive polling failures. Timeout/401/403/404 stops observation into an unresolved/attention path; it does not prove failure or cancel backend work. Known saga retry resumes GET, not another POST.
6. COMPLETED with saleId refreshes history and loads the authoritative Sale; amounts are frozen integer cents. Sale lookup failure does not undo completion or submit a replacement. COMPENSATED explains the rejected step; FAILED requires responsible review. A malformed/uncertain response preserves original identity and blocks a changed intent.
7. Reload restores local intent only, never automatically POSTs/observes. Explicit known-ID GET resumes; otherwise reconstruct the same request and retry the original key before its original deadline. Expiry requires reconciliation, not an assumption of server expiry/new sale permission.
8. Detail navigation keeps the existing history/draft mounted but inactive. Leaving/aborting observation does not cancel/compensate Workflow. Logout/new login clears local ownership; renewal/reload within the same valid Host identity preserves it. Per-tab only; canonical lifecycle is [ADR-016](../05-architecture/decisions/records/ADR-016-host-session-renewal-and-operation-recovery.md).

Detail first loads Sale, then one GET per distinct optional metadata ID with maximum concurrency four. If names fail, retain customerId/productId, quantities, frozen unitPriceCents/subtotals/total and a partial-data notice. Retry only failed metadata, not Sale creation. Abort/stale-generation checks prevent replaced route replies from changing the current view. Detail 403 returns to history with a safe ownership notice; invalid/missing ID shows not-found. [Source](https://github.com/code-corhuila/synkro-sales-portal/blob/5da98e5d936b7a6a366164cd786c4efcc9ec6884/src/sales/pages/useRegisterSale.ts); [detail source](https://github.com/code-corhuila/synkro-sales-portal/blob/5da98e5d936b7a6a366164cd786c4efcc9ec6884/src/sales/pages/useSaleDetail.ts).

The earlier release record keeps its historical E2E-02 NOT EXECUTED result. The [verification summary](../15-project-control/documentation-verification.md#four-story-delivery-and-acceptance--2026-11-04) separately records seven passing real Sales browser scenarios, including E2E-02 RUNNING → same-saga GET → COMPLETED under a controlled Sales pause and 1 ms Workflow response fixture. It does not claim spontaneous RUNNING behavior or recovery of every interrupted saga.

### Flow 2 — Authentication

1. Host lazily loads Auth Login at public `/login` and supplies its authentication capability. Auth portal collects/validates credentials and never owns tokens.
2. The Host shared transport invokes public Auth login and consumes the returned credential pair. It restores an allowed local requested route or dashboard. Login 401 stays on the form with a generic message/password cleanup and no refresh/retry.
3. Host coordinates the Accepted ADR-016 proactive renewal policy and single-flight refresh before protected requests. Session metadata is token-free for portals, and Angular Customers keeps the exact v1 adapter.
4. Each receiving API/Workflow validates/authorizes the token locally; Gateway presence checking is not signature validation. Public login/refresh do not require a prior person bearer.
5. Protected 401/failed renewal ends the session without automatic refresh/replay. 403 is access denial without logout. Refresh response loss may already have rotated credentials and is not blindly retried. Issued JWT validity/revocation limits follow Accepted ADR-017.

This login exists in Auth/Host source and author evidence; the Corte 1 user picker is historical. A dev-sign-in flag remains guarded tooling and candidate examples set it false; the presence of that code on a promoted branch is not production sign-in authorization. See [Browser session](../07-api/authentication.md#browser-session), [Login source](https://github.com/code-corhuila/synkro-auth-portal/blob/42f569e22ffc7f85e8917874a0fdbcf27bc2b6ee/src/Login.tsx) and [Host authority](https://github.com/code-corhuila/synkro-front/blob/2b3b39a5b378bb4b9573fabd7abac528c36d2149/src/shell/session.ts).

### Flow 3 — A typical ADMIN session

Login restores an allowed route or dashboard. ADMIN can use role links, Sales summary and reports, existing Customer/Product/Sales flows and /users create/known-ID lookup/bounded search (HU-AUTH-18/#297). Service-token issuance/known-ID lookup is available in QA; no unfiltered token list-all is promised. Initial ADMIN is still the separate operator CLI. Current publication and execution scope are recorded in the verification summary.

### Flow 4 — A typical SALESPERSON session

Login → Customer list/create/detail/edit as permitted → `/stock` read-only availability preview → `/sales` registration and own history/detail. Customer creation maintains an intent key for uncertain explicit retry. The preview does not reserve stock; only Workflow's reservation commits availability. A competitor may win stock before submission and a proven reserve rejection is shown without claiming a completed sale. Own-sale authorization stays server-side. Dashboard shows the Sales summary and report links with owner filtering enforced by the API.

### Flow 5 — A typical INVENTORY session

Login → dashboard role links (no Sales summary) → `/products` for category/catalog/stock-delta work or `/stock-alerts` for read-only list/filter. Category and product create/edit/deactivate dialogs stay in Products; mutation buttons disable pending work and confirmation cancellation makes no write. Alerts retain raw product IDs if optional names fail. The Products alert API/view and real Worker open/resolve job exist. Replenishment is reconciled when a successful eligible Worker pass reaches the product; quotas, pagination, transient failures and cooperative timeouts prevent a next-tick guarantee. See the [current acceptance and merge audit](../15-project-control/infra-final-acceptance-2026-11-02.md). INVENTORY cannot mount Customers/Sales/administration routes; direct API authorization still applies.

---

## User registration authorization (ADR-014)

The /users form is ADMIN-only and consumes the Host client/session. It sends name/email/password and one of ADMIN, SALESPERSON or INVENTORY to the existing audited/idempotent register endpoint. Double submission is blocked. An ambiguous result retains the original body/key only in RAM, blocks edits and offers explicit retry; SPA exit/reentry preserves the intent, while logout/new session retires it. No password is persisted and no full-reload recovery is promised. The separate UUID lookup shows only allowed profile fields and rejects stale responses. 401 follows Host logout; 403 does not permit retry escalation. List-all/edit/delete/recovery and first-ADMIN initialization remain separate scope.

## Navigation rules

| Rule | Description |
|------|-------------|
| Authentication | Host RequireAuth restores/checks the session and redirects to login; approved local requested route may be restored |
| Authorization | Host canAccess/RequireRole redirects denial to dashboard before mounting the remote; APIs remain authoritative |
| Unmatched route | Host NotFound for unknown top-level paths; remote-specific child handling as described above |
| Confirmation | Customer/Product deactivation asks confirmation; cancel produces no mutation |
| Navigation/cancellation | Host owns browser history; Customers synchronizes its inner router without writing competing history; stale/aborted reads cannot replace current data |
| Remote outage | Keep Host/other modules usable. Login shows one styled recovery panel only on Auth remote load failure; Reintentar acceso reloads that remote, and Ir al inicio follows Host guards. A healthy login has no orphan controls. This does not promise identical retry behavior for every other remote |
| Metadata outage | A valid Sale/alert record survives missing optional names; retain raw IDs and frozen data, with bounded independent retry where implemented |

### Customers routing evidence and R-008

| Required behavior | Implementation/test | Reported real-browser evidence / limit |
|---|---|---|
| Initial /customers with no session, return after login | Host route/guard + Angular list route | R8 loginRestore PASS; exact Host/portal/API/Gateway revisions in [result](https://github.com/code-corhuila/synkro-infra-postgres/blob/8139a43e786f3ab7adf6367065a6165d8d83c15e/docs/evidence/composition-2026-10-22/runs/R8-customers/customers-browser-result.json) |
| /customers/new | Customers new route, explicit navigation | ADMIN and SALESPERSON create through real service; uncertain same-key retry PASS |
| /customers/:id and /customers/:id/edit | Detail/edit modes and replacement handling | R8 detailAndReplacement PASS; edit is exercised by button navigation, not independently claimed refresh for every edit route |
| Detail refresh/deep entry | Host history + Angular synchronization | R8 deepLinkRefresh PASS at created detail; not proof of all arbitrary nested routes |
| Back/Forward and exit/reentry | Host navigation, router lifecycle/unit tests | R8 backForward PASS list↔detail; bootstrap/page tests cover stale completion and application destroy |
| Role denial and remote outage | Host guard, v1 adapter, lazy element boundary | R8 inventoryDenied and browserPortalRecovery PASS; no unauthorized Customers element mounted |

R8 root `217dacf3577b2ec12a4e838b655bf0bea527f561` selected the current tagged Host/Customers revisions and used an Infra-adapted owner harness (locked snapshots plus TCP database readiness). Inner scope was available, exit 2: successful Customers subset, not full platform acceptance. Earlier R7/B7 Customers browser failures remain in the release record. R-008 is mitigated for this evidenced route set; independent current-root review and uncovered route/lifecycle permutations remain explicit, not closed merely by four routes existing. No new browser test ran for DOCS-97.

---

## Correlations

- Design system (visual components, tokens) → `12-ux-ui/design-system.md`
- Wireframes, including the four states per screen → `12-ux-ui/wireframes.md`
- Domain entities behind these screens → `02-domain/entities-and-rules.md`
- Roles and permissions source of truth → `00-governance/security-policy.md`, current Host navigation table and receiving API authorization; Corte 1 roles.js is historical
- Sale registration saga → `05-architecture/decisions/records/ADR-007-persistent-saga-and-scheduled-work.md`, as modified by Accepted ADR-015; low-stock behavior → ADR-007 Decision 6 as modified by ADR-018; executed Worker scope remains in the current acceptance catalog
- Sales domain on MongoDB → `05-architecture/decisions/records/ADR-010-sales-on-mongodb.md`
- Angular Customers portal, host/portal contract → `05-architecture/decisions/records/ADR-011-angular-customers-portal.md`, `_stacks/frontend.md`
- Token validation per service → ADR-006
- Missing list endpoints for Users and Service tokens → `15-project-control/open-questions.md` (HU-DOCS-88)

## Customers, Sales and password-reset follow-up — 2026-11-10

| Screen/flow | Current delivery | Guard and recovery |
|---|---|---|
| Customers forms/search | Required contacts and bounded name/document suggestions integrated in develop | API is authoritative; ACTIVE search for Sales, INACTIVE search ADMIN-only; field/cancel/stale-response states |
| Inactive customer activation | Explicit ADMIN action and confirmation | Direct API also enforces ADMIN; preserve UUID/document/history and audit the real operator |
| New sale | Clickable real catalogue, categories, bounded batches, one cart entry/product, estimated totals, keyboard customer selector | No brand/barcode; Workflow validates availability and official amounts; a changed customer can require reselection without losing cart |
| Sale draft/retry | UUID/quantity draft tied to person/session, with service metadata re-read on recovery | Unresolved sent intent is read-only and retries its original key; do not transfer a draft to another login |
| Sale history/detail/downloads | Current customer metadata, yearly commercial reference, UUID retained, XML 1.2/PDF issuer | Bounded metadata reads/unavailable state; only own sales for SALESPERSON, global ADMIN; no fiscal validity |
| Users password reset | HU-AUTH-19 requested; not evidenced as delivered | Future action belongs to authenticated ADMIN Users, not public login; secrets never enter URL/logs/persistent browser storage |

The [consolidation record](../15-project-control/documentation-verification.md#three-new-functional-stories--consolidation-2026-11-10) distinguishes reported final browser acceptance from unexecuted scopes. Reported Sales builds support one origin at a time; do not claim one build works simultaneously on localhost and 127.0.0.1. No new route or reset UI is invented here.
