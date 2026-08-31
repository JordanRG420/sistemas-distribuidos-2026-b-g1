# Microservices Catalog

> **What to fill in here:** The complete inventory of system services.
> For the detail of each service, go to `09-microservices/services/NN-service-name/`.
> This catalog is the executive view — one row per service.

---

## Services map

```
   4 React frontends (one per bounded context) — no API Gateway,
   each frontend calls its own backend service directly.

┌────────────────┐        ┌────────────────┐        ┌────────────────┐
│  auth-service  │        │customers-service│       │ products-service│
│     :8081      │        │     :8082       │       │     :8083       │
│ (Java/Spring)  │        │ (Java/Spring)   │        │      (Go)       │
└───────┬────────┘        └────────▲────────┘        └────────▲────────┘
        │                          │                          │
        │ issues JWT (RS256)       │ GET /customers/{id}      │ GET /products/{id}
        │                          │ (exists? active?)        │ PATCH .../stock
        │                          │                          │
        │                 ┌────────┴──────────────────────────┴────────┐
        │                 │              sales-service                 │
        └────────────────▶│                  :8084 (Go)                │
     validates JWT        └─────────────────────────────────────────────┘
     locally (public key,
     no runtime call)

              All 4 services share one PostgreSQL instance,
              one schema per service: auth, customers, products, sales
              (own DB user per schema — see security-policy.md)
```

---

## Service registry

| # | Service | Main responsibility | Port | Repo | DB | DB type | Status |
|---|---------|---------------------|------|------|-----|---------|--------|
| 01 | `auth-service` | Identity of internal users: credentials, roles, JWT (RS256) issuance | 8081 | `auth-service` | PostgreSQL — schema `auth` | Relational | 🔴 Planned |
| 02 | `customers-service` | Register, update, query, deactivate customers | 8082 | `customers-service` | PostgreSQL — schema `customers` | Relational | 🔴 Planned |
| 03 | `products-service` | Product catalog, categories, stock control | 8083 | `products-service` | PostgreSQL — schema `products` | Relational | 🔴 Planned |
| 04 | `sales-service` | Sale registration, orchestrates Customers + Products, sales reports | 8084 | `sales-service` | PostgreSQL — schema `sales` | Relational | 🔴 Planned |

**Statuses:** 🟢 Active in prod | 🟡 In development | 🔴 Planned | ⏸ Deprecated
All four are 🔴 Planned — the MVP monolith (separate `mvp-synkro-tech` repo, port 8080) is a throwaway spike and doesn't count as progress on these.

### Frontend & shared repositories

| Repo | Pairs with | Type | Branches |
|------|------------|------|----------|
| `auth-frontend` | `auth-service` | React SPA | `main/qa/dev` |
| `customers-frontend` | `customers-service` | React SPA | `main/qa/dev` |
| `products-frontend` | `products-service` | React SPA | `main/qa/dev` |
| `sales-frontend` | `sales-service` | React SPA | `main/qa/dev` |
| `database` | all 4 | Shared PostgreSQL instance, 4 schemas above | `main/qa/dev` |
| `docs` | — | This documentation | `main` only |

---

## Detail per service

### 01 — `auth-service`

| Field | Value |
|-------|-------|
| **Folder** | `09-microservices/services/01-auth-service/` |
| **Responsibility** | Manages the identity of SynkroTech SAS's internal users: credentials, roles, JWT (RS256) issuance and refresh |
| **Type** | Supporting service (cross-cutting, not a core business process) |
| **Port** | 8081 |
| **Technology** | Java (Spring Boot) |
| **DB** | PostgreSQL, shared instance — schema `auth`, own `auth_user` credential |
| **Bounded Context** | `02-domain/domain-map.md` → Authentication and Users |
| **Externally exposed** | Yes — called directly by all 4 frontends for login. Called by no other backend service: the other 3 validate its JWT locally instead |

**Key endpoints:** to be completed in `09-microservices/services/01-auth-service/README.md` (future HU)
**Events published/consumed:** none planned for the MVP

---

### 02 — `customers-service`

| Field | Value |
|-------|-------|
| **Folder** | `09-microservices/services/02-customers-service/` |
| **Responsibility** | Register, update, query, and deactivate customers |
| **Type** | Core service |
| **Port** | 8082 |
| **Technology** | Java (Spring Boot) |
| **DB** | PostgreSQL, shared instance — schema `customers`, own `customers_user` credential |
| **Bounded Context** | `02-domain/domain-map.md` → Customers |
| **Externally exposed** | Yes — called by its frontend, and by `sales-service` to validate a customer's existence/active status |

**Key endpoints:** to be completed in `09-microservices/services/02-customers-service/README.md` (future HU)

---

### 03 — `products-service`

| Field | Value |
|-------|-------|
| **Folder** | `09-microservices/services/03-products-service/` |
| **Responsibility** | Product catalog, categories, and stock control |
| **Type** | Core service |
| **Port** | 8083 |
| **Technology** | Go |
| **DB** | PostgreSQL, shared instance — schema `products`, own `products_user` credential |
| **Bounded Context** | `02-domain/domain-map.md` → Products and Inventory |
| **Externally exposed** | Yes — called by its frontend, and by `sales-service` to validate stock/price and to deduct stock after a sale |

**Key endpoints:** to be completed in `09-microservices/services/03-products-service/README.md` (future HU)

---

### 04 — `sales-service`

| Field | Value |
|-------|-------|
| **Folder** | `09-microservices/services/04-sales-service/` |
| **Responsibility** | Registers sales, orchestrates Customers + Products, generates sales reports |
| **Type** | Core service |
| **Port** | 8084 |
| **Technology** | Go |
| **DB** | PostgreSQL, shared instance — schema `sales`, own `sales_user` credential |
| **Bounded Context** | `02-domain/domain-map.md` → Sales |
| **Externally exposed** | Yes — called by its frontend. Calls out to `customers-service` and `products-service`; calls no other service |

**Key endpoints:** to be completed in `09-microservices/services/04-sales-service/README.md` (future HU)

---

## Service communication matrix

| Source service | Destination service | Channel | Type | Description |
|-----------------|---------------------|---------|------|--------------|
| sales-service | customers-service | HTTP/REST | Synchronous | `GET /api/customers/{id}` at sale creation — rejects the sale if the customer doesn't exist or `active = false` |
| sales-service | products-service | HTTP/REST | Synchronous | `GET /api/products/{id}` per line — validates existence/stock, freezes `unitPrice`; `PATCH /api/products/{id}/stock` deducts stock once the sale is confirmed |
| sales-service | customers-service | HTTP/REST | Synchronous | `GET /api/customers/{id}` at read time — resolves the customer's name when displaying a sale's detail |
| sales-service | products-service | HTTP/REST | Synchronous | `GET /api/products/{id}` at read time, per line — resolves each product's name when displaying a sale's detail |

**Note on JWT validation:** all 4 services validate the RS256 JWT issued by `auth-service` **locally**, with its public key. This isn't a row above because it never triggers a runtime call to `auth-service` — avoiding that call on every request is the entire point of the decision (see `01-context/overview.md`, NFR-07).

**Accepted N+1 limitation (MVP):** listing many sales with customer/product names costs one HTTP call per related entity. Accepted for the MVP — a batch-lookup endpoint or a small read cache in `sales-service` are the two options already on the table if this becomes a real bottleneck (see `02-domain/entities-and-rules.md`).

---

## Data ownership matrix

| Entity / Data | Owner service (Source of Truth) | How other services access |
|-----------------|----------------------------------|------------------------------|
| User / credentials / roles | auth-service | Not accessed by other services — they validate the JWT locally instead |
| Customer | customers-service | REST API (`GET /api/customers/{id}`) — called by sales-service |
| Product, Category | products-service | REST API (`GET /api/products/{id}`, `PATCH /api/products/{id}/stock`) — called by sales-service |
| Sale, SaleDetail | sales-service | REST API (`GET /api/sales`, `GET /api/sales/{id}`) — called by its own frontend only |
| SalesSummary (reports) | sales-service (derived, not stored) | Calculated on demand via `SUM`/`GROUP BY` over Sale/SaleDetail — not an independent entity |

---

## Correlations

- Architecture and patterns → `05-architecture/overview.md`, ADR-001
- Domain source for this catalog → `02-domain/domain-map.md`, `02-domain/entities-and-rules.md`
- API contracts per service → `07-api/contracts/openapi/` (not yet created — next in the SDD fill-in order)
- Full detail per service → `09-microservices/services/NN-[name]/` (deferred to a future HU)
